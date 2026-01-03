# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pyright: reportReturnType=false
"""Waldiez Runner protocol."""

from pathlib import Path
from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class WaldiezRunnerProtocol(Protocol):
    """Waldiez Runner protocol."""

    def before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
        message: str | None,
    ) -> Path:
        """Actions to perform before running the flow.

        Parameters
        ----------
        output_file : Path
            The output file.
        uploads_root : Path | None
            The runtime uploads root.
        message : str | None
            Optional initial message to pass (override flow's message if needed)

        Returns
        -------
        Path
            The path to the temporary directory created for the run.
        """

    async def a_before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
        message: str | None,
    ) -> Path:
        """Asynchronously perform actions before running the flow.

        Parameters
        ----------
        output_file : Path
            The output file.
        uploads_root : Path | None
            The runtime uploads root.
        message : str | None
            Optional initial message to pass (override flow's message if needed)

        Returns
        -------
        Path
            The path to the temporary directory created for the run.
        """

    def run(
        self,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool | None = None,
        message: str | None = None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
        skip_symlinks: bool = False,
        skip_deps: bool | None = None,
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
        message : str | None
            Optional initial message to pass (override flow's message if needed)
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        skip_timeline : bool
            Whether to skip generating the timeline JSON.
        skip_symlinks : bool
            Whether to skip creating symlinks for checkpoints.
        skip_deps : bool | None
            Whether to skip installing dependencies.
        dot_env : str | Path | None
            The path to the .env file, if any.
        **kwargs : Any
            Additional keyword arguments for the run method.

        Returns
        -------
        list[dict[str, Any]]
            The results of the run.

        Raises
        ------
        RuntimeError
            If the runner is already running
            or an error occurs during the run.
        """

    async def a_run(
        self,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool | None = None,
        message: str | None = None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
        skip_symlinks: bool = False,
        skip_deps: bool | None = None,
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
        message : str | None
            Optional initial message to pass (override flow's message if needed)
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        skip_timeline : bool
            Whether to skip generating the timeline JSON.
        skip_symlinks : bool
            Whether to skip creating symlinks for checkpoints.
        skip_deps : bool | None
            Whether to skip installing dependencies.
        dot_env : str | Path | None
            The path to the .env file, if any.
        **kwargs : Any
            Additional keyword arguments for the a_run method.

        Returns
        -------
        list[dict[str, Any]]
            The results of the run.

        Raises
        ------
        RuntimeError
            If the runner is already running, the workflow is not async
            or an error occurs during the run.
        """

    def after_run(
        self,
        results: list[dict[str, Any]],
        error: BaseException | None,
        output_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
        skip_symlinks: bool,
    ) -> Path | None:
        """Actions to perform after running the flow.

        Parameters
        ----------
        results : list[dict[str, Any]]
            The results of the run.
        error : BaseException | None
            Optional error during the run.
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The runtime uploads root.
        temp_dir : Path
            The path to the temporary directory.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        skip_timeline : bool
            Whether to skip generating the timeline JSON.
        skip_symlinks : bool
            Whether to skip creating symlinks for checkpoints.
        """

    async def a_after_run(
        self,
        results: list[dict[str, Any]],
        error: BaseException | None,
        output_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
        skip_symlinks: bool,
    ) -> Path | None:
        """Asynchronously perform actions after running the flow.

        Parameters
        ----------
        results : list[dict[str, Any]]
            The results of the run.
        error : BaseException | None
            Optional error during the run.
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The runtime uploads root.
        temp_dir : Path
            The path to the temporary directory.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        skip_timeline : bool
            Whether to skip generating the timeline JSON.
        skip_symlinks : bool
            Whether to skip creating symlinks for checkpoints.
        """

    def is_running(self) -> bool:
        """Check if the runner is currently running.

        Returns
        -------
        bool
            True if the runner is running, False otherwise.
        """
