# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common utilities for the waldiez runner."""

import asyncio
import sys
import traceback

# noinspection PyProtectedMember
from dataclasses import dataclass
from getpass import getpass
from pathlib import Path
from typing import (
    Any,
    Callable,
)


@dataclass
class ProcessSetup:
    """Container for subprocess setup data."""

    temp_dir: Path
    file_path: Path
    old_vars: dict[str, str]
    skip_mmd: bool


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
