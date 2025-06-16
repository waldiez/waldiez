# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=too-many-try-statements,import-outside-toplevel,too-complex
"""Run a waldiez flow.

The flow is first converted to an autogen flow with agents, chats, and tools.
We then chown to temporary directory, call the flow's `main()` and
return the results. Before running the flow, any additional environment
variables specified in the waldiez file are set.
"""

import asyncio
import importlib.util
import threading
import time
from pathlib import Path
from types import ModuleType
from typing import Callable, Union

from autogen import ChatResult  # type: ignore[import-untyped]
from autogen.io import IOStream  # type: ignore

from waldiez.io import StructuredIOStream
from waldiez.models.waldiez import Waldiez
from waldiez.running.patch_io_stream import patch_io_stream

from .base_runner import WaldiezBaseRunner
from .run_results import WaldiezRunResults


class WaldiezImportRunner(WaldiezBaseRunner):
    """Waldiez runner class."""

    def __init__(
        self,
        waldiez: Waldiez,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        isolated: bool = False,
    ) -> None:
        """Initialize the Waldiez manager."""
        super().__init__(
            waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            isolated=isolated,
        )
        self._execution_thread: threading.Thread | None = None
        self._execution_loop: asyncio.AbstractEventLoop | None = None
        self._loaded_module: ModuleType | None = None

    # pylint: disable=too-many-statements,too-complex
    def _run(  # noqa: C901
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
        skip_mmd: bool,
    ) -> Union[
        "ChatResult",
        list["ChatResult"],
        dict[int, "ChatResult"],
    ]:
        """Run the Waldiez workflow."""
        results_container: WaldiezRunResults = {
            "results": None,
            "exception": None,
            "completed": False,
        }

        def _execute_workflow() -> None:
            if not structured_io:
                patch_io_stream(self.waldiez.is_async)
            printer: Callable[..., None] = print
            try:
                file_name = output_file.name
                module_name = file_name.replace(".py", "")
                spec = importlib.util.spec_from_file_location(
                    module_name, temp_dir / file_name
                )
                if not spec or not spec.loader:
                    raise ImportError("Could not import the flow")
                if structured_io:
                    stream = StructuredIOStream(
                        uploads_root=uploads_root, is_async=False
                    )
                    printer = stream.print
                    with IOStream.set_default(stream):
                        self._loaded_module = importlib.util.module_from_spec(
                            spec
                        )
                        spec.loader.exec_module(self._loaded_module)
                        printer("<Waldiez> - Starting workflow...")
                        printer(self.waldiez.info.model_dump_json())
                        results = self._loaded_module.main()
                else:
                    printer = IOStream.get_default().print
                    self._loaded_module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(self._loaded_module)
                    printer("<Waldiez> - Starting workflow...")
                    printer(self.waldiez.info.model_dump_json())
                    results = self._loaded_module.main()
                results_container["results"] = results
                printer("<Waldiez> - Workflow finished")
            except SystemExit:
                printer("<Waldiez> - Workflow stopped by user")
                results_container["results"] = []
            except Exception as e:  # pylint: disable=broad-exception-caught
                results_container["exception"] = e
                printer("<Waldiez> - Workflow execution failed: %s", e)
            finally:
                results_container["completed"] = True
                self._execution_loop = None
                self._execution_thread = None

        # Execute in a separate thread for responsive stopping
        self._execution_thread = threading.Thread(
            target=_execute_workflow, daemon=True
        )
        self._execution_thread.start()

        # Wait for completion while checking for stop requests
        while self._execution_thread and self._execution_thread.is_alive():
            if self._stop_requested.is_set():
                self.log.info(
                    "Stop requested, waiting for graceful shutdown..."
                )
                self._execution_thread.join(timeout=5.0)
                if self._execution_thread.is_alive():
                    self.log.warning("Workflow did not stop gracefully")
                break
            if results_container["completed"] is True:
                break
            time.sleep(0.1)

        # Handle results
        exception = results_container["exception"]
        if exception is not None:
            self._last_exception = exception
            raise exception

        self._last_results = results_container["results"] or []
        return self._last_results

    async def _a_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
        skip_mmd: bool,
    ) -> Union[
        "ChatResult",
        list["ChatResult"],
        dict[int, "ChatResult"],
    ]:
        """Async execution using asyncio tasks."""

        async def _execute_workflow() -> Union[
            "ChatResult",
            list["ChatResult"],
            dict[int, "ChatResult"],
        ]:
            """Execute the workflow in an async context."""
            try:
                file_name = output_file.name
                module_name = file_name.replace(".py", "")
                spec = importlib.util.spec_from_file_location(
                    module_name, temp_dir / file_name
                )
                if not spec or not spec.loader:
                    raise ImportError("Could not import the flow")
                if structured_io:
                    stream = StructuredIOStream(
                        uploads_root=uploads_root, is_async=True
                    )
                    with IOStream.set_default(stream):
                        self.log.info("<Waldiez> - Starting workflow...")
                        self.log.info(self.waldiez.info.model_dump_json())
                        self._loaded_module = importlib.util.module_from_spec(
                            spec
                        )
                        spec.loader.exec_module(self._loaded_module)
                        results = await self._loaded_module.main()
                        self._last_results = results
                else:
                    self._loaded_module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(self._loaded_module)
                    results = await self._loaded_module.main()
                    self._last_results = results
                self.log.info("<Waldiez> - Workflow finished")
                return results

            except SystemExit:
                self.log.info("Workflow stopped by user")
                return []
            except Exception as e:
                self._last_exception = e
                self.log.error("Workflow execution failed: %s", e)
                raise

        # Create cancellable task
        task = asyncio.create_task(_execute_workflow())

        # Monitor for stop requests
        try:
            while not task.done():
                if self._stop_requested.is_set():
                    self.log.info("Stop requested, cancelling task...")
                    task.cancel()
                    break
                await asyncio.sleep(0.1)

            return await task

        except asyncio.CancelledError:
            self.log.info("Workflow cancelled")
            return []

    def _after_run(
        self,
        results: Union[
            "ChatResult",
            list["ChatResult"],
            dict[int, "ChatResult"],
        ],
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
        temp_dir: Path,
        skip_mmd: bool,
    ) -> None:
        super()._after_run(
            results,
            output_file,
            uploads_root,
            structured_io,
            temp_dir,
            skip_mmd,
        )

        # Clean up module reference
        self._loaded_module = None

    def _start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool = False,
        skip_mmd: bool = False,
    ) -> None:
        """Start the Waldiez workflow."""

        def run_in_background() -> None:
            """Run the workflow in a background thread."""
            try:
                # Reuse the blocking run logic but in a background thread
                self._run(
                    temp_dir, output_file, uploads_root, structured_io, skip_mmd
                )
            except Exception as e:  # pylint: disable=broad-exception-caught
                self._last_exception = e
                self.log.error("Background workflow failed: %s", e)

        # Start background execution
        background_thread = threading.Thread(
            target=run_in_background, daemon=True
        )
        background_thread.start()

    async def _a_start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool = False,
        skip_mmd: bool = False,
    ) -> None:
        """Start the Waldiez workflow asynchronously."""

        async def run_in_background() -> None:
            """Run the workflow in an async context."""
            try:
                await self._a_run(
                    temp_dir, output_file, uploads_root, structured_io, skip_mmd
                )
            except Exception as e:  # pylint: disable=broad-exception-caught
                self._last_exception = e
                self.log.error("Background workflow failed: %s", e)

        # Start background task
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
