# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportUnknownMemberType=false, reportAttributeAccessIssue=false
"""Run a waldiez flow.

The flow is first converted to an autogen flow with agents, chats, and tools.
We then chown to temporary directory, call the flow's `main()` and
return the results. Before running the flow, any additional environment
variables specified in the waldiez file are set.
"""

import asyncio
import traceback
from pathlib import Path
from typing import TYPE_CHECKING, Any, Union

from waldiez.models.waldiez import Waldiez
from waldiez.running.run_results import WaldiezRunResults

from .base_runner import WaldiezBaseRunner

if TYPE_CHECKING:
    from autogen.events import BaseEvent  # type: ignore
    from autogen.messages import BaseMessage  # type: ignore


class WaldiezStandardRunner(WaldiezBaseRunner):
    """Run a waldiez flow in a standard way."""

    def __init__(
        self,
        waldiez: Waldiez,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        dot_env: str | Path | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize the Waldiez manager."""
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
        """Run the Waldiez workflow."""
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
            if self._stop_requested.is_set():
                self.log.info(
                    "Async execution stopped before AG2 workflow start"
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
            self.print(self.waldiez.info.model_dump_json())
            results = loaded_module.main(
                on_event=self._on_event,
            )
            results_container["results"] = results
            self.print("<Waldiez> - Workflow finished")
        except SystemExit:
            self.print("<Waldiez> - Workflow stopped by user")
        except Exception as e:  # pylint: disable=broad-exception-caught
            results_container["exception"] = e
            traceback.print_exc()
            self.print(f"<Waldiez> - Workflow execution failed: {e}")

        finally:
            results_container["completed"] = True
        return results_container["results"]

    def _on_event(
        self,
        event: Union["BaseEvent", "BaseMessage"],
    ) -> bool:
        """Process an event from the workflow."""
        self._event_count += 1
        if self._stop_requested.is_set():
            self.log.info(
                "Async execution stopped before AG2 workflow event processing"
            )
            return False
        try:
            WaldiezBaseRunner.process_event(event)
            self._processed_events += 1
        except Exception as e:
            raise RuntimeError(
                f"Error processing event {event}: {e}\n{traceback.format_exc()}"
            ) from e
        if hasattr(event, "type") and event.type == "run_completion":
            self._signal_completion()
        if self._stop_requested.is_set():
            return False
        return not self._execution_complete_event.is_set()

    async def _a_on_event(
        self,
        event: Union["BaseEvent", "BaseMessage"],
    ) -> bool:
        """Process an event from the workflow asynchronously."""
        self._event_count += 1
        if self._stop_requested.is_set():
            self.log.info(
                "Async execution stopped before AG2 workflow event processing"
            )
            return False
        try:
            await WaldiezBaseRunner.a_process_event(event)
            self._processed_events += 1
        except Exception as e:
            raise RuntimeError(
                f"Error processing event {event}: {e}\n{traceback.format_exc()}"
            ) from e
        if hasattr(event, "type") and event.type == "run_completion":
            self._signal_completion()
        if self._stop_requested.is_set():
            return False
        return not self._execution_complete_event.is_set()

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
        """Run the Waldiez workflow asynchronously."""

        # fmt: off
        async def _execute_workflow() -> list[dict[str, Any]]:
            # fmt: on
            """Execute the workflow in an async context."""
            # pylint: disable=import-outside-toplevel
            from autogen.io import IOStream  # pyright: ignore

            from waldiez.io import StructuredIOStream

            results: list[dict[str, Any]]
            # pylint: disable=too-many-try-statements,broad-exception-caught
            try:
                loaded_module = self._load_module(output_file, temp_dir)
                if self._stop_requested.is_set():
                    self.log.info(
                        "Async execution stopped before AG2 workflow start"
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
                self.print("<Waldiez> - Starting workflow...")
                self.print(self.waldiez.info.model_dump_json())
                results = await loaded_module.main(  # pyright: ignore
                    on_event=self._a_on_event
                )
            except SystemExit:
                self.print("<Waldiez> - Workflow stopped by user")
                return []
            except Exception as e:
                self.print(
                    "<Waldiez> - Error loading workflow: "
                    f"{e}\n{traceback.format_exc()}"
                )
                raise RuntimeError(
                    f"Error loading workflow: {e}\n{traceback.format_exc()}"
                ) from e
            return results

        # Create cancellable task
        task = asyncio.create_task(_execute_workflow())

        # Monitor for stop requests
        # pylint: disable=too-many-try-statements
        try:
            while not task.done():
                if self._stop_requested.is_set():
                    task.cancel()
                    self.log.info("Async execution stopped by user")
                    break
                await asyncio.sleep(0.1)
            # Return the task result when completed
            return await task

        except asyncio.CancelledError:
            self.log.info("Async execution cancelled")
            return []
