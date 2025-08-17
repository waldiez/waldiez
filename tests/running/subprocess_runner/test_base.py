# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-param-doc,no-self-use
"""Tests for BaseSubprocessRunner."""

import json
import shlex
import sys
from pathlib import Path
from typing import Any
from unittest.mock import Mock

import pytest

from waldiez.logger import get_logger
from waldiez.running.subprocess_runner import BaseSubprocessRunner


class TestBaseSubprocessRunner:
    """Test cases for BaseSubprocessRunner."""

    def test_init_defaults(self) -> None:
        """Test initialization with default values."""
        runner = BaseSubprocessRunner()

        assert runner.input_timeout == 120.0
        assert runner.uploads_root is None
        assert runner.dot_env is None
        assert runner.waiting_for_input is False
        assert runner.logger is not None

    def test_init_with_params(self, tmp_path: Path) -> None:
        """Test initialization with custom parameters."""
        uploads_root = tmp_path / "uploads"
        dot_env = Path(".env")
        logger = Mock()

        runner = BaseSubprocessRunner(
            input_timeout=60.0,
            uploads_root=uploads_root,
            dot_env=dot_env,
            logger=logger,
        )

        assert runner.input_timeout == 60.0
        assert runner.uploads_root == uploads_root
        assert runner.dot_env == dot_env
        assert runner.logger == logger

    def test_build_command_basic(self) -> None:
        """Test basic command building."""
        runner = BaseSubprocessRunner()
        flow_path = Path("test_flow.waldiez")

        cmd = runner.build_command(flow_path, mode="debug")

        expected = [
            sys.executable,
            "-m",
            "waldiez",
            "run",
            "--file",
            str(flow_path),
            "--output",
            str(flow_path.with_suffix(".py")),
            "--step",
            "--structured",
            "--force",
        ]
        assert cmd == expected

    def test_build_command_with_options(self, tmp_path: Path) -> None:
        """Test command building with various options."""
        runner = BaseSubprocessRunner(
            uploads_root=tmp_path / "uploads", dot_env=Path(".env")
        )
        flow_path = Path("test_flow.waldiez")
        output_path = Path("custom_output.py")

        cmd = runner.build_command(
            flow_path,
            output_path=output_path,
            mode="run",
            structured=False,
            force=False,
        )

        expected = [
            sys.executable,
            "-m",
            "waldiez",
            "run",
            "--file",
            str(flow_path),
            "--output",
            str(output_path),
            "--uploads-root",
            str(tmp_path / "uploads"),
            "--dot-env",
            str(Path(".env")),
        ]
        assert cmd == expected

    def test_parse_output_valid_json(self) -> None:
        """Test parsing valid JSON output."""
        runner = BaseSubprocessRunner()
        json_line = '{"type": "output", "data": "test message"}'

        result = runner.parse_output(json_line, "stdout")

        expected = {"type": "output", "data": "test message"}
        assert result == expected

    def test_parse_output_invalid_json(self) -> None:
        """Test parsing invalid JSON output."""
        runner = BaseSubprocessRunner()
        text_line = "This is not JSON"

        result = runner.parse_output(text_line, "stdout")

        expected = {
            "type": "subprocess_output",
            "stream": "stdout",
            "content": "This is not JSON",
            "subprocess_type": "output",
        }
        result.pop("context", None)  # Remove context for comparison
        result.pop("session_id", None)  # Remove session_id for comparison
        assert result == expected

    def test_parse_output_empty_line(self) -> None:
        """Test parsing empty line."""
        runner = BaseSubprocessRunner()

        result = runner.parse_output("", "stdout")

        assert result == {}

    def test_create_input_response(self) -> None:
        """Test creating input response."""
        runner = BaseSubprocessRunner()

        response = runner.create_input_response(
            "input_response", "user input", "req123"
        )

        expected = (
            json.dumps(
                {
                    "type": "input_response",
                    "data": "user input",
                    "request_id": "req123",
                }
            )
            + "\n"
        )
        assert response == expected

    def test_create_input_response_no_request_id(self) -> None:
        """Test creating input response without request ID."""
        runner = BaseSubprocessRunner()

        response = runner.create_input_response("input_response", "user input")

        expected = (
            json.dumps({"type": "input_response", "data": "user input"}) + "\n"
        )
        assert response == expected

    def test_decode_subprocess_line_bytes(self) -> None:
        """Test decoding bytes from subprocess."""
        runner = BaseSubprocessRunner()

        result = runner.decode_subprocess_line(b"test output\n")

        assert result == "test output"

    def test_decode_subprocess_line_string(self) -> None:
        """Test decoding string from subprocess."""
        runner = BaseSubprocessRunner()

        result = runner.decode_subprocess_line("test output\n")

        assert result == "test output"

    def test_decode_subprocess_line_other(self) -> None:
        """Test decoding other types from subprocess."""
        runner = BaseSubprocessRunner()

        result = runner.decode_subprocess_line(123)

        assert result == "123"

    def test_log_subprocess_start(
        self, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """Test logging subprocess start."""
        runner = BaseSubprocessRunner(logger=get_logger(level="debug"))
        cmd = [sys.executable, "-m", "waldiez", "run"]

        runner.log_subprocess_start(cmd)
        cmd_str = " ".join(shlex.quote(arg) for arg in cmd)
        captured = capsys.readouterr()
        assert f"Starting subprocess: {cmd_str}" in captured.out

    def test_log_subprocess_end_success(
        self, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """Test logging subprocess end with success."""
        runner = BaseSubprocessRunner(logger=get_logger(level="debug"))

        runner.log_subprocess_end(0)
        captured = capsys.readouterr()
        assert (
            "Subprocess completed successfully (exit code: 0)" in captured.out
        )

    def test_log_subprocess_end_failure(
        self, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """Test logging subprocess end with failure."""
        runner = BaseSubprocessRunner(logger=get_logger(level="debug"))

        runner.log_subprocess_end(1)

        captured = capsys.readouterr()
        assert "Subprocess failed (exit code: 1)" in captured.out

    def test_create_output_message(self) -> None:
        """Test creating output message."""
        runner = BaseSubprocessRunner()

        result = runner.create_output_message(
            "test content",
            stream="stderr",
            msg_type="error",
        )

        expected: dict[str, Any] = {
            "type": "subprocess_output",
            "subprocess_type": "error",
            "stream": "stderr",
            "content": "test content",
        }
        result.pop("session_id", None)
        result.pop("context", None)
        assert result == expected

    def test_create_output_message_defaults(self) -> None:
        """Test creating output message with defaults."""
        runner = BaseSubprocessRunner()

        result = runner.create_output_message("test content")

        expected = {
            "type": "subprocess_output",
            "stream": "stdout",
            "content": "test content",
            "subprocess_type": "output",
        }
        result.pop("session_id", None)
        result.pop("context", None)
        assert result == expected

    def test_create_completion_message(self) -> None:
        """Test creating completion message."""
        runner = BaseSubprocessRunner()

        result = runner.create_completion_message(
            success=True, exit_code=0, message="Custom completion message"
        )
        expected: dict[str, Any] = {
            "type": "subprocess_completion",
            "success": True,
            "exit_code": 0,
            "message": "Custom completion message",
        }
        result.pop("session_id", None)
        result.pop("context", None)
        assert result == expected

    def test_create_completion_message_default(self) -> None:
        """Test creating completion message with default message."""
        runner = BaseSubprocessRunner()

        result = runner.create_completion_message(success=False, exit_code=1)

        expected: dict[str, Any] = {
            "type": "subprocess_completion",
            "success": False,
            "exit_code": 1,
            "message": "Process completed with exit code 1",
        }
        result.pop("session_id", None)
        result.pop("context", None)
        assert result == expected
