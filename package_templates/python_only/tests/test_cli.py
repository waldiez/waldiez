# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Tests for my_package.cli.*."""
from typing import Callable

from typer.testing import CliRunner

from my_package.cli import app

runner = CliRunner()


def test_cli_help(escape_ansi: Callable[[str], str]) -> None:
    """Test the CLI help message.

    Parameters
    ----------
    escape_ansi : Callable[[str], str]
        The escape_ansi fixture (defined in conftest.py).
    """
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    escaped_output = escape_ansi(result.output)
    assert "Usage" in escaped_output
    assert "--version" in escaped_output
    assert "run" in escaped_output


def test_cli_version(escape_ansi: Callable[[str], str]) -> None:
    """Test the CLI version flag.

    Parameters
    ----------
    escape_ansi : Callable[[str], str]
        The escape_ansi fixture (defined in conftest.py).
    """
    result = runner.invoke(app, ["--version"])
    assert result.exit_code == 0
    assert "my-package" in escape_ansi(result.output)


def test_cli_run() -> None:
    """Test the CLI run command."""
    result = runner.invoke(app, ["run"])
    assert result.exit_code == 0
    assert "Hello, World!" in result.output

    result = runner.invoke(app, ["run", "--prefix", "Hi"])
    assert result.exit_code == 0
    assert "Hi, World!" in result.output

    result = runner.invoke(app, ["run", "--name", "Alice"])
    assert result.exit_code == 0
    assert "Hello, Alice!" in result.output

    result = runner.invoke(app, ["run", "--prefix", "Hi", "--name", "Alice"])
    assert result.exit_code == 0
    assert "Hi, Alice!" in result.output
