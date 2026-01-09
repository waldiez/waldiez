# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: skip-file
# isort: skip_file
"""Extra typer commands for CLI."""

import typer

from .jupyter import add_jupyter_cli
from .runner import add_runner_cli
from .studio import add_studio_cli


def add_cli_extras(app: typer.Typer) -> None:
    """Add extra CLI commands to the app.

    Parameters
    ----------
    app : typer.Typer
        The Typer app to add the extra commands to.

    Returns
    -------
    typer.Typer
        The app with the extra commands added
    """
    add_jupyter_cli(app)
    add_runner_cli(app)
    add_studio_cli(app)


__all__ = ["add_cli_extras"]
