# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: skip-file
# isort: skip_file
# pyright: reportMissingImports=false,reportUnusedImport=false
# pyright: reportCallInDefaultInitializer=false,reportPrivateImportUsage=false
# pyright: reportUnknownVariableType=false
# flake8: noqa: E501
"""Waldiez-jupyter extra typer commands for CLI."""

from typing import Callable

import typer
from typer.models import CommandInfo
import subprocess  # nosemgrep # nosec

_have_jupyter = False

# noinspection PyBroadException
# pylint: disable=broad-exception-caught
try:
    import waldiez_jupyter  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]  # noqa

    _have_jupyter = True
except BaseException:
    pass


def add_jupyter_cli(app: typer.Typer) -> None:
    """Add Jupyter extra command to the app if available.

    Parameters
    ----------
    app : typer.Typer
        The Typer app to add the extra command to.

    Returns
    -------
    typer.Typer
        The app with the extra command added
    """
    if _have_jupyter:
        jupyter_app = get_jupyter_app()
        app.registered_commands.append(
            CommandInfo(name="lab", callback=jupyter_app)
        )


def get_jupyter_app() -> Callable[..., None]:
    """Get the Jupyter Typer app.

    Returns
    -------
    typer.Typer
        The Jupyter Typer app
    """
    jupyter_app = typer.Typer(
        add_completion=False,
        no_args_is_help=False,
        pretty_exceptions_enable=False,
    )

    @jupyter_app.callback(
        help="Start JupyterLab.",
        context_settings={
            "help_option_names": ["-h", "--help"],
            "allow_extra_args": True,
            "ignore_unknown_options": True,
        },
        no_args_is_help=False,
        invoke_without_command=True,
        add_help_option=True,
    )
    def start(
        port: int = typer.Option(
            8888,
            "--port",
            help="Port to run JupyterLab on.",
        ),
        host: str = typer.Option(
            "*",
            "--host",
            help="Host to run JupyterLab on.",
        ),
        browser: bool = typer.Option(
            False,
            help="Open the browser after starting JupyterLab.",
        ),
        password: str = typer.Option(
            None,
            "--password",
            help="Password to access JupyterLab.",
        ),
    ) -> None:
        """Start JupyterLab."""
        command = [
            "jupyter",
            "lab",
            f"--port={port}",
            f"--ip={host}",
            "--ServerApp.terminado_settings=\"shell_command=['/bin/bash']\"",
            "--ServerApp.allow_origin='*'",
            "--ServerApp.disable_check_xsrf=True",
        ]
        if not browser:
            command.append("--no-browser")
        if password:
            from jupyter_server.auth import passwd  # type: ignore[unused-ignore, import-not-found, attr-defined]  # noqa

            hashed_password = passwd(password)  # type: ignore[unused-ignore, no-untyped-call]  # noqa
            command.append(f"--ServerApp.password={hashed_password}")
        subprocess.run(command)

    return start
