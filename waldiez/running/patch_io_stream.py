# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=import-outside-toplevel, broad-exception-caught
# pylint: disable=too-many-try-statements, too-complex
# noqa: C901
"""Patch ag2's IOStream if a flow is async.

# let's keep an eye here:
# https://github.com/ag2ai/ag2/blob/main/autogen/agentchat/conversable_agent.py#L2973
# reply = await iostream.input(prompt) ???? (await???)
"""

import inspect
import sys
from typing import Any, Callable

from asyncer import syncify


def patch_io_stream(is_async: bool) -> None:
    """Patch the IOStream to handle async flows.

    Parameters
    ----------
    is_async : bool
        Whether the flow is async or not.
    """
    if is_async:
        patch_async_io_stream()
    else:
        patch_sync_io_stream()


def patch_sync_io_stream() -> None:
    """Patch the IOStream to handle async flows."""
    from autogen.io import IOStream  # type: ignore

    iostream = IOStream.get_default()
    original_input = iostream.input

    def _safe_input(prompt: str = "", *, password: bool = False) -> str:
        """Async input method."""
        try:
            input_or_coro = original_input(prompt, password=password)
            if inspect.iscoroutine(input_or_coro):

                async def _async_input() -> str:
                    reply = await input_or_coro
                    return reply

                return syncify(_async_input)()
            return input_or_coro

        except EOFError:
            # Handle EOFError gracefully
            return ""

    iostream.input = _safe_input  # pyright: ignore
    iostream.print = get_printer()  # pyright: ignore
    IOStream.set_default(iostream)


def patch_async_io_stream() -> None:
    """Patch the IOStream to handle async flows."""
    from autogen.io import IOStream  # pyright: ignore

    iostream = IOStream.get_default()
    original_input = iostream.input

    async def _async_input(prompt: str = "", *, password: bool = False) -> str:
        """Async input method."""
        try:
            input_or_coro = original_input(prompt, password=password)
            if inspect.iscoroutine(input_or_coro):
                reply = await input_or_coro
            else:
                reply = input_or_coro
            return reply
        except EOFError:
            # Handle EOFError gracefully
            return ""

    iostream.input = _async_input  # pyright: ignore
    iostream.print = get_printer()  # pyright: ignore
    IOStream.set_default(iostream)


def get_printer() -> Callable[..., None]:  # noqa: C901
    """Get the printer function.

    Returns
    -------
    Callable[..., None]
        The printer function that handles Unicode encoding errors gracefully.
    """
    try:
        # noinspection PyUnresolvedReferences
        from autogen.io import IOStream  # pyright: ignore

        printer = IOStream.get_default().print
    except ImportError:
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
        try:
            printer(*args, **kwargs)
        except UnicodeEncodeError:
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
                        except (UnicodeEncodeError, UnicodeDecodeError):
                            safe_args.append(repr(arg))

                    # Use built-in print instead of the custom printer
                    print(*safe_args, **kwargs)

                except Exception:
                    # Final fallback: write directly to stderr buffer
                    try:
                        error_msg = (
                            "Could not print the message "
                            "due to encoding issues.\n"
                        )
                        if hasattr(sys.stderr, "buffer"):
                            sys.stderr.buffer.write(
                                error_msg.encode("utf-8", errors="replace")
                            )
                            sys.stderr.buffer.flush()
                        else:
                            sys.stderr.write(error_msg)
                            sys.stderr.flush()
                    except Exception:
                        # If even this fails, we're in a very bad state
                        pass
        except Exception as e:
            # Handle any other unexpected errors
            try:
                error_msg = f"Unexpected error in printer: {str(e)}\n"
                if hasattr(sys.stderr, "buffer"):
                    sys.stderr.buffer.write(
                        error_msg.encode("utf-8", errors="replace")
                    )
                    sys.stderr.buffer.flush()
                else:
                    sys.stderr.write(error_msg)
                    sys.stderr.flush()
            except Exception:
                pass

    return safe_printer


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
    if len(args) > 1:
        msg = sep.join(str(arg) for arg in args)

    # Handle end parameter
    end = kwargs.get("end", "\n")
    msg += end

    # Handle flush parameter
    flush = kwargs.get("flush", False)

    return msg, flush
