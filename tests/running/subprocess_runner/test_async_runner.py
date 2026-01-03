# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-param-doc, missing-return-doc,missing-raises-doc
# pylint: disable=no-self-use,protected-access,duplicate-code
# pyright: reportPrivateUsage=false
"""Tests for AsyncSubprocessRunner."""

import asyncio
import json
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, PropertyMock, patch

import pytest

from waldiez.running.subprocess_runner import AsyncSubprocessRunner


@pytest.fixture(name="mock_output_callback")
def mock_output_callback_fixture() -> AsyncMock:
    """Mock async output callback."""
    return AsyncMock()


@pytest.fixture(name="mock_input_callback")
def mock_input_callback_fixture() -> AsyncMock:
    """Mock async input request callback."""
    return AsyncMock()


@pytest.fixture(name="runner")
def runner_fixture(
    mock_output_callback: AsyncMock, mock_input_callback: AsyncMock
) -> AsyncSubprocessRunner:
    """Create AsyncSubprocessRunner instance."""
    return AsyncSubprocessRunner(
        on_output=mock_output_callback,
        on_input_request=mock_input_callback,
        input_timeout=30.0,
    )


def test_init(
    mock_output_callback: AsyncMock,
    mock_input_callback: AsyncMock,
    tmp_path: Path,
) -> None:
    """Test initialization."""
    runner = AsyncSubprocessRunner(
        on_output=mock_output_callback,
        on_input_request=mock_input_callback,
        input_timeout=60.0,
        uploads_root=tmp_path / "uploads",
        dot_env=tmp_path / ".env",
    )

    assert runner.on_output == mock_output_callback
    assert runner.on_input_request == mock_input_callback
    assert runner.input_timeout == 60.0
    assert runner.uploads_root == tmp_path / "uploads"
    assert runner.dot_env == tmp_path / ".env"
    assert runner.process is None
    assert isinstance(runner.input_queue, asyncio.Queue)
    assert isinstance(runner.output_queue, asyncio.Queue)
    assert not runner._monitor_tasks


@pytest.mark.asyncio
async def test_provide_user_input(runner: AsyncSubprocessRunner) -> None:
    """Test providing user input."""
    runner.waiting_for_input = True

    await runner.provide_user_input("test input")

    # Check that input was queued
    assert runner.input_queue.qsize() == 1
    queued_input = await runner.input_queue.get()
    assert queued_input == "test input"


@pytest.mark.asyncio
async def test_provide_user_input_not_waiting(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test providing user input when not waiting."""
    runner.waiting_for_input = False

    await runner.provide_user_input("test input")

    # Input should not be queued
    assert runner.input_queue.qsize() == 0


@pytest.mark.asyncio
async def test_stop_no_process(runner: AsyncSubprocessRunner) -> None:
    """Test stopping when no process is running."""
    await runner.stop()

    # Should complete without error
    assert runner.process is None


@pytest.mark.asyncio
async def test_stop_with_process(runner: AsyncSubprocessRunner) -> None:
    """Test stopping with active process."""
    # Mock process
    mock_process = MagicMock()
    mock_process.terminate = MagicMock()
    mock_process.wait = AsyncMock(return_value=0)
    runner.process = mock_process

    await runner.stop()

    mock_process.terminate.assert_called_once()
    mock_process.wait.assert_called_once()


@pytest.mark.asyncio
async def test_stop_with_force_kill(runner: AsyncSubprocessRunner) -> None:
    """Test stopping with force kill when terminate times out."""
    # Mock process that doesn't terminate gracefully
    mock_process = MagicMock()
    mock_process.terminate = MagicMock()
    mock_process.kill = MagicMock()
    runner.process = mock_process

    with patch("asyncio.wait_for", side_effect=asyncio.TimeoutError()):
        await runner.stop()

    mock_process.terminate.assert_called_once()
    mock_process.kill.assert_called_once()


def test_is_running_no_process(runner: AsyncSubprocessRunner) -> None:
    """Test is_running when no process exists."""
    assert runner.is_running() is False


def test_is_running_with_process(runner: AsyncSubprocessRunner) -> None:
    """Test is_running with active process."""
    mock_process = MagicMock()
    mock_process.returncode = None
    runner.process = mock_process

    assert runner.is_running() is True


def test_is_running_finished_process(runner: AsyncSubprocessRunner) -> None:
    """Test is_running with finished process."""
    mock_process = MagicMock()
    mock_process.returncode = 0
    runner.process = mock_process

    assert runner.is_running() is False


@pytest.mark.asyncio
async def test_handle_stdout_line_input_request(
    runner: AsyncSubprocessRunner,
    mock_input_callback: MagicMock,
) -> None:
    """Test handling input request from stdout."""
    # pylint: disable=line-too-long
    line = '{"type": "input_request", "prompt": "Enter input:", "request_id": "123"}'  # noqa: E501

    # Mock the input queue to provide response
    await runner.input_queue.put("user response")

    # Mock process stdin
    mock_stdin = MagicMock()
    mock_stdin.write = MagicMock()
    mock_stdin.drain = AsyncMock()
    mock_stdin.is_closing = MagicMock(return_value=False)
    runner.process = MagicMock()
    runner.process.stdin = mock_stdin

    await runner._handle_stdout_line(line)

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
    mock_stdin.write.assert_called_once_with(expected_response.encode())
    mock_stdin.drain.assert_called_once()


@pytest.mark.asyncio
async def test_handle_stdout_line_regular_output(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test handling regular output from stdout."""
    line = '{"type": "output", "data": "regular output"}'

    await runner._handle_stdout_line(line)

    # Check that message was queued for output
    assert runner.output_queue.qsize() == 1
    queued_message = await runner.output_queue.get()
    expected = {"type": "output", "data": "regular output"}
    assert queued_message == expected


@pytest.mark.asyncio
async def test_handle_stdout_line_non_json(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test handling non-JSON output from stdout."""
    line = "This is plain text output"

    await runner._handle_stdout_line(line)

    # Check that message was queued as output message
    assert runner.output_queue.qsize() == 1
    queued_message = await runner.output_queue.get()
    expected = {
        "type": "subprocess_output",
        "stream": "stdout",
        "content": "This is plain text output",
        "subprocess_type": "output",
    }
    queued_message.pop("context", None)
    queued_message.pop("session_id", None)
    assert queued_message == expected


@pytest.mark.asyncio
async def test_handle_input_request_timeout(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test handling input request with timeout."""
    data = {
        "type": "input_request",
        "prompt": "Enter input:",
        "request_id": "123",
    }

    # Don't put anything in input queue to trigger timeout
    runner.process = MagicMock()
    mock_stdin = MagicMock()
    mock_stdin.write = MagicMock()
    mock_stdin.drain = AsyncMock()
    mock_stdin.is_closing = MagicMock(return_value=False)
    runner.process.stdin = mock_stdin
    runner.input_timeout = 1.0
    await runner._handle_input_request(data)

    # Check that empty response was sent on timeout
    expected_response = (
        json.dumps({"type": "input_response", "data": "", "request_id": "123"})
        + "\n"
    )
    mock_stdin.write.assert_called_once_with(expected_response.encode())
    assert runner.waiting_for_input is False


@pytest.mark.asyncio
async def test_cleanup(runner: AsyncSubprocessRunner) -> None:
    """Test cleanup of resources."""
    # Create mock tasks
    mock_task1 = AsyncMock()
    mock_task1.done = MagicMock(return_value=False)
    mock_task1.cancel = MagicMock()

    mock_task2 = AsyncMock()
    mock_task2.done = MagicMock(return_value=True)

    runner._monitor_tasks = [mock_task1, mock_task2]

    # Mock process with stdin
    mock_stdin = MagicMock()
    mock_stdin.write = MagicMock()
    mock_stdin.drain = AsyncMock()
    mock_stdin.wait_closed = AsyncMock()
    mock_stdin.is_closing = MagicMock(return_value=False)

    mock_process = MagicMock()
    mock_process.stdin = mock_stdin
    runner.process = mock_process

    with patch("asyncio.gather", new_callable=AsyncMock):
        await runner._cleanup()

    # Check task cleanup
    mock_task1.cancel.assert_called_once()
    mock_task2.cancel.assert_not_called()  # Already done
    assert runner._monitor_tasks == []

    # Check process cleanup
    mock_stdin.close.assert_called_once()
    mock_stdin.wait_closed.assert_called_once()
    assert runner.process is not None
    assert runner.waiting_for_input is False


@pytest.mark.asyncio
@patch("asyncio.create_subprocess_exec")
async def test_run_subprocess_success(
    mock_create_subprocess: MagicMock,
    runner: AsyncSubprocessRunner,
    mock_output_callback: MagicMock,
) -> None:
    """Test successful subprocess execution."""
    # Mock subprocess
    mock_process = AsyncMock()
    mock_process.wait = AsyncMock(return_value=0)
    mock_create_subprocess.return_value = mock_process

    # Mock monitoring tasks
    with patch.object(runner, "_start_monitoring", new_callable=AsyncMock):
        with patch.object(runner, "_cleanup", new_callable=AsyncMock):
            flow_path = Path("test_flow.waldiez")

            result = await runner.run_subprocess(
                flow_path, mode="run", message=None
            )

            assert result is True
            mock_create_subprocess.assert_called_once()
            mock_output_callback.assert_called_once()  # Completion message


@pytest.mark.asyncio
@patch("asyncio.create_subprocess_exec")
async def test_run_subprocess_failure(
    mock_create_subprocess: MagicMock,
    runner: AsyncSubprocessRunner,
    mock_output_callback: MagicMock,
) -> None:
    """Test failed subprocess execution."""
    # Mock subprocess that fails
    mock_process = MagicMock()
    mock_process.wait = AsyncMock(return_value=1)
    mock_create_subprocess.return_value = mock_process

    # Mock monitoring tasks
    with patch.object(runner, "_start_monitoring", new_callable=AsyncMock):
        with patch.object(runner, "_cleanup", new_callable=AsyncMock):
            flow_path = Path("test_flow.waldiez")

            result = await runner.run_subprocess(
                flow_path, mode="run", message=None
            )

            assert result is False
            mock_output_callback.assert_called_once()  # Completion message


@pytest.mark.asyncio
@patch("asyncio.create_subprocess_exec")
async def test_run_subprocess_exception(
    mock_create_subprocess: MagicMock,
    runner: AsyncSubprocessRunner,
    mock_output_callback: MagicMock,
) -> None:
    """Test subprocess execution with exception."""
    # Mock subprocess creation failure
    mock_create_subprocess.side_effect = Exception("Failed to start")

    flow_path = Path("test_flow.waldiez")

    with patch.object(runner, "_cleanup", new_callable=AsyncMock):
        result = await runner.run_subprocess(
            flow_path, mode="run", message=None
        )

        assert result is False
        mock_output_callback.assert_called_once()  # Error message


@pytest.mark.asyncio
async def test_provide_user_input_queue_error(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test providing user input when queue operations fail."""
    runner.waiting_for_input = True

    # Mock the input_queue.put to raise an exception
    with patch.object(
        runner.input_queue, "put", side_effect=Exception("Queue error")
    ):
        # This should trigger the exception handling in provide_user_input
        await runner.provide_user_input("test input")

    # Should complete without raising the exception


@pytest.mark.asyncio
async def test_start_monitoring_no_process(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _start_monitoring when no process exists."""
    runner.process = None

    # Should return early without creating tasks
    await runner._start_monitoring()

    assert runner._monitor_tasks == []


@pytest.mark.asyncio
async def test_read_stdout_no_process(runner: AsyncSubprocessRunner) -> None:
    """Test _read_stdout when no process exists."""
    runner.process = None

    await runner._read_stdout()
    # Should return early without error


@pytest.mark.asyncio
async def test_read_stdout_no_stdout(runner: AsyncSubprocessRunner) -> None:
    """Test _read_stdout when process has no stdout."""
    mock_process = MagicMock()
    mock_process.stdout = None
    mock_process.returncode = None
    runner.process = mock_process

    await runner._read_stdout()
    # Should return early without error


@pytest.mark.asyncio
async def test_read_stdout_timeout_continue(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _read_stdout handling timeout and continuing."""
    # Mock process with stdout that times out
    mock_stdout = AsyncMock()
    mock_stdout.readline.side_effect = asyncio.TimeoutError()

    mock_process = MagicMock()
    mock_process.stdout = mock_stdout
    mock_process.returncode = 0  # Set to completed to break the loop
    runner.process = mock_process

    await runner._read_stdout()


@pytest.mark.asyncio
async def test_read_stdout_readline_error(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _read_stdout handling readline errors."""
    # Mock process with stdout that raises an exception
    mock_stdout = AsyncMock()
    mock_stdout.readline.side_effect = Exception("Read error")

    mock_process = MagicMock()
    mock_process.stdout = mock_stdout
    mock_process.returncode = None
    runner.process = mock_process

    await runner._read_stdout()


@pytest.mark.asyncio
async def test_read_stdout_outer_exception(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _read_stdout handling outer try-catch exception."""
    # Mock process that raises exception in the outer try block
    mock_process = MagicMock()
    mock_process.stdout = MagicMock()
    mock_process.returncode = None

    # Make the while loop condition raise an exception
    type(mock_process).returncode = PropertyMock(
        side_effect=Exception("Process error")
    )
    runner.process = mock_process

    await runner._read_stdout()


@pytest.mark.asyncio
async def test_read_stdout_empty_line_break(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _read_stdout breaking on empty line."""
    # Mock process with stdout that returns empty line
    mock_stdout = AsyncMock()
    mock_stdout.readline.return_value = b""  # Empty line

    mock_process = MagicMock()
    mock_process.stdout = mock_stdout
    mock_process.returncode = None
    runner.process = mock_process

    await runner._read_stdout()


@pytest.mark.asyncio
async def test_read_stdout_handle_line_error(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _read_stdout when _handle_stdout_line raises an error."""
    # Mock process with stdout
    mock_stdout = AsyncMock()
    mock_stdout.readline.return_value = b'{"type": "output", "data": "test"}\n'

    mock_process = MagicMock()
    mock_process.stdout = mock_stdout
    mock_process.returncode = (
        0  # Set to completed to break the loop after first iteration
    )
    runner.process = mock_process

    # Mock _handle_stdout_line to raise an exception
    with patch.object(
        runner, "_handle_stdout_line", side_effect=Exception("Handle error")
    ):
        with patch.object(
            runner, "decode_subprocess_line", return_value="test line"
        ):
            await runner._read_stdout()


@pytest.mark.asyncio
async def test_start_monitoring_with_tasks(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _start_monitoring creates and waits for monitoring tasks."""
    # Mock process
    mock_process = MagicMock()
    mock_process.stdout = AsyncMock()
    mock_process.stderr = AsyncMock()
    mock_process.returncode = 0  # Already completed
    runner.process = mock_process

    # Mock the individual monitoring methods to complete quickly
    with patch.object(
        runner, "_read_stdout", new_callable=AsyncMock
    ) as mock_stdout:
        with patch.object(
            runner, "_read_stderr", new_callable=AsyncMock
        ) as mock_stderr:
            with patch.object(
                runner, "_send_queued_messages", new_callable=AsyncMock
            ) as mock_sender:
                await runner._start_monitoring()

                # Verify tasks were created and methods were called
                mock_stdout.assert_awaited_once()
                mock_stderr.assert_awaited_once()
                mock_sender.assert_awaited_once()

                # Monitor tasks should be cleared after gather
                assert len(runner._monitor_tasks) == 3


@pytest.mark.asyncio
async def test_read_stdout_timeout_continue_readline(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _read_stdout continues on timeout."""
    call_count = 0

    async def mock_readline() -> bytes:
        """Mock readline function."""
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise asyncio.TimeoutError()  # First call times out
        if call_count == 2:
            return (
                b'{"type": "output", "data": "test"}\n'  # Second call succeeds
            )
        return b""  # Third call returns empty to break loop

    mock_stdout = AsyncMock()
    mock_stdout.readline = mock_readline

    mock_process = MagicMock()
    mock_process.stdout = mock_stdout
    mock_process.returncode = None  # Keep running until empty line
    runner.process = mock_process

    with patch.object(runner, "decode_subprocess_line", return_value="test"):
        with patch.object(
            runner, "_handle_stdout_line", new_callable=AsyncMock
        ) as mock_handle:
            await runner._read_stdout()

            # Should continue after timeout and process the second line
            assert call_count >= 2
            mock_handle.assert_awaited_once()


@pytest.mark.asyncio
async def test_read_stderr_no_process(runner: AsyncSubprocessRunner) -> None:
    """Test _read_stderr when no process exists."""
    runner.process = None

    await runner._read_stderr()
    # Should return early


@pytest.mark.asyncio
async def test_read_stderr_no_stderr(runner: AsyncSubprocessRunner) -> None:
    """Test _read_stderr when process has no stderr."""
    mock_process = MagicMock()
    mock_process.stderr = None
    runner.process = mock_process

    await runner._read_stderr()
    # Should return early


@pytest.mark.asyncio
async def test_read_stderr_timeout_continue_readline(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _read_stderr continues on timeout."""
    call_count = 0

    async def mock_readline() -> bytes:
        """Mock readline function."""
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise asyncio.TimeoutError()  # First call times out
        return b""  # Second call returns empty to break loop

    mock_stderr = AsyncMock()
    mock_stderr.readline = mock_readline

    mock_process = MagicMock()
    mock_process.stderr = mock_stderr
    mock_process.returncode = None
    runner.process = mock_process

    await runner._read_stderr()

    # Should continue after timeout
    assert call_count >= 2


@pytest.mark.asyncio
async def test_read_stderr_readline_exception(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _read_stderr handling readline exception."""
    mock_stderr = AsyncMock()
    mock_stderr.readline.side_effect = Exception("Read error")

    mock_process = MagicMock()
    mock_process.stderr = mock_stderr
    mock_process.returncode = None
    runner.process = mock_process

    await runner._read_stderr()
    # Should handle exception and break


@pytest.mark.asyncio
async def test_read_stderr_outer_exception(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _read_stderr handling outer exception."""
    # Mock process that raises exception when accessing returncode
    mock_process = MagicMock()
    mock_process.stderr = AsyncMock()
    type(mock_process).returncode = PropertyMock(
        side_effect=Exception("Process error")
    )
    runner.process = mock_process

    await runner._read_stderr()
    # Should handle outer exception


@pytest.mark.asyncio
async def test_send_queued_messages_success(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _send_queued_messages successfully sending messages."""
    # Mock process that's running
    mock_process = MagicMock()
    mock_process.returncode = None
    runner.process = mock_process

    # Put a message in the queue
    test_message = {"type": "output", "data": "test message"}
    await runner.output_queue.put(test_message)

    # Mock on_output callback
    runner.on_output = AsyncMock()

    # Change returncode after first iteration to stop the loop
    async def mock_queue_get() -> dict[str, Any]:
        """Mock queue get."""
        mock_process.returncode = 0  # Set to completed after getting message
        return test_message

    with patch.object(runner.output_queue, "get", side_effect=mock_queue_get):
        await runner._send_queued_messages()

    # Verify message was sent to callback
    runner.on_output.assert_awaited_once_with(test_message)


@pytest.mark.asyncio
async def test_send_queued_messages_output_callback_error(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _send_queued_messages handling output callback error."""
    # Mock process that's running
    mock_process = MagicMock()
    mock_process.returncode = None
    runner.process = mock_process

    # Put a message in the queue
    test_message = {"type": "output", "data": "test message"}
    await runner.output_queue.put(test_message)

    # Mock on_output callback to raise exception
    runner.on_output = AsyncMock(side_effect=Exception("Callback error"))

    # Change returncode after first iteration to stop the loop
    async def mock_queue_get() -> dict[str, Any]:
        """Mock queue get."""
        mock_process.returncode = 0  # Set to completed after getting message
        return test_message

    with patch.object(runner.output_queue, "get", side_effect=mock_queue_get):
        await runner._send_queued_messages()

    # Should handle callback exception
    runner.on_output.assert_awaited_once_with(test_message)


@pytest.mark.asyncio
async def test_send_queued_messages_timeout_continue(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _send_queued_messages continues on timeout."""
    call_count = 0

    async def mock_queue_get() -> dict[str, Any]:
        """Mock queue get."""
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise asyncio.TimeoutError()  # First call times out
        # Second call - set process to completed to stop loop
        mock_process.returncode = 0
        return {"type": "output", "data": "test"}

    # Mock process that's running
    mock_process = MagicMock()
    mock_process.returncode = None
    runner.process = mock_process

    runner.on_output = AsyncMock()

    with patch.object(runner.output_queue, "get", side_effect=mock_queue_get):
        await runner._send_queued_messages()

    # Should continue after timeout
    assert call_count >= 2


@pytest.mark.asyncio
async def test_send_queued_messages_queue_exception(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _send_queued_messages handling queue get exception."""
    # Mock process that's running
    mock_process = MagicMock()
    mock_process.returncode = None
    runner.process = mock_process

    runner.on_output = AsyncMock()

    # Mock queue.get to raise exception
    with patch.object(
        runner.output_queue, "get", side_effect=Exception("Queue error")
    ):
        await runner._send_queued_messages()

    # Should handle exception and break


@pytest.mark.asyncio
async def test_send_queued_messages_outer_exception(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _send_queued_messages handling outer exception."""
    # Mock process that raises exception when accessing returncode
    # in while condition
    mock_process = MagicMock()
    type(mock_process).returncode = PropertyMock(
        side_effect=Exception("Process error")
    )
    runner.process = mock_process

    runner.on_output = AsyncMock()

    await runner._send_queued_messages()

    # Should handle outer exception


@pytest.mark.asyncio
async def test_send_queued_messages_no_process(
    runner: AsyncSubprocessRunner,
) -> None:
    """Test _send_queued_messages when process becomes None during execution."""
    # Start with a process, then set to None to break the loop
    mock_process = MagicMock()
    mock_process.returncode = None
    runner.process = mock_process

    call_count = 0

    async def mock_queue_get() -> dict[str, Any]:
        """Mock queue get."""
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            # Set process to None during execution
            runner.process = None
            return {"type": "output", "data": "test"}
        return {"type": "output", "data": "test2"}

    runner.on_output = AsyncMock()

    with patch.object(runner.output_queue, "get", side_effect=mock_queue_get):
        await runner._send_queued_messages()

    # Should stop when process becomes None (while condition check)
    assert call_count == 1
