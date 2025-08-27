# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-raises-doc,
# pylint: disable=protected-access,too-many-try-statements
# pyright: reportIndexIssue=false,reportOperatorIssue=false
# pyright: reportPrivateUsage=false
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false

"""Test waldiez.running.utils.*."""

import asyncio
import builtins
import functools
import subprocess
import sys
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from waldiez.running import utils


def test_chdir_context(tmp_path: Path) -> None:
    """Test the chdir context manager."""
    orig_cwd = Path.cwd()
    with utils.chdir(tmp_path):
        assert Path.cwd() == tmp_path
    assert Path.cwd() == orig_cwd


@pytest.mark.asyncio
async def test_a_chdir_context(tmp_path: Path) -> None:
    """Test the async chdir context manager."""
    orig_cwd = Path.cwd()
    async with utils.a_chdir(tmp_path):
        assert Path.cwd() == tmp_path
    assert Path.cwd() == orig_cwd


@pytest.mark.parametrize(
    "text,expected",
    [
        ("\x1b[31mRed Text\x1b[0m", "Red Text"),
        ("Normal Text", "Normal Text"),
        ("\x1b[1;34mBlue Bold\x1b[0m", "Blue Bold"),
        ("\x1b[?25lHidden Cursor\x1b[?25h", "Hidden Cursor"),
    ],
)
def test_strip_ansi(text: str, expected: str) -> None:
    """Test the strip_ansi function."""
    assert utils.strip_ansi(text) == expected


async def async_func() -> None:
    """Async function."""
    await asyncio.sleep(1)
    return None


# pylint: disable=too-few-public-methods
class CallableClass:
    """A callable class for testing."""

    async def __call__(self) -> None:
        """Call the async function."""
        await asyncio.sleep(1)


def test_is_async_callable() -> None:
    """Test if a callable is async."""

    async def f_async() -> None:
        return None

    def f_sync() -> None:
        return None

    partial_async = functools.partial(f_async)
    partial_sync = functools.partial(f_sync)

    assert utils.is_async_callable(f_async)
    assert not utils.is_async_callable(f_sync)
    assert utils.is_async_callable(partial_async)
    assert not utils.is_async_callable(partial_sync)
    assert utils.is_async_callable(CallableClass())
    assert not utils.is_async_callable(print)


@patch("builtins.input", return_value="user_input_sync")
@patch("waldiez.running.utils.getpass", return_value="secret_sync")
def test_input_sync(mock_getpass: MagicMock, mock_input: MagicMock) -> None:
    """Test the sync input function."""
    # Test sync input without password
    assert utils.input_sync("prompt") == "user_input_sync"
    # Test sync input with password
    assert utils.input_sync("prompt", password=True) == "secret_sync"

    # Test EOFError handling for input
    mock_input.side_effect = EOFError
    assert utils.input_sync("prompt") == ""
    # Test EOFError handling for getpass
    mock_getpass.side_effect = EOFError
    assert utils.input_sync("prompt", password=True) == ""


@pytest.mark.asyncio
@patch("builtins.input")
@patch("waldiez.running.utils.getpass")
async def test_input_async(
    mock_getpass: MagicMock,
    mock_input: MagicMock,
) -> None:
    """Test the async input function."""
    mock_input.return_value = "user_input_async"
    mock_getpass.return_value = "secret_async"

    # Normal input async
    result = await utils.input_async("prompt")
    assert result == "user_input_async"

    # Password input async
    result = await utils.input_async("prompt", password=True)
    assert result == "secret_async"

    mock_input.side_effect = EOFError
    result = await utils.input_async("prompt")
    assert result == ""

    mock_getpass.side_effect = EOFError
    result = await utils.input_async("prompt", password=True)
    assert result == ""


def test_create_sync_subprocess(tmp_path: Path) -> None:
    """Test the creation of a synchronous subprocess."""
    file_path = tmp_path / "test_script.py"
    file_path.write_text("print('hello')")
    setup = utils.ProcessSetup(
        temp_dir=tmp_path, file_path=file_path, old_vars={}, skip_mmd=False
    )
    proc = utils.create_sync_subprocess(setup)
    assert isinstance(proc, subprocess.Popen)
    proc_args: list[Any]
    if not isinstance(proc.args, list):
        proc_args = [proc.args]
    else:
        proc_args = proc.args
    assert str(proc_args[0]) == sys.executable
    assert str(file_path) in proc_args


@pytest.mark.asyncio
@patch("asyncio.create_subprocess_exec", new_callable=AsyncMock)
async def test_create_async_subprocess(
    mock_create_subproc: AsyncMock, tmp_path: Path
) -> None:
    """Test the creation of an asynchronous subprocess."""
    file_path = tmp_path / "test_script.py"
    file_path.write_text("print('hello')")
    setup = utils.ProcessSetup(
        temp_dir=tmp_path, file_path=file_path, old_vars={}, skip_mmd=False
    )
    mock_proc = AsyncMock()
    mock_create_subproc.return_value = mock_proc

    proc = await utils.create_async_subprocess(setup)
    mock_create_subproc.assert_called_once()
    assert proc == mock_proc


class DummyStderr:
    """Dummy stderr stream for testing."""

    data: bytes

    def __init__(self) -> None:
        """Initialize the dummy stderr."""
        self.buffer = self
        self.data = b""
        self.flushed = False

    def write(self, b: bytes | str) -> None:
        """Write bytes or string to the dummy stderr."""
        if isinstance(b, bytes):
            self.data += b
            self.buffer.data += b
        else:
            self.data += b.encode("utf-8", errors="replace")
            self.buffer.data += b.encode("utf-8", errors="replace")

    def flush(self) -> None:
        """Flush the dummy stderr."""
        self.flushed = True


def test_get_what_to_print_basic() -> None:
    """Test get_what_to_print with basic arguments."""
    msg, flush = utils.get_what_to_print(
        "hello", "world", sep=",", end="!", flush=True
    )
    assert msg == "hello,world!"
    assert flush is True


def test_safe_printer_normal(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Test safe printer with normal input."""
    # Setup fake printer that prints normally
    called = {}

    def fake_printer(*args: Any, **kwargs: Any) -> None:
        called["called"] = True
        print(*args, **kwargs)

    # race on 'reload'?
    # AttributeError: 'module' object at autogen.io has no attribute 'io'
    try:
        monkeypatch.setattr(
            "autogen.io.IOStream.get_default",
            lambda: MagicMock(print=fake_printer),
        )
        printer = utils.get_printer()
        printer("normal message")
        captured = capsys.readouterr()
        assert "normal message" in captured.out
        assert called.get("called")
    except AttributeError:
        pass


def test_safe_printer_unicode_encode_error(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """Test safe printer with UnicodeEncodeError."""
    # Setup printer that raises UnicodeEncodeError once, then works
    calls = {"count": 0}

    def fake_printer(*args: Any, **kwargs: Any) -> None:
        """Fake printer that raises UnicodeEncodeError."""
        if calls["count"] == 0:
            calls["count"] += 1
            raise UnicodeEncodeError("utf-8", "error", 0, 1, "reason")
        print(*args, **kwargs)

    try:
        monkeypatch.setattr(
            "autogen.io.IOStream.get_default",
            lambda: MagicMock(print=fake_printer),
        )
        printer = utils.get_printer()
        printer("message with unicode \ud83d")
        captured = capsys.readouterr()
        output = captured.out or captured.err
        assert "message with unicode" in output
    except AttributeError:
        pass


def test_safe_printer_multiple_failures(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Test safe printer with multiple failures."""

    # Setup printer that always raises UnicodeEncodeError
    # noinspection PyUnusedLocal
    def always_fail(*args: Any, **kwargs: Any) -> None:
        """Fail always with UnicodeEncodeError."""
        raise UnicodeEncodeError(
            "utf-8", "Could not print the message", 0, 1, "reason"
        )

    try:
        monkeypatch.setattr(
            "autogen.io.IOStream.get_default",
            lambda: MagicMock(print=always_fail),
        )

        printer = utils.get_printer()

        printer("fail message")
        captured = capsys.readouterr()
        assert "fail message" in captured.out

        # let's also have builtin print also fail:
        monkeypatch.setattr(builtins, "print", always_fail)
        std_err = DummyStderr()
        monkeypatch.setattr(sys, "stderr", std_err)

        printer("fail message")
        std_err_data = std_err.data.decode("utf-8", errors="replace")
        assert "Could not print the message" in std_err_data
    except AttributeError:
        pass


def test_safe_printer_handles_unexpected_exception(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test safe printer handles unexpected exception."""

    # Setup printer that raises generic exception
    # noinspection PyUnusedLocal
    def raise_exc(*args: Any, **kwargs: Any) -> None:
        """Raise generic exception."""
        raise RuntimeError("fail")

    try:
        monkeypatch.setattr(
            "autogen.io.IOStream.get_default",
            lambda: MagicMock(print=raise_exc),
        )

        printer = utils.get_printer()

        # Should not raise, and write error message to stderr
        std_err = DummyStderr()
        monkeypatch.setattr(sys, "stderr", std_err)
        printer("trigger error")

        # noinspection PyUnreachableCode
        assert any(
            "Unexpected error" in (m if isinstance(m, str) else str(m))
            for m in std_err.data.decode("utf-8", errors="replace").splitlines()
        )
    except AttributeError:
        pass


def test_syncify() -> None:
    """Test syncify utility function."""

    async def async_dummy_func() -> str:
        """Async dummy function."""
        await asyncio.sleep(0)
        return "async result"

    assert utils.syncify(async_dummy_func)() == "async result"


@pytest.mark.asyncio
async def test_syncify_async_func_with_running_loop() -> None:
    """Test syncify utility function when a running loop exists."""

    async def async_dummy_func() -> str:
        """Async dummy function."""
        await asyncio.sleep(0)
        return "async result"

    assert utils.syncify(async_dummy_func)() == "async result"


def test_syncify_no_loop_falls_back_to_run() -> None:
    """Test syncify utility function with no event loop."""

    async def async_dummy_func() -> str:
        """Async dummy function."""
        await asyncio.sleep(0)
        return "async result"

    def mock_run(coro: Any) -> Any:
        """Mock asyncio.run that properly handles the coroutine."""
        # Create a new event loop to run the coroutine
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()

    with patch("asyncio.get_running_loop", side_effect=RuntimeError):
        with patch("asyncio.run", side_effect=mock_run) as mock_async_run:
            assert utils.syncify(async_dummy_func)() == "async result"
            assert mock_async_run.call_count == 1


def test_syncify_with_timeout_direct_run() -> None:
    """Test syncify with timeout when no event loop is running."""

    async def slow_async_func() -> str:
        """Slow async function that will timeout."""
        await asyncio.sleep(2)  # Sleep longer than timeout
        return "should not reach here"

    # Mock get_running_loop to raise RuntimeError (no loop running)
    with patch("asyncio.get_running_loop", side_effect=RuntimeError):
        sync_func = utils.syncify(slow_async_func, timeout=0.1)

        # This should raise TimeoutError due to timeout
        with pytest.raises(TimeoutError, match="timed out after 0.1 seconds"):
            sync_func()


def test_syncify_with_timeout_asyncio_timeout_error() -> None:
    """Test syncify handling asyncio.TimeoutError when using asyncio.run."""

    async def slow_async_func() -> str:
        """Slow async function."""
        await asyncio.sleep(2)
        return "result"

    def mock_run(coro: Any) -> None:
        """Mock asyncio.run that consumes the coroutine then raises timeout."""
        # Close the coroutine to avoid the warning
        coro.close()
        raise asyncio.TimeoutError("timeout")

    # Mock get_running_loop to raise RuntimeError (no loop running)
    with patch("asyncio.get_running_loop", side_effect=RuntimeError):
        # Mock asyncio.run to raise asyncio.TimeoutError after awaiting
        with patch("asyncio.run", side_effect=mock_run):
            sync_func = utils.syncify(slow_async_func, timeout=0.1)

            with pytest.raises(
                TimeoutError, match="timed out after 0.1 seconds"
            ):
                sync_func()


@pytest.mark.asyncio
async def test_syncify_with_timeout_in_thread() -> None:
    """Test syncify with timeout when event loop is running."""

    async def slow_async_func() -> str:
        """Slow async function that will timeout."""
        await asyncio.sleep(2)  # Sleep longer than timeout
        return "should not reach here"

    # We're already in an event loop (pytest-asyncio),
    # so this will use thread execution
    sync_func = utils.syncify(slow_async_func, timeout=0.1)

    # This should raise TimeoutError due to timeout in thread
    with pytest.raises((TimeoutError, asyncio.TimeoutError)):
        sync_func()


@pytest.mark.asyncio
async def test_run_in_thread_base_exception() -> None:
    """Test _run_in_thread handling BaseException (like KeyboardInterrupt)."""

    async def func_that_raises_base_exception() -> str:
        """Raise BaseException."""
        await asyncio.sleep(0.1)
        raise KeyboardInterrupt("user interrupt")

    # Directly test the _run_in_thread function
    with pytest.raises(KeyboardInterrupt, match="user interrupt"):
        utils._run_in_thread(func_that_raises_base_exception, (), {}, None)


@pytest.mark.asyncio
async def test_run_in_thread_timeout() -> None:
    """Test _run_in_thread with thread execution timeout."""

    async def slow_func() -> str:
        """Very slow function."""
        await asyncio.sleep(10)  # Much longer than timeout
        return "result"

    # Test with very short timeout to trigger thread timeout
    with pytest.raises((TimeoutError, asyncio.TimeoutError)):
        utils._run_in_thread(slow_func, (), {}, timeout=0.01)


@pytest.mark.asyncio
async def test_syncify_exception_propagation() -> None:
    """Test that syncify properly propagates exceptions from async functions."""

    async def failing_async_func() -> str:
        """Async function that raises an exception."""
        await asyncio.sleep(0.1)
        raise ValueError("test error")

    # Test with event loop running (thread path)
    sync_func = utils.syncify(failing_async_func)

    with pytest.raises(ValueError, match="test error"):
        sync_func()


def test_syncify_exception_propagation_no_loop() -> None:
    """Test syncify exception propagation when no event loop is running."""

    async def failing_async_func() -> str:
        """Async function that raises an exception."""
        await asyncio.sleep(0.1)
        raise ValueError("test error")

    # Mock get_running_loop to raise RuntimeError (no loop running)
    with patch("asyncio.get_running_loop", side_effect=RuntimeError):
        sync_func = utils.syncify(failing_async_func)

        with pytest.raises(ValueError, match="test error"):
            sync_func()
