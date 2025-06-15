# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Run a waldiez flow.

The flow is first converted to an autogen flow with agents, chats, and tools.
We then chown to temporary directory, call the flow's `main()` and
return the results. Before running the flow, any additional environment
variables specified in the waldiez file are set.
"""

# pylint: disable=import-outside-toplevel,reimported

import gc
import importlib.util
import sys
import tempfile
from pathlib import Path
from types import ModuleType, TracebackType
from typing import (
    TYPE_CHECKING,
    Optional,
    Set,
    Type,
    Union,
)

from .exporter import WaldiezExporter
from .io import StructuredIOStream
from .models.waldiez import Waldiez
from .running import (
    a_chdir,
    a_install_requirements,
    after_run,
    before_run,
    chdir,
    install_requirements,
    refresh_environment,
    reset_env_vars,
    set_env_vars,
)

if TYPE_CHECKING:
    from autogen import ChatResult  # type: ignore


class WaldiezRunner:
    """Waldiez runner class."""

    def __init__(
        self, waldiez: Waldiez, file_path: Optional[Union[str, Path]] = None
    ) -> None:
        """Initialize the Waldiez manager."""
        self._waldiez = waldiez
        self._running = False
        self._file_path = file_path
        self._exporter = WaldiezExporter(waldiez)
        self._called_install_requirements = False

    @classmethod
    def load(
        cls,
        waldiez_file: Union[str, Path],
        name: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[list[str]] = None,
        requirements: Optional[list[str]] = None,
    ) -> "WaldiezRunner":
        """Create a WaldiezRunner instance from a file.

        Parameters
        ----------
        waldiez_file : Union[str, Path]
            The file path.
        name : Optional[str], optional
            The name of the Waldiez, by default None.
        description : Optional[str], optional
            The description of the Waldiez, by default None.
        tags : Optional[list[str]], optional
            The tags of the Waldiez, by default None.
        requirements : Optional[list[str]], optional
            The requirements of the Waldiez, by default None.

        Returns
        -------
        WaldiezRunner
            The Waldiez runner instance.

        Raises
        ------
        FileNotFoundError
            If the file is not found.
        RuntimeError
            If the file is not a valid Waldiez file.
        """
        waldiez = Waldiez.load(
            waldiez_file,
            name=name,
            description=description,
            tags=tags,
            requirements=requirements,
        )
        return cls(waldiez, file_path=waldiez_file)

    def __enter__(
        self,
    ) -> "WaldiezRunner":
        """Enter the context manager."""
        return self

    async def __aenter__(
        self,
    ) -> "WaldiezRunner":
        """Enter the context manager asynchronously."""
        return self

    def __exit__(
        self,
        exc_type: Type[BaseException],
        exc_value: BaseException,
        traceback: TracebackType,
    ) -> None:
        """Exit the context manager."""
        if self._running:
            self._running = False

    async def __aexit__(
        self,
        exc_type: Type[BaseException],
        exc_value: BaseException,
        traceback: TracebackType,
    ) -> None:
        """Exit the context manager asynchronously."""
        if self._running:
            self._running = False

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
        return self._running

    def gather_requirements(self) -> Set[str]:
        """Gather extra requirements to install before running the flow.

        Returns
        -------
        Set[str]
            The extra requirements.
        """
        extra_requirements = {
            req for req in self.waldiez.requirements if req not in sys.modules
        }
        return extra_requirements

    def install_requirements(self) -> None:
        """Install the requirements for the flow."""
        self._called_install_requirements = True
        extra_requirements = self.gather_requirements()
        if extra_requirements:
            install_requirements(extra_requirements)

    async def a_install_requirements(self) -> None:
        """Install the requirements for the flow asynchronously."""
        self._called_install_requirements = True
        extra_requirements = self.gather_requirements()
        if extra_requirements:
            await a_install_requirements(extra_requirements)

    def _before_run(
        self,
        temp_dir: Path,
        file_name: str,
        module_name: str,
    ) -> tuple[ModuleType, dict[str, str]]:
        self._exporter.export(Path(file_name))
        # unique_names = self._exporter.context.get_unique_names()
        spec = importlib.util.spec_from_file_location(
            module_name, temp_dir / file_name
        )
        if not spec or not spec.loader:
            raise ImportError("Could not import the flow")
        sys.path.insert(0, str(temp_dir))
        old_vars = set_env_vars(self.waldiez.get_flow_env_vars())
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        print("<Waldiez> - Starting workflow...")
        print(self.waldiez.info.model_dump_json())
        return module, old_vars

    def _run(
        self,
        output_path: Optional[Union[str, Path]],
        uploads_root: Optional[Union[str, Path]],
        use_structured_io: bool = False,
        skip_mmd: bool = False,
    ) -> Union["ChatResult", list["ChatResult"], dict[int, "ChatResult"]]:
        """Run the Waldiez workflow.

        Parameters
        ----------
        output_path : Optional[Union[str, Path]]
            The output path.
        uploads_root : Optional[Union[str, Path]]
            The runtime uploads root.
        use_structured_io : bool
            Whether to use structured IO instead of the default 'input/print'.
        skip_mmd : bool
            Whether to skip the Mermaid diagram generation.

        Returns
        -------
        Union[ChatResult, list[ChatResult]]
            The result(s) of the chat(s).
        """
        temp_dir = Path(tempfile.mkdtemp())
        file_name = before_run(output_path, uploads_root)
        module_name = file_name.replace(".py", "")
        if not self._called_install_requirements:
            self.install_requirements()
        refresh_environment()
        print(
            "Requirements installed.\n"
            "NOTE: If new packages were added and you are using Jupyter, "
            "you might need to restart the kernel."
        )
        results: Union[
            "ChatResult", list["ChatResult"], dict[int, "ChatResult"]
        ] = []
        with chdir(to=temp_dir):
            module, old_vars = self._before_run(
                temp_dir=temp_dir,
                file_name=file_name,
                module_name=module_name,
            )
            if use_structured_io:
                stream = StructuredIOStream(
                    timeout=120,  # 2 minutes
                    uploads_root=uploads_root,
                )
                with StructuredIOStream.set_default(stream):
                    results = module.main()
            else:
                results = module.main()
            print("<Waldiez> - Workflow finished")
            sys.path.pop(0)
            reset_env_vars(old_vars)
        after_run(
            temp_dir=temp_dir,
            output_path=output_path,
            flow_name=self.waldiez.name,
            skip_mmd=skip_mmd,
        )
        gc.collect()
        refresh_environment()
        return results

    async def _a_run(
        self,
        output_path: Optional[Union[str, Path]],
        uploads_root: Optional[Union[str, Path]],
        use_structured_io: bool = False,
        skip_mmd: bool = False,
    ) -> Union["ChatResult", list["ChatResult"], dict[int, "ChatResult"]]:
        """Run the Waldiez workflow asynchronously."""
        temp_dir = Path(tempfile.mkdtemp())
        file_name = before_run(output_path, uploads_root)
        module_name = file_name.replace(".py", "")
        if not self._called_install_requirements:
            await self.a_install_requirements()
        refresh_environment()
        print(
            "Requirements installed.\n"
            "NOTE: If new packages were added and you are using Jupyter, "
            "you might need to restart the kernel."
        )
        results: Union[
            "ChatResult", list["ChatResult"], dict[int, "ChatResult"]
        ] = []
        async with a_chdir(to=temp_dir):
            module, old_vars = self._before_run(
                temp_dir=temp_dir,
                file_name=file_name,
                module_name=module_name,
            )
            if use_structured_io:
                stream = StructuredIOStream(
                    timeout=120,  # 2 minutes
                    uploads_root=uploads_root,
                )
                with StructuredIOStream.set_default(stream):
                    results = await module.main()
            else:
                results = await module.main()
            sys.path.pop(0)
            reset_env_vars(old_vars)
        after_run(
            temp_dir=temp_dir,
            output_path=output_path,
            flow_name=self.waldiez.name,
            skip_mmd=skip_mmd,
        )
        gc.collect()
        refresh_environment()
        return results

    def run(
        self,
        output_path: Optional[Union[str, Path]] = None,
        uploads_root: Optional[Union[str, Path]] = None,
        use_structured_io: bool = False,
        skip_mmd: bool = False,
    ) -> Union["ChatResult", list["ChatResult"], dict[int, "ChatResult"]]:
        """Run the Waldiez workflow.

        Parameters
        ----------
        output_path : Optional[Union[str, Path]], optional
            The output path, by default None.
        uploads_root : Optional[Union[str, Path]], optional
            The uploads root, to get user-uploaded files, by default None.
        use_structured_io : bool, optional
            Whether to use structured IO instead of the default 'input/print',
            by default False.
        skip_mmd : bool, optional
            Whether to skip the Mermaid diagram generation, by default False.

        Returns
        -------
        Union["ChatResult", list["ChatResult"], dict[int, "ChatResult"]]
            The result(s) of the chat(s).

        Raises
        ------
        RuntimeError
            If the workflow is already running.
        """
        if self.waldiez.is_async:
            # pylint: disable=import-outside-toplevel
            from anyio.from_thread import start_blocking_portal

            with start_blocking_portal(backend="asyncio") as portal:
                return portal.call(
                    self._a_run,
                    output_path,
                    uploads_root,
                    use_structured_io,
                    skip_mmd,
                )
        if self._running is True:
            raise RuntimeError("Workflow already running")
        self._running = True
        file_path = output_path or self._file_path
        try:
            return self._run(
                file_path,
                uploads_root=uploads_root,
                use_structured_io=use_structured_io,
                skip_mmd=skip_mmd,
            )
        finally:
            self._running = False

    async def a_run(
        self,
        output_path: Optional[Union[str, Path]] = None,
        uploads_root: Optional[Union[str, Path]] = None,
        use_structured_io: bool = False,
        skip_mmd: bool = False,
    ) -> Union["ChatResult", list["ChatResult"], dict[int, "ChatResult"]]:
        """Run the Waldiez workflow asynchronously.

        Parameters
        ----------
        output_path : Optional[Union[str, Path]], optional
            The output path, by default None.
        uploads_root : Optional[Union[str, Path]], optional
            The uploads root, to get user-uploaded files, by default None.
        use_structured_io : bool, optional
            Whether to use structured IO instead of the default 'input/print',
            by default False.
        skip_mmd : bool, optional
            Whether to skip the Mermaid diagram generation, by default False.

        Returns
        -------
        Union[ChatResult, list[ChatResult]], dict[int, ChatResult]
            The result(s) of the chat(s).

        Raises
        ------
        RuntimeError
            If the workflow is already running.
        """
        if self._running is True:
            raise RuntimeError("Workflow already running")
        self._running = True
        file_path = output_path or self._file_path
        try:
            return await self._a_run(
                file_path,
                uploads_root=uploads_root,
                use_structured_io=use_structured_io,
                skip_mmd=skip_mmd,
            )
        finally:
            self._running = False
