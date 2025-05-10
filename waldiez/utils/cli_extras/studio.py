# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: skip-file
# isort: skip_file
# flake8: noqa: E501,E402
"""Waldiez-studio extra typer commands for CLI."""

from typing import Any, Callable

import typer
from typer.models import CommandInfo

HAVE_STUDIO = False
studio_app: Callable[..., Any] | None = None

# noinspection PyBroadException
# pylint: disable=broad-exception-caught
try:
    from waldiez_studio.cli import run  # type: ignore[unused-ignore, import-not-found, import-untyped]

    studio_app = run

    HAVE_STUDIO = True
except BaseException:
    pass


def add_studio_cli(app: typer.Typer) -> None:
    """Add studio command to the app if available.

    Parameters
    ----------
    app : typer.Typer
        The Typer app to add the studio command to.
    """
    if HAVE_STUDIO:
        app.registered_commands.append(
            CommandInfo(name="studio", callback=studio_app)
        )
