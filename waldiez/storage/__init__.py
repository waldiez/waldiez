# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Storage module for managing workspace directories and checkpoints."""

import typer
from typer.models import CommandInfo

from .checkpoint import Checkpoint, CheckpointInfo
from .cli import handle_checkpoints
from .filesystem_storage import FilesystemStorage
from .protocol import Storage
from .storage_manager import StorageManager
from .utils import get_root_dir, symlink


def add_checkpoints_app(app: typer.Typer) -> None:
    """Add checkpoints management commands to the CLI.

    Parameters
    ----------
    app : typer.Typer
        The Typer application instance.
    """
    app.registered_commands.append(
        CommandInfo(
            name="checkpoints",
            help="Handle waldiez checkpoints.",
            callback=handle_checkpoints,
            no_args_is_help=True,
        )
    )


__all__ = [
    "Storage",
    "StorageManager",
    "FilesystemStorage",
    "Checkpoint",
    "CheckpointInfo",
    "symlink",
    "get_root_dir",
    "handle_checkpoints",
    "add_checkpoints_app",
]
