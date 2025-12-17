# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=broad-exception-caught,too-many-try-statements,too-many-lines
# pyright: reportUnknownMemberType=false, reportAttributeAccessIssue=false
# pyright: reportUnknownArgumentType=false, reportUnusedParameter=false
# flake8: noqa: C901
"""Base runner for Waldiez workflows."""

import importlib.util
import json
import shutil
import sys
import tempfile
import threading
import traceback as tb
from pathlib import Path
from types import ModuleType, TracebackType
from typing import Any

import aiofiles
from aiofiles.os import wrap
from anyio.from_thread import start_blocking_portal
from typing_extensions import Self, override

from waldiez.exporter import WaldiezExporter
from waldiez.logger import WaldiezLogger, get_logger
from waldiez.models import Waldiez
from waldiez.storage import StorageManager, WaldiezCheckpoint, safe_name

from .dir_utils import a_chdir, chdir
from .environment import reset_env_vars, set_env_vars
from .events_mixin import EventsMixin
from .exceptions import StopRunningException
from .protocol import WaldiezRunnerProtocol
from .requirements_mixin import RequirementsMixin
from .results_mixin import ResultsMixin


# pylint: disable=too-many-public-methods
# noinspection PyBroadException
class WaldiezBaseRunner(WaldiezRunnerProtocol, RequirementsMixin, ResultsMixin):
    """Base runner for Waldiez."""

    _structured_io: bool
    _output_path: str | Path | None
    _uploads_root: str | Path | None
    _dot_env_path: Path | None
    _running: bool
    _waldiez_file: Path
    _flow_name: str
    _storage_manager: StorageManager
    _checkpoint: WaldiezCheckpoint | None
    _output_dir: Path
    _logger: WaldiezLogger
    _skip_deps: bool

    def __init__(
        self,
        waldiez: Waldiez,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        structured_io: bool,
        dot_env: str | Path | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize the Waldiez manager."""
        workspace_arg: str | None = kwargs.pop("workspace", None)
        if not isinstance(workspace_arg, str):
            workspace_arg = None
        WaldiezBaseRunner._running = False
        WaldiezBaseRunner._structured_io = structured_io
        WaldiezBaseRunner._output_path = output_path
        WaldiezBaseRunner._uploads_root = uploads_root
        WaldiezBaseRunner._dot_env_path = Path(dot_env) if dot_env else None
        WaldiezBaseRunner._flow_name = safe_name(waldiez.name)
        WaldiezBaseRunner._storage_manager = StorageManager(None, workspace_arg)
        WaldiezBaseRunner._waldiez = waldiez
        EventsMixin.set_input_function(input)
        EventsMixin.set_print_function(print)
        EventsMixin.set_send_function(print)
        EventsMixin.set_async(waldiez.is_async)
        RequirementsMixin.__init__(self)
        self._called_install_requirements = False
        self._exporter = WaldiezExporter(waldiez)
        self._stop_requested = threading.Event()
        self._last_results: list[dict[str, Any]] = []
        self._last_exception: Exception | None = None
        self._running_lock = threading.Lock()
        self._loaded_module: ModuleType | None = None
        logger = kwargs.get("logger")
        if isinstance(logger, WaldiezLogger):
            self._logger = logger
        else:
            self._logger = get_logger()
        WaldiezBaseRunner._logger = self._logger
        waldiez_file = kwargs.get("waldiez_file", "")
        if isinstance(waldiez_file, str) and waldiez_file:
            waldiez_file_path = Path(waldiez_file).resolve()
        elif isinstance(waldiez_file, Path):
            waldiez_file_path = waldiez_file.resolve()
        else:
            waldiez_file_path = waldiez.dump(to=output_path)
        if not waldiez_file_path or not waldiez_file_path.is_file():
            raise ValueError("Could not resolve a waldiez file path")
        WaldiezBaseRunner._waldiez_file = waldiez_file_path
        if (waldiez_file_path.parent / ".env").exists():
            WaldiezBaseRunner._dot_env_path = waldiez_file_path.parent / ".env"
        WaldiezBaseRunner._checkpoint = None
        checkpoint_arg = kwargs.get("checkpoint", "")
        if checkpoint_arg and isinstance(checkpoint_arg, str):
            WaldiezBaseRunner._checkpoint = WaldiezBaseRunner._init_checkpoint(
                checkpoint_arg=checkpoint_arg,
            )
        self._output_dir = WaldiezBaseRunner._init_output_dir(output_path)
        WaldiezBaseRunner._check_dot_env(self._output_dir)
        WaldiezBaseRunner._skip_deps = (
            str(kwargs.get("skip_deps", "false")).lower() == "true"
        )

    @staticmethod
    def _init_output_dir(output_path: str | Path | None) -> Path:
        if output_path:
            if str(output_path).endswith((".py", ".ipynb", ".waldiez")):
                return Path(output_path).parent
            return (
                Path(output_path)
                if Path(output_path).is_dir()
                else Path(output_path).parent
            )
        return Path.cwd()  # should change on ".run(...)"

    @staticmethod
    def _store_run_paths(tmp_dir: Path, output_file: Path) -> None:
        """Store the path of the module that is to be run."""
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            dir_path = StorageManager.default_root()
            dir_path.mkdir(parents=True, exist_ok=True)
            msg = json.dumps(
                {
                    "src": str(tmp_dir),
                    "dst": str(output_file),
                    "name": WaldiezBaseRunner._waldiez.name,
                }
            )
            with open(
                dir_path / ResultsMixin.RUN_DETAILS, "w", encoding="utf-8"
            ) as f:
                f.write(msg)
        except BaseException:
            WaldiezBaseRunner._logger.error(tb.format_exc())

    @staticmethod
    def _remove_run_paths() -> None:
        """Remove run paths."""
        ResultsMixin._cleanup()

    @staticmethod
    async def _a_store_run_paths(tmp_dir: Path, output_file: Path) -> None:
        """Store the path of the module that is to be run."""
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            dir_path = StorageManager.default_root()
            dir_path.mkdir(parents=True, exist_ok=True)
            msg = json.dumps(
                {
                    "src": str(tmp_dir),
                    "dst": str(output_file),
                    "name": WaldiezBaseRunner._waldiez.name,
                }
            )
            async with aiofiles.open(
                dir_path / ResultsMixin.RUN_DETAILS, "w", encoding="utf-8"
            ) as f:
                await f.write(msg)
        except BaseException:
            WaldiezBaseRunner._logger.error(tb.format_exc())

    @staticmethod
    def _check_dot_env(output_dir: Path) -> None:
        if (
            WaldiezBaseRunner._dot_env_path
            and WaldiezBaseRunner._dot_env_path.is_file()
        ):
            return
        if (output_dir / ".env").is_file():
            WaldiezBaseRunner._dot_env_path = output_dir / ".env"

    @staticmethod
    def _init_checkpoint(
        checkpoint_arg: str,
    ) -> WaldiezCheckpoint | None:
        checkpoint: WaldiezCheckpoint | None = None
        session_name = WaldiezBaseRunner._flow_name
        checkpoint_id, history_index = StorageManager.parse_checkpoint_arg(
            checkpoint_arg
        )
        if checkpoint_id == "latest":
            try:
                info = WaldiezBaseRunner._storage_manager.get_latest_checkpoint(
                    session_name
                )
                if info:
                    checkpoint = WaldiezBaseRunner._storage_manager.load(
                        info, history_index=history_index
                    )
            except BaseException:
                pass
        else:
            try:
                checkpoint_ts = WaldiezCheckpoint.parse_timestamp(checkpoint_id)
                info = WaldiezBaseRunner._storage_manager.get(
                    session_name, checkpoint_ts
                )
                if info:
                    checkpoint = WaldiezBaseRunner._storage_manager.load(
                        info, history_index=history_index
                    )
            except BaseException:
                pass
        return checkpoint

    @override
    @staticmethod
    def print(*args: Any, **kwargs: Any) -> None:
        """Print a message to the output stream.

        Parameters
        ----------
        *args : Any
            Positional arguments to print.
        **kwargs : Any
            Keyword arguments to print.
        """
        if len(args) == 1 and isinstance(args[0], dict):
            arg = json.dumps(args[0], default=str, ensure_ascii=False)
            EventsMixin.do_print(arg, **kwargs)
        else:
            EventsMixin.do_print(*args, **kwargs)

    @override
    def is_running(self) -> bool:
        """Check if the workflow is currently running.

        Returns
        -------
        bool
            True if the workflow is running, False otherwise.
        """
        with self._running_lock:
            return WaldiezBaseRunner._running

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
                "The waldiez file does not contain a main(...) function"
            )
        self._loaded_module = module
        return module

    def _before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
        message: str | None = None,
    ) -> Path:
        """Run before the flow execution."""
        self.log.info("Preparing workflow file: %s", output_file)
        temp_dir = Path(tempfile.mkdtemp(prefix="wlz-"))
        self._output_dir = temp_dir
        file_name = output_file.name
        with chdir(to=temp_dir):
            self._exporter.export(
                path=file_name,
                uploads_root=uploads_root,
                message=message,
                structured_io=WaldiezBaseRunner._structured_io,
                force=True,
            )
            if self.dot_env_path and self.dot_env_path.is_file():
                shutil.copyfile(
                    str(self.dot_env_path),
                    str(temp_dir / ".env"),
                )
        return temp_dir

    async def _a_before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
        message: str | None,
    ) -> Path:
        """Run before the flow execution asynchronously."""
        temp_dir = Path(tempfile.mkdtemp(prefix="wlz-"))
        self._output_dir = temp_dir
        file_name = output_file.name
        async with a_chdir(to=temp_dir):
            self._exporter.export(
                path=file_name,
                uploads_root=uploads_root,
                message=message,
                structured_io=self.structured_io,
                force=True,
            )
            if self.dot_env_path and self.dot_env_path.is_file():
                wrapped = wrap(shutil.copyfile)
                await wrapped(
                    str(self.dot_env_path),
                    str(temp_dir / ".env"),
                )
        return temp_dir

    def _run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        message: str | None,
        skip_mmd: bool,
        skip_timeline: bool,
        skip_symlinks: bool,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez flow."""
        raise NotImplementedError(
            "The _run method must be implemented in the subclass."
        )

    async def _a_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        message: str | None,
        skip_mmd: bool,
        skip_timeline: bool,
        skip_symlinks: bool,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez flow asynchronously."""
        raise NotImplementedError(
            "The _a_run method must be implemented in the subclass."
        )

    def _after_run(
        self,
        results: list[dict[str, Any]],
        error: BaseException | None,
        output_file: Path,
        waldiez_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
        skip_symlinks: bool,
    ) -> Path | None:
        """Run after the flow execution."""
        self._last_results = results
        self._stop_requested.clear()
        try:
            return ResultsMixin.post_run(
                results=results,
                error=error,
                temp_dir=temp_dir,
                output_file=output_file,
                flow_name=WaldiezBaseRunner._flow_name,
                waldiez_file=waldiez_file,
                uploads_root=uploads_root,
                skip_mmd=skip_mmd,
                skip_timeline=skip_timeline,
                storage_manager=WaldiezBaseRunner._storage_manager,
                skip_symlinks=skip_symlinks,
            )
        except BaseException:  # pragma: no cover
            self.log.warning(
                "Error occurred during after_run: \n%s\n", tb.format_exc()
            )
        self.log.info("Cleanup completed")
        return None

    async def _a_after_run(
        self,
        results: list[dict[str, Any]],
        error: BaseException | None,
        output_file: Path,
        waldiez_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
        skip_symlinks: bool,
    ) -> Path | None:
        """Run after the flow execution asynchronously."""
        self._last_results = results
        self._stop_requested.clear()
        try:
            return await ResultsMixin.a_post_run(
                results=results,
                error=error,
                temp_dir=temp_dir,
                output_file=output_file,
                flow_name=WaldiezBaseRunner._flow_name,
                waldiez_file=waldiez_file,
                uploads_root=uploads_root,
                skip_mmd=skip_mmd,
                skip_timeline=skip_timeline,
                skip_symlinks=skip_symlinks,
            )
        except BaseException as exc:  # pragma: no cover
            self.log.warning("Error occurred during a_after_run: %s", exc)
        self.log.info("Cleanup completed")
        return None

    @staticmethod
    def _prepare_paths(
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
    ) -> tuple[Path, Path | None]:
        """Prepare the output and uploads paths."""
        uploads_root_path: Path | None = None
        if uploads_root is not None:
            uploads_root_path = Path(uploads_root)
            WaldiezBaseRunner._uploads_root = uploads_root_path

        if output_path is not None:
            output_path = Path(output_path)
            WaldiezBaseRunner._output_path = output_path
        if not WaldiezBaseRunner._output_path:
            WaldiezBaseRunner._output_path = (
                Path.cwd() / safe_name(WaldiezBaseRunner._waldiez.name)
            ).with_suffix(".py")
        output_file: Path = Path(WaldiezBaseRunner._output_path)
        WaldiezBaseRunner._check_dot_env(output_file.parent)
        return output_file, uploads_root_path

    @override
    def before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
        message: str | None,
    ) -> Path:
        """Run the before_run method synchronously.

        Parameters
        ----------
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.
        message : str | None
            Optional initial message to pass (override flow's message if needed)

        Returns
        -------
        Path
            The path to the temporary directory created before running the flow.
        """
        return self._before_run(
            output_file=output_file,
            uploads_root=uploads_root,
            message=message,
        )

    @override
    async def a_before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
        message: str | None,
    ) -> Path:
        """Run the _a_before_run method asynchronously.

        Parameters
        ----------
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.
        message : str | None
            Optional initial message to pass (override flow's message if needed)

        Returns
        -------
        Path
            The path to the temporary directory created before running the flow.
        """
        return await self._a_before_run(
            output_file=output_file,
            uploads_root=uploads_root,
            message=message,
        )

    def prepare(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        message: str | None,
    ) -> tuple[Path, Path, Path | None]:
        """Prepare the paths and environment for running the flow.

        Parameters
        ----------
        output_path : str | Path | None
            The output path for the flow, by default None.
        uploads_root : str | Path | None
            The root path for uploads, by default None.
        message : str | None
            Optional initial message to pass (override flow's message if needed)

        Returns
        -------
        tuple[Path, Path, Path | None]
            A tuple containing:
            - The path to the output file.
            - The path to the temporary directory created for the run.
            - The root path for uploads, if specified, otherwise None.
        """
        output_file, uploads_root_path = self._prepare_paths(
            output_path=output_path,
            uploads_root=uploads_root,
        )
        temp_dir = self.before_run(
            output_file=output_file,
            uploads_root=uploads_root_path,
            message=message,
        )
        if not WaldiezBaseRunner._skip_deps:
            self.install_requirements()
        return temp_dir, output_file, uploads_root_path

    # pylint: disable=too-many-locals,unused-argument,too-complex
    @override
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
            If the runner is already running, the workflow is not async,
            or an error occurs during the run.
        StopRunningException
            If the run is stopped by the user.
        """
        if isinstance(skip_deps, bool):
            WaldiezBaseRunner._skip_deps = skip_deps
        if dot_env is not None:
            resolved = Path(dot_env).resolve()
            if resolved.is_file():
                WaldiezBaseRunner._dot_env_path = resolved
        if structured_io is not None:
            WaldiezBaseRunner._structured_io = structured_io
        if self.is_running():
            raise RuntimeError("Workflow already running")
        if self.is_async:
            with start_blocking_portal(backend="asyncio") as portal:
                return portal.call(
                    self.a_run,
                    output_path,
                    uploads_root,
                    structured_io,
                    message,
                    skip_mmd,
                    skip_timeline,
                    skip_symlinks,
                    skip_deps,
                    dot_env,
                    **kwargs,
                )
        temp_dir, output_file, uploads_root_path = self.prepare(
            output_path=output_path,
            uploads_root=uploads_root,
            message=message,
        )
        WaldiezBaseRunner._running = True
        results: list[dict[str, Any]] = []
        error: BaseException | None = None
        old_env_vars = set_env_vars(self._waldiez.get_flow_env_vars())
        output_dir = output_file.parent
        try:
            with chdir(to=temp_dir):
                sys.path.insert(0, str(temp_dir))
                results = self._run(
                    temp_dir=temp_dir,
                    output_file=output_file,
                    uploads_root=uploads_root_path,
                    message=message,
                    skip_mmd=skip_mmd,
                    skip_timeline=skip_timeline,
                    skip_symlinks=skip_symlinks,
                )
        except (SystemExit, StopRunningException, KeyboardInterrupt) as exc:
            error = exc
            self.log.warning("Execution stopped: %s", exc)
            raise StopRunningException(StopRunningException.reason) from exc
        except BaseException as exc:
            self.log.error("Error occurred while running workflow: %s", exc)
            error = exc
        finally:
            WaldiezBaseRunner._running = False
            reset_env_vars(old_env_vars)
            output = self.after_run(
                results=results,
                error=error,
                output_file=output_file,
                uploads_root=uploads_root_path,
                temp_dir=temp_dir,
                skip_mmd=skip_mmd,
                skip_timeline=skip_timeline,
                skip_symlinks=skip_symlinks,
            )
            if output:
                output_dir = output
        EventsMixin.do_print("<Waldiez> - Done running the flow.")
        if sys.path[0] == str(temp_dir):
            sys.path.pop(0)
        return self.get_results(results, output_dir)

    async def a_prepare(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
        message: str | None,
    ) -> tuple[Path, Path, Path | None]:
        """Prepare the paths for the async run.

        Parameters
        ----------
        output_path : str | Path | None
            The output path, by default None.
        uploads_root : str | Path | None
            The uploads root path, by default None.
        message : str | None
            Optional initial message to pass (override flow's message if needed)

        Returns
        -------
        tuple[Path, Path, Path | None]
            The temporary directory, output file, and uploads root path.
        """
        output_file, uploads_root_path = self._prepare_paths(
            output_path=output_path,
            uploads_root=uploads_root,
        )
        temp_dir = await self._a_before_run(
            output_file=output_file,
            uploads_root=uploads_root_path,
            message=message,
        )
        if not WaldiezBaseRunner._skip_deps:
            await self.a_install_requirements()
        return temp_dir, output_file, uploads_root_path

    @override
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
        skip_deps : bool
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
        StopRunningException
            If the run is stopped by the user.
        """
        if isinstance(skip_deps, bool):
            WaldiezBaseRunner._skip_deps = skip_deps
        if dot_env is not None:
            resolved = Path(dot_env).resolve()
            if resolved.is_file():
                WaldiezBaseRunner._dot_env_path = resolved
        if structured_io is not None:
            WaldiezBaseRunner._structured_io = structured_io
        if self.is_running():
            raise RuntimeError("Workflow already running")
        temp_dir, output_file, uploads_root_path = await self.a_prepare(
            output_path=output_path,
            uploads_root=uploads_root,
            message=message,
        )
        WaldiezBaseRunner._running = True
        results: list[dict[str, Any]] = []
        error: BaseException | None = None
        output_dir = output_file.parent
        old_env_vars = set_env_vars(self._waldiez.get_flow_env_vars())
        try:
            async with a_chdir(to=temp_dir):
                sys.path.insert(0, str(temp_dir))
                results = await self._a_run(
                    temp_dir=temp_dir,
                    output_file=output_file,
                    uploads_root=uploads_root_path,
                    message=message,
                    skip_mmd=skip_mmd,
                    skip_timeline=skip_timeline,
                    skip_symlinks=skip_symlinks,
                    **kwargs,
                )
        except (SystemExit, StopRunningException, KeyboardInterrupt) as exc:
            self.log.warning("Execution stopped: %s", exc)
            error = exc
            raise StopRunningException(StopRunningException.reason) from exc
        except BaseException as exc:
            self.log.error("Error occurred while running workflow: %s", exc)
            error = exc
        finally:
            WaldiezBaseRunner._running = False
            reset_env_vars(old_env_vars)
            output = await self.a_after_run(
                results=results,
                error=error,
                output_file=output_file,
                uploads_root=uploads_root_path,
                temp_dir=temp_dir,
                skip_mmd=skip_mmd,
                skip_timeline=skip_timeline,
                skip_symlinks=skip_symlinks,
            )
            if output:
                output_dir = output
        if sys.path[0] == str(temp_dir):
            sys.path.pop(0)
        return await self.a_get_results(results, output_dir)

    @override
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
            The results of the flow run.
        error : BaseException | None
            Optional error during the run.
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.
        temp_dir : Path
            The path to the temporary directory used during the run.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        skip_timeline : bool
            Whether to skip generating the timeline JSON.
        skip_symlinks : bool
            Whether to skip creating symlinks for checkpoints.

        Returns
        -------
        Path | None
            The destination directory if output file, else None
        """
        return self._after_run(
            results=results,
            error=error,
            output_file=output_file,
            waldiez_file=WaldiezBaseRunner._waldiez_file,
            uploads_root=uploads_root,
            temp_dir=temp_dir,
            skip_mmd=skip_mmd,
            skip_timeline=skip_timeline,
            skip_symlinks=skip_symlinks,
        )

    @override
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
            The results of the flow run.
        error : BaseException | None
            Optional error during the run.
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.
        temp_dir : Path
            The path to the temporary directory used during the run.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        skip_timeline : bool
            Whether to skip generating the timeline JSON.
        skip_symlinks : bool
            Whether to skip creating symlinks for checkpoints.

        Returns
        -------
        Path | None
            The destination directory if output file, else None
        """
        return await self._a_after_run(
            results=results,
            error=error,
            output_file=output_file,
            uploads_root=uploads_root,
            temp_dir=temp_dir,
            skip_mmd=skip_mmd,
            skip_timeline=skip_timeline,
            waldiez_file=WaldiezBaseRunner._waldiez_file,
            skip_symlinks=skip_symlinks,
        )

    @property
    def waldiez(self) -> Waldiez:
        """Get the Waldiez instance."""
        return WaldiezBaseRunner._waldiez

    @property
    def waldiez_file(self) -> Path:
        """Get the path to the waldiez file."""
        return self._waldiez_file

    @property
    def is_async(self) -> bool:
        """Check if the workflow is async."""
        return WaldiezBaseRunner._waldiez.is_async

    @property
    def running(self) -> bool:
        """Get the running status."""
        return self.is_running()

    @property
    def log(self) -> WaldiezLogger:
        """Get the logger for the runner."""
        return self._logger

    @property
    def structured_io(self) -> bool:
        """Check if the runner is using structured IO."""
        return WaldiezBaseRunner._structured_io

    @property
    def dot_env_path(self) -> Path | None:
        """Get the path to the .env file, if any."""
        return WaldiezBaseRunner._dot_env_path

    @property
    def output_path(self) -> str | Path | None:
        """Get the output path for the runner."""
        return WaldiezBaseRunner._output_path

    @property
    def uploads_root(self) -> str | Path | None:
        """Get the uploads root path for the runner."""
        return WaldiezBaseRunner._uploads_root

    @property
    def state_json(self) -> Path | None:
        """Get the state.json path to resume from if any."""
        if WaldiezBaseRunner._checkpoint:
            state_file = WaldiezBaseRunner._checkpoint.state_file
            if state_file.is_file():
                return state_file
        return None

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
        dot_env: str | Path | None = None,
        **kwargs: Any,
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
        dot_env : str | Path | None, optional
            The path to the .env file, if any, by default None.
        **kwargs : Any
            Additional kwargs to pass.

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
            dot_env=dot_env,
            **kwargs,
        )

    def stop(self) -> None:
        """Stop the workflow execution."""
        self._stop_requested.set()

    def is_stop_requested(self) -> bool:
        """Check if a stop has been requested.

        Returns
        -------
        bool
            True if stop has been requested, False otherwise.
        """
        return self._stop_requested.is_set()

    def set_stop_requested(self) -> None:
        """Set the stop requested flag."""
        self._stop_requested.set()

    def __enter__(self) -> Self:
        """Enter the context manager."""
        return self

    async def __aenter__(self) -> Self:
        """Enter the context manager asynchronously."""
        return self

    def __exit__(
        self,
        exc_type: type[BaseException],
        exc_value: BaseException,
        traceback: TracebackType,
    ) -> None:
        """Exit the context manager."""
        if self.is_running():
            self._stop_requested.set()

    async def __aexit__(
        self,
        exc_type: type[BaseException],
        exc_value: BaseException,
        traceback: TracebackType,
    ) -> None:
        """Exit the context manager asynchronously."""
        if self.is_running():
            self._stop_requested.set()
