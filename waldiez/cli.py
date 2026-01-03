# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=missing-function-docstring, missing-param-doc, missing-raises-doc
# pylint: disable=line-too-long, import-outside-toplevel,too-many-locals
# pylint: disable=too-many-arguments,too-many-positional-arguments
# pyright: reportUnknownArgumentType=false,reportCallInDefaultInitializer=false
# pyright:  reportUnusedCallResult=false,reportAny=false
"""Command line interface to convert or run a waldiez file."""

import json
import os
import sys
from pathlib import Path
from typing import TYPE_CHECKING, Literal

import anyio
import typer
from dotenv import load_dotenv
from typing_extensions import Annotated

from .cli_extras import add_cli_extras
from .logger import get_logger
from .models import Waldiez
from .storage import add_checkpoints_app
from .utils import get_waldiez_version
from .ws import add_ws_app

if TYPE_CHECKING:
    # noinspection PyUnusedImports
    from waldiez.running import WaldiezBaseRunner

load_dotenv()
LOG = get_logger(level="debug")

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


@app.command(
    context_settings={
        "help_option_names": ["-h", "--help"],
        "allow_extra_args": True,
        "ignore_unknown_options": True,
    },
)
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
    output: Path | None = typer.Option(  # noqa: B008
        None,
        help=(
            "Path to the output (.py) file. "
            "The output's directory will contain "
            "the generated flow (.py) and any additional generated files."
        ),
        dir_okay=False,
        resolve_path=True,
    ),
    uploads_root: Path | None = typer.Option(  # noqa: B008
        None,
        help=(
            "Path to the uploads root directory. "
            "The directory will contain "
            "any uploaded files."
        ),
        dir_okay=True,
        resolve_path=True,
    ),
    message: str | None = typer.Option(  # noqa: B008
        None,
        "--message",
        "-m",
        help=(
            "Optional message to pass to the runner "
            "This will override the flow's initial message if any"
        ),
    ),
    structured: bool = typer.Option(  # noqa: B008
        False,
        help=(
            "If set, structured messages will be used for I/O when "
            "using print and/or input"
        ),
    ),
    force: bool = typer.Option(  # noqa: B008
        False,
        help="Override the output file if it already exists.",
    ),
    skip_deps: bool = typer.Option(  # noqa: B008
        False,
        help="Skip installing dependencies.",
    ),
    env_file: Path | None = typer.Option(  # noqa: B008
        None,
        "--env-file",
        "-e",
        help=(
            "Path to a .env file containing additional environment variables. "
            "These variables will be set before running the flow."
        ),
        file_okay=True,
        dir_okay=False,
        readable=True,
        resolve_path=True,
    ),
    step: bool = typer.Option(  # noqa: B008
        False,
        "--step",
        "-s",
        help=(
            "Run the flow in step-by-step mode. "
            "This will pause execution after each step, allowing for debugging."
        ),
        is_eager=True,
        rich_help_panel="Debug",
    ),
    breakpoints: list[str] = typer.Option(  # noqa: B008
        ...,
        "--breakpoints",
        "-b",
        default_factory=list,
        help="Optional list with initial breakpoints (if using step mode).",
        rich_help_panel="Debug",
    ),
    checkpoint: Annotated[
        str | None,
        typer.Option(
            "--checkpoint",
            "-c",
            help=(
                "The checkpoint (by its timestamp) to use (for resuming). "
                "NOTE: use 'latest' to load the latest checkpoint, or "
                " Unix ms timestamp format: '1410715640579'"
                " (as listed in the checkpoint's path)"
                " An optional (history) index can also be passed"
                " (e.g.: '1410715640579:2'). The latest will be used if not."
            ),
        ),
    ] = None,
    subprocess: bool = typer.Option(
        False,
        "--subprocess",
        "-p",
        help=(
            "Run the flow using the subprocess runner. "
            "This will execute the flow in a separate process."
        ),
        is_eager=True,
    ),
) -> None:
    """Run a Waldiez flow."""
    output_path = _get_output_path(output, force)
    from waldiez.runner import create_runner
    from waldiez.storage import safe_name

    run_mode: Literal["standard", "debug", "subprocess"] = "standard"
    if subprocess:
        run_mode = "subprocess"
    elif step:
        run_mode = "debug"
    subprocess_mode = "run"
    if run_mode == "subprocess":
        subprocess_mode = "debug" if step else "run"
    ckp: str | None = None
    if checkpoint:
        ckp_parts = checkpoint.split(":")
        ckp = safe_name(ckp_parts[0])
        if len(ckp_parts) == 2:
            ckp = f"{ckp}:{ckp_parts[1]}"
    try:
        runner = create_runner(
            Waldiez.load(file),
            mode=run_mode,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured,
            skip_deps=skip_deps,
            dot_env=env_file,
            subprocess_mode=subprocess_mode,
            waldiez_file=file,
            breakpoints=breakpoints,
            checkpoint=ckp,
        )
    except FileNotFoundError as error:
        typer.echo(f"File not found: {file}")
        raise typer.Exit(code=1) from error
    except json.decoder.JSONDecodeError as error:
        typer.echo("Invalid .waldiez file. Not a valid json?")
        raise typer.Exit(code=1) from error
    except ValueError as error:
        typer.echo(f"Invalid .waldiez file: {error}")
        raise typer.Exit(code=1) from error
    _do_run(
        runner,
        output_path=output_path,
        uploads_root=uploads_root,
        structured=structured,
        message=message,
        env_file=env_file,
        skip_deps=skip_deps,
    )


@app.command(
    context_settings={
        "help_option_names": ["-h", "--help"],
        "allow_extra_args": True,
        "ignore_unknown_options": True,
    },
)
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
            " If not provided, the output (.py) will be saved in the same directory as the input file."
            " If the file already exists, it will not be overwritten unless --force is used."
        ),
        file_okay=True,
        dir_okay=False,
        resolve_path=True,
    ),
    message: str | None = typer.Option(  # noqa: B008
        None,
        "--message",
        "-m",
        help=(
            "Optional initial message to pass to the generated file. "
            "This will override the flow's initial message if any"
        ),
    ),
    force: bool = typer.Option(
        False,
        help="Override the output file if it already exists.",
    ),
    skip_secrets: bool = typer.Option(
        False,
        help="Redact any secrets from the generated dump",
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
    from waldiez.exporter import WaldiezExporter

    exporter = WaldiezExporter(waldiez)
    if debug:
        LOG.set_level("DEBUG")
    if output is None:
        output = Path(file).with_suffix(".py").resolve()
    exporter.export(
        output,
        message=message,
        force=force,
        skip_secrets=skip_secrets,
        debug=debug,
    )
    generated = str(output).replace(os.getcwd(), ".")
    typer.echo(f"Generated: {generated}")


@app.command(
    context_settings={
        "help_option_names": ["-h", "--help"],
        "allow_extra_args": True,
        "ignore_unknown_options": True,
    },
)
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


@app.command(
    context_settings={
        "help_option_names": ["-h", "--help"],
        "allow_extra_args": True,
        "ignore_unknown_options": True,
    },
)
def gather() -> None:
    """Try to gather any generated data during a run.

    To be used in case of a run interruption.
    """
    from waldiez.running import WaldiezBaseRunner

    done, msg = WaldiezBaseRunner.gather()
    if done:
        LOG.success(msg)
    else:
        LOG.warning(msg)


def _get_output_path(output: Path | None, force: bool) -> Path | None:
    if output is not None:
        output = Path(output).resolve()
    if output is not None and not output.parent.exists():
        output.parent.mkdir(parents=True)
    if output is not None and output.exists():
        if not force:
            LOG.error("Output file already exists.")
            raise typer.Exit(code=1)
        output.unlink()
    return output


def _do_run(
    runner: "WaldiezBaseRunner",  # noqa: F821
    output_path: Path | None,
    uploads_root: Path | None,
    structured: bool,
    message: str | None,
    env_file: Path | None,
    skip_deps: bool,
) -> None:
    _error: Exception | None = None
    _stopped: bool = False
    from waldiez.running import StopRunningException

    try:
        if runner.waldiez.is_async:
            anyio.run(
                runner.a_run,
                output_path,
                uploads_root,
                structured,  # structured_io
                message,
                False,  # skip_mmd
                False,  # skip_timeline
                False,  # skip_symlinks
                skip_deps,  # skip_deps
                env_file,
            )
            # os._exit(0 if _error is None else 1)
        else:
            runner.run(
                output_path=output_path,
                uploads_root=uploads_root,
                structured_io=structured,
                message=message,
                skip_mmd=False,
                skip_timeline=False,
                skip_symlinks=False,
                skip_deps=skip_deps,
                dot_env=env_file,
            )
    except Exception as error:
        _error = (
            error if StopRunningException.reason not in str(error) else None
        )
        _stopped = StopRunningException.reason in str(error)
        _error = error if not _stopped else None
        if _error:
            LOG.error("Execution failed: %s", error)
        else:
            LOG.warning(StopRunningException.reason)
        raise typer.Exit(code=1 if error else 0) from error
    except KeyboardInterrupt:
        LOG.warning("Execution interrupted.")
        _stopped = True
        typer.echo("Execution stopped by user.")
    finally:
        if _stopped:
            os._exit(0)
        elif _error:
            os._exit(1)
        else:
            sys.exit(0)


add_cli_extras(app)
add_ws_app(app)
add_checkpoints_app(app)

if __name__ == "__main__":
    app()
