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
        threaded: bool = False,
        skip_patch_io: bool = True,
    ) -> None:
        """Initialize the Waldiez manager."""
        super().__init__(
            waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            isolated=isolated,
            threaded=threaded,
            skip_patch_io=skip_patch_io,
        )

    def _run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
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
        skip_mmd: bool,
        skip_timeline: bool,
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
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> None:
        """Start the Waldiez workflow."""
        # This method should be implemented to start the workflow
        # For now, it is a placeholder

    async def _a_start(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
    ) -> None:
        """Start the Waldiez workflow asynchronously."""
        # This method should be implemented to start the workflow asynchronously
        # For now, it is a placeholder

    def _stop(self) -> None:
        """Stop the Waldiez workflow."""

    async def _a_stop(self) -> None:
        """Stop the Waldiez workflow asynchronously."""
