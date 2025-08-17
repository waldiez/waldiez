# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,unused-argument,logging-fstring-interpolation
# pylint: disable=too-many-try-statements,broad-exception-caught,duplicate-code
# flake8: noqa: G004
"""Sync subprocess runner for Waldiez workflows."""

import logging
import queue
import subprocess
import threading
import time
from pathlib import Path
from typing import Any, Callable, Literal, Optional

from .__base__ import BaseSubprocessRunner


class SyncSubprocessRunner(BaseSubprocessRunner):
    """Sync subprocess runner for Waldiez workflows using threading."""

    def __init__(
        self,
        on_output: Callable[[dict[str, Any]], None],
        on_input_request: Callable[[str], None],
        input_timeout: float = 120.0,
        uploads_root: str | Path | None = None,
        dot_env: str | Path | None = None,
        logger: logging.Logger | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize sync subprocess runner.

        Parameters
        ----------
        on_output : Callable[[dict], None]
            Callback for handling output messages
        on_input_request : Callable[[str], None]
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
            **kwargs,
        )
        self.on_output = on_output
        self.on_input_request = on_input_request
        self.process: Optional[subprocess.Popen[Any]] = None
        self.input_queue: queue.Queue[str] = queue.Queue()
        self.output_queue: queue.Queue[dict[str, Any]] = queue.Queue()
        self._stop_event = threading.Event()
        self._monitor_threads: list[threading.Thread] = []

    def run_subprocess(
        self,
        flow_path: Path,
        mode: Literal["debug", "run"],
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
            # Build command
            cmd = self.build_command(flow_path, mode=mode)
            self.log_subprocess_start(cmd)

            # Start subprocess
            # pylint: disable=consider-using-with
            self.process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,  # Line buffered
            )

            # Start monitoring threads
            self._start_monitoring()

            # Wait for completion
            exit_code = self.process.wait()
            self.log_subprocess_end(exit_code)

            # Send completion message
            completion_msg = self.create_completion_message(
                success=exit_code == 0, exit_code=exit_code
            )
            self.on_output(completion_msg)

            return exit_code == 0

        except Exception as e:
            self.logger.error(f"Error running subprocess: {e}")
            error_msg = self.create_output_message(
                f"Subprocess error: {str(e)}",
                stream="stderr",
                msg_type="error",
            )
            self.on_output(error_msg)
            return False

        finally:
            self._cleanup()

    def provide_user_input(self, user_input: str) -> None:
        """Provide user input response.

        Parameters
        ----------
        user_input : str
            User's input response
        """
        if self.waiting_for_input:
            try:
                self.input_queue.put(user_input, timeout=1.0)
                self.logger.debug(f"User input queued: {user_input}")
            except queue.Full:
                self.logger.warning("Input queue is full, dropping input")
            except Exception as e:  # pragma: no cover
                self.logger.error(f"Error queuing user input: {e}")

    def stop(self) -> None:
        """Stop the subprocess."""
        self._cleanup()

    def _start_monitoring(self) -> None:
        """Start monitoring threads for subprocess I/O."""
        if not self.process:  # pragma: no cover
            return

        # Reset stop event
        self._stop_event.clear()

        # Create and start monitoring threads
        self._monitor_threads = [
            threading.Thread(target=self._read_stdout, daemon=True),
            threading.Thread(target=self._read_stderr, daemon=True),
            threading.Thread(target=self._send_queued_messages, daemon=True),
        ]

        for thread in self._monitor_threads:
            thread.start()

    def _read_stdout(self) -> None:
        """Read and handle stdout from subprocess."""
        if not self.process or not self.process.stdout:  # pragma: no cover
            return

        try:
            while not self._stop_event.is_set() and self.process.poll() is None:
                try:
                    # Use readline with timeout simulation
                    if self.process.stdout.readable():  # pragma: no branch
                        line = self.process.stdout.readline()

                        if not line:  # pragma: no cover
                            time.sleep(0.1)
                            continue

                        line_str = (
                            line.strip()
                            if isinstance(line, str)
                            else str(line).strip()
                        )
                        if line_str:  # pragma: no branch
                            self._handle_stdout_line(line_str)

                except Exception as e:
                    self.logger.error(f"Error reading stdout: {e}")
                    break

                time.sleep(0.01)  # Small delay to prevent busy waiting

        except Exception as e:
            self.logger.error(f"Error in stdout reader: {e}")

    # pylint: disable=too-complex,too-many-nested-blocks
    def _read_stderr(self) -> None:  # noqa: C901
        """Read and handle stderr from subprocess."""
        if not self.process or not self.process.stderr:  # pragma: no cover
            return

        try:
            while not self._stop_event.is_set() and self.process.poll() is None:
                try:
                    # Use readline with timeout simulation
                    if self.process.stderr.readable():  # pragma: no branch
                        line = self.process.stderr.readline()

                        if not line:
                            time.sleep(0.1)
                            continue

                        line_str = (
                            line.strip()
                            if isinstance(line, str)
                            else str(line).strip()
                        )
                        if line_str:
                            error_msg = self.create_output_message(
                                line_str,
                                stream="stderr",
                                msg_type="error",
                            )
                            try:
                                self.output_queue.put(error_msg, timeout=1.0)
                            except queue.Full:
                                self.logger.warning(
                                    "Output queue full, dropping stderr message"
                                )

                except Exception as e:
                    self.logger.error(f"Error reading stderr: {e}")
                    break

                time.sleep(0.01)  # Small delay to prevent busy waiting

        except Exception as e:
            self.logger.error(f"Error in stderr reader: {e}")

    def _send_queued_messages(self) -> None:
        """Send queued messages to output callback."""
        try:
            while not self._stop_event.is_set():
                try:
                    message = self.output_queue.get(timeout=1.0)

                    try:
                        self.on_output(message)
                    except Exception as e:
                        self.logger.error(f"Error in output callback: {e}")

                    self.output_queue.task_done()

                except queue.Empty:
                    continue
                except Exception as e:
                    self.logger.error(f"Error sending queued message: {e}")
                    break

        except Exception as e:
            self.logger.error(f"Error in message sender: {e}")

    def _handle_stdout_line(self, line: str) -> None:
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
            prompt = parsed_data.get("prompt", "> ")
            self.waiting_for_input = True
            self.on_input_request(prompt)
            self._handle_input_request(parsed_data)
        else:
            # Forward message to output
            try:
                self.output_queue.put(parsed_data, timeout=1.0)
            except queue.Full:
                self.logger.warning(
                    "Output queue full, dropping structured message"
                )

    def _handle_input_request(self, data: dict[str, Any]) -> None:
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
            user_input = self.input_queue.get(timeout=self.input_timeout)

            # Create response
            response = self.create_input_response(
                response_type=response_type,
                user_input=user_input,
                request_id=request_id,
            )
            # Send response to subprocess
            if self.process and self.process.stdin:
                self.process.stdin.write(response)
                self.process.stdin.flush()

            self.logger.debug(f"Sent input response: {user_input}")

        except queue.Empty:
            self.logger.warning("Input request timed out")
            # Send empty response on timeout
            if self.process and self.process.stdin:
                response = self.create_input_response(
                    response_type=response_type,
                    user_input="",
                    request_id=request_id,
                )
                self.process.stdin.write(response)
                self.process.stdin.flush()

        except Exception as e:
            self.logger.error(f"Error handling input request: {e}")

        finally:
            self.waiting_for_input = False

    def _cleanup_threads(self) -> None:
        """Cleanup threads."""
        self._stop_event.set()

        # Wait for threads to finish
        for thread in self._monitor_threads:
            if thread.is_alive():
                thread.join(timeout=2.0)
                if thread.is_alive():
                    self.logger.warning(
                        f"Thread {thread.name} did not stop gracefully"
                    )

    def _cleanup_process(self) -> None:
        """Cleanup process resources."""
        if self.process:
            if self.process.stdin:
                try:
                    self.process.stdin.close()
                except Exception:
                    pass

            if self.process.stdout:
                try:
                    self.process.stdout.close()
                except Exception:
                    pass

            if self.process.stderr:
                try:
                    self.process.stderr.close()
                except Exception:
                    pass
            self.logger.debug("Terminating subprocess")
            try:
                self.process.terminate()
                self.process.wait(timeout=2.0)
            except (TimeoutError, subprocess.TimeoutExpired):
                self.logger.warning("Force killing subprocess")
                self.process.kill()
                self.process.wait()
            except BaseException as e:
                self.logger.error(f"Error stopping subprocess: {e}")
            finally:
                self.process = None

    def _cleanup_queues(self) -> None:
        """Cleanup input and output queues."""
        try:
            while not self.input_queue.empty():
                self.input_queue.get_nowait()
        except queue.Empty:
            pass

        try:
            while not self.output_queue.empty():
                self.output_queue.get_nowait()
        except queue.Empty:
            pass

    def _cleanup(self) -> None:
        """Cleanup resources."""
        self._stop_event.set()
        self._cleanup_process()
        self._cleanup_threads()
        self._monitor_threads.clear()
        self.waiting_for_input = False
        self._cleanup_queues()

    def is_running(self) -> bool:
        """Check if subprocess is currently running.

        Returns
        -------
        bool
            True if subprocess is running, False otherwise
        """
        return self.process is not None and self.process.poll() is None

    def get_exit_code(self) -> Optional[int]:
        """Get the exit code of the subprocess.

        Returns
        -------
        Optional[int]
            Exit code if process has finished, None if still running
        """
        if self.process is None:
            return None
        return self.process.poll()

    def wait_for_completion(self, timeout: Optional[float] = None) -> int:
        """Wait for subprocess to complete.

        Parameters
        ----------
        timeout : Optional[float]
            Maximum time to wait in seconds. None means wait indefinitely.

        Returns
        -------
        int
            Exit code of the subprocess

        Raises
        ------
        subprocess.TimeoutExpired
            If timeout is reached before subprocess completes
        RuntimeError
            If no subprocess is running
        """
        if not self.process:
            raise RuntimeError("No subprocess is running")

        return self.process.wait(timeout=timeout)
