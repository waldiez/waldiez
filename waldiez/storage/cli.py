# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-function-docstring, missing-param-doc
# pylint: disable=missing-raises-doc,too-complex,too-many-branches

"""CLI interface for Waldiez checkpoints."""

from datetime import datetime, timezone
from pathlib import Path

import typer
from rich import print as pretty_print
from typing_extensions import Annotated

from .storage_manager import StorageManager
from .utils import get_root_dir

app = typer.Typer(
    name="waldiez-checkpoints",
    help="Waldiez checkpoints management",
    add_completion=False,
    no_args_is_help=True,
    pretty_exceptions_enable=False,
    context_settings={
        "help_option_names": ["-h", "--help"],
        "allow_extra_args": True,
        "ignore_unknown_options": True,
    },
)

DEFAULT_WORKSPACE = get_root_dir()


@app.command(name="checkpoints", no_args_is_help=True)
def handle_checkpoints(  # noqa: C901
    workspace: Annotated[
        Path,
        typer.Option(
            "--workspace",
            "-w",
            help="The workspace to use.",
            dir_okay=True,
            resolve_path=True,
            exists=True,
            readable=True,
        ),
    ] = DEFAULT_WORKSPACE,
    list_checkpoints: Annotated[
        bool, typer.Option("--list", "-l", help="List checkpoints.")
    ] = False,
    list_sessions: Annotated[
        bool, typer.Option("--sessions", "-s", help="List sessions.")
    ] = False,
    session: Annotated[
        str | None,
        typer.Option(
            "--session", help="Use this session (if deleting or listing)."
        ),
    ] = None,
    delete_checkpoint: Annotated[
        bool, typer.Option("--delete", "-d", help="Delete a checkpoint.")
    ] = False,
    delete_session: Annotated[
        bool,
        typer.Option(
            "--delete-session",
            "-ds",
            help="Delete a session (and all its checkpoints).",
        ),
    ] = False,
    checkpoint: Annotated[
        str | None,
        typer.Option(
            "--checkpoint",
            "-c",
            help=(
                "The checkpoint (by its timestamp) to delete. "
                "NOTE: format: '%Y%m%d_%H%M%S_%f'"
                " (as listed in the checkpoint's path)"
            ),
        ),
    ] = None,
    cleanup: Annotated[
        bool,
        typer.Option(
            "--clean",
            help=(
                "Cleanup a session's checkpoints. "
                "NOTE: if no session is specified, "
                "all sessions will be used."
            ),
        ),
    ] = False,
    keep: Annotated[
        int | None,
        typer.Option("--keep", help="Keep the latest 'n' checkpoints."),
    ] = None,
) -> None:
    """Handle waldiez checkpoints."""
    manager = StorageManager(workspace_dir=workspace)
    if list_checkpoints:
        checkpoints = manager.checkpoints(session_name=session)
        pretty_print([checkpoint.to_dict() for checkpoint in checkpoints])
        raise typer.Exit(0)
    if list_sessions:
        sessions = manager.sessions()
        pretty_print(sessions)
        raise typer.Exit(0)
    if delete_session:
        if not session:
            typer.echo("Please provide the session.", err=True)
            raise typer.Exit(1)
        manager.delete_session(session)
    if delete_checkpoint:
        if not session:
            typer.echo("Please provide the session.", err=True)
            raise typer.Exit(1)
        if not checkpoint:
            typer.echo(
                "Please provide the checkpoint's timestamp to delete.", err=True
            )
            raise typer.Exit(1)
        checkpoint_timestamp = datetime.strptime(
            checkpoint, "%Y%m%d_%H%M%S_%f"
        ).replace(tzinfo=timezone.utc)
        manager.delete(session_name=session, timestamp=checkpoint_timestamp)
    if cleanup:
        if not isinstance(keep, int):
            keep_count = 0
        else:
            keep_count = max(keep, 0)
        if not session:
            sessions = manager.sessions()
        else:
            sessions = [session]
        for _session in sessions:
            manager.cleanup(session_name=_session, keep_count=keep_count)


if __name__ == "__main__":
    app()
