# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: skip-file
# isort: skip_file
# flake8: noqa: E501,E402
"""Waldiez-runner extra typer commands for CLI."""

from typing import Any, Callable

import typer
from typer.models import CommandInfo

HAVE_RUNNER = False
runner_app: Callable[..., Any] | None = None

try:
    from waldiez_runner.cli import run  # type: ignore[unused-ignore, import-not-found, import-untyped]

    runner_app = run

    HAVE_RUNNER = True
except BaseException:
    pass


def add_runner_cli(app: typer.Typer) -> None:
    """Add runner command to the app if available.

    Parameters
    ----------
    app : typer.Typer
        The Typer app to add the runner command to.
    """
    if HAVE_RUNNER:
        app.registered_commands.append(
            CommandInfo(name="serve", callback=runner_app)
        )
