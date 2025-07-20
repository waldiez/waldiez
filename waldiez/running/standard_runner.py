# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# flake8: noqa: C901, E501
# pyright: reportUnknownMemberType=false, reportUnknownVariableType=false
# pyright: reportAttributeAccessIssue=false
# pylint: disable=too-many-try-statements,import-outside-toplevel,line-too-long,
# pylint: disable=too-complex,unused-argument,duplicate-code,broad-exception-caught
"""Run a waldiez flow.

The flow is first converted to an autogen flow with agents, chats, and tools.
We then chown to temporary directory, call the flow's `main()` and
return the results. Before running the flow, any additional environment
variables specified in the waldiez file are set.
"""

import asyncio
import importlib.util
import sys
import threading
import traceback
from pathlib import Path
from types import ModuleType
from typing import TYPE_CHECKING, Any, Callable, Coroutine, Optional, Union

from waldiez.models.waldiez import Waldiez
from waldiez.running.run_results import WaldiezRunResults

from .base_runner import WaldiezBaseRunner
from .utils import chdir

if TYPE_CHECKING:
    from autogen.events import BaseEvent  # type: ignore
    from autogen.io.run_response import (  # type: ignore
        AsyncRunResponseProtocol,
        RunResponseProtocol,
    )


class WaldiezStandardRunner(WaldiezBaseRunner):
    """Run a waldiez flow in a standard way."""

    def __init__(
        self,
        waldiez: Waldiez,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
    ) -> None:
        """Initialize the Waldiez manager."""
        super().__init__(
            waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
        )
        self._execution_thread: threading.Thread | None = None
        self._loaded_module: ModuleType | None = None
        self._event_count = 0
        self._processed_events = 0

    def _load_module(self, output_file: Path, temp_dir: Path) -> ModuleType:
        """Load the module from the waldiez file."""
        file_name = output_file.name
        module_name = file_name.replace(".py", "")
        spec = importlib.util.spec_from_file_location(
            module_name, temp_dir / file_name
        )
        if not spec or not spec.loader:
            raise ImportError("Could not import the flow")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        if not hasattr(module, "main"):
            raise ImportError(
                "The waldiez file does not contain a main() function"
            )
        self._loaded_module = module
        return module

    def _run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> Optional[Union["RunResponseProtocol", "AsyncRunResponseProtocol"]]:
        """Run the Waldiez workflow."""
        from autogen.io import IOStream  # type: ignore

        from waldiez.io import StructuredIOStream

        self._print: Callable[..., None] = print
        self._input: (
            Callable[..., str] | Callable[..., Coroutine[Any, Any, str]]
        ) = input
        results_container: WaldiezRunResults = {
            "results": None,
            "exception": None,
            "completed": False,
        }
        try:
            self._loaded_module = self._load_module(output_file, temp_dir)
            if self._stop_requested.is_set():
                self.log.info(
                    "Async execution stopped before AG2 workflow start"
                )
                return None
            if self.structured_io:
                stream = StructuredIOStream(
                    uploads_root=uploads_root, is_async=False
                )
            else:
                stream = IOStream.get_default()
            self._print = stream.print
            self._input = stream.input
            self._send = stream.send
            self._print("<Waldiez> - Starting workflow...")
            self._print(self.waldiez.info.model_dump_json())
            results = self._loaded_module.main(
                on_event=self._on_event,
            )
            results_container["results"] = results
            self._print("<Waldiez> - Workflow finished")
        except SystemExit:
            self._print("<Waldiez> - Workflow stopped by user")
            results_container["results"] = None
        except Exception as e:  # pylint: disable=broad-exception-caught
            results_container["exception"] = e
            traceback.print_exc()
            self._print(f"<Waldiez> - Workflow execution failed: {e}")
        finally:
            results_container["completed"] = True
        return results_container["results"]

    def _on_event(
        self,
        event: "BaseEvent",
    ) -> bool:
        """Process an event from the workflow."""
        self._event_count += 1
        if self._stop_requested.is_set():
            self.log.info(
                "Async execution stopped before AG2 workflow event processing"
            )
            return False
        try:
            if hasattr(event, "type"):
                if event.type == "input_request":
                    user_input = self._input(
                        event.content.prompt,
                        password=event.content.password,
                    )
                    event.content.respond(user_input)
                else:
                    self._send(event)
            self._processed_events += 1
        except Exception as e:
            raise RuntimeError(
                f"Error processing event {event}: {e}\n{traceback.format_exc()}"
            ) from e
        if event.type == "run_completion":
            self._signal_completion()
            WaldiezBaseRunner._running = False
        return not self._stop_requested.is_set()

    def _start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> None:
        """Start the workflow in a non-blocking way."""
        if self._execution_thread and self._execution_thread.is_alive():
            raise RuntimeError("Non-blocking execution already in progress")

        # Reset completion state
        self._reset_completion_state()

        # Create thread with proper integration
        self._execution_thread = threading.Thread(
            target=self._threaded_run,
            args=(temp_dir, output_file, uploads_root, skip_mmd, skip_timeline),
            name=f"WaldiezStandardRunner-{self.waldiez.name}",
            daemon=False,  # Not daemon so we can properly join
        )
        self._execution_thread.start()

    def _threaded_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
    ) -> None:
        """Run in a separate thread with proper lifecycle."""
        try:
            # Change to temp directory and manage sys.path
            with chdir(to=temp_dir):
                sys.path.insert(0, str(temp_dir))
                try:
                    results = self._run(
                        temp_dir=temp_dir,
                        output_file=output_file,
                        uploads_root=uploads_root,
                        skip_mmd=skip_mmd,
                        skip_timeline=skip_timeline,
                    )

                    # Store results
                    self._last_results = results

                    # Call after_run hooks
                    self.after_run(
                        results=results,
                        output_file=output_file,
                        uploads_root=uploads_root,
                        temp_dir=temp_dir,
                        skip_mmd=skip_mmd,
                        skip_timeline=skip_timeline,
                    )

                finally:
                    # Clean up sys.path
                    if sys.path and sys.path[0] == str(temp_dir):
                        sys.path.pop(0)

        except Exception as e:
            self._last_exception = e
            self.log.error("Threaded execution failed: %s", e)

        finally:
            # Signal completion and mark as not running
            self._signal_completion()
            WaldiezBaseRunner._running = False

    async def _a_on_event(
        self,
        event: "BaseEvent",
    ) -> bool:
        """Process an event from the workflow asynchronously."""
        self._event_count += 1
        if self._stop_requested.is_set():
            self.log.info(
                "Async execution stopped before AG2 workflow event processing"
            )
            return False
        try:
            if hasattr(event, "type"):
                if event.type == "input_request":
                    prompt = getattr(event, "prompt", "> ")
                    password = getattr(event, "password", False)
                    if not asyncio.iscoroutinefunction(self._input):
                        # If input is not async, we need to ensure it is
                        async def _async_input(
                            prompt: str, password: bool = False
                        ) -> str:
                            """Async wrapper for input."""
                            return self._input(prompt, password=password)  # type: ignore[return-value]

                        user_input = await _async_input(
                            prompt, password=password
                        )
                    else:
                        user_input = await self._input(
                            prompt, password=password
                        )
                    respond = event.content.respond(user_input)
                    if asyncio.iscoroutine(respond):  # pyright: ignore
                        await respond
                else:
                    event.print(self._print)
            self._processed_events += 1
        except Exception as e:
            raise RuntimeError(
                f"Error processing event {event}: {e}\n{traceback.format_exc()}"
            ) from e

        return not self._stop_requested.is_set()

    async def _a_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
    ) -> Optional[Union["AsyncRunResponseProtocol", "RunResponseProtocol"]]:
        """Run the Waldiez workflow asynchronously."""

        # fmt: off
        async def _execute_workflow() -> Optional[
            Union["AsyncRunResponseProtocol", "RunResponseProtocol"]
        ]:
            # fmt: on
            """Execute the workflow in an async context."""
            from autogen.io import IOStream  # pyright: ignore

            from waldiez.io import StructuredIOStream

            results: Optional["AsyncRunResponseProtocol"] = None
            try:
                self._loaded_module = self._load_module(output_file, temp_dir)
                if self._stop_requested.is_set():
                    self.log.info(
                        "Async execution stopped before AG2 workflow start"
                    )
                    return None
                if self.structured_io:
                    stream = StructuredIOStream(
                        uploads_root=uploads_root, is_async=True
                    )
                else:
                    stream = IOStream.get_default()
                self._print = stream.print
                self._input = stream.input
                self._print("<Waldiez> - Starting workflow...")
                self._print(self.waldiez.info.model_dump_json())
                results = await self._loaded_module.main(
                    on_event=self._a_on_event
                )
            except SystemExit:
                self._print("<Waldiez> - Workflow stopped by user")
                return None
            except Exception as e:
                self._print(
                    f"<Waldiez> - Error loading workflow: {e}\n{traceback.format_exc()}"
                )
                raise RuntimeError(
                    f"Error loading workflow: {e}\n{traceback.format_exc()}"
                ) from e
            return results

        # Create cancellable task
        task = asyncio.create_task(_execute_workflow())

        # Monitor for stop requests
        try:
            while not task.done():
                if self._stop_requested.is_set():
                    task.cancel()
                    self.log.info("Async execution stopped by user")
                    return None
                await asyncio.sleep(0.1)
            # Return the task result when completed
            return await task

        except asyncio.CancelledError:
            self.log.info("Async execution cancelled")
            return None

    async def _a_start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
    ) -> None:
        """Start the Waldiez workflow asynchronously."""

        async def run_in_background() -> None:
            """Run the Waldiez workflow in a background thread."""
            try:
                results = await self._a_run(
                    temp_dir,
                    output_file,
                    uploads_root,
                    skip_mmd=skip_mmd,
                    skip_timeline=skip_timeline,
                )
                if results:
                    self._print(f"<Waldiez> - Workflow completed: {results}")
            except Exception as e:
                self._print(
                    f"<Waldiez> - Error during workflow: {e}\n{traceback.format_exc()}"
                )

        asyncio.create_task(run_in_background())

    def _stop(self) -> None:
        """Stop the Waldiez workflow."""
        self.log.info("Stopping workflow execution...")
        self._stop_requested.set()

        # Wait for graceful shutdown
        if self._execution_thread and self._execution_thread.is_alive():
            self._execution_thread.join(timeout=5.0)

            if self._execution_thread and self._execution_thread.is_alive():
                self.log.warning("Workflow thread did not stop gracefully")

    async def _a_stop(self) -> None:
        """Stop the Waldiez workflow asynchronously."""
        self.log.info("Stopping workflow execution (async)...")
        self._stop_requested.set()

        # For async, we rely on the task cancellation in _a_run
        # Let's give it a moment to respond
        await asyncio.sleep(0.5)

    def get_execution_stats(self) -> dict[str, Any]:
        """Get execution statistics for standard runner.

        Returns
        -------
        dict[str, Any]
            A dictionary containing execution statistics such as total events,
            processed events, whether a module was loaded, and event processing rate.
        """
        base_stats = super().get_execution_stats()
        return {
            **base_stats,
            "total_events": self._event_count,
            "processed_events": self._processed_events,
            "has_loaded_module": self._loaded_module is not None,
            "event_processing_rate": (
                self._processed_events / self._event_count
                if self._event_count > 0
                else 0
            ),
        }
