# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-param-doc,missing-return-doc
# pylint: disable=no-self-use,unused-argument
# pyright: reportFunctionMemberAccess=false,reportUnknownVariableType=false
"""Tests for CLI functionality."""

import logging
import re
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from typer.testing import CliRunner

from waldiez.ws.cli import app, setup_logging


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


class TestSetupLogging:
    """Test logging setup functionality."""

    def test_setup_logging_default(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test default logging setup."""
        with caplog.at_level(logging.INFO):
            setup_logging()

            # Test that logging is configured
            logger = logging.getLogger("test")
            logger.info("Test message")

            assert "Test message" in escape_ansi(caplog.text)

    def test_setup_logging_verbose(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test verbose logging setup."""
        with caplog.at_level(logging.DEBUG):
            setup_logging(verbose=True)

            # Test that debug logging is enabled
            logger = logging.getLogger("test")
            logger.debug("Debug message")

            assert "Debug message" in escape_ansi(caplog.text)

    def test_setup_logging_websockets_level(self) -> None:
        """Test that websockets logger level is set to WARNING."""
        setup_logging()

        websockets_logger = logging.getLogger("websockets")
        assert websockets_logger.level == logging.WARNING


class TestCLICommands:
    """Test CLI command functionality."""

    def setup_method(self) -> None:
        """Set up test method."""
        # pylint: disable=attribute-defined-outside-init
        self.runner = CliRunner()

    def test_serve_command_help(self) -> None:
        """Test serve command help."""
        result = self.runner.invoke(app, ["serve", "--help"])

        assert result.exit_code == 0
        result_output = escape_ansi(result.output)
        assert "Start Waldiez WebSocket server" in result_output
        assert "--host" in result_output
        assert "--port" in result_output
        assert "--max-clients" in result_output

    async def test_serve_command_default_parameters(self) -> None:
        """Test serve command with default parameters."""
        with (
            patch(
                "waldiez.ws.cli.asyncio.run",
            ) as mock_run,
            patch(
                "waldiez.ws.cli.run_server",
                new_callable=MagicMock(),
            ) as mock_serve,
        ):
            result = self.runner.invoke(app, ["serve"])
            # Verify asyncio.run was called
            mock_run.assert_called_once()
            mock_serve.assert_called_once()
            # Should not exit with error (would be interrupted by mocking)
            assert result.exit_code == 0

    def test_serve_command_custom_parameters(self) -> None:
        """Test serve command with custom parameters."""
        with (
            patch("waldiez.ws.cli.asyncio.run") as mock_run,
            patch("waldiez.ws.cli.run_server", new_callable=MagicMock()),
        ):
            result = self.runner.invoke(
                app,
                [
                    "serve",
                    "--host",
                    "0.0.0.0",
                    "--port",
                    "9000",
                    "--max-clients",
                    "5",
                    "--ping-interval",
                    "30.0",
                    "--ping-timeout",
                    "30.0",
                    "--max-size",
                    "1048576",
                    "--verbose",
                ],
            )

            assert result.exit_code == 0
            mock_run.assert_called_once()

    def test_serve_command_allowed_origins(self) -> None:
        """Test serve command with allowed origins."""
        with (
            patch("waldiez.ws.cli.asyncio.run") as mock_run,
            patch(
                "waldiez.ws.cli.run_server", new_callable=MagicMock()
            ) as mock_serve,
        ):
            result = self.runner.invoke(
                app,
                [
                    "serve",
                    "--allowed-origin",
                    "https://example.com",
                    "--allowed-origin",
                    ".*\\.mydomain\\.com",
                ],
            )

            assert result.exit_code == 0
            mock_run.assert_called_once()
            mock_serve.assert_called_once()

    def test_serve_command_invalid_regex(self) -> None:
        """Test serve command with invalid regex pattern."""
        result = self.runner.invoke(
            app, ["serve", "--allowed-origin", "[invalid-regex"]
        )

        assert result.exit_code == 1
        assert "Invalid regex pattern" in result.output

    def test_serve_command_watch_directories(self, tmp_path: Path) -> None:
        """Test serve command with watch directories."""
        with (
            patch("waldiez.ws.cli.asyncio.run") as mock_run,
            patch(
                "waldiez.ws.cli.run_server", new_callable=MagicMock()
            ) as mock_serve,
        ):
            result = self.runner.invoke(
                app,
                [
                    "serve",
                    "--auto-reload",
                    "--watch-dir",
                    str(tmp_path / "test1"),
                    "--watch-dir",
                    str(tmp_path / "test2"),
                ],
            )

            assert result.exit_code == 0
            mock_run.assert_called_once()
            mock_serve.assert_called_once()

    def test_serve_command_keyboard_interrupt(self) -> None:
        """Test serve command handling keyboard interrupt."""
        with (
            patch("waldiez.ws.cli.asyncio.run", side_effect=KeyboardInterrupt),
            patch("waldiez.ws.cli.run_server", new_callable=MagicMock()),
        ):
            result = self.runner.invoke(app, ["serve"])

            assert (
                result.exit_code == 0
            )  # Should handle KeyboardInterrupt gracefully

    def test_serve_command_exception(self) -> None:
        """Test serve command handling exceptions."""
        with (
            patch(
                "waldiez.ws.cli.asyncio.run",
                side_effect=Exception("Server error"),
            ),
            patch("waldiez.ws.cli.run_server", new_callable=MagicMock()),
        ):
            result = self.runner.invoke(app, ["serve"])

            assert result.exit_code == 1
