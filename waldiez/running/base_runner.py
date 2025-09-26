# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportUnknownMemberType=false, reportAttributeAccessIssue=false
# pyright: reportUnknownArgumentType=false
"""Base runner for Waldiez workflows."""

import importlib.util
import inspect
import json
import shutil
import sys
import tempfile
import threading
from pathlib import Path
from types import ModuleType, TracebackType
from typing import TYPE_CHECKING, Any, Callable, Coroutine, Type, Union

from aiofiles.os import wrap
from anyio.from_thread import start_blocking_portal
from typing_extensions import Self

from waldiez.exporter import WaldiezExporter
from waldiez.logger import WaldiezLogger, get_logger
from waldiez.models import Waldiez

from .async_utils import is_async_callable, syncify
from .dir_utils import a_chdir, chdir
from .environment import reset_env_vars, set_env_vars
from .exceptions import StopRunningException
from .io_utils import input_async, input_sync
from .post_run import (
    a_after_run,
    after_run,
)
from .pre_run import RequirementsMixin
from .protocol import WaldiezRunnerProtocol

if TYPE_CHECKING:
    from autogen.agentchat import ConversableAgent  # type: ignore
    from autogen.events import BaseEvent  # type: ignore
    from autogen.messages import BaseMessage  # type: ignore


# pylint: disable=too-many-public-methods
class WaldiezBaseRunner(WaldiezRunnerProtocol, RequirementsMixin):
    """Base runner for Waldiez.

    Initialization parameters:
        - waldiez: The Waldiez flow to run.
        - output_path: Path to save the output file.
        - uploads_root: Root directory for uploads.
        - structured_io: Whether to use structured I/O.
        - dot_env: Path to a .env file for environment variables.

    Methods to possibly override:
        - prepare: Prepare the environment and paths for running the flow.
        - _before_run: Actions to perform before running the flow.
        - a_prepare: Async version of the prepare method.
        - _a_before_run: Async actions to perform before running the flow.
        - _run: Actual implementation of the run logic.
        - _a_run: Async implementation of the run logic.
        - _after_run: Actions to perform after running the flow.
        - _a_after_run: Async actions to perform after running the flow.
    """

    _structured_io: bool
    _output_path: str | Path | None
    _uploads_root: str | Path | None
    _dot_env_path: str | Path | None
    _running: bool
    _is_async: bool
    _waldiez_file: Path
    _input: Callable[..., str] | Callable[..., Coroutine[Any, Any, str]]
    _print: Callable[..., None]
    _send: Callable[[Union["BaseEvent", "BaseMessage"]], None]

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
        WaldiezBaseRunner._running = False
        WaldiezBaseRunner._structured_io = structured_io
        WaldiezBaseRunner._output_path = output_path
        WaldiezBaseRunner._uploads_root = uploads_root
        WaldiezBaseRunner._dot_env_path = dot_env
        WaldiezBaseRunner._input = input
        WaldiezBaseRunner._print = print
        WaldiezBaseRunner._send = print
        WaldiezBaseRunner._is_async = waldiez.is_async
        RequirementsMixin.__init__(self)
        self._waldiez = waldiez
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

    @staticmethod
    def print(*args: Any, **kwargs: Any) -> None:
        """Print a message to the console.

        Parameters
        ----------
        *args : Any
            Positional arguments to print.
        **kwargs : Any
            Keyword arguments to print.
        """
        if len(args) == 1 and isinstance(args[0], dict):
            arg = json.dumps(args[0], default=str, ensure_ascii=False)
            WaldiezBaseRunner._print(arg, **kwargs)
        else:
            WaldiezBaseRunner._print(*args, **kwargs)

    def is_running(self) -> bool:
        """Check if the workflow is currently running.

        Returns
        -------
        bool
            True if the workflow is running, False otherwise.
        """
        with self._running_lock:
            return WaldiezBaseRunner._running

    @staticmethod
    def get_input_function() -> (
        Callable[..., str] | Callable[..., Coroutine[Any, Any, str]]
    ):
        """Get the input function for user interaction.

        Returns
        -------
        Callable[[str, bool], str]
            A function that takes a prompt and a password flag,
            returning user input.
        """
        if hasattr(WaldiezBaseRunner, "_input") and callable(
            WaldiezBaseRunner._input
        ):
            return WaldiezBaseRunner._input
        if WaldiezBaseRunner._is_async:
            return input_async
        return input_sync

    @staticmethod
    async def a_get_user_input(
        prompt: str, *, password: bool = False, **kwargs: Any
    ) -> str:
        """Get user input with an optional password prompt.

        Parameters
        ----------
        prompt : str
            The prompt to display to the user.
        password : bool, optional
            If True, the input will be hidden (default is False).
        **kwargs : Any
            Additional keyword arguments to pass to the input function.

        Returns
        -------
        str
            The user input.
        """
        input_function = WaldiezBaseRunner.get_input_function()
        if is_async_callable(input_function):
            try:
                result = await input_function(  # type: ignore
                    prompt,
                    password=password,
                    **kwargs,
                )
            except TypeError:
                result = await input_function(prompt)  # type: ignore
        else:
            try:
                result = input_function(prompt, password=password, **kwargs)
            except TypeError:
                result = input_function(prompt)
        return result  # pyright: ignore

    @staticmethod
    def get_user_input(
        prompt: str,
        *,
        password: bool = False,
        **kwargs: Any,
    ) -> str:
        """Get user input with an optional password prompt.

        Parameters
        ----------
        prompt : str
            The prompt to display to the user.
        password : bool, optional
            If True, the input will be hidden (default is False).
        **kwargs : Any
            Additional keyword arguments to pass to the input function.

        Returns
        -------
        str
            The user input.
        """
        input_function = WaldiezBaseRunner.get_input_function()
        if inspect.iscoroutinefunction(input_function):
            try:
                return syncify(input_function)(
                    prompt, password=password, **kwargs
                )
            except TypeError:
                return syncify(input_function)(prompt)
        try:
            return str(input_function(prompt, password=password, **kwargs))
        except TypeError:
            return str(input_function(prompt))

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

    def _before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
    ) -> Path:
        """Run before the flow execution."""
        self.log.info("Preparing workflow file: %s", output_file)
        temp_dir = Path(tempfile.mkdtemp(prefix="wlz-"))
        file_name = output_file.name
        with chdir(to=temp_dir):
            self._exporter.export(
                path=file_name,
                force=True,
                uploads_root=uploads_root,
                structured_io=WaldiezBaseRunner._structured_io,
            )
            if self._dot_env_path:
                shutil.copyfile(
                    str(self._dot_env_path),
                    str(temp_dir / ".env"),
                )
        return temp_dir

    async def _a_before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
    ) -> Path:
        """Run before the flow execution asynchronously."""
        temp_dir = Path(tempfile.mkdtemp())
        file_name = output_file.name
        async with a_chdir(to=temp_dir):
            self._exporter.export(
                path=file_name,
                uploads_root=uploads_root,
                structured_io=self.structured_io,
                force=True,
            )
            if self._dot_env_path:
                wrapped = wrap(shutil.copyfile)
                await wrapped(
                    str(self._dot_env_path),
                    str(temp_dir / ".env"),
                )
        return temp_dir

    def _run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
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
        skip_mmd: bool,
        skip_timeline: bool,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez flow asynchronously."""
        raise NotImplementedError(
            "The _a_run method must be implemented in the subclass."
        )

    def _after_run(
        self,
        results: list[dict[str, Any]],
        output_file: Path,
        waldiez_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> None:
        """Run after the flow execution."""
        # Save results
        self._last_results = results

        # Reset stop flag for next run
        self._stop_requested.clear()
        # pylint: disable=broad-exception-caught
        try:
            after_run(
                temp_dir=temp_dir,
                output_file=output_file,
                flow_name=self._waldiez.name,
                waldiez_file=waldiez_file,
                uploads_root=uploads_root,
                skip_mmd=skip_mmd,
                skip_timeline=skip_timeline,
            )
        except BaseException as exc:  # pragma: no cover
            self.log.warning("Error occurred during after_run: %s", exc)
        self.log.info("Cleanup completed")

    async def _a_after_run(
        self,
        results: list[dict[str, Any]],
        output_file: Path,
        waldiez_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> None:
        """Run after the flow execution asynchronously."""
        self._last_results = results
        self._stop_requested.clear()
        # pylint: disable=broad-exception-caught
        try:
            await a_after_run(
                temp_dir=temp_dir,
                output_file=output_file,
                flow_name=self._waldiez.name,
                waldiez_file=waldiez_file,
                uploads_root=uploads_root,
                skip_mmd=skip_mmd,
                skip_timeline=skip_timeline,
            )
        except BaseException as exc:  # pragma: no cover
            self.log.warning("Error occurred during a_after_run: %s", exc)
        self.log.info("Cleanup completed")

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
            WaldiezBaseRunner._output_path = Path.cwd() / "waldiez_flow.py"
        output_file: Path = Path(WaldiezBaseRunner._output_path)
        return output_file, uploads_root_path

    @staticmethod
    async def a_process_event(
        event: Union["BaseEvent", "BaseMessage"],
        agents: list["ConversableAgent"],  # pylint: disable=unused-argument
        skip_send: bool = False,
    ) -> None:
        """Process an event or message asynchronously.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event or message to process.
        agents : list["ConversableAgent"]
            The known agents in the flow.
        skip_send : bool
            Skip sending the event.
        """
        if hasattr(event, "type"):  # pragma: no branch
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
            elif not skip_send:
                WaldiezBaseRunner._send(event)

    @staticmethod
    def process_event(
        event: Union["BaseEvent", "BaseMessage"],
        agents: list["ConversableAgent"],  # pylint: disable=unused-argument
        skip_send: bool = False,
    ) -> None:
        """Process an event or message synchronously.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event or message to process.
        agents : list["ConversableAgent"]
            The known agents in the flow.
        skip_send : bool
            Skip sending the event.
        """
        if hasattr(event, "type"):  # pragma: no branch
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
            elif not skip_send:
                WaldiezBaseRunner._send(event)

    def before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
    ) -> Path:
        """Run the before_run method synchronously.

        Parameters
        ----------
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.

        Returns
        -------
        Path
            The path to the temporary directory created before running the flow.
        """
        return self._before_run(
            output_file=output_file,
            uploads_root=uploads_root,
        )

    async def a_before_run(
        self,
        output_file: Path,
        uploads_root: Path | None,
    ) -> Path:
        """Run the _a_before_run method asynchronously.

        Parameters
        ----------
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.

        Returns
        -------
        Path
            The path to the temporary directory created before running the flow.
        """
        return await self._a_before_run(
            output_file=output_file,
            uploads_root=uploads_root,
        )

    def prepare(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
    ) -> tuple[Path, Path, Path | None]:
        """Prepare the paths and environment for running the flow.

        Parameters
        ----------
        output_path : str | Path | None
            The output path for the flow, by default None.
        uploads_root : str | Path | None
            The root path for uploads, by default None.

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
        )
        self.install_requirements()
        return temp_dir, output_file, uploads_root_path

    # noinspection PyProtocol
    # pylint: disable=too-many-locals,unused-argument
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

        Raises
        ------
        RuntimeError
            If the runner is already running, the workflow is not async,
            or an error occurs during the run.
        StopRunningException
            If the run is stopped by the user.
        """
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
                    skip_mmd,
                )
        temp_dir, output_file, uploads_root_path = self.prepare(
            output_path=output_path,
            uploads_root=uploads_root,
        )
        WaldiezBaseRunner._running = True
        results: list[dict[str, Any]] = []
        old_env_vars = set_env_vars(self._waldiez.get_flow_env_vars())
        try:
            with chdir(to=temp_dir):
                sys.path.insert(0, str(temp_dir))
                results = self._run(
                    temp_dir=temp_dir,
                    output_file=output_file,
                    uploads_root=uploads_root_path,
                    skip_mmd=skip_mmd,
                    skip_timeline=skip_timeline,
                )
        except (SystemExit, StopRunningException, KeyboardInterrupt) as exc:
            raise StopRunningException(StopRunningException.reason) from exc
        except BaseException as exc:  # pylint: disable=broad-exception-caught
            self.log.error("Error occurred while running workflow: %s", exc)
            results = [{"error": str(exc)}]
        finally:
            WaldiezBaseRunner._running = False
            reset_env_vars(old_env_vars)
            self.after_run(
                results=results,
                output_file=output_file,
                uploads_root=uploads_root_path,
                temp_dir=temp_dir,
                skip_mmd=skip_mmd,
                skip_timeline=skip_timeline,
            )
        self._print("<Waldiez> - Done running the flow.")
        if sys.path[0] == str(temp_dir):
            sys.path.pop(0)
        return results

    async def a_prepare(
        self,
        output_path: str | Path | None,
        uploads_root: str | Path | None,
    ) -> tuple[Path, Path, Path | None]:
        """Prepare the paths for the async run.

        Parameters
        ----------
        output_path : str | Path | None
            The output path, by default None.
        uploads_root : str | Path | None
            The uploads root path, by default None.

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
        )
        await self.a_install_requirements()
        return temp_dir, output_file, uploads_root_path

    # noinspection DuplicatedCode
    # noinspection PyProtocol
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

        Raises
        ------
        RuntimeError
            If the runner is already running, the workflow is not async
            or an error occurs during the run.
        StopRunningException
            If the run is stopped by the user.
        """
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
        )
        WaldiezBaseRunner._running = True
        results: list[dict[str, Any]] = []
        old_env_vars = set_env_vars(self._waldiez.get_flow_env_vars())
        try:
            async with a_chdir(to=temp_dir):
                sys.path.insert(0, str(temp_dir))
                results = await self._a_run(
                    temp_dir=temp_dir,
                    output_file=output_file,
                    uploads_root=uploads_root_path,
                    skip_mmd=skip_mmd,
                    skip_timeline=skip_timeline,
                )
        except (SystemExit, StopRunningException, KeyboardInterrupt) as exc:
            raise StopRunningException(StopRunningException.reason) from exc
        except BaseException as exc:  # pylint: disable=broad-exception-caught
            results = [{"error": str(exc)}]
        finally:
            WaldiezBaseRunner._running = False
            reset_env_vars(old_env_vars)
            await self._a_after_run(
                results=results,
                output_file=output_file,
                uploads_root=uploads_root_path,
                waldiez_file=WaldiezBaseRunner._waldiez_file,
                temp_dir=temp_dir,
                skip_mmd=skip_mmd,
                skip_timeline=skip_timeline,
            )
        if sys.path[0] == str(temp_dir):
            sys.path.pop(0)
        return results

    def after_run(
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
            The results of the flow run.
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
        """
        self._after_run(
            results=results,
            output_file=output_file,
            waldiez_file=WaldiezBaseRunner._waldiez_file,
            uploads_root=uploads_root,
            temp_dir=temp_dir,
            skip_mmd=skip_mmd,
            skip_timeline=skip_timeline,
        )

    async def a_after_run(
        self,
        results: list[dict[str, Any]],
        output_file: Path,
        uploads_root: Path | None,
        temp_dir: Path,
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> None:
        """Asynchronously perform actions after running the flow.

        Parameters
        ----------
        results : list[dict[str, Any]]
            The results of the flow run.
        output_file : Path
            The path to the output file.
        uploads_root : Path | None
            The root path for uploads, if any.
        temp_dir : Path
            The path to the temporary directory used during the run.
        skip_mmd : bool
            Whether to skip generating the mermaid diagram.
        skip_timeline : bool

        """
        await self._a_after_run(
            results=results,
            output_file=output_file,
            uploads_root=uploads_root,
            temp_dir=temp_dir,
            skip_mmd=skip_mmd,
            skip_timeline=skip_timeline,
            waldiez_file=WaldiezBaseRunner._waldiez_file,
        )

    @property
    def waldiez(self) -> Waldiez:
        """Get the Waldiez instance."""
        return self._waldiez

    @property
    def waldiez_file(self) -> Path:
        """Get the path to the waldiez file."""
        return self._waldiez_file

    @property
    def is_async(self) -> bool:
        """Check if the workflow is async."""
        return self._waldiez.is_async

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
    def dot_env_path(self) -> str | Path | None:
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
        )

    def stop(self) -> None:
        """Stop the workflow execution."""
        self.log.info("Stop requested - setting stop flag")
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
        exc_type: Type[BaseException],
        exc_value: BaseException,
        traceback: TracebackType,
    ) -> None:
        """Exit the context manager."""
        if self.is_running():
            self._stop_requested.set()

    async def __aexit__(
        self,
        exc_type: Type[BaseException],
        exc_value: BaseException,
        traceback: TracebackType,
    ) -> None:
        """Exit the context manager asynchronously."""
        if self.is_running():
            self._stop_requested.set()
