# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common utilities for the waldiez runner."""

import asyncio
import functools
import inspect
import logging
import os
import re
import subprocess
import sys
import threading
import traceback

# noinspection PyProtectedMember
from asyncio.subprocess import Process
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass
from getpass import getpass
from pathlib import Path
from typing import (
    Any,
    AsyncIterator,
    Callable,
    Coroutine,
    Generic,
    Iterator,
    TypeVar,
    Union,
    cast,
)

logger = logging.getLogger(__name__)
T = TypeVar("T")


@dataclass
class _ResultContainer(Generic[T]):
    """Container for thread execution results with proper typing."""

    result: T | None = None
    exception: BaseException | None = None


@dataclass
class ProcessSetup:
    """Container for subprocess setup data."""

    temp_dir: Path
    file_path: Path
    old_vars: dict[str, str]
    skip_mmd: bool


@contextmanager
def chdir(to: Union[str, Path]) -> Iterator[None]:
    """Change the current working directory in a context.

    Parameters
    ----------
    to : Union[str, Path]
        The directory to change to.

    Yields
    ------
    Iterator[None]
        The context manager.
    """
    old_cwd = str(os.getcwd())
    os.chdir(to)
    try:
        yield
    finally:
        os.chdir(old_cwd)


@asynccontextmanager
async def a_chdir(to: Union[str, Path]) -> AsyncIterator[None]:
    """Asynchronously change the current working directory in a context.

    Parameters
    ----------
    to : Union[str, Path]
        The directory to change to.

    Yields
    ------
    AsyncIterator[None]
        The async context manager.
    """
    old_cwd = str(os.getcwd())
    os.chdir(to)
    try:
        yield
    finally:
        os.chdir(old_cwd)


def get_python_executable() -> str:
    """Get the appropriate Python executable path.

    For bundled applications, this might be different from sys.executable.

    Returns
    -------
    str
        Path to the Python executable to use for pip operations.
    """
    # Check if we're in a bundled application (e.g., PyInstaller)
    if getattr(sys, "frozen", False):  # pragma: no cover
        # We're in a bundled app
        if hasattr(sys, "_MEIPASS"):
            sys_meipass = getattr(
                sys, "_MEIPASS", str(Path.home() / ".waldiez" / "bin")
            )
            bundled = Path(sys_meipass) / "python"
            if bundled.exists():
                return str(bundled)
    return sys.executable


# noinspection TryExceptPass,PyBroadException
def ensure_pip() -> None:  # pragma: no cover
    """Make sure `python -m pip` works (bootstrap via ensurepip if needed)."""
    # pylint: disable=import-outside-toplevel
    # pylint: disable=unused-import,broad-exception-caught
    try:
        import pip  # noqa: F401  # pyright: ignore

        return
    except Exception:
        pass
    try:
        import ensurepip

        ensurepip.bootstrap(upgrade=True)
    except Exception:
        # If bootstrap fails, we'll still attempt `-m pip` and surface errors.
        pass


def get_pip_install_location() -> str | None:
    """Determine the best location to install packages.

    Returns
    -------
    Optional[str]
        The installation target directory, or None for default.
    """
    if getattr(sys, "frozen", False):  # pragma: no cover
        # For bundled apps, try to install to a user-writable location
        if hasattr(sys, "_MEIPASS"):
            app_data = Path.home() / ".waldiez" / "site-packages"
            app_data.mkdir(parents=True, exist_ok=True)
            # Add to sys.path if not already there
            app_data_str = str(app_data)
            if app_data_str not in sys.path:
                # after stdlib
                sys.path.insert(1, app_data_str)
            return app_data_str
    return None


def strip_ansi(text: str) -> str:
    """Remove ANSI escape sequences from text.

    Parameters
    ----------
    text : str
        The text to strip.

    Returns
    -------
    str
        The text without ANSI escape sequences.
    """
    ansi_pattern = re.compile(r"\x1b\[[0-9;]*m|\x1b\[.*?[@-~]")
    return ansi_pattern.sub("", text)


def create_sync_subprocess(setup: ProcessSetup) -> subprocess.Popen[bytes]:
    """Create a synchronous subprocess.

    Parameters
    ----------
    setup : ProcessSetup
        The setup data for the subprocess.

    Returns
    -------
    subprocess.Popen[bytes]
        The created subprocess.
    """
    return subprocess.Popen(
        [get_python_executable(), "-u", str(setup.file_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.PIPE,
        # text=True,
        # bufsize=1,  # Line buffered for real-time output
        # universal_newlines=True,
        env={**os.environ},
    )


async def create_async_subprocess(setup: ProcessSetup) -> Process:
    """Create an asynchronous subprocess.

    Parameters
    ----------
    setup : ProcessSetup
        The setup data for the subprocess.

    Returns
    -------
    Process
        The created asynchronous subprocess.
    """
    return await asyncio.create_subprocess_exec(
        get_python_executable(),
        "-u",
        str(setup.file_path),
        # stdout=asyncio.subprocess.PIPE,
        # stderr=asyncio.subprocess.PIPE,
        # stdin=asyncio.subprocess.PIPE,
        env={**os.environ},
    )


async def input_async(prompt: str, *, password: bool = False) -> str:
    """Asynchronous input function.

    Parameters
    ----------
    prompt : str
        The prompt to display to the user.
    password : bool, optional
        Whether to hide input (password mode), by default False.

    Returns
    -------
    str
        The user input.
    """
    if password:
        try:
            return await asyncio.to_thread(getpass, prompt)
        except EOFError:
            return ""
    try:
        return await asyncio.to_thread(input, prompt)
    except EOFError:
        return ""


def input_sync(prompt: str, *, password: bool = False) -> str:
    """Input function (synchronous).

    Parameters
    ----------
    prompt : str
        The prompt to display to the user.
    password : bool, optional
        Whether to hide input (password mode), by default False.

    Returns
    -------
    str
        The user input.
    """
    if password:
        try:
            return getpass(prompt)
        except EOFError:
            return ""
    try:
        return input(prompt)
    except EOFError:
        return ""


# pylint: disable=import-outside-toplevel,too-complex
def get_printer() -> Callable[..., None]:  # noqa: C901
    """Get the printer function.

    Returns
    -------
    Callable[..., None]
        The printer function that handles Unicode encoding errors gracefully.
    """
    try:
        # noinspection PyUnresolvedReferences
        from autogen.io import IOStream  # type: ignore

        printer = IOStream.get_default().print
    except ImportError:  # pragma: no cover
        # Fallback to standard print if autogen is not available
        printer = print

    # noinspection PyBroadException,TryExceptPass
    def safe_printer(*args: Any, **kwargs: Any) -> None:  # noqa: C901
        """Safe printer that handles Unicode encoding errors.

        Parameters
        ----------
        *args : Any
            Arguments to pass to the printer
        **kwargs : Any
            Keyword arguments to pass to the printer
        """
        # pylint: disable=broad-exception-caught,too-many-try-statements
        try:
            printer(*args, **kwargs)
        except (UnicodeEncodeError, UnicodeDecodeError):
            # First fallback: try to get a safe string representation
            try:
                msg, flush = get_what_to_print(*args, **kwargs)
                # Convert problematic characters to safe representations
                safe_msg = msg.encode("utf-8", errors="replace").decode("utf-8")
                printer(safe_msg, end="", flush=flush)
            except (UnicodeEncodeError, UnicodeDecodeError):
                # Second fallback: use built-in print with safe encoding
                try:
                    # Convert args to safe string representations
                    safe_args: list[str] = []
                    for arg in args:
                        try:
                            safe_args.append(
                                str(arg)
                                .encode("utf-8", errors="replace")
                                .decode("utf-8")
                            )
                        except (
                            UnicodeEncodeError,
                            UnicodeDecodeError,
                        ):  # pragma: no cover
                            safe_args.append(repr(arg))

                    # Use built-in print instead of the custom printer
                    print(*safe_args, **kwargs)

                except Exception:
                    # Final fallback: write directly to stderr buffer
                    error_msg = (
                        "Could not print the message due to encoding issues.\n"
                    )
                    to_sys_stderr(error_msg)
        except Exception as e:
            # Handle any other unexpected errors
            traceback.print_exc()
            error_msg = f"Unexpected error in printer: {str(e)}\n"
            to_sys_stderr(error_msg)

    return safe_printer


def to_sys_stderr(msg: str) -> None:
    """Write a message to sys.stderr.

    Parameters
    ----------
    msg : str
        The message to write to stderr.
    """
    # pylint: disable=broad-exception-caught
    # noinspection TryExceptPass,PyBroadException
    try:
        if hasattr(sys.stderr, "buffer"):
            sys.stderr.buffer.write(msg.encode("utf-8", errors="replace"))
            sys.stderr.buffer.flush()
        else:  # pragma: no cover
            sys.stderr.write(msg)
            sys.stderr.flush()
    except Exception:  # pragma: no cover
        pass


def get_what_to_print(*args: Any, **kwargs: Any) -> tuple[str, bool]:
    """Extract message and flush flag from print arguments.

    Parameters
    ----------
    *args : Any
        Arguments to print
    **kwargs : Any
        Keyword arguments for print function

    Returns
    -------
    tuple[str, bool]
        Message to print and flush flag
    """
    # Convert all args to strings and join with spaces (like print does)
    msg = " ".join(str(arg) for arg in args)

    # Handle sep parameter
    sep = kwargs.get("sep", " ")
    if isinstance(sep, bytes):  # pragma: no cover
        sep = sep.decode("utf-8", errors="replace")
    if len(args) > 1:
        msg = sep.join(str(arg) for arg in args)

    # Handle end parameter
    end = kwargs.get("end", "\n")
    if isinstance(end, bytes):  # pragma: no cover
        end = end.decode("utf-8", errors="replace")
    msg += end

    # Handle flush parameter
    flush = kwargs.get("flush", False)
    # noinspection PyUnreachableCode
    if not isinstance(flush, bool):  # pragma: no cover
        flush = False

    return msg, flush


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


def safe_filename(name: str, ext: str = "") -> str:
    """
    Make a safe cross-platform filename from an arbitrary string.

    Parameters
    ----------
    name : str
        The string to turn into a safe filename.
    ext :  str
        Optional extension (with or without leading dot).

    Returns
    -------
    str
        A safe filename string.
    """
    # Normalize extension
    # pylint: disable=inconsistent-quotes
    ext = f".{ext.lstrip('.')}" if ext else ""

    # Forbidden characters on Windows (also bad on Unix)
    forbidden = r'[<>:"/\\|?*\x00-\x1F]'
    name = re.sub(forbidden, "_", name)

    # Trim trailing dots/spaces (illegal on Windows)
    name = name.rstrip(". ")

    # Collapse multiple underscores
    name = re.sub(r"_+", "_", name)

    # Reserved Windows device names
    reserved = re.compile(
        r"^(con|prn|aux|nul|com[1-9]|lpt[1-9])$", re.IGNORECASE
    )
    if reserved.match(name):
        name = f"_{name}"

    # Fallback if empty
    if not name:
        name = "file"

    # Ensure length limit (NTFS max filename length = 255 bytes)
    max_len = 255 - len(ext)
    if len(name) > max_len:
        name = name[:max_len]

    return f"{name}{ext}"
