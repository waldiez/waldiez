# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=duplicate-code
"""Waldiez WebSocket server module."""

import typer
from typer.models import CommandInfo

from .cli import serve
from .client_manager import ClientManager
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
from .server import HAS_WEBSOCKETS, WaldiezWsServer, run_server
from .session_manager import SessionManager
from .utils import (
    ConnectionManager,
    HealthChecker,
    ServerHealth,
    get_available_port,
    is_port_available,
    test_server_connection,
)


def add_ws_app(app: typer.Typer) -> None:
    """Add WebSocket server commands to the CLI.

    Parameters
    ----------
    app : typer.Typer
        The Typer application instance.
    """
    if HAS_WEBSOCKETS:
        app.registered_commands.append(
            CommandInfo(
                name="ws",
                help="Start the Waldiez WebSocket server.",
                callback=serve,
            )
        )


__all__ = [
    "WaldiezWsServer",
    "run_server",
    "ClientManager",
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
    "SessionManager",
    "OperationTimeoutError",
    "WaldiezServerError",
    "get_available_port",
    "is_port_available",
    "add_ws_app",
]
