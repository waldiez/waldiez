# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=missing-param-doc, missing-return-doc
# pylint: disable=protected-access, duplicate-code
# pyright: reportPrivateUsage=false
"""Tests for SyncSubprocessRunner."""

import json
import queue
import subprocess
import threading
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from waldiez.logger import get_logger
from waldiez.running.subprocess_runner import SyncSubprocessRunner


@pytest.fixture(name="mock_output_callback")
def mock_output_callback_fixture() -> MagicMock:
    """Mock sync output callback."""
    return MagicMock()


@pytest.fixture(name="mock_input_callback")
def mock_input_callback_fixture() -> MagicMock:
    """Mock sync input request callback."""
    return MagicMock()


@pytest.fixture(name="runner")
def runner_fixture(
    mock_output_callback: MagicMock,
    mock_input_callback: MagicMock,
) -> SyncSubprocessRunner:
    """Create SyncSubprocessRunner instance."""
    return SyncSubprocessRunner(
        on_output=mock_output_callback,
        on_input_request=mock_input_callback,
        input_timeout=30.0,
        logger=get_logger(level="debug"),
    )


def test_init(
    mock_output_callback: MagicMock,
    mock_input_callback: MagicMock,
    tmp_path: Path,
) -> None:
    """Test initialization."""
    runner = SyncSubprocessRunner(
        on_output=mock_output_callback,
        on_input_request=mock_input_callback,
        input_timeout=60.0,
        uploads_root=tmp_path / "uploads",
        dot_env=tmp_path / ".env",
    )

    assert runner.on_output == mock_output_callback
    assert runner.on_input_request == mock_input_callback
    assert runner.input_timeout == 60.0
    assert isinstance(runner.input_queue, queue.Queue)
    assert isinstance(runner.output_queue, queue.Queue)
    assert not runner._monitor_threads


def test_provide_user_input(runner: SyncSubprocessRunner) -> None:
    """Test providing user input."""
    runner.waiting_for_input = True

    runner.provide_user_input("test input")

    # Check that input was queued
    assert runner.input_queue.qsize() == 1
    queued_input = runner.input_queue.get()
    assert queued_input == "test input"


def test_provide_user_input_not_waiting(runner: SyncSubprocessRunner) -> None:
    """Test providing user input when not waiting."""
    runner.waiting_for_input = False

    runner.provide_user_input("test input")

    # Input should not be queued
    assert runner.input_queue.qsize() == 0


def test_provide_user_input_queue_full(
    runner: SyncSubprocessRunner, caplog: pytest.LogCaptureFixture
) -> None:
    """Test providing user input when queue is full."""
    runner.waiting_for_input = True

    # Fill the queue to capacity (default queue size)
    with patch.object(runner.input_queue, "put", side_effect=queue.Full):
        runner.provide_user_input("test input")
    assert "Input queue is full, dropping input" in caplog.text


def test_stop_no_process(runner: SyncSubprocessRunner) -> None:
    """Test stopping when no process is running."""
    runner.stop()

    # Should complete without error
    assert runner.process is None


def test_stop_with_process(runner: SyncSubprocessRunner) -> None:
    """Test stopping with active process."""
    # Mock process
    mock_process = MagicMock()
    mock_process.terminate = MagicMock()
    mock_process.wait = MagicMock(return_value=0)
    runner.process = mock_process

    runner.stop()

    mock_process.terminate.assert_called_once()
    mock_process.wait.assert_called_once()


def test_stop_with_force_kill(runner: SyncSubprocessRunner) -> None:
    """Test stopping with force kill when terminate times out."""
    # Mock process that doesn't terminate gracefully
    mock_process = MagicMock()
    mock_process.terminate = MagicMock()
    mock_process.wait = MagicMock(
        side_effect=subprocess.TimeoutExpired("cmd", 5.0)
    )
    mock_process.kill = MagicMock()
    runner.process = mock_process

    # Mock the second wait call after kill
    with patch.object(
        mock_process,
        "wait",
        side_effect=[subprocess.TimeoutExpired("cmd", 5.0), 0],
    ):
        runner.stop()

    mock_process.terminate.assert_called_once()
    mock_process.kill.assert_called_once()


def test_is_running_no_process(runner: SyncSubprocessRunner) -> None:
    """Test is_running when no process exists."""
    assert runner.is_running() is False


def test_is_running_with_process(runner: SyncSubprocessRunner) -> None:
    """Test is_running with active process."""
    mock_process = MagicMock()
    mock_process.poll.return_value = None
    runner.process = mock_process

    assert runner.is_running() is True


def test_is_running_finished_process(runner: SyncSubprocessRunner) -> None:
    """Test is_running with finished process."""
    mock_process = MagicMock()
    mock_process.poll.return_value = 0
    runner.process = mock_process

    assert runner.is_running() is False


def test_get_exit_code_no_process(runner: SyncSubprocessRunner) -> None:
    """Test getting exit code when no process."""
    assert runner.get_exit_code() is None


def test_get_exit_code_with_process(runner: SyncSubprocessRunner) -> None:
    """Test getting exit code with process."""
    mock_process = MagicMock()
    mock_process.poll.return_value = 0
    runner.process = mock_process

    assert runner.get_exit_code() == 0


def test_wait_for_completion_no_process(runner: SyncSubprocessRunner) -> None:
    """Test waiting for completion with no process."""
    with pytest.raises(RuntimeError, match="No subprocess is running"):
        runner.wait_for_completion()


def test_wait_for_completion_with_process(runner: SyncSubprocessRunner) -> None:
    """Test waiting for completion with process."""
    mock_process = MagicMock()
    mock_process.wait.return_value = 0
    runner.process = mock_process

    exit_code = runner.wait_for_completion(timeout=10.0)

    assert exit_code == 0
    mock_process.wait.assert_called_once_with(timeout=10.0)


def test_handle_stdout_line_input_request(
    runner: SyncSubprocessRunner, mock_input_callback: MagicMock
) -> None:
    """Test handling input request from stdout."""
    # pylint: disable=line-too-long
    line = '{"type": "input_request", "prompt": "Enter input:", "request_id": "123"}'  # noqa: E501

    # Put response in input queue
    runner.input_queue.put("user response")

    # Mock process stdin
    mock_stdin = MagicMock()
    runner.process = MagicMock()
    runner.process.stdin = mock_stdin

    runner._handle_stdout_line(line)

    # Check that input request callback was called
    mock_input_callback.assert_called_once_with("Enter input:")

    # Check that response was sent to subprocess
    expected_response = (
        json.dumps(
            {
                "type": "input_response",
                "data": "user response",
                "request_id": "123",
            }
        )
        + "\n"
    )
    mock_stdin.write.assert_called_once_with(expected_response)
    mock_stdin.flush.assert_called_once()


def test_handle_stdout_line_regular_output(
    runner: SyncSubprocessRunner,
) -> None:
    """Test handling regular output from stdout."""
    line = '{"type": "output", "data": "regular output"}'

    runner._handle_stdout_line(line)

    # Check that message was queued for output
    assert runner.output_queue.qsize() == 1
    queued_message = runner.output_queue.get()
    expected = {"type": "output", "data": "regular output"}
    assert queued_message == expected


def test_handle_stdout_line_non_json(runner: SyncSubprocessRunner) -> None:
    """Test handling non-JSON output from stdout."""
    line = "This is plain text output"

    runner._handle_stdout_line(line)

    # Check that message was queued as output message
    assert runner.output_queue.qsize() == 1
    queued_message = runner.output_queue.get()
    expected = {
        "type": "subprocess_output",
        "stream": "stdout",
        "content": "This is plain text output",
        "subprocess_type": "output",
    }
    queued_message.pop("session_id", None)
    queued_message.pop("context", None)
    assert queued_message == expected


def test_handle_input_request_timeout(runner: SyncSubprocessRunner) -> None:
    """Test handling input request with timeout."""
    data = {
        "type": "input_request",
        "prompt": "Enter input:",
        "request_id": "123",
    }

    # Don't put anything in input queue to trigger timeout
    runner.process = MagicMock()
    mock_stdin = MagicMock()
    runner.process.stdin = mock_stdin
    runner.input_timeout = 1.0

    runner._handle_input_request(data)

    # Check that empty response was sent on timeout
    expected_response = (
        json.dumps({"type": "input_response", "data": "", "request_id": "123"})
        + "\n"
    )
    mock_stdin.write.assert_called_once_with(expected_response)
    assert runner.waiting_for_input is False


def test_cleanup_threads(runner: SyncSubprocessRunner) -> None:
    """Test cleanup of threads."""
    # Create mock threads
    mock_thread1 = MagicMock()
    mock_thread1.is_alive.return_value = True
    mock_thread1.join = MagicMock()

    mock_thread2 = MagicMock()
    mock_thread2.is_alive.return_value = False

    runner._monitor_threads = [mock_thread1, mock_thread2]

    runner._cleanup_threads()

    # Check that stop event was set
    assert runner._stop_event.is_set()

    # Check thread cleanup
    mock_thread1.join.assert_called_once_with(timeout=2.0)
    mock_thread2.join.assert_not_called()  # Not alive


def test_cleanup_process(runner: SyncSubprocessRunner) -> None:
    """Test cleanup of process."""
    # Mock process with streams
    mock_stdin = MagicMock()
    mock_stdout = MagicMock()
    mock_stderr = MagicMock()

    mock_process = MagicMock()
    mock_process.stdin = mock_stdin
    mock_process.stdout = mock_stdout
    mock_process.stderr = mock_stderr
    mock_process.wait.return_value = 0

    runner.process = mock_process

    runner._cleanup_process()

    # Check stream cleanup
    mock_stdin.close.assert_called_once()
    mock_stdout.close.assert_called_once()
    mock_stderr.close.assert_called_once()

    # Check process wait and cleanup
    mock_process.wait.assert_called_once_with(timeout=2.0)
    assert runner.process is None


def test_cleanup_process_timeout(runner: SyncSubprocessRunner) -> None:
    """Test cleanup of process with timeout."""
    # Mock process that times out on wait
    mock_process = MagicMock()
    mock_process.stdin = MagicMock()
    mock_process.stdout = MagicMock()
    mock_process.stderr = MagicMock()
    mock_process.wait.side_effect = [
        TimeoutError(),
        0,
    ]  # First call times out, second succeeds
    mock_process.kill = MagicMock()

    runner.process = mock_process

    runner._cleanup_process()

    # Check that process was killed after timeout
    mock_process.kill.assert_called_once()
    assert runner.process is None


def test_cleanup_queues(runner: SyncSubprocessRunner) -> None:
    """Test cleanup of queues."""
    # Put items in queues
    runner.input_queue.put("input1")
    runner.input_queue.put("input2")
    runner.output_queue.put({"type": "output", "data": "output1"})
    runner.output_queue.put({"type": "output", "data": "output2"})

    runner._cleanup_queues()

    # Check that queues are empty
    assert runner.input_queue.empty()
    assert runner.output_queue.empty()


@patch("subprocess.Popen")
def test_run_subprocess_success(
    mock_popen: MagicMock,
    runner: SyncSubprocessRunner,
    mock_output_callback: MagicMock,
) -> None:
    """Test successful subprocess execution."""
    # Mock subprocess
    mock_process = MagicMock()
    mock_process.wait.return_value = 0
    mock_popen.return_value = mock_process

    # Mock monitoring
    with patch.object(runner, "_start_monitoring"):
        with patch.object(runner, "_cleanup"):
            flow_path = Path("test_flow.waldiez")

            result = runner.run_subprocess(flow_path, mode="run", message=None)

            assert result is True
            mock_popen.assert_called_once()
            mock_output_callback.assert_called_once()  # Completion message


@patch("subprocess.Popen")
def test_run_subprocess_failure(
    mock_popen: MagicMock,
    runner: SyncSubprocessRunner,
    mock_output_callback: MagicMock,
) -> None:
    """Test failed subprocess execution."""
    # Mock subprocess that fails
    mock_process = MagicMock()
    mock_process.wait.return_value = 1
    mock_popen.return_value = mock_process

    # Mock monitoring
    with patch.object(runner, "_start_monitoring"):
        with patch.object(runner, "_cleanup"):
            flow_path = Path("test_flow.waldiez")

            result = runner.run_subprocess(
                flow_path, mode="debug", message=None
            )

            assert result is False
            mock_output_callback.assert_called_once()  # Completion message


@patch("subprocess.Popen")
def test_run_subprocess_exception(
    mock_popen: MagicMock,
    runner: SyncSubprocessRunner,
    mock_output_callback: MagicMock,
) -> None:
    """Test subprocess execution with exception."""
    # Mock subprocess creation failure
    mock_popen.side_effect = Exception("Failed to start")

    flow_path = Path("test_flow.waldiez")

    with patch.object(runner, "_cleanup"):
        result = runner.run_subprocess(flow_path, mode="run", message=None)

        assert result is False
        mock_output_callback.assert_called_once()  # Error message


def test_start_monitoring(runner: SyncSubprocessRunner) -> None:
    """Test starting monitoring threads."""
    mock_process = MagicMock()
    runner.process = mock_process

    with patch("threading.Thread") as mock_thread_class:
        mock_thread = MagicMock()
        mock_thread_class.return_value = mock_thread

        runner._start_monitoring()

        # Check that threads were created and started
        assert mock_thread_class.call_count == 3  # stdout, stderr, messages
        assert mock_thread.start.call_count == 3


def test_send_queued_messages(
    runner: SyncSubprocessRunner, mock_output_callback: MagicMock
) -> None:
    """Test sending queued messages."""
    # Put a message in the output queue
    test_message = {"type": "output", "data": "test"}
    runner.output_queue.put(test_message)

    # Mock the stop event to stop the loop after processing one message
    def side_effect() -> None:
        """Side effect to stop the event."""
        time.sleep(0.1)  # Allow message to be processed
        runner._stop_event.set()

    # Start the message sender in a thread
    thread = threading.Thread(target=side_effect)
    thread.start()

    runner._send_queued_messages()

    thread.join()

    # Check that callback was called
    mock_output_callback.assert_called_once_with(test_message)


def test_read_stdout_with_input_request(
    runner: SyncSubprocessRunner,
    mock_input_callback: MagicMock,
) -> None:
    """Test reading stdout with input request."""
    # Mock process with stdout
    mock_stdout = MagicMock()
    mock_stdout.readable = MagicMock(return_value=True)
    mock_stdout.readline = MagicMock(
        side_effect=[
            '{"type": "input_request", "prompt": "Enter input:"}\n',
            "",  # End of stream
        ]
    )
    runner._stop_event.clear()  # Ensure stop event is clear
    mock_process = MagicMock()
    mock_process.stdout = mock_stdout
    mock_process.poll = MagicMock(
        side_effect=[None, 0]
    )  # Running, then finished

    runner.process = mock_process
    runner.input_queue.put("user response")  # Provide response
    runner._read_stdout()

    runner._stop_event.set()  # Stop reading
    # Check that input request was handled
    mock_input_callback.assert_called_once_with("Enter input:")


def test_read_stderr(runner: SyncSubprocessRunner) -> None:
    """Test reading stderr."""
    # Mock process with stderr
    mock_stderr = MagicMock()
    mock_stderr.readable = MagicMock(return_value=True)
    mock_stderr.readline = MagicMock(
        side_effect=[
            "Error message\n",
            "",  # End of stream
        ]
    )

    mock_process = MagicMock()
    mock_process.stderr = mock_stderr
    mock_process.poll = MagicMock(
        side_effect=[None, 0]
    )  # Running, then finished

    runner._stop_event.clear()  # Ensure stop event is clear
    runner.process = mock_process
    runner._read_stderr()

    runner._stop_event.set()  # Stop reading

    # Check that error message was queued
    assert runner.output_queue.qsize() == 1
    queued_message = runner.output_queue.get()
    expected = {
        "subprocess_type": "error",
        "stream": "stderr",
        "content": "Error message",
        "type": "subprocess_output",
    }
    queued_message.pop("session_id", None)
    queued_message.pop("context", None)
    assert queued_message == expected


def test_read_stderr_queue_full(runner: SyncSubprocessRunner) -> None:
    """Test reading stderr when output queue is full."""
    # Mock process with stderr
    mock_stderr = MagicMock()
    mock_stderr.readable = MagicMock(return_value=True)
    mock_stderr.readline = MagicMock(
        side_effect=[
            "Error message\n",
            "",  # End of stream
        ]
    )

    mock_process = MagicMock()
    mock_process.stderr = mock_stderr
    mock_process.poll = MagicMock(
        side_effect=[None, 0]
    )  # Running, then finished

    runner._stop_event.clear()
    runner.process = mock_process

    # Mock output_queue.put to raise queue.Full
    with patch.object(runner.output_queue, "put", side_effect=queue.Full):
        with patch.object(
            runner,
            "create_output_message",
            return_value={"type": "error", "data": "Error message"},
        ):
            runner._read_stderr()

    # Should handle queue.Full gracefully


def test_read_stderr_readline_exception(runner: SyncSubprocessRunner) -> None:
    """Test reading stderr when readline raises exception."""
    # Mock process with stderr that raises exception
    mock_stderr = MagicMock()
    mock_stderr.readable = MagicMock(return_value=True)
    mock_stderr.readline = MagicMock(side_effect=Exception("Read error"))

    mock_process = MagicMock()
    mock_process.stderr = mock_stderr
    mock_process.poll = MagicMock(return_value=None)  # Keep running

    runner._stop_event.clear()
    runner.process = mock_process

    runner._read_stderr()

    # Should handle exception and break


def test_read_stderr_readable_exception(runner: SyncSubprocessRunner) -> None:
    """Test reading stderr when readable() raises exception."""
    # Mock process with stderr where readable() raises exception
    mock_stderr = MagicMock()
    mock_stderr.readable = MagicMock(side_effect=Exception("Readable error"))

    mock_process = MagicMock()
    mock_process.stderr = mock_stderr
    mock_process.poll = MagicMock(return_value=None)

    runner._stop_event.clear()
    runner.process = mock_process

    runner._read_stderr()

    # Should handle exception and break


def test_read_stderr_create_message_exception(
    runner: SyncSubprocessRunner,
) -> None:
    """Test reading stderr when create_output_message raises exception."""
    # Mock process with stderr
    mock_stderr = MagicMock()
    mock_stderr.readable = MagicMock(return_value=True)
    mock_stderr.readline = MagicMock(
        side_effect=[
            "Error message\n",
            "",  # End of stream
        ]
    )

    mock_process = MagicMock()
    mock_process.stderr = mock_stderr
    mock_process.poll = MagicMock(side_effect=[None, 0])

    runner._stop_event.clear()
    runner.process = mock_process

    # Mock create_output_message to raise exception
    with patch.object(
        runner,
        "create_output_message",
        side_effect=Exception("Create message error"),
    ):
        runner._read_stderr()

    # Should handle exception and break


def test_read_stdout_readline_exception(runner: SyncSubprocessRunner) -> None:
    """Test reading stdout when readline raises exception."""
    # Mock process with stdout that raises exception on readline
    mock_stdout = MagicMock()
    mock_stdout.readable = MagicMock(return_value=True)
    mock_stdout.readline = MagicMock(side_effect=Exception("Read error"))

    mock_process = MagicMock()
    mock_process.stdout = mock_stdout
    mock_process.poll = MagicMock(return_value=None)  # Keep running

    runner._stop_event.clear()
    runner.process = mock_process

    runner._read_stdout()

    # Should handle exception and break


def test_read_stdout_readable_exception(runner: SyncSubprocessRunner) -> None:
    """Test reading stdout when readable() raises exception."""
    # Mock process with stdout where readable() raises exception
    mock_stdout = MagicMock()
    mock_stdout.readable = MagicMock(side_effect=Exception("Readable error"))

    mock_process = MagicMock()
    mock_process.stdout = mock_stdout
    mock_process.poll = MagicMock(return_value=None)

    runner._stop_event.clear()
    runner.process = mock_process

    runner._read_stdout()

    # Should handle exception and break


def test_read_stdout_handle_line_exception(
    runner: SyncSubprocessRunner,
) -> None:
    """Test reading stdout when _handle_stdout_line raises exception."""
    # Mock process with stdout
    mock_stdout = MagicMock()
    mock_stdout.readable = MagicMock(return_value=True)
    mock_stdout.readline = MagicMock(
        side_effect=[
            "Some line\n",
            "",  # End of stream
        ]
    )

    mock_process = MagicMock()
    mock_process.stdout = mock_stdout
    mock_process.poll = MagicMock(side_effect=[None, 0])

    runner._stop_event.clear()
    runner.process = mock_process

    # Mock _handle_stdout_line to raise exception
    with patch.object(
        runner, "_handle_stdout_line", side_effect=Exception("Handle error")
    ):
        runner._read_stdout()

    # Should handle exception and break


def test_read_stdout_outer_exception(runner: SyncSubprocessRunner) -> None:
    """Test reading stdout when outer try block raises exception."""
    # Mock process that raises exception when accessing poll()
    mock_process = MagicMock()
    mock_process.stdout = MagicMock()
    mock_process.poll = MagicMock(side_effect=Exception("Poll error"))

    runner._stop_event.clear()
    runner.process = mock_process

    runner._read_stdout()

    # Should handle outer exception


def test_read_stdout_stop_event_exception(runner: SyncSubprocessRunner) -> None:
    """Test reading stdout when stop event check raises exception."""
    # Mock process with stdout
    mock_stdout = MagicMock()
    mock_stdout.readable = MagicMock(return_value=True)

    mock_process = MagicMock()
    mock_process.stdout = mock_stdout
    mock_process.poll = MagicMock(return_value=None)

    runner.process = mock_process

    # Mock _stop_event.is_set to raise exception
    with patch.object(
        runner._stop_event, "is_set", side_effect=Exception("Stop event error")
    ):
        runner._read_stdout()

    # Should handle outer exception
