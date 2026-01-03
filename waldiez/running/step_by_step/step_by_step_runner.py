# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=duplicate-code,line-too-long
# pyright: reportUnknownMemberType=false, reportAttributeAccessIssue=false
# pyright: reportUnknownArgumentType=false, reportOptionalMemberAccess=false
# pyright: reportDeprecated=false, reportMissingTypeStubs=false
# pyright: reportUnsafeMultipleInheritance=false,reportArgumentType=false
# flake8: noqa: E501

"""Step-by-step Waldiez runner with user interaction capabilities."""

import asyncio
import threading
import traceback
import uuid
from collections import deque
from collections.abc import Iterable
from pathlib import Path
from typing import TYPE_CHECKING, Any, Union

from pydantic import ValidationError
from typing_extensions import override

from waldiez.models.waldiez import Waldiez
from waldiez.running.step_by_step.command_handler import CommandHandler
from waldiez.running.step_by_step.events_processor import EventProcessor

from ..base_runner import WaldiezBaseRunner
from ..exceptions import StopRunningException
from ..results_mixin import WaldiezRunResults
from .breakpoints_mixin import BreakpointsMixin
from .step_by_step_models import (
    VALID_CONTROL_COMMANDS,
    WaldiezDebugConfig,
    WaldiezDebugError,
    WaldiezDebugEventInfo,
    WaldiezDebugInputRequest,
    WaldiezDebugInputResponse,
    WaldiezDebugMessage,
    WaldiezDebugStats,
    WaldiezDebugStepAction,
)

if TYPE_CHECKING:
    from autogen.agentchat import ConversableAgent  # type: ignore
    from autogen.events import BaseEvent  # type: ignore
    from autogen.messages import BaseMessage  # type: ignore

MESSAGES = {
    "workflow_starting": "<Waldiez step-by-step> - Starting workflow...",
    "workflow_finished": "<Waldiez step-by-step> - Workflow finished",
    "workflow_stopped": "<Waldiez step-by-step> - Workflow stopped by user",
    "workflow_failed": (
        "<Waldiez step-by-step> - Workflow execution failed: {error}"
    ),
}
DEBUG_INPUT_PROMPT = (
    # cspell: disable-next-line
    "[Step] (c)ontinue, (r)un, (q)uit, (i)nfo, (h)elp, (st)ats: "
)


def gen_id() -> str:
    """Generate a new id.

    Returns
    -------
    str
        The new id.
    """
    return str(uuid.uuid4())


# pylint: disable=too-many-instance-attributes,too-many-ancestors
# noinspection DuplicatedCode,StrFormat
class WaldiezStepByStepRunner(WaldiezBaseRunner, BreakpointsMixin):
    """Refactored step-by-step runner with improved architecture."""

    def __init__(
        self,
        waldiez: Waldiez,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        dot_env: str | Path | None = None,
        auto_continue: bool = False,
        breakpoints: Iterable[Any] | None = None,
        config: WaldiezDebugConfig | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize the step-by-step runner."""
        super().__init__(
            waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            dot_env=dot_env,
            **kwargs,
        )
        BreakpointsMixin.__init__(self, config=config)
        self.set_agent_id_to_name(waldiez.flow.unique_names["agent_names"])

        # Configuration
        self._config = config or WaldiezDebugConfig()
        self._config.auto_continue = auto_continue

        # Core state
        self._event_count = 0
        self._processed_events = 0
        self._step_mode = self._config.step_mode

        # Use deque for efficient FIFO operations on event history
        self._event_history: deque[dict[str, Any]] = deque(
            maxlen=self._config.max_event_history
        )
        self._current_event: Union["BaseEvent", "BaseMessage", None] = None

        # Participant tracking
        self._known_participants = self.waldiez.info.participants
        self._last_sender: str | None = None
        self._last_recipient: str | None = None

        # Initialize breakpoints
        if breakpoints:
            _, errors = self.import_breakpoints(list(breakpoints))
            if errors:
                for error in errors:
                    self.log.warning("Breakpoint import error: %s", error)

        # Command handling
        self._command_handler = CommandHandler(self)
        self._event_processor = EventProcessor(self)
        auto_run = self.is_auto_run()
        self._config.auto_continue = auto_run

    @property
    def auto_continue(self) -> bool:
        """Get whether auto-continue is enabled."""
        return self._config.auto_continue

    @auto_continue.setter
    def auto_continue(self, value: bool) -> None:
        """Set whether auto-continue is enabled.

        Parameters
        ----------
        value : bool
            Whether to enable auto-continue.
        """
        self._config.auto_continue = value
        self.log.debug("Auto-continue mode set to: %s", value)

    @property
    def step_mode(self) -> bool:
        """Get the step mode.

        Returns
        -------
        bool
            Whether the step mode is enabled.
        """
        return self._step_mode

    @step_mode.setter
    def step_mode(self, value: bool) -> None:
        """Set the step mode.

        Parameters
        ----------
        value : bool
            Whether to enable step mode.
        """
        self._step_mode = value
        self.log.debug("Step mode set to: %s", value)

    @property
    def last_sender(self) -> str | None:
        """Get the last sender.

        Returns
        -------
        str | None
            The last sender, if available.
        """
        return self._last_sender

    @last_sender.setter
    def last_sender(self, value: str | None) -> None:
        """Set the last sender.

        Parameters
        ----------
        value : str | None
            The last sender to set.
        """
        self._last_sender = value

    @property
    def last_recipient(self) -> str | None:
        """Get the last recipient.

        Returns
        -------
        str | None
            The last recipient, if available.
        """
        return self._last_recipient

    @last_recipient.setter
    def last_recipient(self, value: str | None) -> None:
        """Set the last recipient.

        Parameters
        ----------
        value : str | None
            The last recipient to set.
        """
        self._last_recipient = value

    @property
    def stop_requested(self) -> threading.Event:
        """Get the stop requested event."""
        return self._stop_requested

    @property
    def max_event_history(self) -> int:
        """Get the maximum event history size."""
        return self._config.max_event_history

    def add_to_history(self, event_info: dict[str, Any]) -> None:
        """Add an event to the history.

        Parameters
        ----------
        event_info : dict[str, Any]
            The event information to add to the history.
        """
        self._event_history.append(event_info)

    def pop_event(self) -> None:
        """Pop event from the history."""
        if self._event_history:
            self._event_history.popleft()

    def emit_event(
        self, event: Union["BaseEvent", "BaseMessage", dict[str, Any]]
    ) -> None:
        """Emit an event.

        Parameters
        ----------
        event : BaseEvent | BaseMessage | dict[str, Any]
            The event to emit.
        """
        if not isinstance(event, dict):
            event_info = event.model_dump(
                mode="json", exclude_none=True, fallback=str
            )
            event_info["count"] = self._event_count
            event_info["sender"] = getattr(event, "sender", self._last_sender)
            event_info["recipient"] = getattr(
                event, "recipient", self._last_recipient
            )
        else:
            event_info = event
        self.emit(WaldiezDebugEventInfo(event=event_info))

    # noinspection PyTypeHints
    @override
    def emit(self, message: WaldiezDebugMessage) -> None:
        """Emit a debug message.

        Parameters
        ----------
        message : WaldiezDebugMessage
            The message to emit.
        """
        message_dump = message.model_dump(
            mode="json", exclude_none=True, fallback=str
        )
        self.print(message_dump)

    @property
    def current_event(self) -> Union["BaseEvent", "BaseMessage", None]:
        """Get the current event.

        Returns
        -------
        Union["BaseEvent", "BaseMessage", None]
            The current event, if available.
        """
        return self._current_event

    @current_event.setter
    def current_event(
        self, value: Union["BaseEvent", "BaseMessage", None]
    ) -> None:
        """Set the current event.

        Parameters
        ----------
        value : Union["BaseEvent", "BaseMessage", None]
            The event to set as the current event.
        """
        self._current_event = value

    @property
    def event_count(self) -> int:
        """Get the current event count.

        Returns
        -------
        int
            The current event count.
        """
        return self._event_count

    def event_plus_one(self) -> None:
        """Increment the current event count."""
        self._event_count += 1

    def show_event_info(self) -> None:
        """Show detailed information about the current event."""
        if not self._current_event:
            self.emit(WaldiezDebugError(error="No current event to display"))
            return

        event_info = self._current_event.model_dump(
            mode="json", exclude_none=True, fallback=str
        )
        # Add additional context
        event_info["_meta"] = {
            "event_number": self._event_count,
            "processed_events": self._processed_events,
            "step_mode": self._step_mode,
            "has_breakpoints": len(self._breakpoints) > 0,
        }
        self.emit(WaldiezDebugEventInfo(event=event_info))

    def show_stats(self) -> None:
        """Show comprehensive execution statistics."""
        base_stats: dict[str, Any] = {
            "execution": {
                "events_processed": self._processed_events,
                "total_events": self._event_count,
                "processing_rate": (
                    f"{(self._processed_events / self._event_count * 100):.1f}%"
                    if self._event_count > 0
                    else "0%"
                ),
            },
            "mode": {
                "step_mode": self._step_mode,
                "auto_continue": self._config.auto_continue,
            },
            "history": {
                "event_history_count": len(self._event_history),
                "max_history_size": self._config.max_event_history,
                "memory_usage": f"{len(self._event_history) * 200}B (est.)",
            },
            "participants": {
                "last_sender": self._last_sender,
                "last_recipient": self._last_recipient,
                "known_participants": len(self._known_participants),
            },
        }

        # Merge with breakpoint stats
        breakpoint_stats = self.get_breakpoint_stats()
        stats_dict: dict[str, Any] = {
            **base_stats,
            "breakpoints": breakpoint_stats,
        }

        self.emit(WaldiezDebugStats(stats=stats_dict))

    @property
    def execution_stats(self) -> dict[str, Any]:
        """Get comprehensive execution statistics.

        Returns
        -------
        dict[str, Any]
            A dictionary containing execution statistics.
        """
        base_stats: dict[str, Any] = {
            "total_events": self._event_count,
            "processed_events": self._processed_events,
            "event_processing_rate": (
                self._processed_events / self._event_count
                if self._event_count > 0
                else 0
            ),
            "step_mode": self._step_mode,
            "auto_continue": self._config.auto_continue,
            "event_history_count": len(self._event_history),
            "last_sender": self._last_sender,
            "last_recipient": self._last_recipient,
            "known_participants": [
                p.model_dump() for p in self._known_participants
            ],
            "config": self._config.model_dump(),
        }

        return {**base_stats, "breakpoints": self.get_breakpoint_stats()}

    @property
    def event_history(self) -> list[dict[str, Any]]:
        """Get the history of processed events.

        Returns
        -------
        list[dict[str, Any]]
            A list of dictionaries containing event history.
        """
        return list(self._event_history)

    def reset_session(self) -> None:
        """Reset the debugging session state."""
        self._event_count = 0
        self._processed_events = 0
        self._event_history.clear()
        self._current_event = None
        self._last_sender = None
        self._last_recipient = None
        self.reset_stats()
        self.log.info("Debug session reset")

    def _get_user_response(
        self,
        user_response: str,
        request_id: str,
        skip_id_check: bool = False,
    ) -> tuple[str | None, bool]:
        """Get and validate user response."""
        try:
            response = WaldiezDebugInputResponse.model_validate_json(
                user_response
            )
        except ValidationError as exc:
            # Handle raw CLI input
            got = user_response.strip().lower()
            if got in VALID_CONTROL_COMMANDS:
                return got, True
            self.emit(WaldiezDebugError(error=f"Invalid input: {exc}"))
            return None, False

        if not skip_id_check and response.request_id != request_id:
            self.emit(
                WaldiezDebugError(
                    error=f"Stale input received: {response.request_id} != {request_id}"
                )
            )
            return None, False

        return response.data, True

    def _parse_user_action(
        self, user_response: str, request_id: str
    ) -> WaldiezDebugStepAction:
        """Parse user action using the command handler."""
        self.log.debug("Parsing user action... '%s'", user_response)

        user_input, is_valid = self._get_user_response(
            user_response,
            request_id=request_id,
            skip_id_check=True,
        )
        if not is_valid:
            return WaldiezDebugStepAction.UNKNOWN

        return self._command_handler.handle_command(user_input or "")

    def _get_user_action(self, force: bool) -> WaldiezDebugStepAction:
        """Get user action with timeout support.

        Parameters
        ----------
        force : bool
            Force getting the user's action, even if in auto-run mode.
        """
        if self._config.auto_continue:
            self.step_mode = True
            if force:
                self._config.auto_continue = False
            else:
                return WaldiezDebugStepAction.CONTINUE
        while True:
            request_id = gen_id()
            try:
                if not self.structured_io:
                    # if structured, we already do this (print the prompt)
                    self.emit(
                        WaldiezDebugInputRequest(
                            prompt=DEBUG_INPUT_PROMPT, request_id=request_id
                        )
                    )
            except Exception as e:  # pylint: disable=broad-exception-caught
                self.log.warning("Failed to emit input request: %s", e)
            try:
                user_input = self.get_user_input(
                    DEBUG_INPUT_PROMPT,
                    request_id=request_id,
                ).strip()
                return self._parse_user_action(
                    user_input, request_id=request_id
                )

            except (KeyboardInterrupt, EOFError):
                self._stop_requested.set()
                return WaldiezDebugStepAction.QUIT

    async def _a_get_user_action(self, force: bool) -> WaldiezDebugStepAction:
        """Get user action asynchronously."""
        if self._config.auto_continue:
            self.step_mode = True
            if force:
                self._config.auto_continue = False
            else:
                return WaldiezDebugStepAction.CONTINUE

        while True:
            request_id = gen_id()
            # pylint: disable=too-many-try-statements
            try:
                self.emit(
                    WaldiezDebugInputRequest(
                        prompt=DEBUG_INPUT_PROMPT, request_id=request_id
                    )
                )

                user_input = await self.a_get_user_input(DEBUG_INPUT_PROMPT)
                user_input = user_input.strip()
                return self._parse_user_action(
                    user_input, request_id=request_id
                )

            except (KeyboardInterrupt, EOFError):
                return WaldiezDebugStepAction.QUIT

    def _handle_step_interaction(self, force: bool) -> bool:
        """Handle step-by-step user interaction.

        Parameters
        ----------
        force : bool
            Force getting the user's action, even if in auto-run mode.
        """
        while True:
            action = self._get_user_action(force)
            if action in (
                WaldiezDebugStepAction.CONTINUE,
                WaldiezDebugStepAction.STEP,
            ):
                return True
            if action == WaldiezDebugStepAction.RUN:
                self._config.auto_continue = True
                return True
            if action == WaldiezDebugStepAction.QUIT:
                return False
            # For other actions (info, help, etc.), continue the loop

    async def _a_handle_step_interaction(self, force: bool) -> bool:
        """Handle step-by-step user interaction asynchronously."""
        while True:
            action = await self._a_get_user_action(force)
            if action in (
                WaldiezDebugStepAction.CONTINUE,
                WaldiezDebugStepAction.STEP,
            ):
                return True
            if action == WaldiezDebugStepAction.RUN:
                self._config.auto_continue = True
                return True
            if action == WaldiezDebugStepAction.QUIT:
                return False
            # For other actions (info, help, etc.), continue the loop

    # pylint: disable=too-many-locals
    @override
    def _run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        message: str | None = None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
        skip_symlinks: bool = False,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez workflow with step-by-step debugging."""
        self._skip_deps = (
            str(kwargs.get("skip_deps", str(self._skip_deps))).lower() == "true"
        )
        # pylint: disable=import-outside-toplevel
        from autogen.io import IOStream  # type: ignore

        from waldiez.io import StructuredIOStream

        results_container: WaldiezRunResults = {
            "results": [],
            "exception": None,
            "completed": False,
        }
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            loaded_module = self._load_module(output_file, temp_dir)
            self._store_run_paths(tmp_dir=temp_dir, output_file=output_file)
            if self._stop_requested.is_set():
                self.log.debug(
                    "Step-by-step execution stopped before workflow start"
                )
                return []

            # Setup I/O
            if self.structured_io:
                stream = StructuredIOStream(
                    uploads_root=uploads_root, is_async=False
                )
            else:
                stream = IOStream.get_default()

            self.set_print_function(stream.print)
            self.set_input_function(stream.input)
            self.set_send_function(stream.send)
            self._output_dir = temp_dir
            self.print(MESSAGES["workflow_starting"])
            self.print(self.waldiez.info.model_dump_json())
            results = loaded_module.main(
                on_event=self._on_event,
                state_json=self.state_json,
            )
            results_container["results"] = results
            self.print(MESSAGES["workflow_finished"])

        except Exception as e:
            if StopRunningException.reason in str(e):
                raise StopRunningException(StopRunningException.reason) from e
            results_container["exception"] = e
            traceback.print_exc()
            self.print(MESSAGES["workflow_failed"].format(error=str(e)))
        finally:
            results_container["completed"] = True
            self._remove_run_paths()

        return results_container["results"]

    def _re_emit_if_needed(self, event_info: dict[str, Any]) -> None:
        # emit again if type is text, swapping the sender and without recipient
        if event_info.get("type", "") == "text":
            event_info["sender"] = event_info["recipient"]
            event_info["recipient"] = None
            event_info["agents"]["sender"] = event_info["agents"]["recipient"]
            event_info["agents"]["recipient"] = None
            self.emit_event(event_info)

    def _on_event(
        self,
        event: Union["BaseEvent", "BaseMessage"],
        agents: list["ConversableAgent"],
    ) -> bool:
        """Process an event with step-by-step debugging."""
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            # Use the event processor for core logic
            result = self._event_processor.process_event(event, agents)

            if result["action"] == "stop":
                self.log.debug(
                    "Step-by-step execution stopped before event processing"
                )
                return False
            event_info = result["event_info"]
            self.emit_event(event_info)
            # Handle breakpoint logic
            if result["action"] == "break":
                if not self._handle_step_interaction(force=True):
                    self._stop_requested.set()
                    if hasattr(event, "type") and event.type == "input_request":
                        event.content.respond("exit")
                        return True
                    raise StopRunningException(StopRunningException.reason)
                self._re_emit_if_needed(event_info)
            # Process the actual event
            self.process_event(
                event, agents, output_dir=self._output_dir, skip_send=True
            )
            self._processed_events += 1

        except Exception as e:
            if not isinstance(e, StopRunningException):
                raise RuntimeError(
                    f"Error processing event {event}: {e}\n{traceback.format_exc()}"
                ) from e
            raise StopRunningException(StopRunningException.reason) from e

        return not self._stop_requested.is_set()

    # pylint: disable=too-complex
    @override
    async def _a_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        message: str | None = None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
        skip_symlinks: bool = False,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez workflow with step-by-step debugging (async)."""
        self._skip_deps = (
            str(kwargs.get("skip_deps", str(self._skip_deps))).lower() == "true"
        )

        async def _execute_workflow() -> list[dict[str, Any]]:
            # pylint: disable=import-outside-toplevel
            from autogen.io import IOStream

            from waldiez.io import StructuredIOStream

            # pylint: disable=too-many-try-statements,broad-exception-caught
            try:
                loaded_module = self._load_module(output_file, temp_dir)
                await self._a_store_run_paths(
                    tmp_dir=temp_dir, output_file=output_file
                )
                if self._stop_requested.is_set():
                    self.log.debug(
                        "Step-by-step execution stopped before workflow start"
                    )
                    return []

                if self.structured_io:
                    stream = StructuredIOStream(
                        uploads_root=uploads_root, is_async=True
                    )
                else:
                    stream = IOStream.get_default()

                self.set_print_function(stream.print)
                self.set_input_function(stream.input)
                self.set_send_function(stream.send)

                self._output_dir = temp_dir
                self.print(MESSAGES["workflow_starting"])
                self.print(self.waldiez.info.model_dump_json())

                results = await loaded_module.main(
                    on_event=self._a_on_event,
                    state_json=self.state_json,
                )
                self.print(MESSAGES["workflow_finished"])
                return results

            except Exception as e:
                if StopRunningException.reason in str(e):
                    raise StopRunningException(
                        StopRunningException.reason
                    ) from e
                self.print(MESSAGES["workflow_failed"].format(error=str(e)))
                traceback.print_exc()
                return []
            finally:
                self._remove_run_paths()

        # Create and monitor cancellable task
        task = asyncio.create_task(_execute_workflow())
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            while not task.done():
                if self._stop_requested.is_set():
                    task.cancel()
                    self.log.debug("Step-by-step execution stopped by user")
                    break
                await asyncio.sleep(0.1)
            return await task
        except asyncio.CancelledError:
            self.log.debug("Step-by-step execution cancelled")
            return []

    async def _a_on_event(
        self,
        event: Union["BaseEvent", "BaseMessage"],
        agents: list["ConversableAgent"],
    ) -> bool:
        """Process an event with step-by-step debugging asynchronously."""
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            # Use the event processor for core logic
            result = self._event_processor.process_event(event, agents)

            if result["action"] == "stop":
                self.log.debug(
                    "Async step-by-step execution stopped before event processing"
                )
                return False
            event_info = result["event_info"]
            self.emit_event(event_info)
            # Handle breakpoint logic
            if result["action"] == "break":
                if not await self._a_handle_step_interaction(force=True):
                    self._stop_requested.set()
                    if hasattr(event, "type") and event.type == "input_request":
                        await event.content.respond("exit")
                        return True
                    raise StopRunningException(StopRunningException.reason)
                self._re_emit_if_needed(event_info)
            # Process the actual event
            await self.a_process_event(
                event, agents, output_dir=self._output_dir, skip_send=True
            )
            self._processed_events += 1

        except Exception as e:
            if not isinstance(e, StopRunningException):
                raise RuntimeError(
                    f"Error processing event {event}: {e}\n{traceback.format_exc()}"
                ) from e
            raise StopRunningException(StopRunningException.reason) from e

        return not self._stop_requested.is_set()
