# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportUnknownMemberType=false, reportAttributeAccessIssue=false
# pyright: reportUnknownArgumentType=false, reportOptionalMemberAccess=false
# pylint: disable=duplicate-code

"""Step-by-step Waldiez runner with user interaction capabilities."""

import asyncio
import threading
import traceback
import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any, Union

from pydantic import ValidationError

from waldiez.models.waldiez import Waldiez

from .base_runner import WaldiezBaseRunner
from .exceptions import StopRunningException
from .run_results import WaldiezRunResults
from .step_by_step_models import (
    HELP_MESSAGE,
    WaldiezDebugError,
    WaldiezDebugEventInfo,
    WaldiezDebugInputRequest,
    WaldiezDebugInputResponse,
    WaldiezDebugMessage,
    WaldiezDebugStats,
    WaldiezDebugStepAction,
)

if TYPE_CHECKING:
    from autogen.events import BaseEvent  # type: ignore
    from autogen.messages import BaseMessage  # type: ignore


DEBUG_INPUT_PROMPT = (
    "[Step] (c)ontinue, (r)un, (q)uit, (i)nfo, (h)elp, (st)ats: "
)
MESSAGES = {
    "workflow_starting": "<Waldiez step-by-step> - Starting workflow...",
    "workflow_finished": "<Waldiez step-by-step> - Workflow finished",
    "workflow_stopped": "<Waldiez step-by-step> - Workflow stopped by user",
    "workflow_failed": (
        "<Waldiez step-by-step> - Workflow execution failed: {error}"
    ),
}


# pylint: disable=too-many-instance-attributes
class WaldiezStepByStepRunner(WaldiezBaseRunner):
    """Step-by-step runner with user interaction and debugging capabilities."""

    def __init__(
        self,
        waldiez: Waldiez,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        dot_env: str | Path | None = None,
        auto_continue: bool = False,
        break_on_events: list[str] | None = None,
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
        self._event_count = 0
        self._processed_events = 0
        self._step_mode = True
        self._auto_continue = auto_continue
        self._break_on_events = break_on_events or []
        self._event_history: list[dict[str, Any]] = []
        self._current_event: Union["BaseEvent", "BaseMessage", None] = None
        self._known_participants = self.waldiez.info.participants
        self._last_sender: str | None = None
        self._last_recipient: str | None = None

    @property
    def auto_continue(self) -> bool:
        """Get whether auto-continue is enabled."""
        return self._auto_continue

    @auto_continue.setter
    def auto_continue(self, value: bool) -> None:
        """Set whether auto-continue is enabled.

        Parameters
        ----------
        value : bool
            Whether to enable auto-continue.
        """
        self._auto_continue = value

    @property
    def stop_requested(self) -> threading.Event:
        """Get the stop requested event."""
        return self._stop_requested

    def set_auto_continue(self, auto_continue: bool) -> None:
        """Set whether to automatically continue without user input.

        Parameters
        ----------
        auto_continue : bool
            Whether to automatically continue execution
            without waiting for user input.
        """
        self._auto_continue = auto_continue
        self.log.info("Auto-continue mode set to: %s", auto_continue)

    # pylint: disable=no-self-use
    # noinspection PyMethodMayBeStatic
    def print(self, *args: Any, **kwargs: Any) -> None:
        """Print.

        Parameters
        ----------
        *args : Any
            Positional arguments to print.
        **kwargs : Any
            Keyword arguments to print.
        """
        WaldiezBaseRunner._print(*args, **kwargs)

    def emit_event(self, event: Union["BaseEvent", "BaseMessage"]) -> None:
        """Emit an event.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event to emit.
        """
        event_info = event.model_dump(
            mode="json", exclude_none=True, fallback=str
        )
        event_info["count"] = self._event_count
        self._last_sender = getattr(event, "sender", self._last_sender)
        self._last_recipient = getattr(event, "recipient", self._last_recipient)
        event_info["sender"] = self._last_sender
        event_info["recipient"] = self._last_recipient
        self.emit(WaldiezDebugEventInfo(event=event_info))

    def emit(self, message: WaldiezDebugMessage) -> None:
        """Emit a debug message.

        Parameters
        ----------
        message : WaldiezDebugMessage
            The debug message to emit.
        """
        message_dump = message.model_dump(
            mode="json", exclude_none=True, fallback=str
        )
        self.print(message_dump)

    def _show_stats(self) -> None:
        stats_dict: dict[str, Any] = {
            "events_processed": self._processed_events,
            "total_events": self._event_count,
            "step_mode": self._step_mode,
            "auto_continue": self._auto_continue,
            "break_on_events": (
                self._break_on_events if self._break_on_events else []
            ),
            "event_history_count": len(self._event_history),
        }
        self.emit(WaldiezDebugStats(stats=stats_dict))

    def _should_break_on_event(
        self, event: Union["BaseEvent", "BaseMessage"]
    ) -> bool:
        """Determine if we should break on this event.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event to check.

        Returns
        -------
        bool
            True if we should break, False otherwise.
        """
        if not self._step_mode:
            return False

        # Check if event type is in break list
        event_type = getattr(event, "type", "unknown")
        if event_type == "input_request":
            # we'll already wait for user input in this case
            return False
        # If no specific events specified, break on all
        if not self._break_on_events:
            return True
        return event_type in self._break_on_events

    def _get_user_response(
        self, user_response: str, input_id: str
    ) -> tuple[str | None, bool]:
        """Get user response for step-by-step execution.

        Parameters
        ----------
        user_response : str
            The user's response.
        input_id : str
            The ID of the input request.

        Returns
        -------
        tuple[str | None, bool]
            The user's response or None if invalid,
            and a boolean indicating validity.
        """
        try:
            response = WaldiezDebugInputResponse.model_validate_json(
                user_response
            )
        except ValidationError as exc:
            got = user_response.strip().lower()
            # in cli mode, let's see if got raw response
            # instead of a structured one
            if got in (
                "",
                "c",
                "r",
                "s",
                "h",
                "q",
                "i",
                "st",
            ):
                return got, True
            self.emit(WaldiezDebugError(error=f"Invalid input: {exc}"))
            return None, False

        if response.input_id != input_id:
            self.emit(
                WaldiezDebugError(
                    error=(
                        "Stale input received: "
                        f"{response.input_id} != {input_id}"
                    )
                )
            )
            return None, False
        return response.response, True

    # pylint: disable=too-many-return-statements
    def _parse_user_action(
        self, user_response: str, input_id: str
    ) -> WaldiezDebugStepAction:
        """Parse user action for step-by-step execution.

        Parameters
        ----------
        user_response : str
            The user's response.
        input_id : str
            The ID of the input request.

        Returns
        -------
        WaldiezDebugStepAction
            The action chosen by the user.
        """
        user_input, is_valid = self._get_user_response(user_response, input_id)
        if not is_valid:
            return WaldiezDebugStepAction.UNKNOWN
        if not user_input:
            return WaldiezDebugStepAction.CONTINUE
        match user_input:
            case "c":
                return WaldiezDebugStepAction.CONTINUE
            case "s":
                return WaldiezDebugStepAction.STEP
            case "r":
                self._step_mode = False
                return WaldiezDebugStepAction.RUN
            case "q":
                self._stop_requested.set()
                return WaldiezDebugStepAction.QUIT
            case "i":
                return WaldiezDebugStepAction.INFO
            case "h":
                self.emit(HELP_MESSAGE)
                return WaldiezDebugStepAction.HELP
            case "st":
                self._show_stats()
                return WaldiezDebugStepAction.STATS
            case _:
                self.emit(
                    WaldiezDebugError(
                        error=f"Unknown command: {user_input}, use 'h' for help"
                    )
                )
                return WaldiezDebugStepAction.UNKNOWN

    def _get_user_action(self) -> WaldiezDebugStepAction:
        """Get user action for step-by-step execution.

        Returns
        -------
        WaldiezDebugStepAction
            The action chosen by the user.
        """
        if self._auto_continue:
            return WaldiezDebugStepAction.CONTINUE

        while True:
            # pylint: disable=too-many-try-statements
            input_id = str(uuid.uuid4())
            try:
                self.emit(
                    WaldiezDebugInputRequest(
                        prompt=DEBUG_INPUT_PROMPT, input_id=input_id
                    )
                )
                user_input = (
                    WaldiezBaseRunner.get_user_input(DEBUG_INPUT_PROMPT)
                    .strip()
                    .lower()
                )
                return self._parse_user_action(user_input, input_id=input_id)
            except (KeyboardInterrupt, EOFError):
                self._stop_requested.set()
                return WaldiezDebugStepAction.QUIT

    # pylint: disable=too-many-return-statements
    async def _a_get_user_action(self) -> WaldiezDebugStepAction:
        """Get user action for step-by-step execution asynchronously.

        Returns
        -------
        WaldiezDebugStepAction
            The action chosen by the user.
        """
        if self._auto_continue:
            return WaldiezDebugStepAction.CONTINUE

        while True:
            # pylint: disable=too-many-try-statements
            input_id = str(uuid.uuid4())
            try:
                self.emit(
                    WaldiezDebugInputRequest(
                        prompt=DEBUG_INPUT_PROMPT, input_id=input_id
                    )
                )
                user_input = await WaldiezBaseRunner.a_get_user_input(
                    DEBUG_INPUT_PROMPT
                )
                user_input = user_input.strip().lower()
                return self._parse_user_action(user_input, input_id=input_id)
            except (KeyboardInterrupt, EOFError):
                return WaldiezDebugStepAction.QUIT

    def _handle_step_interaction(self) -> bool:
        """Handle step-by-step user interaction.

        Returns
        -------
        bool
            True to continue execution, False to stop.
        """
        while True:  # pragma: no branch
            action = self._get_user_action()

            if action in (
                WaldiezDebugStepAction.CONTINUE,
                WaldiezDebugStepAction.STEP,
            ):
                return True
            if action == WaldiezDebugStepAction.RUN:
                return True
            if action == WaldiezDebugStepAction.QUIT:  # pragma: no branch
                return False

    async def _a_handle_step_interaction(self) -> bool:
        """Handle step-by-step user interaction asynchronously.

        Returns
        -------
        bool
            True to continue execution, False to stop.
        """
        while True:  # pragma: no branch
            action = await self._a_get_user_action()

            if action in (
                WaldiezDebugStepAction.CONTINUE,
                WaldiezDebugStepAction.STEP,
            ):
                return True
            if action == WaldiezDebugStepAction.RUN:
                return True
            if action == WaldiezDebugStepAction.QUIT:  # pragma: no branch
                return False

    # pylint: disable=unused-argument
    def _run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez workflow with step-by-step debugging."""
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
            if self._stop_requested.is_set():  # pragma: no cover
                self.log.debug(
                    "Step-by-step execution stopped before workflow start"
                )
                return []

            if self.structured_io:
                stream = StructuredIOStream(
                    uploads_root=uploads_root, is_async=False
                )
            else:
                stream = IOStream.get_default()

            WaldiezBaseRunner._print = stream.print
            WaldiezBaseRunner._input = stream.input
            WaldiezBaseRunner._send = stream.send

            self.print(MESSAGES["workflow_starting"])
            self.print(self.waldiez.info.model_dump_json())

            results = loaded_module.main(on_event=self._on_event)
            results_container["results"] = results
            self.print(MESSAGES["workflow_finished"])

        except Exception as e:
            if StopRunningException.reason in str(e):
                raise StopRunningException(StopRunningException.reason) from e
            results_container["exception"] = e
            traceback.print_exc()
            self.print(MESSAGES["workflow_failed"].format(error=e))
        finally:
            results_container["completed"] = True

        return results_container["results"]

    def _on_event(self, event: Union["BaseEvent", "BaseMessage"]) -> bool:
        """Process an event with step-by-step debugging.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event to process.

        Returns
        -------
        bool
            True to continue, False to stop.

        Raises
        ------
        RuntimeError
            If an error occurs while processing the event.
        StopRunningException
            If execution is stopped by user request.
        """
        self._event_count += 1
        self._current_event = event

        if self._stop_requested.is_set():
            self.log.debug(
                "Step-by-step execution stopped before event processing"
            )
            return False

        # Store event in history
        event_info = event.model_dump(
            mode="json", exclude_none=True, fallback=str
        )
        event_info["count"] = self._event_count
        self._event_history.append(event_info)

        # pylint: disable=too-many-try-statements
        try:
            # Show event information if we should break
            if self._should_break_on_event(event):  # pragma: no branch
                self.emit_event(event)
                if not self._handle_step_interaction():
                    self._stop_requested.set()
                    if hasattr(event, "type") and event.type == "input_request":
                        event.content.respond("exit")
                        return True
                    raise StopRunningException(StopRunningException.reason)

            # Process the event
            WaldiezBaseRunner.process_event(event)
            self._processed_events += 1

        except Exception as e:
            if not isinstance(e, StopRunningException):
                raise RuntimeError(
                    f"Error processing event {event}: "
                    f"{e}\n{traceback.format_exc()}"
                ) from e
            raise StopRunningException(StopRunningException.reason) from e
        return not self._stop_requested.is_set()

    # pylint: disable=too-complex
    async def _a_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez workflow with step-by-step debugging (async)."""

        async def _execute_workflow() -> list[dict[str, Any]]:
            """Execute the workflow in an async context."""
            # pylint: disable=import-outside-toplevel
            from autogen.io import IOStream  # pyright: ignore

            from waldiez.io import StructuredIOStream

            results: list[dict[str, Any]]
            # pylint: disable=too-many-try-statements,broad-exception-caught
            try:
                loaded_module = self._load_module(output_file, temp_dir)
                if self._stop_requested.is_set():  # pragma: no cover
                    self.log.debug(
                        "step-by-step execution stopped before workflow start"
                    )
                    return []

                if self.structured_io:
                    stream = StructuredIOStream(
                        uploads_root=uploads_root, is_async=True
                    )
                else:
                    stream = IOStream.get_default()

                WaldiezBaseRunner._print = stream.print
                WaldiezBaseRunner._input = stream.input
                WaldiezBaseRunner._send = stream.send

                self.print(MESSAGES["workflow_starting"])
                self.print(self.waldiez.info.model_dump_json())

                results = await loaded_module.main(on_event=self._a_on_event)
                self.print(MESSAGES["workflow_finished"])

            except Exception as e:
                if StopRunningException.reason in str(e):
                    raise StopRunningException(
                        StopRunningException.reason
                    ) from e
                self.print(MESSAGES["workflow_failed"].format(error=e))
                traceback.print_exc()
                return []

            return results

        # Create cancellable task
        task = asyncio.create_task(_execute_workflow())

        # Monitor for stop requests
        # pylint: disable=too-many-try-statements
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
        self, event: Union["BaseEvent", "BaseMessage"]
    ) -> bool:
        """Process an event with step-by-step debugging asynchronously.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event to process.

        Returns
        -------
        bool
            True to continue, False to stop.

        Raises
        ------
        RuntimeError
            If an error occurs while processing the event.
        StopRunningException
            If execution is stopped by user request.
        """
        self._event_count += 1
        self._current_event = event

        if self._stop_requested.is_set():
            self.log.debug(
                "Async step-by-step execution stopped before event processing"
            )
            return False

        # Store event in history
        event_info = event.model_dump(
            mode="json", exclude_none=True, fallback=str
        )
        event_info["count"] = self._event_count
        self._event_history.append(event_info)

        # pylint: disable=too-many-try-statements
        try:
            # Show event information if we should break
            if self._should_break_on_event(event):  # pragma: no branch
                self.emit_event(event)

                # Handle step interaction
                if not await self._a_handle_step_interaction():
                    self._stop_requested.set()
                    if hasattr(event, "type") and event.type == "input_request":
                        event.content.respond("exit")
                        return True
                    raise StopRunningException(StopRunningException.reason)

            # Process the event
            await WaldiezBaseRunner.a_process_event(event)
            self._processed_events += 1

        except Exception as e:
            if not isinstance(e, StopRunningException):
                raise RuntimeError(
                    f"Error processing event {event}: "
                    f"{e}\n{traceback.format_exc()}"
                ) from e
            raise StopRunningException(StopRunningException.reason) from e
        return not self._stop_requested.is_set()

    def get_execution_stats(self) -> dict[str, Any]:
        """Get execution statistics for step-by-step runner.

        Returns
        -------
        dict[str, Any]
            A dictionary containing execution statistics.
        """
        return {
            "total_events": self._event_count,
            "processed_events": self._processed_events,
            "event_processing_rate": (
                self._processed_events / self._event_count
                if self._event_count > 0
                else 0
            ),
            "step_mode": self._step_mode,
            "auto_continue": self._auto_continue,
            "break_on_events": self._break_on_events,
            "event_history_count": len(self._event_history),
        }

    def get_event_history(self) -> list[dict[str, Any]]:
        """Get the history of processed events.

        Returns
        -------
        list[dict[str, Any]]
            List of event information dictionaries.
        """
        return self._event_history.copy()

    def set_break_on_events(self, event_types: list[str]) -> None:
        """Set which event types to break on.

        Parameters
        ----------
        event_types : list[str]
            List of event types to break on. Empty list means break on all.
        """
        self._break_on_events = event_types.copy()

    def enable_auto_continue(self, enabled: bool = True) -> None:
        """Enable or disable auto-continue mode.

        Parameters
        ----------
        enabled : bool, optional
            Whether to enable auto-continue, by default True.
        """
        self._auto_continue = enabled

    def enable_step_mode(self, enabled: bool = True) -> None:
        """Enable or disable step mode.

        Parameters
        ----------
        enabled : bool, optional
            Whether to enable step mode, by default True.
        """
        self._step_mode = enabled
