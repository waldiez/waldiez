# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-raises-doc,
# pylint: disable=protected-access,too-many-try-statements
# pyright: reportAttributeAccessIssue=false,reportUnknownMemberType=false

"""Test waldiez.running.io_utils.*."""

import builtins
import sys
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from waldiez.running import io_utils


@patch("builtins.input", return_value="user_input_sync")
@patch("waldiez.running.io_utils.getpass", return_value="secret_sync")
def test_input_sync(mock_getpass: MagicMock, mock_input: MagicMock) -> None:
    """Test the sync input function."""
    # Test sync input without password
    assert io_utils.input_sync("prompt") == "user_input_sync"
    # Test sync input with password
    assert io_utils.input_sync("prompt", password=True) == "secret_sync"

    # Test EOFError handling for input
    mock_input.side_effect = EOFError
    assert io_utils.input_sync("prompt") == ""
    # Test EOFError handling for getpass
    mock_getpass.side_effect = EOFError
    assert io_utils.input_sync("prompt", password=True) == ""


@pytest.mark.asyncio
@patch("builtins.input")
@patch("waldiez.running.io_utils.getpass")
async def test_input_async(
    mock_getpass: MagicMock,
    mock_input: MagicMock,
) -> None:
    """Test the async input function."""
    mock_input.return_value = "user_input_async"
    mock_getpass.return_value = "secret_async"

    # Normal input async
    result = await io_utils.input_async("prompt")
    assert result == "user_input_async"

    # Password input async
    result = await io_utils.input_async("prompt", password=True)
    assert result == "secret_async"

    mock_input.side_effect = EOFError
    result = await io_utils.input_async("prompt")
    assert result == ""

    mock_getpass.side_effect = EOFError
    result = await io_utils.input_async("prompt", password=True)
    assert result == ""


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
    msg, flush = io_utils.get_what_to_print(
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
        printer = io_utils.get_printer()
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
        printer = io_utils.get_printer()
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

        printer = io_utils.get_printer()

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

        printer = io_utils.get_printer()

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
