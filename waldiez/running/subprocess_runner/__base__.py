# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,unused-argument
# flake8: noqa: G004
"""Base subprocess runner - shared functionality."""

import json
import logging
import shlex
import sys
import uuid
from pathlib import Path
from typing import Any, Literal


class BaseSubprocessRunner:
    """Base class with common logic for subprocess runners."""

    def __init__(
        self,
        session_id: str | None = None,
        input_timeout: float = 120.0,
        uploads_root: str | Path | None = None,
        dot_env: str | Path | None = None,
        logger: logging.Logger | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize base subprocess runner.

        Parameters
        ----------
        session_id : str | None
            Unique session identifier
        input_timeout : float
            Timeout for user input
        output_path : str | Path | None
            Path to output file
        uploads_root : str | Path | None
            Root directory for uploads
        dot_env : str | Path | None
            Path to .env file
        logger : logging.Logger | None
            Logger instance to use
        **kwargs : Any
            Additional arguments
        """
        self.session_id = session_id or f"session_{uuid.uuid4().hex}"
        self.input_timeout = input_timeout
        self.uploads_root = uploads_root
        self.dot_env = dot_env
        self.logger = logger or logging.getLogger(self.__class__.__name__)
        self.waiting_for_input = False

    def build_command(
        self,
        flow_path: Path,
        output_path: str | Path | None = None,
        mode: Literal["debug", "run"] = "run",
        structured: bool = True,
        force: bool = True,
    ) -> list[str]:
        """Build subprocess command.

        Parameters
        ----------
        flow_path : Path
            Path to the waldiez flow file
        output_path : str | Path | None
            Path to the output file
        mode : Literal["debug", "run"]
            Execution mode ('debug', 'run', etc.)
        structured : bool
            Whether to use structured I/O
        force : bool
            Whether to force overwrite outputs

        Returns
        -------
        list[str]
            Command arguments list
        """
        _output_path = (
            str(output_path)
            if output_path
            else str(flow_path.with_suffix(".py"))
        )
        cmd = [
            sys.executable,
            "-m",
            "waldiez",
            "run",
            "--file",
            str(flow_path),
            "--output",
            _output_path,
        ]

        if mode == "debug":
            cmd.append("--step")

        if structured:
            cmd.append("--structured")

        if force:
            cmd.append("--force")

        if self.uploads_root:
            cmd.extend(["--uploads-root", str(self.uploads_root)])

        if self.dot_env:
            cmd.extend(["--dot-env", str(self.dot_env)])

        return cmd

    def parse_output(
        self,
        line: str,
        stream: Literal["stdout", "stderr"],
    ) -> dict[str, Any]:
        """Parse output from subprocess.

        Parameters
        ----------
        line : str
            Raw output line from subprocess
        stream : Literal["stdout", "stderr"]
            Stream name ('stdout' or 'stderr')

        Returns
        -------
        dict[str, Any]
            Parsed JSON data if valid, empty dict otherwise
        """
        line = line.strip()
        if not line:
            return {}

        try:
            data = json.loads(line)
            if isinstance(data, dict):
                return data  # pyright: ignore
        except json.JSONDecodeError:
            return self.create_output_message(stream=stream, content=line)
        return self.create_output_message(
            stream=stream, content=line
        )  # pragma: no cover

    # noinspection PyMethodMayBeStatic
    def decode_subprocess_line(self, line: Any) -> str:
        """Safely decode subprocess output line.

        Parameters
        ----------
        line : Any
            Raw bytes from subprocess

        Returns
        -------
        str
            Decoded string
        """
        if isinstance(line, bytes):
            return line.decode("utf-8", errors="replace").strip()
        if isinstance(line, str):
            return line.strip()
        return str(line).strip()

    def log_subprocess_start(self, cmd: list[str]) -> None:
        """Log subprocess start with command.

        Parameters
        ----------
        cmd : list[str]
            Command arguments
        """
        cmd_str = " ".join(shlex.quote(arg) for arg in cmd)
        self.logger.info(f"Starting subprocess: {cmd_str}")

    def log_subprocess_end(self, exit_code: int) -> None:
        """Log subprocess completion.

        Parameters
        ----------
        exit_code : int
            Process exit code
        """
        if exit_code == 0:
            self.logger.info(
                f"Subprocess completed successfully (exit code: {exit_code})"
            )
        else:
            self.logger.error(f"Subprocess failed (exit code: {exit_code})")

    # noinspection PyMethodMayBeStatic
    def create_input_response(
        self,
        response_type: str,
        user_input: str,
        request_id: str | None = None,
    ) -> str:
        """Create input response for subprocess.

        Parameters
        ----------
        response_type : str
            Type of the response
        user_input : str
            User's input response
        request_id : str | None
            Request ID from the input request

        Returns
        -------
        str
            JSON-formatted response
        """
        response = {
            "type": response_type,
            "data": user_input,
        }

        if request_id:
            response["request_id"] = request_id

        return json.dumps(response) + "\n"

    def create_output_message(
        self, content: str, stream: str = "stdout", msg_type: str = "output"
    ) -> dict[str, Any]:
        """Create standardized output message.

        Parameters
        ----------
        content : str
            Message content
        stream : str
            Source stream ('stdout', 'stderr')
        msg_type : str
            Message type ('output', 'error', etc.)

        Returns
        -------
        dict[str, Any]
            The output message
        """
        return {
            "type": "subprocess_output",
            "session_id": self.session_id,
            "stream": stream,
            "content": content,
            "subprocess_type": msg_type,
            "context": {},  # might add in the future
        }

    def create_completion_message(
        self, success: bool, exit_code: int, message: str | None = None
    ) -> dict[str, Any]:
        """Create completion message.

        Parameters
        ----------
        success : bool
            Whether subprocess completed successfully
        exit_code : int
            Process exit code
        message : str | None
            Additional message

        Returns
        -------
        dict
            Completion message
        """
        data = message or f"Process completed with exit code {exit_code}"
        return {
            "type": "subprocess_completion",
            "session_id": self.session_id,
            "success": success,
            "exit_code": exit_code,
            "message": data,
            "context": {},  # might add in the future
        }
