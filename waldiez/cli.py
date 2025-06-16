# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=missing-function-docstring,missing-param-doc,missing-raises-doc
# pylint: disable=line-too-long
"""Command line interface to convert or run a waldiez file."""

import json
import os
from pathlib import Path
from typing import Optional

import anyio
import typer
from dotenv import load_dotenv
from typing_extensions import Annotated

from .exporter import WaldiezExporter
from .logger import get_logger
from .models import Waldiez
from .runner import WaldiezRunner
from .utils import add_cli_extras, get_waldiez_version

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
        typer.echo(f"waldiez version: {get_waldiez_version()}")
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
    threaded: bool = typer.Option(  # noqa: B008
        False,
        help=(
            "If set, the flow will be run in a separate thread. "
            "This is useful for running flows that require user input or print output."
        ),
    ),
    patch_io: bool = typer.Option(  # noqa: B008
        False,
        help=(
            "If set, the flow will patch ag2's IOStream to safe print and input methods. "
            "This is useful for running flows that require user input or print output."
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
        anyio.run(
            runner.a_run,
            output_path,
            uploads_root,
            structured,
            not patch_io,  # skip_patch_io
            False,  # skip_mmd
        )
    else:
        runner.run(
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured,
            threaded=threaded,
            skip_patch_io=not patch_io,
            skip_mmd=False,
        )


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


# def _do_run(
#     data: dict[str, Any],
#     structured: bool,
#     uploads_root: Optional[Path],
#     output_path: Optional[Path],
# ) -> None:
#     """Run the Waldiez flow and get the results."""
#     waldiez = Waldiez.from_dict(data)
#     if structured:
#         stream = StructuredIOStream(uploads_root=uploads_root)
#         with StructuredIOStream.set_default(stream):
#             runner = WaldiezRunner(waldiez)
#             if waldiez.is_async:
#                 anyio.run(
#                     runner.a_run,
#                     output_path,
#                     uploads_root,
#                     True,  # structured_io
#                     False,  # skip_mmd
#                 )
#             else:
#                 runner.run(
#                     output_path=output_path,
#                     uploads_root=uploads_root,
#                     structured_io=True,
#                     skip_mmd=False,
#                 )
#     else:
#         runner = WaldiezRunner(waldiez)
#         if waldiez.is_async:
#             anyio.run(
#                 runner.a_run,
#                 output_path,
#                 uploads_root,
#                 False,  # structured_io
#                 False,  # skip_mmd
#             )
#         else:
#             runner.run(
#                 output_path=output_path,
#                 uploads_root=uploads_root,
#                 structured_io=False,
#                 skip_mmd=False,
#             )


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


add_cli_extras(app)

if __name__ == "__main__":
    app()
