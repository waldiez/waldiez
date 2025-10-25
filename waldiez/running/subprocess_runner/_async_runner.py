# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,unused-argument,logging-fstring-interpolation
# pylint: disable=too-many-try-statements,broad-exception-caught,duplicate-code
# flake8: noqa: G004
"""Async subprocess runner for Waldiez workflows."""

import asyncio
import logging
import sys

# noinspection PyProtectedMember
from asyncio.subprocess import Process as AsyncProcess
from collections.abc import Coroutine
from pathlib import Path
from typing import Any, Callable, Literal

from .__base__ import BaseSubprocessRunner


class AsyncSubprocessRunner(BaseSubprocessRunner):
    """Async subprocess runner for Waldiez workflows."""

    def __init__(
        self,
        on_output: Callable[[dict[str, Any]], Coroutine[Any, Any, None]],
        on_input_request: Callable[[str], Coroutine[Any, Any, None]],
        input_timeout: float = 120.0,
        uploads_root: str | Path | None = None,
        dot_env: str | Path | None = None,
        logger: logging.Logger | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize async subprocess runner.

        Parameters
        ----------
        on_output : Callable[[dict[str, Any]], Coroutine[Any, Any, None]]
            Callback for handling output messages
        on_input_request : Callable[[str], Coroutine[Any, Any, None]]
            Callback for handling input requests
        input_timeout : float
            Timeout for user input
        uploads_root : str | Path | None
            Root directory for uploads
        dot_env : str | Path | None
            Path to .env file
        logger : logging.Logger | None
            Logger instance
        **kwargs : Any
            Additional arguments passed to base class
        """
        super().__init__(
            input_timeout=input_timeout,
            uploads_root=uploads_root,
            dot_env=dot_env,
            logger=logger,
            **kwargs,
        )
        self.on_output = on_output
        self.on_input_request = on_input_request
        self.process: AsyncProcess | None = None
        self.input_queue: asyncio.Queue[str] = asyncio.Queue()
        self.output_queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        self._monitor_tasks: list[asyncio.Task[Any]] = []

    async def run_subprocess(
        self,
        flow_path: Path,
        mode: Literal["debug", "run"] = "debug",
    ) -> bool:
        """Run subprocess with the given flow data.

        Parameters
        ----------
        flow_path : Path
            Path to the waldiez flow file
        mode : Literal["debug", "run"]
            Execution mode ('debug', 'run')

        Returns
        -------
        bool
            True if subprocess completed successfully, False otherwise
        """
        try:
            # Prepare flow file
            # flow_path = self.prepare_flow_file(flow_data, base_dir, filename)

            # Build command
            cmd = self.build_command(flow_path, mode=mode)
            self.log_subprocess_start(cmd)

            # Start subprocess
            self.process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            # Start monitoring tasks
            await self._start_monitoring()

            # Wait for completion
            exit_code = await self.process.wait()
            self.log_subprocess_end(exit_code)

            # Send completion message
            completion_msg = self.create_completion_message(
                success=exit_code == 0, exit_code=exit_code
            )
            await self.on_output(completion_msg)

            return exit_code == 0

        except Exception as e:
            self.logger.error(f"Error running subprocess: {e}")
            error_msg = self.create_output_message(
                f"Subprocess error: {str(e)}",
                stream="stderr",
                msg_type="error",
            )
            await self.on_output(error_msg)
            return False

        finally:
            await self._cleanup()

    async def provide_user_input(self, user_input: str) -> None:
        """Provide user input response.

        Parameters
        ----------
        user_input : str
            User's input response
        """
        if self.waiting_for_input:
            try:
                await self.input_queue.put(user_input)
                self.logger.debug(f"User input queued: {user_input}")
            except Exception as e:
                self.logger.error(f"Error queuing user input: {e}")

    @staticmethod
    async def gather() -> tuple[bool, str]:
        """Gather any results after run.

        Returns
        -------
        tuple[bool, str]
            True if operation succeeded and any related message.
        """
        try:
            proc = await asyncio.create_subprocess_exec(
                *[
                    sys.executable,
                    "-m",
                    "waldiez",
                    "gather",
                ],
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            result = await proc.wait()
            output = ""
            if proc.stdout:
                output_bytes = await proc.stdout.read()
                output = output_bytes.decode()
            return result == 0, output
        except BaseException as e:
            return False, str(e)

    async def stop(self) -> None:
        """Stop the subprocess."""
        await self._cleanup()
        if self.process:
            try:
                self.logger.info("Terminating subprocess")
                self.process.terminate()

                # Wait a bit for graceful termination
                try:
                    await asyncio.wait_for(self.process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    # Force kill if it doesn't terminate gracefully
                    self.logger.warning("Force killing subprocess")
                    self.process.kill()
                    await self.process.wait()

            except Exception as e:
                if not isinstance(e, AttributeError):
                    self.logger.error(f"Error stopping subprocess: {e}")
        self.process = None

    async def _start_monitoring(self) -> None:
        """Start monitoring tasks for subprocess I/O."""
        if not self.process:
            return

        # Create monitoring tasks
        self._monitor_tasks = [
            asyncio.create_task(self._read_stdout()),
            asyncio.create_task(self._read_stderr()),
            asyncio.create_task(self._send_queued_messages()),
        ]

        # Wait for all monitoring tasks to complete
        await asyncio.gather(*self._monitor_tasks, return_exceptions=True)

    async def _read_stdout(self) -> None:
        """Read and handle stdout from subprocess."""
        if not self.process or not self.process.stdout:
            return

        try:
            while self.process.returncode is None:  # pragma: no branch
                try:
                    line = await asyncio.wait_for(
                        self.process.stdout.readline(), timeout=1.0
                    )

                    if not line:
                        break

                    line_str = self.decode_subprocess_line(line)
                    if line_str:
                        await self._handle_stdout_line(line_str)

                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    self.logger.error(f"Error reading stdout: {e}")
                    break

        except Exception as e:
            self.logger.error(f"Error in stdout reader: {e}")

    async def _read_stderr(self) -> None:
        """Read and handle stderr from subprocess."""
        if not self.process or not self.process.stderr:
            return

        try:
            while self.process.returncode is None:  # pragma: no branch
                try:
                    line = await asyncio.wait_for(
                        self.process.stderr.readline(), timeout=1.0
                    )

                    if not line:
                        break

                    line_str = self.decode_subprocess_line(line)
                    if line_str:
                        error_msg = self.create_output_message(
                            line_str, stream="stderr", msg_type="error"
                        )
                        await self.output_queue.put(error_msg)

                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    self.logger.error(f"Error reading stderr: {e}")
                    break

        except Exception as e:
            self.logger.error(f"Error in stderr reader: {e}")

    async def _send_queued_messages(self) -> None:
        """Send queued messages to output callback."""
        try:
            while self.process and self.process.returncode is None:
                try:
                    message = await asyncio.wait_for(
                        self.output_queue.get(), timeout=1.0
                    )

                    try:
                        await self.on_output(message)
                    except Exception as e:
                        self.logger.error(f"Error in output callback: {e}")

                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    self.logger.error(f"Error sending queued message: {e}")
                    break

        except Exception as e:
            self.logger.error(f"Error in message sender: {e}")

    async def _handle_stdout_line(self, line: str) -> None:
        """Handle a line from stdout.

        Parameters
        ----------
        line : str
            Decoded line from stdout
        """
        # Try to parse as structured JSON first
        parsed_data = self.parse_output(line, stream="stdout")
        if not parsed_data:
            return
        if parsed_data.get("type") in ("input_request", "debug_input_request"):
            self.waiting_for_input = True
            await self.on_input_request(parsed_data.get("prompt", "> "))
            await self._handle_input_request(parsed_data)
        else:
            try:
                await self.output_queue.put(parsed_data)
            except Exception as e:
                self.logger.error(f"Error queuing output message: {e}")

    async def _handle_input_request(self, data: dict[str, Any]) -> None:
        """Handle input request from subprocess.

        Parameters
        ----------
        data : dict[str, Any]
            Input request data
        """
        response_type = str(data.get("type", "input_request")).replace(
            "request", "response"
        )
        request_id = data.get("request_id")
        try:
            # Wait for user response
            user_input = await asyncio.wait_for(
                self.input_queue.get(),
                timeout=self.input_timeout,
            )

            # Create response
            response = self.create_input_response(
                response_type=response_type,
                user_input=user_input,
                request_id=request_id,
            )

            # Send response to subprocess
            if self.process and self.process.stdin:
                self.process.stdin.write(response.encode())
                await self.process.stdin.drain()

            self.logger.debug(f"Sent {response_type}: {user_input}")

        except asyncio.TimeoutError:
            self.logger.warning("Input request timed out")
            # Send empty response on timeout
            if self.process and self.process.stdin:
                response = self.create_input_response(
                    response_type=response_type,
                    user_input="",
                    request_id=request_id,
                )
                self.process.stdin.write(response.encode())
                await self.process.stdin.drain()

        except Exception as e:
            self.logger.error(f"Error handling input request: {e}")

        finally:
            self.waiting_for_input = False

    async def _cleanup(self) -> None:
        """Cleanup resources."""
        # Cancel monitoring tasks
        for task in self._monitor_tasks:
            if not task.done():
                task.cancel()

        # Wait for tasks to complete
        if self._monitor_tasks:
            await asyncio.gather(*self._monitor_tasks, return_exceptions=True)

        self._monitor_tasks.clear()

        # Close process streams
        if self.process:
            if self.process.stdin and not self.process.stdin.is_closing():
                self.process.stdin.close()
                await self.process.stdin.wait_closed()
        self.waiting_for_input = False

    def is_running(self) -> bool:
        """Check if subprocess is currently running.

        Returns
        -------
        bool
            True if subprocess is running, False otherwise
        """
        return self.process is not None and self.process.returncode is None
