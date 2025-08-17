# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-param-doc,missing-return-doc
# pylint: disable=no-self-use
"""Tests for error handling and exceptions."""

import logging
from typing import Any

import pytest

from waldiez.ws.errors import (
    ErrorCode,
    ErrorHandler,
    MessageHandlingError,
    MessageParsingError,
    OperationTimeoutError,
    ServerOverloadError,
    UnsupportedActionError,
    WaldiezServerError,
)


class TestWaldiezServerError:
    """Test base server error class."""

    def test_basic_error(self) -> None:
        """Test basic error creation."""
        error = WaldiezServerError("Test error")
        assert error.message == "Test error"
        assert error.error_code == ErrorCode.INTERNAL_ERROR
        assert not error.details

    def test_error_with_code_and_details(self) -> None:
        """Test error with custom code and details."""
        details: dict[str, Any] = {"key": "value", "number": 42}
        error = WaldiezServerError("Custom error", ErrorCode.TIMEOUT, details)
        assert error.message == "Custom error"
        assert error.error_code == ErrorCode.TIMEOUT
        assert error.details == details

    def test_to_dict(self) -> None:
        """Test error serialization to dictionary."""
        details = {"operation": "test"}
        error = WaldiezServerError(
            "Test error", ErrorCode.INVALID_MESSAGE_FORMAT, details
        )

        error_dict = error.to_dict()
        expected: dict[str, Any] = {
            "type": "error",
            "message": "Test error",
            "code": int(ErrorCode.INVALID_MESSAGE_FORMAT),
            "error_type": ErrorCode.INVALID_MESSAGE_FORMAT.string,
            "details": details,
        }
        assert error_dict == expected


class TestSpecificErrors:
    """Test specific error types."""

    def test_message_parsing_error(self) -> None:
        """Test message parsing error."""
        raw_data = '{"invalid": json}'
        error = MessageParsingError("Invalid JSON", raw_data)

        assert error.message == "Invalid JSON"
        assert error.error_code == ErrorCode.INVALID_MESSAGE_FORMAT
        assert error.details["raw_data"] == raw_data

    def test_message_parsing_error_long_data(self) -> None:
        """Test message parsing error with long raw data."""
        raw_data = "x" * 1000  # Long string
        error = MessageParsingError("Invalid JSON", raw_data)

        # Should truncate long data
        assert len(error.details["raw_data"]) == 500

    def test_unsupported_action_error(self) -> None:
        """Test unsupported action error."""
        error = UnsupportedActionError("invalid_action")

        assert error.message == "Unsupported action: invalid_action"
        assert error.error_code == ErrorCode.UNSUPPORTED_ACTION
        assert error.details["action"] == "invalid_action"

    def test_server_overload_error(self) -> None:
        """Test server overload error."""
        error = ServerOverloadError(10, 5)

        assert "10/5 clients" in error.message
        assert error.error_code == ErrorCode.SERVER_OVERLOADED
        assert error.details["current_clients"] == 10
        assert error.details["max_clients"] == 5

    def test_operation_timeout_error(self) -> None:
        """Test operation timeout error."""
        error = OperationTimeoutError("save", 30.0)

        assert "save" in error.message
        assert "30" in error.message
        assert error.error_code == ErrorCode.TIMEOUT
        assert error.details["operation"] == "save"
        assert error.details["timeout"] == 30.0

    def test_message_handling_error(self) -> None:
        """Test message handling error."""
        original = ValueError("Original error")
        error = MessageHandlingError("run", "Failed to execute", original)

        assert "run" in error.message
        assert "Failed to execute" in error.message
        assert error.error_code == ErrorCode.OPERATION_FAILED
        assert error.details["operation"] == "run"
        assert error.details["details"] == "Failed to execute"
        assert error.details["original_error"] == str(original)

    def test_message_handling_error_no_original(self) -> None:
        """Test message handling error without original exception."""
        error = MessageHandlingError("convert", "Invalid format")

        assert error.details["operation"] == "convert"
        assert error.details["details"] == "Invalid format"
        assert "original_error" not in error.details


class TestErrorHandler:
    """Test error handler functionality."""

    def test_error_handler_init(self) -> None:
        """Test error handler initialization."""
        handler = ErrorHandler()
        assert not handler.error_counts
        assert handler.logger is not None

    def test_error_handler_with_logger(self) -> None:
        """Test error handler with custom logger."""
        logger = logging.getLogger("test")
        handler = ErrorHandler(logger)
        assert handler.logger is logger

    def test_handle_waldiez_error(self) -> None:
        """Test handling of WaldiezServerError."""
        handler = ErrorHandler()
        error = MessageParsingError("Invalid JSON")

        response = handler.handle_error(error, client_id="test_client")

        assert response["type"] == "error"
        assert response["message"] == "Invalid JSON"
        assert response["code"] == int(ErrorCode.INVALID_MESSAGE_FORMAT)
        assert handler.error_counts["MessageParsingError"] == 1

    def test_handle_value_error(self) -> None:
        """Test handling of ValueError."""
        handler = ErrorHandler()
        error = ValueError("Invalid value")

        response = handler.handle_error(error, client_id="test_client")

        assert response["type"] == "error"
        assert response["message"] == "Invalid value"
        assert response["code"] == int(ErrorCode.INVALID_REQUEST_DATA)
        assert response["error_type"] == "ValidationError"
        assert handler.error_counts["ValueError"] == 1

    def test_handle_timeout_error(self) -> None:
        """Test handling of TimeoutError."""
        handler = ErrorHandler()
        error = TimeoutError("Operation timed out")

        response = handler.handle_error(error)

        assert response["type"] == "error"
        assert response["message"] == "Operation timed out"
        assert response["code"] == int(ErrorCode.TIMEOUT)
        assert response["error_type"] == "TimeoutError"

    def test_handle_unexpected_error(self) -> None:
        """Test handling of unexpected errors."""
        handler = ErrorHandler()
        error = RuntimeError("Unexpected error")

        response = handler.handle_error(error, client_id="test_client")

        assert response["type"] == "error"
        assert response["message"] == "An internal server error occurred"
        assert response["code"] == int(ErrorCode.INTERNAL_ERROR)
        assert response["error_type"] == "InternalError"
        assert handler.error_counts["RuntimeError"] == 1

    def test_handle_error_with_context(self) -> None:
        """Test error handling with context."""
        handler = ErrorHandler()
        error = ValueError("Test error")
        context = {"operation": "test", "data": "test_data"}

        response = handler.handle_error(error, context, "client_123")

        assert response["type"] == "error"
        # Context is logged but not returned to client

    def test_record_operational_error(self) -> None:
        """Test recording operational errors."""
        handler = ErrorHandler()

        handler.record_operational_error("MessageSendFailure", "Network issue")
        assert handler.error_counts["MessageSendFailure"] == 1

        handler.record_operational_error("MessageSendFailure")
        assert handler.error_counts["MessageSendFailure"] == 2

    def test_record_send_failure(self) -> None:
        """Test recording send failures."""
        handler = ErrorHandler()

        handler.record_send_failure("client_123")
        assert handler.error_counts["MessageSendFailure"] == 1

        handler.record_send_failure()
        assert handler.error_counts["MessageSendFailure"] == 2

    def test_record_connection_drop(self) -> None:
        """Test recording connection drops."""
        handler = ErrorHandler()

        handler.record_connection_drop("client_123", "Network error")
        assert handler.error_counts["ConnectionDropped"] == 1

        handler.record_connection_drop("client_456")
        assert handler.error_counts["ConnectionDropped"] == 2

    def test_get_error_stats(self) -> None:
        """Test getting error statistics."""
        handler = ErrorHandler()

        # Initially no errors
        stats = handler.get_error_stats()
        assert stats["total_errors"] == 0
        assert not stats["error_counts"]
        assert stats["most_common_error"] is None

        # Add some errors
        handler.handle_error(ValueError("Error 1"))
        handler.handle_error(ValueError("Error 2"))
        handler.handle_error(RuntimeError("Error 3"))

        stats = handler.get_error_stats()
        assert stats["total_errors"] == 3
        assert stats["error_counts"]["ValueError"] == 2
        assert stats["error_counts"]["RuntimeError"] == 1
        assert stats["most_common_error"] == "ValueError"

    def test_reset_stats(self) -> None:
        """Test resetting error statistics."""
        handler = ErrorHandler()

        # Add some errors
        handler.handle_error(ValueError("Error"))
        handler.record_operational_error("TestError")

        assert handler.error_counts

        # Reset
        handler.reset_stats()
        assert not handler.error_counts

        stats = handler.get_error_stats()
        assert stats["total_errors"] == 0


class TestErrorCodes:
    """Test error code enumeration."""

    def test_error_code_values(self) -> None:
        """Test that error codes have expected values."""
        assert ErrorCode.NORMAL_CLOSURE == 1000
        assert ErrorCode.GOING_AWAY == 1001
        assert ErrorCode.PROTOCOL_ERROR == 1002
        assert ErrorCode.UNSUPPORTED_DATA == 1003
        assert ErrorCode.INTERNAL_ERROR == 1011
        assert ErrorCode.TRY_AGAIN_LATER == 1013

        # Custom codes in 4000-4999 range
        assert 4000 <= ErrorCode.INVALID_MESSAGE_FORMAT <= 4999
        assert 4000 <= ErrorCode.UNSUPPORTED_ACTION <= 4999
        assert 4000 <= ErrorCode.SERVER_OVERLOADED <= 4999
        assert 4000 <= ErrorCode.INVALID_REQUEST_DATA <= 4999
        assert 4000 <= ErrorCode.OPERATION_FAILED <= 4999
        assert 4000 <= ErrorCode.TIMEOUT <= 4999

    def test_error_code_int_conversion(self) -> None:
        """Test error code to int conversion."""
        assert int(ErrorCode.NORMAL_CLOSURE) == 1000
        assert int(ErrorCode.INVALID_MESSAGE_FORMAT) == 4000


class TestErrorHandlerLogging:
    """Test error handler logging functionality."""

    def test_error_logging(self, caplog: pytest.LogCaptureFixture) -> None:
        """Test that errors are properly logged."""
        with caplog.at_level(logging.WARNING):
            handler = ErrorHandler()
            error = MessageParsingError("Test parsing error")

            handler.handle_error(error, client_id="test_client")

            assert (
                "Waldiez error (client: test_client): Test parsing error"
                in caplog.text
            )

    def test_unexpected_error_logging(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test that unexpected errors are logged at ERROR level."""
        with caplog.at_level(logging.ERROR):
            handler = ErrorHandler()
            error = RuntimeError("Unexpected runtime error")

            handler.handle_error(error, client_id="test_client")
            msg = (
                "Unexpected error (client: test_client): "
                "Unexpected runtime error"
            )
            assert msg in caplog.text

    def test_operational_error_logging(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test that operational errors are logged."""
        with caplog.at_level(logging.WARNING):
            handler = ErrorHandler()

            handler.record_operational_error("TestError", "Test details")

            assert "Operational error [TestError]: Test details" in caplog.text
