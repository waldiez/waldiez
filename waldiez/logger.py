# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=broad-exception-caught,too-many-try-statements
"""Waldiez logger."""

from __future__ import annotations

import inspect
import logging
import os
import re
import string
import threading
import traceback
from collections.abc import Mapping
from datetime import datetime, timezone
from enum import IntEnum
from pathlib import Path
from types import TracebackType
from typing import Any, Callable

import click
from typing_extensions import override

HERE = Path(__file__).parent


class LogLevel(IntEnum):
    """Log level enumeration for comparison."""

    DEBUG = 10
    INFO = 20
    SUCCESS = 21
    WARNING = 30
    ERROR = 40
    CRITICAL = 50


class WaldiezLogger(logging.Logger):
    """A colorful logger implementation using Click.

    Supports both .format() and %-style formatting:
       - logger.info("Hello {name}!", name="world")
       - logger.info("Hello %s!", "world")
       - logger.info("User {user} has {count} items", user="john", count=5)
    """

    _instance: WaldiezLogger | None = None
    _lock: threading.Lock = threading.Lock()

    _INTERNAL_METHODS = {
        "_get_caller_info",
        "_format_message",
        "log",
        "debug",
        "info",
        "success",
        "warning",
        "error",
        "critical",
        "exception",
    }
    _level_map: dict[str, LogLevel] = {
        "DEBUG": LogLevel.DEBUG,
        "INFO": LogLevel.INFO,
        "SUCCESS": LogLevel.SUCCESS,
        "WARNING": LogLevel.WARNING,
        "ERROR": LogLevel.ERROR,
        "CRITICAL": LogLevel.CRITICAL,
    }
    # Map levels to click styling functions
    _style_map: dict[str, Callable[[str], str]] = {
        "DEBUG": lambda msg: click.style(msg, dim=True),
        "INFO": lambda msg: click.style(msg, fg="blue"),
        "SUCCESS": lambda msg: click.style(msg, fg="green"),
        "WARNING": lambda msg: click.style(msg, fg="yellow"),
        "ERROR": lambda msg: click.style(msg, fg="red"),
        "CRITICAL": lambda msg: click.style(msg, fg="red", bold=True),
        "EXCEPTION": lambda msg: click.style(msg, fg="red", bold=True),
    }

    def __new__(cls, *args: Any, **kwargs: Any) -> "WaldiezLogger":
        """Ensure only one instance of the logger is created."""
        for level_name, level_value in LogLevel.__members__.items():
            logging.addLevelName(level_value, level_name)
        if cls._instance is None:
            with cls._lock:
                # Double-check locking pattern
                if cls._instance is None:  # pragma: no branch
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(
        self,
        level: str = "info",
        timestamp_format: str = "%Y-%m-%d %H:%M:%S",
    ) -> None:
        """Initialize the logger with a default level.

        Parameters
        ----------
        level : str, optional
            Initial logging level, by default "info"
        timestamp_format : str, optional
            Timestamp format string, by default "%Y-%m-%d %H:%M:%S"
        """
        super().__init__(self.__class__.__name__)
        for level_name, level_value in LogLevel.__members__.items():
            logging.addLevelName(level_value, level_name)
        if getattr(self, "_initialized", False) is True:
            if level != self.get_level():
                self.set_level(level)
            if (
                self._instance
                and self._instance.get_timestamp_format() != timestamp_format
            ):
                self._instance.set_timestamp_format(timestamp_format)
            return
        self._initialized = True
        self._level = level.upper()
        self._timestamp_format = timestamp_format
        if self.get_level() != level:
            self.set_level(level)
        if (
            self._instance
            and self._instance.get_timestamp_format() != timestamp_format
        ):
            self._instance.set_timestamp_format(timestamp_format)

    @classmethod
    def get_instance(
        cls,
        level: str = "info",
        timestamp_format: str = "%Y-%m-%d %H:%M:%S",
    ) -> "WaldiezLogger":
        """Get the singleton instance.

        Parameters
        ----------
        level : str, optional
            Initial logging level, by default "info"
        timestamp_format : str, optional
            Timestamp format string, by default "%Y-%m-%d %H:%M:%S"

        Returns
        -------
        WaldiezLogger
            The singleton logger instance
        """
        return cls(level, timestamp_format)

    def _get_level_name(self, level: int) -> str:
        """Get the string name of the logging level.

        Parameters
        ----------
        level : int
            The logging level.

        Returns
        -------
        str
            The string name of the logging level.
        """
        for name, lvl in self._level_map.items():
            if lvl == level:
                return name
        return self.get_level()

    def _get_level_number(self, level: str) -> int:
        """Get the numeric value of the logging level.

        Parameters
        ----------
        level : str
            The logging level.

        Returns
        -------
        int
            The numeric value of the logging level.
        """
        return self._level_map.get(level.upper(), LogLevel.INFO)

    # pylint: disable=unused-argument
    @override
    def log(
        self,
        level: int,
        msg: object,
        *args: object,
        exc_info: (
            bool
            | tuple[type[BaseException], BaseException, TracebackType | None]
            | tuple[None, None, None]
            | BaseException
            | None
        ) = None,
        stack_info: bool = False,
        stacklevel: int = 1,
        extra: Mapping[str, object] | None = None,
        **kwargs: object,
    ) -> None:
        """Log a message with the specified level.

        Parameters
        ----------
        level : int
            The logging level to use (e.g., logging.DEBUG, logging.INFO, etc.).
        msg : object
            The message to log or message template for formatting.
        *args : object
            Arguments to format into the message.
        exc_info :
            bool |
            tuple[type[BaseException], BaseException, TracebackType | None] |
            tuple[None, None, None] |
            BaseException |
            None
            Exception information to include in the log.
        stack_info : bool
            Whether to include stack information in the log.
        stacklevel : int
            The stack level to use for the log.
        extra : Mapping[str, object] | None
            Extra context information to include in the log.
        **kwargs : object
            Additional keyword arguments for formatting.

        """
        level_str = self._get_level_name(level)
        if self._should_log(level_str):
            # noinspection PyArgumentList
            formatted_message_content = self._format_args(msg, *args, **kwargs)
            formatted_message = self._format_message(
                formatted_message_content, level_str
            )
            click.echo(formatted_message)

    def do_log(self, msg: Any, *args: Any, level: str, **kwargs: Any) -> None:
        """Log a message with the specified level.

        Parameters
        ----------
        msg : Any
            The message to log or message template for formatting.
        *args : Any
            Arguments to format into the message.
        level : str
            The logging level.
        **kwargs : Any
            Additional keyword arguments for formatting.
        """
        level_int = self._get_level_number(level)
        self.log(level_int, msg, *args, **kwargs)

    @override
    def debug(self, msg: Any, *args: Any, **kwargs: Any) -> None:
        """Log a debug message.

        Parameters
        ----------
        msg : Any
            The debug message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Additional keyword arguments for formatting.
        """
        self.do_log(msg, *args, level="debug", **kwargs)

    @override
    def info(self, msg: Any, *args: Any, **kwargs: Any) -> None:
        """Log an informational message.

        Parameters
        ----------
        msg : Any
            The informational message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Additional keyword arguments for formatting.
        """
        self.do_log(msg, *args, level="info", **kwargs)

    def success(self, msg: Any, *args: Any, **kwargs: Any) -> None:
        """Log a success message.

        Parameters
        ----------
        msg : Any
            The success message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Additional keyword arguments for formatting.
        """
        self.do_log(msg, *args, level="success", **kwargs)

    @override
    def warning(self, msg: Any, *args: Any, **kwargs: Any) -> None:
        """Log a warning message.

        Parameters
        ----------
        msg : Any
            The warning message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Additional keyword arguments for formatting.
        """
        self.do_log(msg, *args, level="warning", **kwargs)

    @override
    def error(self, msg: Any, *args: Any, **kwargs: Any) -> None:
        """Log an error message.

        Parameters
        ----------
        msg : Any
            The error message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Additional keyword arguments for formatting.
        """
        self.do_log(msg, *args, level="error", **kwargs)

    @override
    def critical(self, msg: Any, *args: Any, **kwargs: Any) -> None:
        """Log a critical error message.

        Parameters
        ----------
        msg : Any
            The critical error message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Additional keyword arguments for formatting.
        """
        self.do_log(msg, *args, level="critical", **kwargs)

    @override
    def exception(self, msg: Any, *args: Any, **kwargs: Any) -> None:
        """Log an exception message.

        Parameters
        ----------
        msg : Any
            The exception message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Additional keyword arguments for formatting.
        """
        formatted_message_content = self._format_args(msg, *args, **kwargs)
        formatted_message = self._format_message(
            formatted_message_content, "exception"
        )
        click.echo(formatted_message)
        tb = traceback.format_exc()
        if tb and "NoneType: None" not in tb:  # pragma: no branch
            click.echo(click.style(tb, fg="red", dim=True))

    @override
    def setLevel(self, level: int | str) -> None:
        """
        Set the logging level.

        Parameters
        ----------
        level : int | str
            The logging level to set
            (e.g., "debug", "info", "warning", "error", "critical").
        """
        level_str = (
            level if isinstance(level, str) else self._get_level_name(level)
        )
        self.set_level(level_str)

    def set_level(self, level: str) -> None:
        """Set the logging level.

        Parameters
        ----------
        level : str
            The logging level to set
            (e.g., "debug", "info", "warning", "error", "critical").

        Raises
        ------
        ValueError
            If the provided level is invalid.
        """
        level_upper = level.upper()
        if level_upper in self._level_map:
            self._level = level_upper
            super().setLevel(self._level_map[level_upper].value)
        else:
            msg = (
                f"Invalid log level: {level}. "
                f"Valid levels are: {list(self._level_map.keys())}"
            )
            raise ValueError(msg)

    def get_level(self) -> str:
        """Get the current logging level.

        Returns
        -------
        str
            The current logging level.
        """
        return self._level.lower()

    def get_timestamp_format(self) -> str:
        """Get the current timestamp format.

        Returns
        -------
        str
            The current timestamp format string.
        """
        return self._timestamp_format

    def set_timestamp_format(self, timestamp_format: str) -> None:
        """Set the timestamp format for log messages.

        Parameters
        ----------
        timestamp_format : str
            The new timestamp format string.
        """
        self._timestamp_format = timestamp_format

    def _should_log(self, level: str) -> bool:
        """Check if a message should be logged based on current level."""
        current_level_value = self._level_map.get(self._level, LogLevel.INFO)
        message_level_value = self._level_map.get(level.upper(), LogLevel.INFO)
        return message_level_value >= current_level_value

    @classmethod
    def _get_caller_info(cls) -> str:
        """Get caller information (filename and line number) from the stack."""
        frame = inspect.currentframe()
        # noinspection PyBroadException
        try:
            if frame is None:  # pragma: no cover
                return ""
            # Walk up the call stack until we find a frame that's not internal
            current_frame = frame.f_back  # Skip _get_caller_info itself
            while current_frame is not None:
                code = current_frame.f_code
                function_name = code.co_name
                filename = code.co_filename

                # Skip frames that are internal to the logger
                if cls._is_internal_frame(function_name, filename):
                    current_frame = current_frame.f_back
                    continue
                # Found the actual caller
                line_number = current_frame.f_lineno
                return cls._format_caller_display(filename, line_number)
            return ""  # pragma: no cover
        except Exception:  # pragma: no cover
            # If anything goes wrong, silently return empty string
            # Logging shouldn't crash the application
            return ""
        finally:
            del frame  # Prevent reference cycles

    @classmethod
    def _is_internal_frame(cls, function_name: str, filename: str) -> bool:
        """Check if a frame is internal to the logger and should be skipped."""
        if function_name in cls._INTERNAL_METHODS:
            return True
        # Skip if it's in the same file as the logger (this file)
        logger_file = os.path.abspath(__file__)
        frame_file = os.path.abspath(filename)
        if frame_file == logger_file:  # pragma: no cover
            return True
        if function_name.startswith("_log") or function_name.endswith("_log"):
            return True
        if function_name == "<lambda>":  # pragma: no cover
            return True
        return False

    @staticmethod
    def _format_caller_display(filename: str, line_number: int) -> str:
        """Format the caller information for display."""
        full_path = Path(filename).resolve()
        try:
            relative = full_path.relative_to(Path.cwd())
        except ValueError:  # pragma: no cover
            try:
                relative = full_path.relative_to(HERE.parent)
            except ValueError:  # pragma: no cover
                relative = full_path
        return f"{relative}:{line_number}"

    def _get_timestamp(self) -> str:
        """Get the current timestamp in a human-readable format."""
        return datetime.now(timezone.utc).strftime(self._timestamp_format)

    @staticmethod
    def _has_format_braces(msg_str: str) -> bool:
        """Check if the message contains .format() style placeholders."""
        # noinspection PyBroadException
        try:
            formatter = string.Formatter()
            for _, field_name, _, _ in formatter.parse(msg_str):
                if field_name is not None:
                    return True
            return False
        except Exception:  # pylint: disable=broad-exception-caught
            return False

    @staticmethod
    def _has_percent_placeholders(msg_str: str) -> bool:
        """Check if the message contains %-style placeholders."""
        return bool(re.search(r"%[sdifgGexXocr%]", msg_str))

    @staticmethod
    def _try_format_style(
        msg_str: str, *args: Any, **kwargs: Any
    ) -> tuple[bool, Any]:
        """Attempt .format() formatting, returning (success, result)."""
        try:
            # noinspection StrFormat
            return True, msg_str.format(*args, **kwargs)
        except Exception as e:
            return False, e

    @staticmethod
    def _try_percent_style(msg_str: str, *args: Any) -> tuple[bool, Any]:
        """Attempt %-style formatting, returning (success, result)."""
        try:
            return True, msg_str % args
        except Exception as e:
            return False, e

    # pylint: disable=too-many-return-statements
    def _format_args(self, message: Any, *args: Any, **kwargs: Any) -> str:
        """Format message with arguments, similar to standard logging."""
        if not args and not kwargs:
            return str(message)
        msg_str = str(message)
        has_format = self._has_format_braces(msg_str)
        has_percent = self._has_percent_placeholders(msg_str)
        # Prefer .format() if curly braces detected
        if has_format:
            ok, res = self._try_format_style(msg_str, *args, **kwargs)
            if ok:
                return res
            # If .format() fails and % placeholders exist, try % formatting
            if has_percent and args and not kwargs:  # pragma: no cover
                ok2, res2 = self._try_percent_style(msg_str, *args)
                if ok2:
                    return res2
            return (
                f"{msg_str} (formatting error: {res}, "
                f"args: {args}, kwargs: {kwargs})"
            )
        # Use % formatting if % placeholders present and args (but no kwargs)
        if has_percent and args and not kwargs:
            ok, res = self._try_percent_style(msg_str, *args)
            if ok:
                return res
            return (  # pragma: no cover
                f"{msg_str} (formatting error: {res}, "
                f"args: {args}, kwargs: {kwargs})"
            )
        # we would never reach here (handled before calling this method)
        return msg_str  # pragma: no cover

    def _format_message(self, message: Any, level: str) -> str:
        """Format a log message with level and styling."""
        level_upper = level.upper()

        def _fallback_style(msg: str) -> str:
            return msg

        parts: list[str] = []
        styled_level = self._style_map.get(level_upper, _fallback_style)(
            f"[{level_upper}]"
        )
        parts.append(styled_level)
        timestamp = self._get_timestamp()
        timestamp_styled = click.style(timestamp, dim=True)
        parts.append(timestamp_styled)
        caller_info = self._get_caller_info()
        if caller_info:  # pragma: no branch
            caller_styled = click.style(f"[{caller_info}]", dim=True)
            parts.append(caller_styled)
        prefix = " ".join(parts)
        return f"{prefix} {message}"


def get_logger(
    level: str = "info", timestamp_format: str = "%Y-%m-%d %H:%M:%S"
) -> WaldiezLogger:
    """Get the singleton logger instance.

    Parameters
    ----------
    level : str
        The logging level to use (default: "info").
    timestamp_format : str
        The timestamps format in log messages (default: "%Y-%m-%d %H:%M:%S").

    Returns
    -------
    WaldiezLogger
        The singleton logger instance.
    """
    return WaldiezLogger.get_instance(
        level=level, timestamp_format=timestamp_format
    )
