# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=missing-function-docstring,missing-param-doc,missing-raises-doc
"""Command line interface to convert or run a waldiez file."""

import json
import os
from pathlib import Path
from typing import TYPE_CHECKING, Optional

import anyio
import typer
from dotenv import load_dotenv
from typing_extensions import Annotated

# pylint: disable=import-error,line-too-long
# pyright: reportMissingImports=false
try:  # pragma: no cover
    from ._version import (  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]  # noqa
        __version__,
    )
except ImportError:  # pragma: no cover
    import warnings

    warnings.warn(
        "Importing __version__ failed. Using 'dev' as version.", stacklevel=2
    )
    __version__ = "dev"


from .exporter import WaldiezExporter
from .logger import get_logger
from .models import Waldiez
from .runner import WaldiezRunner
from .utils import add_cli_extras

if TYPE_CHECKING:
    from autogen import ChatResult  # type: ignore[import-untyped]


load_dotenv()
LOG = get_logger()

app = typer.Typer(
    name="waldiez",
    help="Handle Waldiez flows.",
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
    epilog="Use `waldiez [COMMAND] --help` for command-specific help.",
)


@app.callback()
def show_version(
    version: bool = typer.Option(
        False,
        "--version",
        "-v",
        help="Show the version of the Waldiez package.",
    ),
) -> None:
    """Show the version of the Waldiez package and exit."""
    if version:
        typer.echo(f"waldiez version: {__version__}")
        raise typer.Exit()


@app.command()
def run(
    file: Annotated[
        Path,
        typer.Option(
            ...,
            help="Path to the Waldiez flow (*.waldiez) file.",
            exists=True,
            file_okay=True,
            dir_okay=False,
            readable=True,
            resolve_path=True,
        ),
    ],
    output: Optional[Path] = typer.Option(  # noqa: B008
        None,
        help=(
            "Path to the output (.py) file. "
            "The output's directory will contain "
            "the generated flow (.py) and any additional generated files."
        ),
        dir_okay=False,
        resolve_path=True,
    ),
    uploads_root: Optional[Path] = typer.Option(  # noqa: B008
        None,
        help=(
            "Path to the uploads root directory. "
            "The directory will contain "
            "any uploaded files."
        ),
        dir_okay=True,
        resolve_path=True,
    ),
    structured: bool = typer.Option(  # noqa: B008
        False,
        help=(
            "If set, running the flow will use structured io stream instead of the default 'input/print' "
        ),
    ),
    force: bool = typer.Option(  # noqa: B008
        False,
        help="Override the output file if it already exists.",
    ),
) -> None:
    """Run a Waldiez flow."""
    os.environ["AUTOGEN_USE_DOCKER"] = "0"
    os.environ["NEP50_DISABLE_WARNING"] = "1"
    output_path = _get_output_path(output, force)
    with file.open("r", encoding="utf-8") as _file:
        try:
            data = json.load(_file)
        except json.decoder.JSONDecodeError as error:
            typer.echo("Invalid .waldiez file. Not a valid json?")
            raise typer.Exit(code=1) from error
    waldiez = Waldiez.from_dict(data)
    runner = WaldiezRunner(waldiez)
    if waldiez.is_async:
        results = anyio.run(runner.a_run, output_path, uploads_root, structured)
    else:
        results = runner.run(
            output_path=output_path,
            uploads_root=uploads_root,
            use_structured_io=structured,
        )
    if isinstance(results, list):
        LOG.info("Results:")
        for result in results:
            _log_result(result)
            sep = "-" * 80
            print("\n" + f"{sep}" + "\n")
    elif isinstance(results, dict):
        LOG.info("Results:")
        for key, result in results.items():
            LOG.info("Order: %s", key)
            _log_result(result)
            sep = "-" * 80
            print("\n" + f"{sep}" + "\n")
    else:
        _log_result(results)


@app.command()
def convert(
    file: Annotated[
        Path,
        typer.Option(
            ...,
            help="Path to the Waldiez flow (*.waldiez) file.",
            exists=True,
            file_okay=True,
            dir_okay=False,
            readable=True,
            resolve_path=True,
        ),
    ],
    output: Path | None = typer.Option(  # noqa: B008
        default=None,
        help=(
            "Path to the output file. "
            "The file extension determines the output format: "
            "`.py` for Python script, `.ipynb` for Jupyter notebook."
            " If not provided, the output will be saved in the same directory as the input file."
            " If the file already exists, it will not be overwritten unless --force is used."
        ),
        file_okay=True,
        dir_okay=False,
        resolve_path=True,
    ),
    force: bool = typer.Option(
        False,
        help="Override the output file if it already exists.",
    ),
    debug: bool = typer.Option(
        False,
        "--debug",
        "-d",
        help="Enable debug logging.",
        is_eager=True,
        rich_help_panel="Debug",
    ),
) -> None:
    """Convert a Waldiez flow to a Python script or a Jupyter notebook."""
    _get_output_path(output, force)
    with file.open("r", encoding="utf-8") as _file:
        try:
            data = json.load(_file)
        except json.decoder.JSONDecodeError as error:
            typer.echo("Invalid .waldiez file. Not a valid json?")
            raise typer.Exit(code=1) from error
    waldiez = Waldiez.from_dict(data)
    exporter = WaldiezExporter(waldiez)
    if debug:
        LOG.set_level("DEBUG")
    if output is None:
        output = Path(file).with_suffix(".py").resolve()
    exporter.export(output, force=force, debug=debug)
    generated = str(output).replace(os.getcwd(), ".")
    typer.echo(f"Generated: {generated}")


@app.command()
def check(
    file: Annotated[
        Path,
        typer.Option(
            ...,
            help="Path to the Waldiez flow (*.waldiez) file.",
            exists=True,
            file_okay=True,
            dir_okay=False,
            readable=True,
            resolve_path=True,
        ),
    ],
) -> None:
    """Validate a Waldiez flow."""
    with file.open("r", encoding="utf-8") as _file:
        data = json.load(_file)
    Waldiez.from_dict(data)
    LOG.success("Waldiez flow seems valid.")


def _get_output_path(output: Optional[Path], force: bool) -> Optional[Path]:
    if output is not None:
        output = Path(output).resolve()
    if output is not None and not output.parent.exists():
        output.parent.mkdir(parents=True)
    if output is not None and output.exists():
        if force is False:
            LOG.error("Output file already exists.")
            raise typer.Exit(code=1)
        output.unlink()
    return output


def _log_result(result: "ChatResult") -> None:
    """Log the result of the Waldiez flow."""
    LOG.info("Chat History:\n")
    LOG.info(result.chat_history)
    LOG.info("Summary:\n")
    LOG.info(result.summary)
    LOG.info("Cost:\n")
    LOG.info(result.cost)


add_cli_extras(app)

if __name__ == "__main__":
    app()
