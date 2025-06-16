# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Run a waldiez flow.

The flow is first converted to an autogen flow with agents, chats, and tools.
We then chown to temporary directory, call the flow's `main()` and
return the results. Before running the flow, any additional environment
variables specified in the waldiez file are set.
"""

from pathlib import Path
from typing import TYPE_CHECKING, Union

from waldiez.models.waldiez import Waldiez

from .base_runner import WaldiezBaseRunner

if TYPE_CHECKING:
    from autogen import ChatResult  # type: ignore[import-untyped]


class WaldiezSubprocessRunner(WaldiezBaseRunner):
    """Waldiez runner class."""

    def __init__(
        self,
        waldiez: Waldiez,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = True,
        isolated: bool = True,
    ) -> None:
        """Initialize the Waldiez manager."""
        super().__init__(
            waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            isolated=isolated,
        )

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
    ]:
        """Run the Waldiez workflow."""
        return []

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
        """Run the Waldiez workflow asynchronously."""
        return []

    def _start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
        skip_mmd: bool,
    ) -> None:
        """Start the Waldiez workflow."""
        # This method should be implemented to start the workflow
        # For now, it is a placeholder

    async def _a_start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        structured_io: bool,
        skip_mmd: bool,
    ) -> None:
        """Start the Waldiez workflow asynchronously."""
        # This method should be implemented to start the workflow asynchronously
        # For now, it is a placeholder

    def _stop(self) -> None:
        """Stop the Waldiez workflow."""

    async def _a_stop(self) -> None:
        """Stop the Waldiez workflow asynchronously."""

    # def _before_run(
    #     self,
    #     temp_dir: Path,
    #     file_name: str,
    #     module_name: str,
    # ) -> tuple[ModuleType, dict[str, str]]:
    #     self._exporter.export(Path(file_name))
    #     # unique_names = self._exporter.context.get_unique_names()
    #     spec = importlib.util.spec_from_file_location(
    #         module_name, temp_dir / file_name
    #     )
    #     if not spec or not spec.loader:
    #         raise ImportError("Could not import the flow")
    #     sys.path.insert(0, str(temp_dir))
    #     old_vars = set_env_vars(self.waldiez.get_flow_env_vars())
    #     module = importlib.util.module_from_spec(spec)
    #     spec.loader.exec_module(module)
    #     print("<Waldiez> - Starting workflow...")
    #     print(self.waldiez.info.model_dump_json())
    #     return module, old_vars

    # def _run(
    #     self,
    #     output_path: str | Path | None,
    #     uploads_root: str | Path | None,
    #     structured_io: bool = False,
    #     skip_mmd: bool = False,
    # ) -> None:
    #     """Run the Waldiez workflow.

    #     Parameters
    #     ----------
    #     output_path : str | Path | None
    #         The output path.
    #     uploads_root : Optional[Union[str, Path]]
    #         The runtime uploads root.
    #     structured_io : bool
    #         Whether to use structured IO instead of the default 'input/print'.
    #     skip_mmd : bool
    #         Whether to skip the Mermaid diagram generation.
    #     """
    #     temp_dir = Path(tempfile.mkdtemp())
    #     file_name = before_run(output_path, uploads_root)
    #     module_name = file_name.replace(".py", "")
    #     if not self._called_install_requirements:
    #         self.install_requirements()
    #     refresh_environment()
    #     print(
    #         "Requirements installed.\n"
    #         "NOTE: If new packages were added and you are using Jupyter, "
    #         "you might need to restart the kernel."
    #     )
    #     with chdir(to=temp_dir):
    #         module, old_vars = self._before_run(
    #             temp_dir=temp_dir,
    #             file_name=file_name,
    #             module_name=module_name,
    #         )
    #         if structured_io:
    #             stream = StructuredIOStream(
    #                 timeout=120,  # 2 minutes
    #                 uploads_root=uploads_root,
    #             )
    #             with StructuredIOStream.set_default(stream):
    #                 module.main()
    #         else:
    #             module.main()
    #         print("<Waldiez> - Workflow finished")
    #         sys.path.pop(0)
    #         reset_env_vars(old_vars)
    #     after_run(
    #         temp_dir=temp_dir,
    #         output_path=output_path,
    #         flow_name=self.waldiez.name,
    #         skip_mmd=skip_mmd,
    #     )
    #     gc.collect()
    #     refresh_environment()

    # async def _a_run(
    #     self,
    #     output_path: str | Path | None,
    #     uploads_root: str | Path | None,
    #     structured_io: bool = False,
    #     skip_mmd: bool = False,
    # ) -> None:
    #     """Run the Waldiez workflow asynchronously."""
    #     temp_dir = Path(tempfile.mkdtemp())
    #     file_name = before_run(output_path, uploads_root)
    #     module_name = file_name.replace(".py", "")
    #     if not self._called_install_requirements:
    #         await self.a_install_requirements()
    #     refresh_environment()
    #     print(
    #         "Requirements installed.\n"
    #         "NOTE: If new packages were added and you are using Jupyter, "
    #         "you might need to restart the kernel."
    #     )
    #     async with a_chdir(to=temp_dir):
    #         module, old_vars = self._before_run(
    #             temp_dir=temp_dir,
    #             file_name=file_name,
    #             module_name=module_name,
    #         )
    #         if structured_io:
    #             stream = StructuredIOStream(
    #                 timeout=120,  # 2 minutes
    #                 uploads_root=uploads_root,
    #             )
    #             with StructuredIOStream.set_default(stream):
    #                 await module.main()
    #         else:
    #             await module.main()
    #         sys.path.pop(0)
    #         reset_env_vars(old_vars)
    #     after_run(
    #         temp_dir=temp_dir,
    #         output_path=output_path,
    #         flow_name=self.waldiez.name,
    #         skip_mmd=skip_mmd,
    #     )
    #     gc.collect()
    #     refresh_environment()

    # def run(
    #     self,
    #     output_path: str | Path | None = None,
    #     uploads_root: str | Path | None = None,
    #     structured_io: bool = False,
    #     skip_mmd: bool = False,
    # ) -> None:
    #     """Run the Waldiez workflow.

    #     Parameters
    #     ----------
    #     output_path : str | Path | None, optional
    #         The output path, by default None.
    #     uploads_root : str | Path | None, optional
    #         The uploads root, to get user-uploaded files, by default None.
    #     structured_io : bool, optional
    #         Whether to use structured IO instead of the default 'input/print',
    #         by default False.
    #     skip_mmd : bool, optional
    #         Whether to skip the Mermaid diagram generation, by default False.

    #     Raises
    #     ------
    #     RuntimeError
    #         If the workflow is already running.
    #     """
    #     if self.waldiez.is_async:
    #         with start_blocking_portal(backend="asyncio") as portal:
    #             portal.call(
    #                 self._a_run,
    #                 output_path,
    #                 uploads_root,
    #                 structured_io,
    #                 skip_mmd,
    #             )
    #             return
    #     if self._running is True:
    #         raise RuntimeError("Workflow already running")
    #     self._running = True
    #     output_path = output_path or self._output_path
    #     try:
    #         self._run(
    #             output_path,
    #             uploads_root=uploads_root,
    #             structured_io=structured_io,
    #             skip_mmd=skip_mmd,
    #         )
    #     finally:
    #         self._running = False

    # async def a_run(
    #     self,
    #     output_path: str | Path | None = None,
    #     uploads_root: str | Path | None = None,
    #     structured_io: bool = False,
    #     skip_mmd: bool = False,
    # ) -> None:
    #     """Run the Waldiez workflow asynchronously.

    #     Parameters
    #     ----------
    #     output_path : str | Path | None, optional
    #         The output path, by default None.
    #     uploads_root : str | Path | None, optional
    #         The uploads root, to get user-uploaded files, by default None.
    #     structured_io : bool, optional
    #         Whether to use structured IO instead of the default 'input/print',
    #         by default False.
    #     skip_mmd : bool, optional
    #         Whether to skip the Mermaid diagram generation, by default False.

    #     Raises
    #     ------
    #     RuntimeError
    #         If the workflow is already running.
    #     """
    #     if self._running is True:
    #         raise RuntimeError("Workflow already running")
    #     self._running = True
    #     output_path = output_path or self._output_path
    #     try:
    #         await self._a_run(
    #             output_path,
    #             uploads_root=uploads_root,
    #             structured_io=structured_io,
    #             skip_mmd=skip_mmd,
    #         )
    #     finally:
    #         self._running = False


# after_run(
#     temp_dir=temp_dir,
#     output_path=output_path,
#     flow_name=self.waldiez.name,
#     skip_mmd=skip_mmd,
# )
# gc.collect()
# refresh_environment()
