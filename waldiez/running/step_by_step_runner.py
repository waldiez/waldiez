# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# flake8: noqa: C901, E501
# pyright: reportUnknownMemberType=false, reportUnknownVariableType=false
# pyright: reportAttributeAccessIssue=false,reportUnknownArgumentType=false
# pylint: disable=too-many-try-statements,import-outside-toplevel,line-too-long,
# pylint: disable=too-complex,unused-argument,duplicate-code,broad-exception-caught
"""Step-by-step Waldiez runner with user interaction capabilities."""

import asyncio
import threading
import traceback
from enum import Enum
from pathlib import Path
from typing import TYPE_CHECKING, Any, Union

from waldiez.models.waldiez import Waldiez

from .base_runner import StopRunningException, WaldiezBaseRunner
from .run_results import WaldiezRunResults

if TYPE_CHECKING:
    from autogen.events import BaseEvent  # type: ignore
    from autogen.messages import BaseMessage  # type: ignore


class StepAction(Enum):
    """Available actions during step-by-step execution."""

    CONTINUE = "c"  # Continue to next event
    STEP = "s"  # Step through (same as continue, but explicit)
    RUN = "r"  # Run without stopping (disable step mode)
    QUIT = "q"  # Quit execution
    INFO = "i"  # Show detailed event information
    HELP = "h"  # Show help
    STATS = "st"  # Show execution statistics
    UNKNOWN = "unknown"  # Unknown command


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

    def _format_event_info(
        self, event: Union["BaseEvent", "BaseMessage"]
    ) -> str:
        """Format event information for display.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event to format.

        Returns
        -------
        str
            Formatted event information.
        """
        event_type = getattr(event, "type", "unknown")
        event_info = [
            f"Event #{self._event_count}: {event_type}",
            f"Type: {type(event).__name__}",
        ]

        # Add common attributes if they exist
        if hasattr(event, "content"):
            content = str(event.content)[:97]  # Truncate long content
            if len(str(event.content)) > 97:
                content += "..."
            event_info.append(f"Content: {content}")

        if hasattr(event, "source"):
            event_info.append(f"Source: {event.source}")

        if hasattr(event, "target"):
            event_info.append(f"Target: {event.target}")

        if hasattr(event, "timestamp"):
            event_info.append(f"Timestamp: {event.timestamp}")

        # Add any other relevant attributes
        for attr in ["agent_name", "chat_id", "message_id", "tool_name"]:
            if hasattr(event, attr):
                attr_val = getattr(event, attr)
                attr_display = attr.replace("_", " ").title()
                event_info.append(f"{attr_display}: {attr_val}")

        return "\n".join(event_info)

    def _show_help(self) -> None:
        """Show help information for step-by-step commands."""
        help_text = """
Step-by-Step Debug Commands:
  c, s    - Continue/Step to next event
  r       - Run without stopping (disable step mode)
  q       - Quit execution
  i       - Show detailed current event information
  h       - Show this help
  st      - Show execution statistics

Tips:
  - Press Enter alone to continue (same as 'c')
  - Use 'r' to switch to normal execution mode
  - Event history is maintained for debugging
        """
        self.print(help_text)

    def _show_stats(self) -> None:
        """Show current execution statistics."""
        stats_text = f"""
Execution Statistics:
  Events processed: {self._processed_events}/{self._event_count}
  Step mode: {"ON" if self._step_mode else "OFF"}
  Auto-continue: {"ON" if self._auto_continue else "OFF"}
  Break on events: {self._break_on_events if self._break_on_events else "ALL"}
  Event history: {len(self._event_history)} events
"""
        self.print(stats_text)

    # pylint: disable=too-many-return-statements
    def _handle_user_action(self, user_input: str) -> StepAction:
        """Handle user action for step-by-step execution.

        Returns
        -------
        StepAction
            The action chosen by the user.
        """
        if not user_input:
            return StepAction.CONTINUE
        match user_input:
            case "c":
                return StepAction.CONTINUE
            case "s":
                return StepAction.STEP
            case "r":
                self._step_mode = False
                self.print("Switching to run mode (no more breaks)")
                return StepAction.RUN
            case "q":
                self.print("Stopping execution by user request")
                self._stop_requested.set()
                self._signal_completion()
                return StepAction.QUIT
            case "i":
                if self._current_event:
                    detailed_info = self._format_event_info(self._current_event)
                    self.print(
                        f"\nDetailed Event Information:\n{detailed_info}\n"
                    )
                else:
                    self.print("No current event information available")
                return StepAction.INFO
            case "h":
                self._show_help()
                return StepAction.HELP
            case "st":
                self._show_stats()
                return StepAction.STATS
            case _:
                self.print(f"Unknown command: {user_input}. Type 'h' for help.")
                return StepAction.UNKNOWN

    # pylint: disable=too-many-return-statements
    def _get_user_action(self) -> StepAction:
        """Get user action for step-by-step execution.

        Returns
        -------
        StepAction
            The action chosen by the user.
        """
        if self._auto_continue:
            return StepAction.CONTINUE

        while True:
            try:
                prompt = "[Step] (c)ontinue, (r)un, (q)uit, (i)nfo, (h)elp, (st)ats: "
                user_input = (
                    WaldiezBaseRunner.get_user_input(prompt).strip().lower()
                )
                return self._handle_user_action(user_input)
            except (KeyboardInterrupt, EOFError):
                self._stop_requested.set()
                self._signal_completion()
                return StepAction.QUIT

    # pylint: disable=too-many-return-statements
    async def _a_get_user_action(self) -> StepAction:
        """Get user action for step-by-step execution asynchronously.

        Returns
        -------
        StepAction
            The action chosen by the user.
        """
        if self._auto_continue:
            return StepAction.CONTINUE

        while True:
            try:
                prompt = "[Step] (c)ontinue, (r)un, (q)uit, (i)nfo, (h)elp, (st)ats: "
                user_input = await WaldiezBaseRunner.a_get_user_input(prompt)
                user_input = user_input.strip().lower()
                return self._handle_user_action(user_input)
            except (KeyboardInterrupt, EOFError):
                return StepAction.QUIT

    def _handle_step_interaction(self) -> bool:
        """Handle step-by-step user interaction.

        Returns
        -------
        bool
            True to continue execution, False to stop.
        """
        while True:
            action = self._get_user_action()

            if action in (StepAction.CONTINUE, StepAction.STEP):
                return True
            if action == StepAction.RUN:
                return True
            if action == StepAction.QUIT:
                return False

    async def _a_handle_step_interaction(self) -> bool:
        """Handle step-by-step user interaction asynchronously.

        Returns
        -------
        bool
            True to continue execution, False to stop.
        """
        while True:
            action = await self._a_get_user_action()

            if action in (StepAction.CONTINUE, StepAction.STEP):
                return True
            if action == StepAction.RUN:
                self._step_mode = False
                self.print("Switching to run mode (no more breaks)")
                return True
            if action == StepAction.QUIT:
                self.print("Stopping execution by user request")
                return False
            if action == StepAction.INFO:
                if self._current_event:
                    detailed_info = self._format_event_info(self._current_event)
                    self.print(
                        f"\nDetailed Event Information:\n{detailed_info}\n"
                    )
                else:
                    self.print("No current event information available")
            if action == StepAction.HELP:
                self._show_help()
            if action == StepAction.STATS:
                self._show_stats()

    # pylint: disable=too-many-statements,too-many-locals
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
        from autogen.io import IOStream  # type: ignore

        from waldiez.io import StructuredIOStream

        results_container: WaldiezRunResults = {
            "results": [],
            "exception": None,
            "completed": False,
        }

        try:
            self._loaded_module = self._load_module(output_file, temp_dir)
            if self._stop_requested.is_set():
                self.log.info(
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

            self.print("<Waldiez> - Starting workflow...")
            self.print("Step-by-step debugging is enabled. Type 'h' for help.")
            self.print(self.waldiez.info.model_dump_json())

            results = self._loaded_module.main(on_event=self._on_event)
            results_container["results"] = results
            self.print("<Waldiez> - Workflow finished")

        except Exception as e:
            if StopRunningException.reason in str(e):
                raise StopRunningException(StopRunningException.reason) from e
            results_container["exception"] = e
            traceback.print_exc()
            self.print(f"<Waldiez> - Workflow execution failed: {e}")
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
            self.log.info(
                "Step-by-step execution stopped before event processing"
            )
            return False

        # Store event in history
        event_info = {
            "count": self._event_count,
            "type": getattr(event, "type", "unknown"),
            "timestamp": getattr(event, "timestamp", None),
            "content_preview": str(getattr(event, "content", ""))[:50],
        }
        self._event_history.append(event_info)

        try:
            # Show event information if we should break
            if self._should_break_on_event(event):
                event_summary = self._format_event_info(event)
                self.print(f"\n{event_summary}")

                # Handle step interaction
                if not self._handle_step_interaction():
                    self._stop_requested.set()
                    if hasattr(event, "type") and event.type == "input_request":
                        event.content.respond("exit")
                        return True
                    raise StopRunningException(StopRunningException.reason)

            # Process the event
            if hasattr(event, "type"):
                if event.type == "input_request":
                    prompt = getattr(
                        event, "prompt", getattr(event.content, "prompt", "> ")
                    )
                    password = getattr(
                        event,
                        "password",
                        getattr(event.content, "password", False),
                    )
                    user_input = WaldiezBaseRunner.get_user_input(
                        prompt, password=password
                    )
                    event.content.respond(user_input)
                else:
                    self._send(event)

            self._processed_events += 1

        except Exception as e:
            if not isinstance(e, StopRunningException):
                raise RuntimeError(
                    f"Error processing event {event}: {e}\n{traceback.format_exc()}"
                ) from e
            raise StopRunningException(StopRunningException.reason) from e

        if hasattr(event, "type") and event.type == "run_completion":
            self._signal_completion()

        if self._stop_requested.is_set():
            return False

        return not self._execution_complete_event.is_set()

    async def _a_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez workflow with step-by-step debugging asynchronously."""

        async def _execute_workflow() -> list[dict[str, Any]]:
            """Execute the workflow in an async context."""
            from autogen.io import (  # type: ignore[import-untyped,unused-ignore]
                IOStream,
            )

            from waldiez.io import StructuredIOStream

            results: list[dict[str, Any]]
            try:
                self._loaded_module = self._load_module(output_file, temp_dir)
                if self._stop_requested.is_set():
                    self.log.info(
                        "Async step-by-step execution stopped before workflow start"
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

                self.print("<Waldiez> - Starting async workflow...")
                self.print(
                    "Step-by-step debugging is enabled. Type 'h' for help."
                )
                self.print(self.waldiez.info.model_dump_json())

                results = await self._loaded_module.main(
                    on_event=self._a_on_event
                )

            except Exception as e:
                if StopRunningException.reason in str(e):
                    raise StopRunningException(
                        StopRunningException.reason
                    ) from e
                self.print(f"<Waldiez> - Async workflow execution failed: {e}")
                traceback.print_exc()
                return []

            return results

        # Create cancellable task
        task = asyncio.create_task(_execute_workflow())

        # Monitor for stop requests
        try:
            while not task.done():
                if self._stop_requested.is_set():
                    task.cancel()
                    self.log.info(
                        "Async step-by-step execution stopped by user"
                    )
                    break
                await asyncio.sleep(0.1)
            return await task

        except asyncio.CancelledError:
            self.log.info("Async step-by-step execution cancelled")
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
            self.log.info(
                "Async step-by-step execution stopped before event processing"
            )
            return False

        # Store event in history
        event_info = {
            "count": self._event_count,
            "type": getattr(event, "type", "unknown"),
            "timestamp": getattr(event, "timestamp", None),
            "content_preview": str(getattr(event, "content", ""))[:50],
        }
        self._event_history.append(event_info)

        try:
            # Show event information if we should break
            if self._should_break_on_event(event):
                event_summary = self._format_event_info(event)
                self.print(f"\n{event_summary}")

                # Handle step interaction
                if not await self._a_handle_step_interaction():
                    self._stop_requested.set()
                    if hasattr(event, "type") and event.type == "input_request":
                        event.content.respond("exit")
                        return True
                    raise StopRunningException(StopRunningException.reason)

            # Process the event
            if hasattr(event, "type"):
                if event.type == "input_request":
                    prompt = getattr(
                        event, "prompt", getattr(event.content, "prompt", "> ")
                    )
                    password = getattr(
                        event,
                        "password",
                        getattr(event.content, "password", False),
                    )
                    user_input = await WaldiezBaseRunner.a_get_user_input(
                        prompt, password=password
                    )
                    await event.content.respond(user_input)
                else:
                    self._send(event)

            self._processed_events += 1

        except Exception as e:
            if not isinstance(e, StopRunningException):
                raise RuntimeError(
                    f"Error processing event {event}: {e}\n{traceback.format_exc()}"
                ) from e
            raise StopRunningException(StopRunningException.reason) from e

        if hasattr(event, "type") and event.type == "run_completion":
            self._signal_completion()

        if self._stop_requested.is_set():
            return False
        return not self._execution_complete_event.is_set()

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
