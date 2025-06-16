# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=protected-access,too-many-arguments
# pylint: disable=too-many-positional-arguments
"""Run a waldiez flow.

The flow is first converted to an autogen flow with agents, chats, and tools.
We then chown to temporary directory and:
    either import and call the flow's `main()` (if not isolated),
    or run the flow in a subprocess (if isolated).
Before running the flow, any additional environment
variables specified in the waldiez file are set.
"""

from pathlib import Path
from typing import TYPE_CHECKING, Union

from .models.waldiez import Waldiez
from .running import (
    WaldiezBaseRunner,
    WaldiezImportRunner,
    WaldiezSubprocessRunner,
)

if TYPE_CHECKING:
    from autogen import ChatResult  # type: ignore


class WaldiezRunner(WaldiezBaseRunner):
    """Waldiez runner class."""

    _implementation: WaldiezBaseRunner

    def __init__(
        self,
        waldiez: Waldiez,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        isolated: bool = False,
        threaded: bool = False,
        skip_patch_io: bool = True,
    ) -> None:
        """Create a new Waldiez runner.

        Parameters
        ----------
        waldiez : Waldiez
            The waldiez flow to run.
        output_path : str | Path | None, optional
            The path to the output directory where the results will be stored.
            If None, a temporary directory will be used.
        uploads_root : str | Path | None, optional
            The root directory for uploads. If None, the default uploads
            directory will be used.
        structured_io : bool, optional
            If True, the flow will use
            structured IO instead of the default 'input/print'.
        isolated : bool, optional
            If True, the flow will be run in an isolated subprocess.
            Defaults to False.
        threaded : bool, optional
            If True, the flow will be run in a threaded manner.
            Defaults to False.
        skip_patch_io : bool, optional
            If True, the IO patching will be skipped.
            Defaults to True.

        Returns
        -------
        WaldiezBaseRunner
            The runner instance that will execute the flow.
        """
        super().__init__(
            waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            isolated=isolated,
            threaded=threaded,
            skip_patch_io=skip_patch_io,
        )
        if isolated:
            self._implementation = WaldiezSubprocessRunner(
                waldiez,
                output_path=output_path,
                uploads_root=uploads_root,
                structured_io=structured_io,
                isolated=True,
                threaded=threaded,
                skip_patch_io=skip_patch_io,
            )
        else:
            self._implementation = WaldiezImportRunner(
                waldiez,
                output_path=output_path,
                uploads_root=uploads_root,
                structured_io=structured_io,
                isolated=False,
                threaded=threaded,
                skip_patch_io=skip_patch_io,
            )

    @classmethod
    def load(
        cls,
        waldiez_file: str | Path,
        name: str | None = None,
        description: str | None = None,
        tags: list[str] | None = None,
        requirements: list[str] | None = None,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        isolated: bool = False,
        threaded: bool = False,
        skip_patch_io: bool = True,
    ) -> "WaldiezRunner":
        """Load a waldiez flow from a file and create a runner.

        Parameters
        ----------
        waldiez_file : str | Path
            The path to the waldiez file.
        name : str | None, optional
            The name of the flow.
            If None, the name from the waldiez file will be used.
        description : str | None, optional
            The description of the flow.
            If None, the description from the waldiez file will be used.
        tags : list[str] | None, optional
            The tags for the flow. If None, no tags will be set.
        requirements : list[str] | None, optional
            The requirements for the flow. If None, no requirements will be set.
        output_path : str | Path | None, optional
            The path to the output directory where the results will be stored.
            If None, a temporary directory will be used.
        uploads_root : str | Path | None, optional
            The root directory for uploads. If None, the default uploads
            directory will be used.
        structured_io : bool, optional
            If True, the flow will use
            structured IO instead of the default 'input/print'.
        isolated : bool, optional
            If True, the flow will be run in an isolated subprocess.
            Defaults to False.
        threaded : bool, optional
            If True, the flow will be run in a threaded manner.
            Defaults to False.
        skip_patch_io : bool, optional
            If True, the IO patching will be skipped.
            Defaults to True.

        Returns
        -------
        WaldiezBaseRunner
            The runner instance that will execute the flow.
        """
        waldiez = Waldiez.load(
            waldiez_file,
            name=name,
            description=description,
            tags=tags,
            requirements=requirements,
        )
        return cls(
            waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            isolated=isolated,
            threaded=threaded,
            skip_patch_io=skip_patch_io,
        )

    def _before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
    ) -> Path:
        """Actions to perform before running the flow.

        Parameters
        ----------
        output_file : Path
            The output file.
        uploads_root : Path | None
            The runtime uploads root.
        """
        return self._implementation._before_run(
            output_file=output_file,
            uploads_root=uploads_root,
        )

    async def _a_before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
    ) -> Path:
        """Asynchronously perform actions before running the flow.

        Parameters
        ----------
        output_file : str | Path
            The output file.
        uploads_root : Path | None
            The runtime uploads root.

        Returns
        -------
        Path
            The path to the temporary directory created for the run.
        """
        return await self._implementation._a_before_run(
            output_file, uploads_root
        )

    def _run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool = False,
    ) -> Union[
        "ChatResult",
        list["ChatResult"],
        dict[int, "ChatResult"],
    ]:
        """Run the flow.

        Parameters
        ----------
        temp_dir : Path
            The path to the temporary directory created for the run.
        output_file : Path
            The output file.
        uploads_root : Path | None
            The runtime uploads root.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.

        Returns
        -------
        ChatResult | list[ChatResult] | dict[int, ChatResult]
            The result of the run, which can be a single ChatResult,
            a list of ChatResults,
            or a dictionary mapping indices to ChatResults.
        """
        return self._implementation._run(
            temp_dir=temp_dir,
            output_file=output_file,
            uploads_root=uploads_root,
            skip_mmd=skip_mmd,
        )

    async def _a_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
    ) -> Union[
        "ChatResult",
        list["ChatResult"],
        dict[int, "ChatResult"],
    ]:  # pyright: ignore
        """Asynchronously run the flow.

        Parameters
        ----------
        temp_dir : Path
            The path to the temporary directory created for the run.
        output_file : Path
            The output file.
        uploads_root : Path | None
            The runtime uploads root.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.

        Returns
        -------
        Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
            The result of the run, which can be a single ChatResult,
            a list of ChatResults,
            or a dictionary mapping indices to ChatResults.
        """
        return await self._implementation._a_run(
            temp_dir=temp_dir,
            output_file=output_file,
            uploads_root=uploads_root,
            skip_mmd=skip_mmd,
        )

    def _after_run(
        self,
        results: Union[
            "ChatResult",
            list["ChatResult"],
            dict[int, "ChatResult"],
        ],
        output_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
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
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print'.
        temp_dir : Path
            The path to the temporary directory created for the run.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        """
        self._implementation._after_run(
            results,
            output_file,
            uploads_root,
            temp_dir,
            skip_mmd,
        )

    async def _a_after_run(
        self,
        results: Union[
            "ChatResult",
            list["ChatResult"],
            dict[int, "ChatResult"],
        ],
        output_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
    ) -> None:
        """Asynchronously perform actions after running the flow.

        Parameters
        ----------
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The runtime uploads root.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print'.
        temp_dir : Path
            The path to the temporary directory created for the run.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        """
        await self._implementation._a_after_run(
            results,
            output_file,
            uploads_root,
            temp_dir,
            skip_mmd,
        )

    def start(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        structured_io: bool | None = None,
        skip_patch_io: bool | None = None,
        skip_mmd: bool = False,
    ) -> None:
        """Start the flow.

        Parameters
        ----------
        output_path : str | Path | None
            The output path, by default None.
        uploads_root : str | Path | None
            The runtime uploads root.
        structured_io : bool | None
            Whether to use structured IO instead of the default 'input/print'.
            If None, it will use the value from the context.
        skip_patch_io : bool | None = None
            Whether to skip patching I/O, by default None.
            If None, it will use the value from the context.
        skip_mmd : bool = False
            Whether to skip generating the mermaid diagram.
        """
        self._implementation.start(
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            skip_patch_io=skip_patch_io,
        )

    def _start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
    ) -> None:
        """Start the flow.

        Parameters
        ----------
        output_file : Path
            The output file.
        uploads_root : Path | None
            The runtime uploads root.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        """
        self._implementation._start(
            temp_dir=temp_dir,
            output_file=output_file,
            uploads_root=uploads_root,
            skip_mmd=skip_mmd,
        )

    async def a_start(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        structured_io: bool | None = None,
        skip_patch_io: bool | None = None,
        skip_mmd: bool = False,
    ) -> None:
        """Asynchronously start the flow.

        Parameters
        ----------
        output_path : str | Path | None
            The output path, by default None.
        uploads_root : str | Path | None
            The runtime uploads root.
        structured_io : bool | None
            Whether to use structured IO instead of the default 'input/print'.
        skip_patch_io : bool | None = None
            Whether to skip patching I/O, by default None.
        skip_mmd : bool = False
            Whether to skip generating the mermaid diagram, by default False.
        """
        await self._implementation.a_start(
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            skip_patch_io=skip_patch_io,
            skip_mmd=skip_mmd,
        )

    async def _a_start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
    ) -> None:
        """Asynchronously start the flow.

        Parameters
        ----------
        temp_dir : Path
            The path to the temporary directory created for the run.
        output_file : Path
            The output file.
        uploads_root : Path | None
            The runtime uploads root.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        """
        await self._implementation._a_start(
            temp_dir=temp_dir,
            output_file=output_file,
            uploads_root=uploads_root,
            skip_mmd=skip_mmd,
        )

    def _stop(self) -> None:
        """Actions to perform when stopping the flow.

        This method should be overridden in subclasses if needed.
        """
        self._implementation._stop()

    async def _a_stop(self) -> None:
        """Asynchronously perform actions when stopping the flow.

        This method should be overridden in subclasses if needed.
        """
        await self._implementation._a_stop()
