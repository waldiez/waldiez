# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Waldiez Runner protocol."""

from pathlib import Path
from typing import TYPE_CHECKING, Optional, Protocol, Union, runtime_checkable

if TYPE_CHECKING:
    from autogen.io.run_response import (  # type: ignore[import-untyped]
        AsyncRunResponseProtocol,
        RunResponseProtocol,
    )


@runtime_checkable
class WaldiezRunnerProtocol(Protocol):
    """Waldiez Runner protocol."""

    def before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
    ) -> Path:  # pyright: ignore
        """Actions to perform before running the flow.

        Parameters
        ----------
        output_file : Path
            The output file.
        uploads_root : Path | None
            The runtime uploads root.

        Returns
        -------
        Path
            The path to the temporary directory created for the run.
        """

    async def a_before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
    ) -> Path:  # pyright: ignore
        """Asynchronously perform actions before running the flow.

        Parameters
        ----------
        output_file : Path
            The output file.
        uploads_root : Path | None
            The runtime uploads root.

        Returns
        -------
        Path
            The path to the temporary directory created for the run.
        """

    def start(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        structured_io: bool | None = None,
        skip_mmd: bool = False,
    ) -> None:
        """Start running the Waldiez flow in a non-blocking way.

        To allow "stoping" it later.

        Parameters
        ----------
        output_path : str | Path | None
            The output path.
        uploads_root : str | Path | None
            The runtime uploads root.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print'.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.

        Raises
        ------
        RuntimeError
            If the runner is already running.
        """

    async def a_start(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        structured_io: bool | None = None,
        skip_mmd: bool = False,
    ) -> None:
        """Asynchronously start running the Waldiez flow in a non-blocking way.

        To allow "stoping" it later.

        Parameters
        ----------
        output_path :  str | Path | None
            The output path.
        uploads_root : str | Path | None
            The runtime uploads root.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print'.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.

        Raises
        ------
        RuntimeError
            If the runner is already running.
        """

    def run(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        structured_io: bool | None = None,
        skip_mmd: bool = False,
    ) -> Optional[
        Union[
            "RunResponseProtocol",
            "AsyncRunResponseProtocol",
        ]
    ]:  # pyright: ignore
        """Run the Waldiez flow in a blocking way.

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

        Returns
        -------
        Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
            The result of the run, which can be a single ChatResult,
            a list of ChatResults,
            or a dictionary mapping indices to ChatResults.
        """

    async def a_run(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        structured_io: bool | None = None,
        skip_mmd: bool = False,
    ) -> Optional[
        Union[
            "AsyncRunResponseProtocol",
            "RunResponseProtocol",
        ]
    ]:  # pyright: ignore
        """Run the Waldiez flow.

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

        Returns
        -------
        Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
            The result of the run, which can be a single ChatResult,
            a list of ChatResults,
            or a dictionary mapping indices to ChatResults.
        """

    def after_run(
        self,
        results: Optional[
            Union["AsyncRunResponseProtocol", "RunResponseProtocol"]
        ],
        output_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> None:
        """Actions to perform after running the flow.

        Parameters
        ----------
        results : Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
            The results of the run, which can be a single ChatResult,
            a list of ChatResults,
            or a dictionary mapping indices to ChatResults.
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
        """

    async def a_after_run(
        self,
        results: Optional[
            Union[
                "AsyncRunResponseProtocol",
                "RunResponseProtocol",
            ]
        ],
        output_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> None:
        """Asynchronously perform actions after running the flow.

        Parameters
        ----------
        results : Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
            The results of the run, which can be a single ChatResult,
            a list of ChatResults,
            or a dictionary mapping indices to ChatResults.
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
        """

    def is_running(self) -> bool:  # pyright: ignore
        """Check if the runner is currently running.

        Returns
        -------
        bool
            True if the runner is running, False otherwise.
        """

    def stop(self) -> None:
        """Stop the runner if it is running.

        Raises
        ------
        RuntimeError
            If the runner is not running.
        """

    async def a_stop(self) -> None:
        """Asynchronously stop the runner if it is running.

        Raises
        ------
        RuntimeError
            If the runner is not running.
        """
