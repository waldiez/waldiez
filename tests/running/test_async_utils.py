# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-raises-doc,
# pylint: disable=protected-access,too-many-try-statements
# pyright: reportIndexIssue=false,reportOperatorIssue=false
# pyright: reportPrivateUsage=false
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false

"""Test waldiez.running.utils.*."""

import asyncio
import functools
from typing import Any
from unittest.mock import patch

import pytest

from waldiez.running import async_utils


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

    assert async_utils.is_async_callable(f_async)
    assert not async_utils.is_async_callable(f_sync)
    assert async_utils.is_async_callable(partial_async)
    assert not async_utils.is_async_callable(partial_sync)
    assert async_utils.is_async_callable(CallableClass())
    assert not async_utils.is_async_callable(print)


def test_syncify() -> None:
    """Test syncify utility function."""

    async def async_dummy_func() -> str:
        """Async dummy function."""
        await asyncio.sleep(0)
        return "async result"

    assert async_utils.syncify(async_dummy_func)() == "async result"


@pytest.mark.asyncio
async def test_syncify_async_func_with_running_loop() -> None:
    """Test syncify utility function when a running loop exists."""

    async def async_dummy_func() -> str:
        """Async dummy function."""
        await asyncio.sleep(0)
        return "async result"

    assert async_utils.syncify(async_dummy_func)() == "async result"


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
            assert async_utils.syncify(async_dummy_func)() == "async result"
            assert mock_async_run.call_count == 1


def test_syncify_with_timeout_direct_run() -> None:
    """Test syncify with timeout when no event loop is running."""

    async def slow_async_func() -> str:
        """Slow async function that will timeout."""
        await asyncio.sleep(2)  # Sleep longer than timeout
        return "should not reach here"

    # Mock get_running_loop to raise RuntimeError (no loop running)
    with patch("asyncio.get_running_loop", side_effect=RuntimeError):
        sync_func = async_utils.syncify(slow_async_func, timeout=0.1)

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
            sync_func = async_utils.syncify(slow_async_func, timeout=0.1)

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
    sync_func = async_utils.syncify(slow_async_func, timeout=0.1)

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
        async_utils._run_in_thread(
            func_that_raises_base_exception, (), {}, None
        )


@pytest.mark.asyncio
async def test_run_in_thread_timeout() -> None:
    """Test _run_in_thread with thread execution timeout."""

    async def slow_func() -> str:
        """Very slow function."""
        await asyncio.sleep(10)  # Much longer than timeout
        return "result"

    # Test with very short timeout to trigger thread timeout
    with pytest.raises((TimeoutError, asyncio.TimeoutError)):
        async_utils._run_in_thread(slow_func, (), {}, timeout=0.01)


@pytest.mark.asyncio
async def test_syncify_exception_propagation() -> None:
    """Test that syncify properly propagates exceptions from async functions."""

    async def failing_async_func() -> str:
        """Async function that raises an exception."""
        await asyncio.sleep(0.1)
        raise ValueError("test error")

    # Test with event loop running (thread path)
    sync_func = async_utils.syncify(failing_async_func)

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
        sync_func = async_utils.syncify(failing_async_func)

        with pytest.raises(ValueError, match="test error"):
            sync_func()
