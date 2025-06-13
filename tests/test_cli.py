# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test the CLI."""

import re
import sys
from pathlib import Path

import pytest

from waldiez import __version__  # pyright: ignore
from waldiez.__main__ import app as waldiez_main  # type: ignore
from waldiez.cli import app
from waldiez.models import WaldiezFlow


def escape_ansi(text: str) -> str:
    """Remove ANSI escape sequences from a string.

    Parameters
    ----------
    text : str
        The text to process.

    Returns
    -------
    str
        The text without ANSI escape sequences.
    """
    ansi_escape = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")
    return ansi_escape.sub("", text)


def test_get_version(capsys: pytest.CaptureFixture[str]) -> None:
    """Test the get_version function.

    Parameters
    ----------
    capsys : pytest.CaptureFixture[str]
        Pytest fixture to capture stdout and stderr.
    """
    with pytest.raises(SystemExit):
        sys.argv = ["waldiez", "--version"]
        app()
    captured = capsys.readouterr()
    assert __version__ in captured.out


def test_help(capsys: pytest.CaptureFixture[str]) -> None:
    """Test the help message.

    Parameters
    ----------
    capsys : pytest.CaptureFixture[str]
        Pytest fixture to capture stdout and stderr.
    """
    with pytest.raises(SystemExit):
        sys.argv = ["waldiez", "--help"]
        waldiez_main()
    captured = capsys.readouterr()
    assert "Usage: waldiez" in escape_ansi(captured.out)


def test_empty_cli(capsys: pytest.CaptureFixture[str]) -> None:
    """Test the CLI with no arguments.

    Parameters
    ----------
    capsys : pytest.CaptureFixture[str]
        Pytest fixture to capture stdout and stderr.
    """
    with pytest.raises(SystemExit):
        sys.argv = ["waldiez"]
        waldiez_main()
    captured = capsys.readouterr()
    assert "Usage: waldiez" in escape_ansi(captured.out)


def test_cli_export(
    capsys: pytest.CaptureFixture[str],
    tmp_path: Path,
    waldiez_flow: WaldiezFlow,
) -> None:
    """Test exporting a WaldiezFlow using the CLI.

    Parameters
    ----------
    capsys : pytest.CaptureFixture[str]
        Pytest fixture to capture stdout and stderr.
    tmp_path : Path
        Pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    input_file = tmp_path / f"{waldiez_flow.name}.waldiez"
    with open(input_file, "w", encoding="utf-8", newline="\n") as file:
        file.write(waldiez_flow.model_dump_json(by_alias=True))
    output_file = tmp_path / f"{waldiez_flow.name}.ipynb"
    sys.argv = [
        "waldiez",
        "convert",
        "--output",
        str(output_file),
        "--file",
        str(input_file),
    ]
    with pytest.raises(SystemExit):
        waldiez_main()
    captured = capsys.readouterr()
    assert "Generated" in escape_ansi(captured.out)
    assert output_file.exists()
    output_file.unlink(missing_ok=True)


def test_cli_run(
    capsys: pytest.CaptureFixture[str],
    tmp_path: Path,
    waldiez_flow_no_human_input: WaldiezFlow,
) -> None:
    """Test running a WaldiezFlow using the CLI.

    Parameters
    ----------
    capsys : pytest.CaptureFixture[str]
        Pytest fixture to capture stdout and stderr.
    tmp_path : Path
        Pytest fixture to provide a temporary directory.
    waldiez_flow_no_human_input : WaldiezFlow
        A WaldiezFlow instance with no human input.
    """
    input_file = tmp_path / f"{waldiez_flow_no_human_input.name}.waldiez"
    with open(input_file, "w", encoding="utf-8", newline="\n") as file:
        file.write(waldiez_flow_no_human_input.model_dump_json(by_alias=True))
    sys.argv = ["waldiez", "run", "--file", str(input_file)]
    with pytest.raises(SystemExit):
        waldiez_main()
    captured = capsys.readouterr()
    assert "Summary" in escape_ansi(captured.out)


def test_cli_check(
    capsys: pytest.CaptureFixture[str],
    tmp_path: Path,
    waldiez_flow_no_human_input: WaldiezFlow,
) -> None:
    """Test checking a WaldiezFlow using the CLI.

    Parameters
    ----------
    capsys : pytest.CaptureFixture[str]
        Pytest fixture to capture stdout and stderr.
    tmp_path : Path
        Pytest fixture to provide a temporary directory.
    waldiez_flow_no_human_input : WaldiezFlow
        A WaldiezFlow instance with no human input.
    """
    input_file = tmp_path / f"{waldiez_flow_no_human_input.name}.waldiez"
    with open(input_file, "w", encoding="utf-8", newline="\n") as file:
        file.write(waldiez_flow_no_human_input.model_dump_json(by_alias=True))
    sys.argv = ["waldiez", "check", "--file", str(input_file)]
    with pytest.raises(SystemExit):
        waldiez_main()
    captured = capsys.readouterr()
    assert "Waldiez flow seems valid" in escape_ansi(captured.out)
