# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""CLI management for my_package."""
from typing import Annotated

import typer

from ._version import __version__
from .main import greet

app = typer.Typer(
    name="my-package",
    help="A template for creating Python packages.",
    context_settings={
        "help_option_names": ["-h", "--help"],
        "allow_extra_args": True,
        "ignore_unknown_options": True,
    },
    add_completion=False,
    no_args_is_help=True,
    invoke_without_command=True,
    add_help_option=True,
    pretty_exceptions_enable=False,
    epilog=("Use 'my-package <command> --help' for more information."),
)


# pylint: disable=missing-function-docstring,missing-param-doc,missing-raises-doc  # noqa: E501
@app.callback()
def show_version(
    version: bool = typer.Option(
        False,
        "--version",
        "-v",
        help="Show the version and exit.",
    ),
) -> None:
    """Show the version of the Waldiez package and exit."""
    if version:
        typer.echo(f"my-package {__version__}")
        raise typer.Exit()


@app.command()
def run(
    prefix: str = typer.Option(
        "Hello",
        "--prefix",
        "-p",
        help="The prefix to use in the greeting.",
    ),
    name: Annotated[
        str,
        typer.Option(
            ...,
            "--name",
            "-n",
            help="The name to greet.",
        ),
    ] = "World",
) -> None:
    """Run the application."""
    typer.echo(f"{prefix}, {name}!")
    try:
        greet(name)
    except NotImplementedError as error:
        typer.echo(error)
        raise typer.Exit(code=0)


if __name__ == "__main__":
    app()
