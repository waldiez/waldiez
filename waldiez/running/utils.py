# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common utilities for the waldiez runner."""

import asyncio
import functools
import inspect
import os
import re
import subprocess
import sys
import traceback

# noinspection PyProtectedMember
from asyncio.subprocess import Process
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass
from getpass import getpass
from pathlib import Path
from typing import Any, AsyncIterator, Callable, Iterator, Union


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
        [sys.executable, "-u", str(setup.file_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.PIPE,
        # text=True,
        # bufsize=1,  # Line buffered for real-time output
        # universal_newlines=True,
        env={**os.environ},
    )


def is_async_callable(fn: Any) -> bool:
    """Check if a function is asynchronous.

    Parameters
    ----------
    fn : Any
        The function to check.

    Returns
    -------
    bool
        True if the function is asynchronous, False otherwise.
    """
    if isinstance(fn, functools.partial):
        return inspect.iscoroutinefunction(fn.func)
    return inspect.iscoroutinefunction(fn) or inspect.iscoroutinefunction(
        getattr(fn, "__call__", None)  # noqa: B004
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
        sys.executable,
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
    if not isinstance(flush, bool):  # pragma: no cover
        flush = False

    return msg, flush
