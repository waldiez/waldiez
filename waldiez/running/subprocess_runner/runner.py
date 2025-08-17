# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: G004
"""Waldiez subprocess runner that inherits from BaseRunner."""

import asyncio
import re
from pathlib import Path
from typing import Any, Callable, Literal

from waldiez.models import Waldiez

from ..base_runner import WaldiezBaseRunner
from ._async_runner import AsyncSubprocessRunner
from ._sync_runner import SyncSubprocessRunner

# TODO: check output directory and return the results from the JSON logs
# in self._run and self._a_run


class WaldiezSubprocessRunner(WaldiezBaseRunner):
    """Waldiez runner that uses subprocess execution via standalone runners."""

    def __init__(
        self,
        waldiez: Waldiez,
        on_output: Callable[[dict[str, Any]], None] | None = None,
        on_input_request: Callable[[str], None] | None = None,
        on_async_output: Callable[[dict[str, Any]], Any] | None = None,
        on_async_input_request: Callable[[str], Any] | None = None,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = True,
        dot_env: str | Path | None = None,
        input_timeout: float = 120.0,
        **kwargs: Any,
    ) -> None:
        """Initialize subprocess runner that inherits from BaseRunner.

        Parameters
        ----------
        waldiez : Waldiez
            The Waldiez workflow to run
        on_output : Callable[[dict[str, Any]], None] | None
            Sync callback for handling output messages
        on_input_request : Callable[[str], None] | None
            Sync callback for handling input requests
        on_async_output : Callable[[dict[str, Any]], Any] | None
            Async callback for handling output messages
        on_async_input_request : Callable[[str], Any] | None
            Async callback for handling input requests
        output_path : str | Path | None
            Output path for the workflow
        uploads_root : str | Path | None
            Root directory for uploads
        structured_io : bool
            Whether to use structured I/O (forced to True for subprocess)
        dot_env : str | Path | None
            Path to .env file
        input_timeout : float
            Timeout for user input in seconds
        **kwargs : Any
            Additional arguments for BaseRunner
        """
        super().__init__(
            waldiez=waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=True,  # Always force structured I/O for subprocess
            dot_env=dot_env,
            **kwargs,
        )

        # Store callbacks
        self.sync_on_output = on_output or self._default_sync_output
        self.sync_on_input_request = (
            on_input_request or self._default_sync_input_request
        )
        self.async_on_output = on_async_output or self._default_async_output
        self.async_on_input_request = (
            on_async_input_request or self._default_async_input_request
        )
        self.input_timeout = input_timeout

        # Subprocess runner instances
        self.async_runner: AsyncSubprocessRunner | None = None
        self.sync_runner: SyncSubprocessRunner | None = None
        self.temp_flow_file: Path | None = None
        mode = kwargs.get("mode", "run")
        if mode not in ["run", "debug"]:
            raise ValueError(f"Invalid mode: {mode}")
        self.mode: Literal["run", "debug"] = mode
        waldiez_file = kwargs.get("waldiez_file")
        self._waldiez_file = self._ensure_waldiez_file(waldiez_file)

    def _ensure_waldiez_file(self, waldiez_file: str | Path | None) -> Path:
        """Ensure the Waldiez file is a Path object."""
        if isinstance(waldiez_file, str):
            waldiez_file = Path(waldiez_file)
        if waldiez_file and waldiez_file.is_file():
            return waldiez_file.resolve()
        file_name = self.waldiez.name
        # sanitize file name
        file_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", file_name)[:30]
        file_name = f"{file_name}.waldiez"
        with open(file_name, "w", encoding="utf-8") as f:
            f.write(self.waldiez.model_dump_json())
        return Path(file_name).resolve()

    def _default_sync_output(self, data: dict[str, Any]) -> None:
        """Get the default sync output handler."""
        if data.get("type") == "error":
            self.log.error(data.get("data", ""))
        else:
            content = data.get("data", data)
            self._print(content)

    def _default_sync_input_request(self, prompt: str) -> None:
        """Get the default sync input request handler."""
        input_value = input(prompt)
        self.log.debug("User input received: %s", input_value)
        self.provide_user_input(input_value)

    async def _default_async_output(self, data: dict[str, Any]) -> None:
        """Get the default async output handler."""
        self._default_sync_output(data)

    async def _default_async_input_request(self, prompt: str) -> None:
        """Get the default async input request handler."""
        await asyncio.to_thread(self._default_sync_input_request, prompt)

    def _create_async_subprocess_runner(self) -> AsyncSubprocessRunner:
        """Create async subprocess runner."""
        self.async_runner = AsyncSubprocessRunner(
            on_output=self.async_on_output,
            on_input_request=self.async_on_input_request,
            input_timeout=self.input_timeout,
            uploads_root=self.uploads_root,
            dot_env=self.dot_env_path,
            logger=self.log,
        )
        return self.async_runner

    def _create_sync_subprocess_runner(self) -> SyncSubprocessRunner:
        """Create sync subprocess runner."""
        self.sync_runner = SyncSubprocessRunner(
            on_output=self.sync_on_output,
            on_input_request=self.sync_on_input_request,
            input_timeout=self.input_timeout,
            uploads_root=self.uploads_root,
            dot_env=self.dot_env_path,
            logger=self.log,
        )
        return self.sync_runner

    def run(
        self,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool | None = None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
        dot_env: str | Path | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez flow.

        Parameters
        ----------
        output_path : str | Path | None
            The output path, by default None.
        uploads_root : str | Path | None
            The runtime uploads root, by default None.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print'.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        skip_timeline : bool
            Whether to skip generating the timeline JSON.
        dot_env : str | Path | None
            The path to the .env file, if any.
        **kwargs : Any
            Additional keyword arguments for the run method.

        Returns
        -------
        list[dict[str, Any]]
            The results of the run.
        """
        temp_dir = Path.cwd()
        output_file = self._get_output_file(output_path)
        if dot_env is not None:  # pragma: no cover
            resolved = Path(dot_env).resolve()
            if resolved.is_file():
                WaldiezBaseRunner._dot_env_path = resolved
        return self._run(
            temp_dir=temp_dir,
            output_file=output_file,
            uploads_root=Path(uploads_root) if uploads_root else None,
            skip_mmd=skip_mmd,
            skip_timeline=skip_timeline,
            dot_env=dot_env,
            **kwargs,
        )

    def _get_output_file(
        self,
        output_path: str | Path | None,
    ) -> Path:
        """Get the output file path."""
        if output_path:
            _output_path = Path(output_path)
            if _output_path.is_file():
                return _output_path
            if _output_path.is_dir():  # pragma: no branch
                filename = self._waldiez_file.stem
                return _output_path / f"{filename}.py"
        return self._waldiez_file.with_suffix(".py")

    def _run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        # pylint: disable=too-many-try-statements,broad-exception-caught
        mode = kwargs.get("mode", self.mode)
        if not isinstance(mode, str) or mode not in [
            "run",
            "debug",
        ]:  # pragma: no cover
            mode = "run"
        self.mode = mode  # type: ignore
        try:
            # Create sync subprocess runner
            runner = self._create_sync_subprocess_runner()

            # Run subprocess
            success = runner.run_subprocess(self._waldiez_file, mode=self.mode)
            return [
                {
                    "success": success,
                    "runner": "sync_subprocess",
                    "mode": self.mode,
                }
            ]

        except Exception as e:
            self.log.error("Error in sync subprocess execution: %s", e)
            return [
                {
                    "error": str(e),
                    "runner": "sync_subprocess",
                    "mode": self.mode,
                }
            ]

    async def a_run(
        self,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool | None = None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
        dot_env: str | Path | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez flow asynchronously.

        Parameters
        ----------
        output_path : str | Path | None
            The output path, by default None.
        uploads_root : str | Path | None
            The runtime uploads root.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print'.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        skip_timeline : bool
            Whether to skip generating the timeline JSON.
        dot_env : str | Path | None
            The path to the .env file, if any.
        **kwargs : Any
            Additional keyword arguments for the a_run method.

        Returns
        -------
        list[dict[str, Any]]
            The results of the run.
        """
        if dot_env is not None:  # pragma: no cover
            resolved = Path(dot_env).resolve()
            if resolved.is_file():
                WaldiezBaseRunner._dot_env_path = resolved
        temp_dir = Path.cwd()
        output_file = self._get_output_file(output_path)
        return await self._a_run(
            temp_dir=temp_dir,
            output_file=output_file,
            uploads_root=Path(uploads_root) if uploads_root else None,
            skip_mmd=skip_mmd,
            skip_timeline=skip_timeline,
            dot_env=dot_env,
            **kwargs,
        )

    async def _a_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run workflow using async subprocess runner.

        Parameters
        ----------
        temp_dir : Path
            Temporary directory
        output_file : Path
            Output file path
        uploads_root : Path | None
            Uploads root directory
        skip_mmd : bool
            Skip mermaid diagram generation
        skip_timeline : bool
            Skip timeline generation
        **kwargs : Any
            Additional arguments

        Returns
        -------
        list[dict[str, Any]]
            Results of the workflow execution
        """
        mode = kwargs.get("mode", self.mode)
        if not isinstance(mode, str) or mode not in [
            "run",
            "debug",
        ]:  # pragma: no cover
            mode = "run"
        self.mode = mode  # type: ignore

        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            # Create async subprocess runner
            runner = self._create_async_subprocess_runner()

            # Run subprocess
            success = await runner.run_subprocess(
                self._waldiez_file,
                mode=self.mode,
            )
            return [
                {
                    "success": success,
                    "runner": "async_subprocess",
                    "mode": self.mode,
                }
            ]

        except Exception as e:
            self.log.error("Error in async subprocess execution: %s", e)
            return [
                {
                    "error": str(e),
                    "runner": "async_subprocess",
                    "mode": self.mode,
                }
            ]

    def provide_user_input(self, user_input: str) -> None:
        """Provide user input to the active subprocess runner.

        Parameters
        ----------
        user_input : str
            User input response
        """
        if self.async_runner and self.async_runner.is_running():
            asyncio.create_task(
                self.async_runner.provide_user_input(user_input)
            )
        if self.sync_runner and self.sync_runner.is_running():
            self.sync_runner.provide_user_input(user_input)

    async def a_provide_user_input(self, user_input: str) -> None:
        """Provide user input to the active subprocess runner (async version).

        Parameters
        ----------
        user_input : str
            User input response
        """
        if self.async_runner and self.async_runner.is_running():
            await self.async_runner.provide_user_input(user_input)
        if self.sync_runner and self.sync_runner.is_running():
            await asyncio.to_thread(
                self.sync_runner.provide_user_input, user_input
            )

    def stop(self) -> None:
        """Stop the workflow execution."""
        super().stop()  # Set the base runner stop flag

        # Stop active subprocess runners
        if self.async_runner and self.async_runner.is_running():
            asyncio.create_task(self.async_runner.stop())
        if self.sync_runner and self.sync_runner.is_running():
            self.sync_runner.stop()

    async def a_stop(self) -> None:
        """Stop the workflow execution (async version)."""
        super().stop()  # Set the base runner stop flag

        # Stop active subprocess runners
        if self.async_runner and self.async_runner.is_running():
            await self.async_runner.stop()
        if self.sync_runner and self.sync_runner.is_running():
            await asyncio.to_thread(self.sync_runner.stop)

    def is_subprocess_running(self) -> bool:
        """Check if a subprocess is currently running.

        Returns
        -------
        bool
            True if a subprocess is running, False otherwise
        """
        return (
            self.async_runner is not None and self.async_runner.is_running()
        ) or (self.sync_runner is not None and self.sync_runner.is_running())

    def get_subprocess_exit_code(self) -> int | None:
        """Get the exit code of the subprocess.

        Returns
        -------
        int | None
            Exit code if available, None otherwise
        """
        if self.sync_runner:
            return self.sync_runner.get_exit_code()
        return None

    def _cleanup_subprocess_runners(self) -> None:
        """Cleanup subprocess runner instances."""
        if self.async_runner and self.async_runner.is_running():
            asyncio.create_task(self.async_runner.stop())
        self.async_runner = None
        if self.sync_runner and self.sync_runner.is_running():
            self.sync_runner.stop()
        self.sync_runner = None

    def _after_run(
        self,
        results: list[dict[str, Any]],
        output_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> None:
        """Actions to perform after running the flow.

        Parameters
        ----------
        results : list[dict[str, Any]]
            Results from the workflow execution
        output_file : Path
            Output file path
        uploads_root : Path | None
            Uploads root directory
        temp_dir : Path
            Temporary directory
        skip_mmd : bool
            Skip mermaid diagram generation
        skip_timeline : bool
            Skip timeline generation
        """
        # Cleanup subprocess runners
        self._cleanup_subprocess_runners()

    async def _a_after_run(
        self,
        results: list[dict[str, Any]],
        output_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> None:
        """Actions to perform after running the flow (async version).

        Parameters
        ----------
        results : list[dict[str, Any]]
            Results from the workflow execution
        output_file : Path
            Output file path
        uploads_root : Path | None
            Uploads root directory
        temp_dir : Path
            Temporary directory
        skip_mmd : bool
            Skip mermaid diagram generation
        skip_timeline : bool
            Skip timeline generation
        """
        # Cleanup subprocess runners
        self._cleanup_subprocess_runners()

    @classmethod
    def create_with_callbacks(
        cls,
        waldiez_file: str | Path,
        on_output: Callable[[dict[str, Any]], None] | None = None,
        on_input_request: Callable[[str], None] | None = None,
        on_async_output: Callable[[dict[str, Any]], Any] | None = None,
        on_async_input_request: Callable[[str], Any] | None = None,
        **kwargs: Any,
    ) -> "WaldiezSubprocessRunner":
        """Create subprocess runner from waldiez file with callbacks.

        Parameters
        ----------
        waldiez_file : str | Path
            Path to waldiez file
        on_output : Callable[[dict[str, Any]], None] | None
            Sync output callback
        on_input_request : Callable[[str], None] | None
            Sync input request callback
        on_async_output : Callable[[dict[str, Any]], Any] | None
            Async output callback
        on_async_input_request : Callable[[str], Any] | None
            Async input request callback
        **kwargs : Any
            Additional arguments

        Returns
        -------
        WaldiezSubprocessRunner
            Configured subprocess runner
        """
        waldiez = Waldiez.load(waldiez_file)
        kwargs.pop("waldiez_file", None)
        return cls(
            waldiez=waldiez,
            on_output=on_output,
            on_input_request=on_input_request,
            on_async_output=on_async_output,
            on_async_input_request=on_async_input_request,
            waldiez_file=waldiez_file,
            **kwargs,
        )
