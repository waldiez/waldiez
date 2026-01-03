# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=unused-argument
# pyright: reportUnusedParameter=false

"""Error handling and exceptions for Waldiez WebSocket server."""

import logging
from enum import IntEnum
from typing import Any


class ErrorCode(IntEnum):
    """WebSocket error codes."""

    # Standard WebSocket close codes
    NORMAL_CLOSURE = 1000
    GOING_AWAY = 1001
    PROTOCOL_ERROR = 1002
    UNSUPPORTED_DATA = 1003
    INTERNAL_ERROR = 1011
    TRY_AGAIN_LATER = 1013

    # Custom application error codes (4000-4999 range)
    INVALID_MESSAGE_FORMAT = 4000
    UNSUPPORTED_ACTION = 4001
    SERVER_OVERLOADED = 4002
    INVALID_REQUEST_DATA = 4003
    OPERATION_FAILED = 4004
    NO_INPUT_REQUESTED = 4005
    STALE_INPUT_REQUEST = 4006
    SESSION_NOT_FOUND = 4007
    TIMEOUT = 4008

    @property
    def string(self) -> str:
        """Get the string representation of the error code."""
        # to upper camel case
        return self.name.replace("_", " ").title().replace(" ", "")


class WaldiezServerError(Exception):
    """Base exception for Waldiez server errors."""

    def __init__(
        self,
        message: str,
        error_code: ErrorCode = ErrorCode.INTERNAL_ERROR,
        details: dict[str, Any] | None = None,
    ):
        """Initialize server error.

        Parameters
        ----------
        message : str
            Error message
        error_code : ErrorCode
            Error code
        details : dict[str, Any] | None
            Additional error details
        """
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}

    def to_dict(self) -> dict[str, Any]:
        """Convert error to dictionary.

        Returns
        -------
        Dict[str, Any]
            Error dictionary
        """
        return {
            "type": "error",
            "message": self.message,
            "code": int(self.error_code.value),
            "error_type": self.error_code.string,
            "details": self.details,
        }


class MessageParsingError(WaldiezServerError):
    """Error parsing WebSocket message."""

    def __init__(self, message: str, raw_data: str | None = None):
        """Initialize message parsing error.

        Parameters
        ----------
        message : str
            Error message
        raw_data : str | None
            Raw message data that failed to parse
        """
        details: dict[str, Any] = {}
        if raw_data:
            details["raw_data"] = raw_data[:500]  # Limit size

        super().__init__(
            message,
            ErrorCode.INVALID_MESSAGE_FORMAT,
            details,
        )


class UnsupportedActionError(WaldiezServerError):
    """Error for unsupported message actions."""

    def __init__(self, action: str):
        """Initialize unsupported action error.

        Parameters
        ----------
        action : str
            Unsupported action
        """
        super().__init__(
            f"Unsupported action: {action}",
            ErrorCode.UNSUPPORTED_ACTION,
            {"action": action},
        )


class ServerOverloadError(WaldiezServerError):
    """Error when server is overloaded."""

    def __init__(self, current_clients: int, max_clients: int):
        """Initialize server overload error.

        Parameters
        ----------
        current_clients : int
            Current number of clients
        max_clients : int
            Maximum allowed clients
        """
        super().__init__(
            f"Server overloaded: {current_clients}/{max_clients} clients",
            ErrorCode.SERVER_OVERLOADED,
            {
                "current_clients": current_clients,
                "max_clients": max_clients,
            },
        )


class OperationTimeoutError(WaldiezServerError):
    """Error when operation times out."""

    def __init__(self, operation: str, timeout: float):
        """Initialize operation timeout error.

        Parameters
        ----------
        operation : str
            Operation that timed out
        timeout : float
            Timeout duration in seconds
        """
        super().__init__(
            f"Operation '{operation}' timed out after {timeout} seconds",
            ErrorCode.TIMEOUT,
            {
                "operation": operation,
                "timeout": timeout,
            },
        )


class MessageHandlingError(WaldiezServerError):
    """Error during message processing/business logic."""

    def __init__(
        self,
        operation: str,
        details: str,
        original_error: Exception | None = None,
    ):
        """Initialize message handling error.

        Parameters
        ----------
        operation : str
            The operation that failed (e.g., "save", "run", "convert")
        details : str
            Details about the failure
        original_error : Exception | None
            The original exception that caused this error
        """
        error_details = {"operation": operation, "details": details}
        if original_error:
            error_details["original_error"] = str(original_error)

        super().__init__(
            f"Failed to handle {operation}: {details}",
            ErrorCode.OPERATION_FAILED,
            error_details,
        )


class SessionNotFoundError(WaldiezServerError):
    """Error when a session is not found."""

    def __init__(self, session_id: str):
        """Initialize session not found error.

        Parameters
        ----------
        session_id : str
            The ID of the session that was not found
        """
        super().__init__(
            f"Session not found: {session_id}",
            ErrorCode.SESSION_NOT_FOUND,
            {"session_id": session_id},
        )


class NoInputRequestedError(WaldiezServerError):
    """Error when no user input was requested."""

    def __init__(self) -> None:
        """Initialize no input requested error."""
        super().__init__(
            "No user input requested",
            ErrorCode.NO_INPUT_REQUESTED,
            {},
        )


class StaleInputRequestError(WaldiezServerError):
    """Error when an input request is stale."""

    def __init__(self, request_id: str, expected_id: str):
        """Initialize stale input request error.

        Parameters
        ----------
        request_id : str
            The ID of the stale request
        expected_id : str
            The ID of the expected request
        """
        super().__init__(
            f"Stale input request. Expected {expected_id}, got {request_id}",
            ErrorCode.STALE_INPUT_REQUEST,
            {"request_id": request_id, "expected_id": expected_id},
        )


class ErrorHandler:
    """Centralized error handler for WebSocket server."""

    def __init__(self, logger: logging.Logger | None = None):
        """Initialize error handler.

        Parameters
        ----------
        logger : logging.Logger | None
            Logger instance
        """
        self.logger = logger or logging.getLogger(__name__)
        self.error_counts: dict[str, int] = {}

    # noinspection PyUnusedLocal
    def handle_error(
        self,
        error: Exception,
        context: dict[str, Any] | None = None,
        client_id: str | None = None,
    ) -> dict[str, Any]:
        """Handle an error and return appropriate response.

        Parameters
        ----------
        error : Exception
            The error to handle
        context : dict[str, Any] | None
            Additional context information
        client_id : str | None
            Client ID if error is client-specific

        Returns
        -------
        dict[str, Any]
            Error response to send to client
        """
        # Increment error count
        error_type = type(error).__name__
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1

        # Handle known Waldiez errors
        if isinstance(error, WaldiezServerError):
            self.logger.warning(
                "Waldiez error%s: %s",
                f" (client: {client_id})" if client_id else "",
                error.message,
            )
            return error.to_dict()

        # Handle specific common errors
        if isinstance(error, ValueError):
            self.logger.warning(
                "Validation error%s: %s",
                f" (client: {client_id})" if client_id else "",
                str(error),
            )
            return {
                "type": "error",
                "message": str(error),
                "code": int(ErrorCode.INVALID_REQUEST_DATA),
                "error_type": "ValidationError",
            }

        if isinstance(error, TimeoutError):
            self.logger.warning(
                "Timeout error%s: %s",
                f" (client: {client_id})" if client_id else "",
                str(error),
            )
            return {
                "type": "error",
                "message": "Operation timed out",
                "code": int(ErrorCode.TIMEOUT),
                "error_type": "TimeoutError",
            }

        # Handle unexpected errors
        self.logger.error(
            "Unexpected error%s: %s",
            f" (client: {client_id})" if client_id else "",
            str(error),
            exc_info=True,
        )

        # Return generic error response (don't expose internal details)
        return {
            "type": "error",
            "message": "An internal server error occurred",
            "code": int(ErrorCode.INTERNAL_ERROR),
            "error_type": "InternalError",
        }

    def record_operational_error(
        self, error_type: str, details: str | None = None
    ) -> None:
        """Record an operational error that isn't an exception.

        Parameters
        ----------
        error_type : str
            Type of operational error
            (e.g., "MessageSendFailure", "ConnectionDropped")
        details : str | None
            Optional details about the error
        """
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1

        # Log the operational error
        if details:
            self.logger.warning(
                "Operational error [%s]: %s", error_type, details
            )
        else:
            self.logger.warning("Operational error: %s", error_type)

    def record_send_failure(self, client_id: str | None = None) -> None:
        """Handle message send failures.

        Parameters
        ----------
        client_id : str | None
            Client ID if available
        """
        details = f"client: {client_id}" if client_id else None
        self.record_operational_error("MessageSendFailure", details)

    def record_connection_drop(
        self, client_id: str, reason: str | None = None
    ) -> None:
        """Handle connection drops.

        Parameters
        ----------
        client_id : str
            Client ID
        reason : str | None
            Reason for connection drop
        """
        details = f"client: {client_id}"
        if reason:
            details += f", reason: {reason}"
        self.record_operational_error("ConnectionDropped", details)

    def get_error_stats(self) -> dict[str, Any]:
        """Get error statistics.

        Returns
        -------
        dict[str, Any]
            Error statistics
        """
        total_errors = sum(self.error_counts.values())
        return {
            "total_errors": total_errors,
            "error_counts": self.error_counts.copy(),
            "most_common_error": (
                max(self.error_counts, key=lambda x: self.error_counts[x])
                if self.error_counts
                else None
            ),
        }

    def reset_stats(self) -> None:
        """Reset error statistics."""
        self.error_counts.clear()
