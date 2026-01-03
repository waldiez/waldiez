# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,missing-function-docstring,too-few-public-methods
# pylint: disable=protected-access,too-many-public-methods,missing-param-doc
# pylint: disable=missing-return-doc,missing-yield-doc,missing-raises-doc
# pyright: reportPrivateUsage=false
"""Test waldiez.logger.*."""

import re
from collections.abc import Generator
from contextlib import contextmanager
from unittest.mock import Mock, patch

import pytest

from waldiez.logger import LogLevel, WaldiezLogger, get_logger


@contextmanager
def capture_log_output() -> Generator[Mock, None, None]:
    """Context manager to capture log output."""
    with patch("waldiez.logger.click.echo") as mock_echo:
        yield mock_echo


# Fixtures for common test data
@pytest.fixture(name="logger")
def logger_fixture() -> WaldiezLogger:
    """Create a logger instance for testing."""
    return WaldiezLogger()


class TestLogLevel:
    """Test LogLevel enum functionality."""

    def test_values_and_comparisons(self) -> None:
        """Test LogLevel values and comparisons."""
        assert (
            LogLevel.DEBUG
            < LogLevel.INFO
            < LogLevel.WARNING
            < LogLevel.ERROR
            < LogLevel.CRITICAL
        )
        assert LogLevel.SUCCESS > LogLevel.INFO


class TestLoggerInit:
    """Test WaldiezLogger initialization and defaults."""

    def test_default_and_custom(self) -> None:
        """Test default and custom logger initialization."""
        logger = WaldiezLogger()
        assert logger.get_level() == "info"
        assert "%Y-%m-%d" in logger.get_timestamp_format()

        custom = WaldiezLogger(level="warning", timestamp_format="%H:%M")
        assert custom.get_level() == "warning"
        assert custom.get_timestamp_format() == "%H:%M"

    def test_new_creates_instance_from_scratch(self) -> None:
        """Test that new() creates a fresh logger instance."""
        # Clear the singleton
        WaldiezLogger._instance = None

        logger = WaldiezLogger()
        assert isinstance(logger, WaldiezLogger)
        assert WaldiezLogger._instance is logger

    def test_get_logger_returns_singleton(self) -> None:
        """Test that get_logger returns the same instance."""
        logger1 = get_logger()
        logger2 = get_logger()
        assert logger1 is logger2
        assert isinstance(logger1, WaldiezLogger)


class TestLevelControl:
    """Test WaldiezLogger level control methods."""

    def test_set_get_valid(self, logger: WaldiezLogger) -> None:
        """Test setting and getting valid log levels."""
        for level in ["debug", "info", "warning"]:
            logger.set_level(level)
            assert logger.get_level() == level

    def test_set_invalid_raises(self, logger: WaldiezLogger) -> None:
        """Test setting an invalid log level raises an error."""
        with pytest.raises(ValueError):
            logger.set_level("invalid")

    def test_should_log(self, logger: WaldiezLogger) -> None:
        """Test the _should_log method."""
        logger.set_level("warning")
        assert logger._should_log("error")
        assert not logger._should_log("info")


class TestMessageFormatting:
    """Test WaldiezLogger message formatting methods."""

    @pytest.mark.parametrize(
        "template,args,kwargs,expected",
        [
            ("Hello, {}", ("world",), {}, "Hello, world"),
            ("User: {name}", (), {"name": "Alice"}, "User: Alice"),
            ("Count: %d", (5,), {}, "Count: 5"),
            ("Static text", (), {}, "Static text"),
        ],
    )
    def test_format_success(
        self,
        logger: WaldiezLogger,
        template: str,
        args: tuple[str, ...],
        kwargs: dict[str, str],
        expected: str,
    ) -> None:
        """Test successful message formatting."""
        assert logger._format_args(template, *args, **kwargs) == expected

    def test_format_failure_fallback(self, logger: WaldiezLogger) -> None:
        """Test formatting failure falls back to error message."""
        result = logger._format_args("{missing}", ())
        assert "formatting error" in result

    def test_percent_style_fails(self) -> None:
        """Test percent-style formatting failure."""
        ok, err = WaldiezLogger._try_percent_style("%s %s", "one")
        assert not ok
        assert isinstance(err, Exception)

    def test_format_style_fails(self) -> None:
        """Test format-style formatting failure."""
        ok, err = WaldiezLogger._try_format_style("{x}")
        assert not ok
        assert isinstance(err, Exception)


class TestLogMethods:
    """Test WaldiezLogger log methods."""

    @pytest.mark.parametrize(
        "method,level,label",
        [
            ("debug", "debug", "[DEBUG]"),
            ("info", "info", "[INFO]"),
            ("success", "info", "[SUCCESS]"),
            ("warning", "info", "[WARNING]"),
            ("error", "info", "[ERROR]"),
            ("critical", "info", "[CRITICAL]"),
        ],
    )
    def test_method_output(self, method: str, level: str, label: str) -> None:
        """Test that log methods output the correct label and message."""
        logger = WaldiezLogger(level=level)
        with capture_log_output() as echo:
            getattr(logger, method)("msg")
            echo.assert_called_once()
            out = echo.call_args[0][0]
            assert label in out
            assert "msg" in out

    def test_log_unknown_level(self) -> None:
        """Test logging with an unknown level."""
        logger = WaldiezLogger(level="info")
        with capture_log_output() as echo:
            logger.do_log("unknown", level="nolevel")
            echo.assert_called_once()
            assert "[INFO]" in echo.call_args[0][0]

    def test_exception_logging(self) -> None:
        """Test logging an exception with traceback."""
        logger = WaldiezLogger(level="debug")
        with capture_log_output() as echo:
            # noinspection PyBroadException
            # pylint: disable=broad-exception-caught
            try:
                raise ValueError("boom")
            except Exception:
                logger.exception("Failed")
        calls = [c[0][0] for c in echo.call_args_list]
        assert any("[EXCEPTION]" in line for line in calls)
        assert any("Traceback" in line for line in calls)


class TestIntegration:
    """Test WaldiezLogger integration with different log levels."""

    def test_log_multiple_levels(self) -> None:
        """Test logging at multiple levels."""
        logger = WaldiezLogger(level="info")
        with capture_log_output() as echo:
            logger.debug("skip")
            logger.info("log1")
            logger.error("log2")
            assert echo.call_count == 2
            out = [c[0][0] for c in echo.call_args_list]
            assert any("log1" in line for line in out)
            assert any("log2" in line for line in out)
            assert all("skip" not in line for line in out)

    def test_dynamic_level_change(self) -> None:
        """Test changing log level dynamically."""
        logger = WaldiezLogger(level="error")
        with capture_log_output() as echo:
            logger.info("nope")
            logger.set_level("info")
            logger.info("yes")
            assert echo.call_count == 1
            assert "yes" in echo.call_args[0][0]


class TestMisc:
    """Test miscellaneous WaldiezLogger functionality."""

    def test_caller_info_format(self) -> None:
        """Test that caller info is formatted correctly."""
        logger = WaldiezLogger()
        info = logger._get_caller_info()
        # Could be C://... so let's use the last part of the split
        assert ":" in info and info.split(":")[-1].isdigit()

    def test_timestamp_output(self) -> None:
        """Test that timestamps are formatted correctly."""
        logger = WaldiezLogger(timestamp_format="%H:%M:%S")
        ts = logger._get_timestamp()
        assert re.match(r"\d{2}:\d{2}:\d{2}", ts)

    def test_non_string_message(self) -> None:
        """Test logging non-string messages."""
        logger = WaldiezLogger(level="info")
        with capture_log_output() as echo:
            logger.info([1, 2, 3])
            assert "[1, 2, 3]" in echo.call_args[0][0]
