# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=too-many-instance-attributes,unused-argument

"""Base runner for Waldiez workflows."""

import sys
import tempfile
import threading
from pathlib import Path
from types import TracebackType
from typing import TYPE_CHECKING, Type, Union

from anyio.from_thread import start_blocking_portal
from typing_extensions import Self

from waldiez.exporter import WaldiezExporter
from waldiez.logger import WaldiezLogger, get_logger
from waldiez.models import Waldiez
from waldiez.utils import get_waldiez_version

from .environment import refresh_environment, reset_env_vars, set_env_vars
from .post_run import after_run
from .pre_run import (
    a_install_requirements,
    install_requirements,
)
from .protocol import WaldiezRunnerProtocol
from .utils import (
    a_chdir,
    chdir,
)

if TYPE_CHECKING:
    from autogen import ChatResult  # type: ignore[import-untyped]


class WaldiezBaseRunner(WaldiezRunnerProtocol):
    """Base runner for Waldiez.

    Methods to override:
        - _before_run: Actions to perform before running the flow.
        - _a_before_run: Async actions to perform before running the flow.
        - _run: Actual implementation of the run logic.
        - _a_run: Async implementation of the run logic.
        - _after_run: Actions to perform after running the flow.
        - _a_after_run: Async actions to perform after running the flow.
        - _start: Implementation of non-blocking start logic.
        - _a_start: Async implementation of non-blocking start logic.
        - _stop: Actions to perform when stopping the flow.
        - _a_stop: Async actions to perform when stopping the flow.
    """

    def __init__(
        self,
        waldiez: Waldiez,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        structured_io: bool,
        isolated: bool,
    ) -> None:
        """Initialize the Waldiez manager."""
        self._waldiez = waldiez
        self._running = False
        self._structured_io = structured_io
        self._isolated = isolated
        self._output_path = output_path
        self._uploads_root = uploads_root
        self._called_install_requirements = False
        self._exporter = WaldiezExporter(waldiez)
        self._stop_requested = threading.Event()
        self._logger = get_logger()
        self._last_results: Union[
            "ChatResult",
            list["ChatResult"],
            dict[int, "ChatResult"],
            None,
        ] = None
        self._last_exception: Exception | None = None

    def is_running(self) -> bool:
        """Check if the workflow is currently running.

        Returns
        -------
        bool
            True if the workflow is running, False otherwise.
        """
        return self._running

    # ===================================================================
    # PRIVATE METHODS TO OVERRIDE IN SUBCLASSES
    # ===================================================================
    def _before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
    ) -> Path:
        """Run before the flow execution."""
        self.log.info("Preparing workflow file: %s", output_file)
        temp_dir = Path(tempfile.mkdtemp())
        file_name = output_file.name
        with chdir(to=temp_dir):
            self._exporter.export(
                path=file_name,
                force=True,
                uploads_root=uploads_root,
                # if not isolated, we use structured IO in a context manager
                structured_io=structured_io and self._isolated,
            )
        return temp_dir

    async def _a_before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
    ) -> Path:
        """Run before the flow execution asynchronously."""
        temp_dir = Path(tempfile.mkdtemp())
        file_name = output_file.name
        async with a_chdir(to=temp_dir):
            self._exporter.export(
                path=file_name,
                uploads_root=uploads_root,
                structured_io=structured_io,
                force=True,
            )
        return temp_dir

    def _run(
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
    ]:  # pyright: ignore
        """Run the Waldiez flow."""
        raise NotImplementedError(
            "The _run method must be implemented in the subclass."
        )

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
    ]:  # pyright: ignore
        """Run the Waldiez flow asynchronously."""
        raise NotImplementedError(
            "The _a_run method must be implemented in the subclass."
        )

    def _start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
        skip_mmd: bool,
    ) -> None:
        """Start running the Waldiez flow in a non-blocking way."""
        raise NotImplementedError(
            "The _start method must be implemented in the subclass."
        )

    async def _a_start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
        skip_mmd: bool,
    ) -> None:
        """Start running the Waldiez flow in a non-blocking way asynchronously.

        Parameters
        ----------
        temp_dir : Path
            The path to the temporary directory created for the run.
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print'.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        """
        raise NotImplementedError(
            "The _a_start method must be implemented in the subclass."
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
        structured_io: bool,
        temp_dir: Path,
        skip_mmd: bool,
    ) -> None:
        """Run after the flow execution."""
        # Save results
        self._last_results = results

        # Reset stop flag for next run
        self._stop_requested.clear()
        after_run(
            temp_dir=temp_dir,
            output_file=output_file,
            flow_name=self.waldiez.name,
            uploads_root=uploads_root,
            skip_mmd=skip_mmd,
        )
        self.log.info("Cleanup completed")

    async def _a_after_run(
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
        """Run after the flow execution asynchronously."""
        self._after_run(
            results=results,
            output_file=output_file,
            uploads_root=uploads_root,
            structured_io=structured_io,
            temp_dir=temp_dir,
            skip_mmd=skip_mmd,
        )

    def _stop(self) -> None:
        """Actions to perform when stopping the flow."""
        raise NotImplementedError(
            "The _stop method must be implemented in the subclass."
        )

    async def _a_stop(self) -> None:
        """Asynchronously perform actions when stopping the flow."""
        raise NotImplementedError(
            "The _a_stop method must be implemented in the subclass."
        )

    # ===================================================================
    # HELPER METHODS
    # ===================================================================

    def _prepare_paths(
        self,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
    ) -> tuple[Path, Path | None]:
        """Prepare the output and uploads paths."""
        uploads_root_path: Path | None = None
        if uploads_root is not None:
            uploads_root_path = Path(uploads_root)
            self._uploads_root = uploads_root_path

        if output_path is not None:
            output_path = Path(output_path)
            self._output_path = output_path
        if not self._output_path:
            self._output_path = Path.cwd() / "waldiez_flow.py"
        output_file: Path = Path(self._output_path)
        return output_file, uploads_root_path

    def gather_requirements(self) -> set[str]:
        """Gather extra requirements to install before running the flow.

        Returns
        -------
        set[str]
            A set of requirements that are not already installed and do not
            include 'waldiez' in their name.
        """
        extra_requirements = {
            req
            for req in self.waldiez.requirements
            if req not in sys.modules and "waldiez" not in req
        }
        waldiez_version = get_waldiez_version()
        if "waldiez" not in sys.modules:
            extra_requirements.add(f"waldiez=={waldiez_version}")
        return extra_requirements

    def install_requirements(self) -> None:
        """Install the requirements for the flow."""
        if not self._called_install_requirements:
            self._called_install_requirements = True
            extra_requirements = self.gather_requirements()
            if extra_requirements:
                install_requirements(extra_requirements)

    async def a_install_requirements(self) -> None:
        """Install the requirements for the flow asynchronously."""
        if not self._called_install_requirements:
            self._called_install_requirements = True
            extra_requirements = self.gather_requirements()
            if extra_requirements:
                await a_install_requirements(extra_requirements)

    # ===================================================================
    # PUBLIC PROTOCOL IMPLEMENTATION
    # ===================================================================

    def before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
    ) -> Path:
        """Run the before_run method synchronously.

        Parameters
        ----------
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print',
            by default False.

        Returns
        -------
        Path
            The path to the temporary directory created before running the flow.
        """
        return self._before_run(
            output_file=output_file,
            uploads_root=uploads_root,
            structured_io=structured_io,
        )

    async def a_before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
    ) -> Path:
        """Run the _a_before_run method asynchronously.

        Parameters
        ----------
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print',
            by default False.

        Returns
        -------
        Path
            The path to the temporary directory created before running the flow.
        """
        return await self._a_before_run(
            output_file=output_file,
            uploads_root=uploads_root,
            structured_io=structured_io,
        )

    def run(
        self,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        skip_mmd: bool = False,
    ) -> Union[
        "ChatResult",
        list["ChatResult"],
        dict[int, "ChatResult"],
    ]:  # pyright: ignore
        """Run the Waldiez flow in blocking mode.

        Parameters
        ----------
        output_path : str | Path | None
            The output path, by default None.
        uploads_root : str | Path | None
            The runtime uploads root, by default None.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print',
            by default False.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram, by default False.

        Returns
        -------
        Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
            The result of the run, which can be a single ChatResult,
            a list of ChatResults,
            or a dictionary mapping indices to ChatResults.

        Raises
        ------
        RuntimeError
            If the runner is already running.
        """
        if self.is_running():
            raise RuntimeError("Workflow already running")
        if self.waldiez.is_async:
            with start_blocking_portal(backend="asyncio") as portal:
                return portal.call(
                    self.a_run,
                    output_path,
                    uploads_root,
                    structured_io,
                    skip_mmd,
                )
        output_file, uploads_root_path = self._prepare_paths(
            output_path=output_path,
            uploads_root=uploads_root,
        )
        temp_dir = self.before_run(
            output_file=output_file,
            uploads_root=uploads_root_path,
            structured_io=structured_io,
        )
        self.install_requirements()
        refresh_environment()
        self._running = True
        results: Union[
            "ChatResult",
            list["ChatResult"],
            dict[int, "ChatResult"],
        ] = []
        old_env_vars = set_env_vars(self.waldiez.get_flow_env_vars())
        try:
            with chdir(to=temp_dir):
                sys.path.insert(0, str(temp_dir))
                results = self._run(
                    temp_dir=temp_dir,
                    output_file=output_file,
                    uploads_root=uploads_root_path,
                    structured_io=structured_io,
                    skip_mmd=skip_mmd,
                )
        finally:
            self._running = False
            reset_env_vars(old_env_vars)
        self.after_run(
            results=results,
            output_file=output_file,
            uploads_root=uploads_root_path,
            structured_io=structured_io,
            temp_dir=temp_dir,
            skip_mmd=skip_mmd,
        )
        if sys.path[0] == str(temp_dir):
            sys.path.pop(0)
        return results

    async def a_run(
        self,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        skip_mmd: bool = False,
    ) -> Union[
        "ChatResult",
        list["ChatResult"],
        dict[int, "ChatResult"],
    ]:  # pyright: ignore
        """Run the Waldiez flow asynchronously.

        Parameters
        ----------
        output_path : str | Path | None
            The output path, by default None.
        uploads_root : str | Path | None
            The runtime uploads root, by default None.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print',
            by default False.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram, by default False.

        Returns
        -------
        Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
            The result of the run, which can be a single ChatResult,
            a list of ChatResults,
            or a dictionary mapping indices to ChatResults.

        Raises
        ------
        RuntimeError
            If the runner is already running.
        """
        if self.is_running():
            raise RuntimeError("Workflow already running")
        output_file, uploads_root_path = self._prepare_paths(
            output_path=output_path,
            uploads_root=uploads_root,
        )
        temp_dir = await self._a_before_run(
            output_file=output_file,
            uploads_root=uploads_root_path,
            structured_io=structured_io,
        )
        await self.a_install_requirements()
        refresh_environment()
        self._running = True
        results: Union[
            "ChatResult",
            list["ChatResult"],
            dict[int, "ChatResult"],
        ] = []
        try:
            async with a_chdir(to=temp_dir):
                sys.path.insert(0, str(temp_dir))
                results = await self._a_run(
                    temp_dir=temp_dir,
                    output_file=output_file,
                    uploads_root=uploads_root_path,
                    structured_io=structured_io,
                    skip_mmd=skip_mmd,
                )
        finally:
            self._running = False
        await self._a_after_run(
            results=results,
            output_file=output_file,
            uploads_root=uploads_root_path,
            structured_io=structured_io,
            temp_dir=temp_dir,
            skip_mmd=skip_mmd,
        )
        if sys.path[0] == str(temp_dir):
            sys.path.pop(0)
        return results

    def start(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        structured_io: bool,
        skip_mmd: bool,
    ) -> None:
        """Start running the Waldiez flow in a non-blocking way.

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
        if self.is_running():
            raise RuntimeError("Workflow already running")
        output_file, uploads_root_path = self._prepare_paths(
            output_path=output_path,
            uploads_root=uploads_root,
        )
        temp_dir = self.before_run(
            output_file=output_file,
            uploads_root=uploads_root_path,
            structured_io=structured_io,
        )
        self.install_requirements()
        refresh_environment()
        self._running = True
        self._start(
            temp_dir=temp_dir,
            output_file=output_file,
            uploads_root=uploads_root_path,
            structured_io=structured_io,
            skip_mmd=skip_mmd,
        )

    async def a_start(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        structured_io: bool,
        skip_mmd: bool,
    ) -> None:
        """Asynchronously start running the Waldiez flow in a non-blocking way.

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
        if self.is_running():
            raise RuntimeError("Workflow already running")
        output_file, uploads_root_path = self._prepare_paths(
            output_path=output_path,
            uploads_root=uploads_root,
        )
        temp_dir = await self._a_before_run(
            output_file=output_file,
            uploads_root=uploads_root_path,
            structured_io=structured_io,
        )
        await self.a_install_requirements()
        refresh_environment()
        self._running = True
        await self._a_start(
            temp_dir=temp_dir,
            output_file=output_file,
            uploads_root=uploads_root_path,
            structured_io=structured_io,
            skip_mmd=skip_mmd,
        )

    def after_run(
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
        """Actions to perform after running the flow.

        Parameters
        ----------
        results : Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
            The results of the flow run.
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print'.
        temp_dir : Path
            The path to the temporary directory used during the run.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        """
        self._after_run(
            results=results,
            output_file=output_file,
            uploads_root=uploads_root,
            structured_io=structured_io,
            temp_dir=temp_dir,
            skip_mmd=skip_mmd,
        )

    async def a_after_run(
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
        """Asynchronously perform actions after running the flow.

        Parameters
        ----------
        results : Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
            The results of the flow run.
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.
        structured_io : bool
            Whether to use structured IO instead of the default 'input/print'.
        temp_dir : Path
            The path to the temporary directory used during the run.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        """
        await self._a_after_run(
            results=results,
            output_file=output_file,
            uploads_root=uploads_root,
            structured_io=structured_io,
            temp_dir=temp_dir,
            skip_mmd=skip_mmd,
        )

    def stop(self) -> None:
        """Stop the runner if it is running."""
        if not self.is_running():
            return
        try:
            self._stop()
        finally:
            self._running = False

    async def a_stop(self) -> None:
        """Asynchronously stop the runner if it is running."""
        if not self.is_running():
            return
        try:
            await self._a_stop()
        finally:
            self._running = False

    # ===================================================================
    # PROPERTIES AND CONTEXT MANAGERS
    # ===================================================================

    @property
    def waldiez(self) -> Waldiez:
        """Get the Waldiez instance."""
        return self._waldiez

    @property
    def is_async(self) -> bool:
        """Check if the workflow is async."""
        return self.waldiez.is_async

    @property
    def running(self) -> bool:
        """Get the running status."""
        return self.is_running()

    @property
    def log(self) -> WaldiezLogger:
        """Get the logger for the runner."""
        return self._logger

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
    ) -> "WaldiezBaseRunner":
        """Load a waldiez flow from a file and create a runner.

        Parameters
        ----------
        waldiez_file : str | Path
            The path to the waldiez file.
        name : str | None, optional
            The name of the flow, by default None.
        description : str | None, optional
            The description of the flow, by default None.
        tags : list[str] | None, optional
            The tags for the flow, by default None.
        requirements : list[str] | None, optional
            The requirements for the flow, by default None.
        output_path : str | Path | None, optional
            The path to save the output file, by default None.
        uploads_root : str | Path | None, optional
            The root path for uploads, by default None.
        structured_io : bool, optional
            Whether to use structured IO instead of the default 'input/print',
            by default False.
        isolated : bool, optional
            Whether to run the flow in an isolated environment, default False.

        Returns
        -------
        WaldiezBaseRunner
            An instance of WaldiezBaseRunner initialized with the loaded flow.
        """
        waldiez = Waldiez.load(
            waldiez_file,
            name=name,
            description=description,
            tags=tags,
            requirements=requirements,
        )
        return cls(
            waldiez=waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            isolated=isolated,
        )

    def __enter__(self) -> Self:
        """Enter the context manager."""
        return self

    async def __aenter__(self) -> Self:
        """Enter the context manager asynchronously."""
        return self

    def __exit__(
        self,
        exc_type: Type[BaseException],
        exc_value: BaseException,
        traceback: TracebackType,
    ) -> None:
        """Exit the context manager."""
        if self.is_running():
            self.stop()

    async def __aexit__(
        self,
        exc_type: Type[BaseException],
        exc_value: BaseException,
        traceback: TracebackType,
    ) -> None:
        """Exit the context manager asynchronously."""
        if self.is_running():
            await self.a_stop()
