# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=duplicate-code
"""Waldiez WebSocket server module."""

# from .client import ClientManager
from .errors import (
    ErrorCode,
    ErrorHandler,
    MessageHandlingError,
    MessageParsingError,
    OperationTimeoutError,
    ServerOverloadError,
    UnsupportedActionError,
    WaldiezServerError,
)
from .server import WaldiezWsServer, run_server

# from .session import SessionManager
from .utils import (
    ConnectionManager,
    HealthChecker,
    ServerHealth,
    get_available_port,
    is_port_available,
    test_server_connection,
)

__all__ = [
    "WaldiezWsServer",
    "run_server",
    "ConnectionManager",
    "HealthChecker",
    "ServerHealth",
    "test_server_connection",
    "ErrorHandler",
    "ErrorCode",
    "MessageParsingError",
    "MessageHandlingError",
    "UnsupportedActionError",
    "ServerOverloadError",
    "OperationTimeoutError",
    "WaldiezServerError",
    "get_available_port",
    "is_port_available",
]
