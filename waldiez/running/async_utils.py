# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common utilities for the waldiez runner."""

import asyncio
import functools
import inspect
import logging
import threading

# noinspection PyProtectedMember
from collections.abc import Coroutine
from dataclasses import dataclass
from typing import (
    Any,
    Callable,
    Generic,
    TypeVar,
    cast,
)

T = TypeVar("T")

logger = logging.getLogger(__name__)


@dataclass
class _ResultContainer(Generic[T]):
    """Container for thread execution results with proper typing."""

    result: T | None = None
    exception: BaseException | None = None


def is_async_callable(fn: Any) -> bool:
    """Check if a function is async callable, including partials/callables.

    Parameters
    ----------
    fn : Any
        The function to check.

    Returns
    -------
    bool
        True if the function is async callable, False otherwise.
    """
    if isinstance(fn, functools.partial):
        fn = fn.func
    unwrapped = inspect.unwrap(fn)
    return inspect.iscoroutinefunction(
        unwrapped
    ) or inspect.iscoroutinefunction(
        getattr(unwrapped, "__call__", None),  # noqa: B004
    )


def syncify(
    async_func: Callable[..., Coroutine[Any, Any, T]],
    timeout: float | None = None,
) -> Callable[..., T]:
    """Convert an async function to a sync function.

    This function handles the conversion of async functions to sync functions,
    properly managing event loops and thread execution contexts.

    Parameters
    ----------
    async_func : Callable[..., Coroutine[Any, Any, T]]
        The async function to convert.
    timeout : float | None, optional
        The timeout for the sync function. Defaults to None.

    Returns
    -------
    Callable[..., T]
        The converted sync function.

    Raises
    ------
    TimeoutError
        If the async function times out.
    RuntimeError
        If there are issues with event loop management.
    """

    def _sync_wrapper(*args: Any, **kwargs: Any) -> T:
        """Get the result of the async function."""
        # pylint: disable=too-many-try-statements
        try:
            # Check if we're already in an event loop
            asyncio.get_running_loop()
            return _run_in_thread(async_func, args, kwargs, timeout)
        except RuntimeError:
            # No event loop running, we can use asyncio.run directly
            logger.debug("No event loop running, using asyncio.run")

        # Create a new event loop and run the coroutine
        try:
            if timeout is not None:
                # Need to run with asyncio.run and wait_for inside
                async def _with_timeout() -> T:
                    return await asyncio.wait_for(
                        async_func(*args, **kwargs), timeout=timeout
                    )

                return asyncio.run(_with_timeout())
            return asyncio.run(async_func(*args, **kwargs))
        except (asyncio.TimeoutError, TimeoutError) as e:
            raise TimeoutError(
                f"Async function timed out after {timeout} seconds"
            ) from e

    return _sync_wrapper


def _run_in_thread(
    async_func: Callable[..., Coroutine[Any, Any, T]],
    args: tuple[Any, ...],
    kwargs: dict[str, Any],
    timeout: float | None,
) -> T:
    """Run async function in a separate thread.

    Parameters
    ----------
    async_func : Callable[..., Coroutine[Any, Any, T]]
        The async function to run.
    args : tuple[Any, ...]
        Positional arguments for the function.
    kwargs : dict[str, Any]
        Keyword arguments for the function.
    timeout : float | None
        Timeout in seconds.

    Returns
    -------
    T
        The result of the async function.

    Raises
    ------
    TimeoutError
        If the function execution times out.
    RuntimeError
        If thread execution fails unexpectedly.
    """
    result_container: _ResultContainer[T] = _ResultContainer()
    finished_event = threading.Event()

    def _thread_target() -> None:
        """Target function for the thread."""
        # pylint: disable=too-many-try-statements, broad-exception-caught
        try:
            if timeout is not None:

                async def _with_timeout() -> T:
                    return await asyncio.wait_for(
                        async_func(*args, **kwargs), timeout=timeout
                    )

                result_container.result = asyncio.run(_with_timeout())
            else:
                result_container.result = asyncio.run(
                    async_func(*args, **kwargs)
                )
        except (
            BaseException
        ) as e:  # Catch BaseException to propagate cancellations
            result_container.exception = e
        finally:
            finished_event.set()

    thread = threading.Thread(target=_thread_target, daemon=True)
    thread.start()

    # Wait for completion with timeout
    timeout_buffer = 1.0  # 1 second buffer for cleanup
    wait_timeout = timeout + timeout_buffer if timeout is not None else None

    if not finished_event.wait(timeout=wait_timeout):  # pragma: no cover
        raise TimeoutError(
            f"Function execution timed out after {timeout} seconds"
        )

    thread.join(timeout=timeout_buffer)  # Give thread time to clean up

    if result_container.exception is not None:
        raise result_container.exception

    # Use cast since we know the result should be T if no exception occurred
    return cast(T, result_container.result)
