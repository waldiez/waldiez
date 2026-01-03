# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=import-error,line-too-long
# pyright: reportUnknownMemberType=false,reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false,reportAttributeAccessIssue=false
# pyright: reportGeneralTypeIssues=false,reportAny=false
# flake8: noqa: E501
"""Utilities for WebSocket server management."""

import asyncio
import json
import logging
import socket
import time
from contextlib import closing
from dataclasses import asdict, dataclass
from typing import TYPE_CHECKING, Any, final

try:
    import websockets  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped] # noqa
except ImportError:  # pragma: no cover
    from ._mock import websockets  # type: ignore[no-redef,unused-ignore]


if TYPE_CHECKING:
    from .server import WaldiezWsServer


@dataclass
class ErrorStats:
    """Error stats."""

    total_errors: int
    error_counts: dict[str, int]
    most_common_error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary.

        Returns
        -------
        dict[str, Any]
            Dictionary representation of the error stats
        """
        return asdict(self)


@dataclass
class ServerHealth:
    """Server health status."""

    status: str  # "healthy", "degraded", "unhealthy"
    uptime_seconds: float
    active_connections: int
    total_connections: int
    messages_received: int
    messages_sent: int
    memory_usage_mb: float | None = None
    timestamp: float = 0.0
    error_stats: ErrorStats | None = None

    def __post_init__(self) -> None:
        """Set timestamp after initialization."""
        if self.timestamp == 0.0:
            self.timestamp = time.time()
        if not self.error_stats:
            self.error_stats = ErrorStats(
                total_errors=0, error_counts={}, most_common_error=None
            )

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary.

        Returns
        -------
        dict[str, Any]
            Dictionary representation of the health status
        """
        my_dict = asdict(self)
        my_dict["error_stats"] = (
            self.error_stats.to_dict() if self.error_stats else None
        )
        return my_dict


@final
class HealthChecker:
    """Health checker for WebSocket server."""

    def __init__(self, server: "WaldiezWsServer"):
        """Initialize health checker.

        Parameters
        ----------
        server : WaldiezWsServer
            Server instance to monitor
        """
        self.server = server
        self.check_interval = 30.0  # seconds
        self.task: asyncio.Task[Any] | None = None
        self.last_health: ServerHealth | None = None

    def start(self) -> None:
        """Start health monitoring."""
        if self.task and not self.task.done():
            return

        self.task = asyncio.create_task(self._monitor_loop())

    def stop(self) -> None:
        """Stop health monitoring."""
        if self.task and not self.task.done():  # pragma: no branch
            self.task.cancel()

    async def _monitor_loop(self) -> None:
        """Health monitoring loop."""
        while True:
            # pylint: disable=too-many-try-statements,broad-exception-caught
            try:
                await asyncio.sleep(self.check_interval)
                health = await self.check_health()
                self.last_health = health

                # Log health status
                if health.status != "healthy":
                    logger = logging.getLogger(__name__)
                    logger.warning("Server health: %s", health.status)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger = logging.getLogger(__name__)
                logger.error("Health check error: %s", e)

    async def check_health(self) -> ServerHealth:
        """Check server health.

        Returns
        -------
        ServerHealth
            Current health status
        """
        stats = self.server.get_stats()
        # error_handler = self.server.error_handler

        # Determine health status
        status = "healthy"

        # Check for error rate
        total_messages = stats["messages_received"] + stats["messages_sent"]
        if total_messages > 0:
            error_rate = stats["errors_total"] / total_messages
            if error_rate > 0.1:  # More than 10% errors
                status = "unhealthy"
            elif error_rate > 0.05:  # More than 5% errors
                status = "degraded"

        # Check if server is running
        if not stats["is_running"]:
            status = "unhealthy"

        # Get memory usage (optional)
        memory_usage: float | None = None
        try:
            # pylint: disable=import-outside-toplevel
            # noinspection PyUnusedImports
            import psutil

            process = psutil.Process()
            memory_usage = process.memory_info().rss / 1024 / 1024  # MB
        except ImportError:
            pass

        return ServerHealth(
            status=status,
            uptime_seconds=stats["uptime_seconds"],
            active_connections=stats["connections_active"],
            total_connections=stats["connections_total"],
            messages_received=stats["messages_received"],
            messages_sent=stats["messages_sent"],
            memory_usage_mb=memory_usage,
            error_stats=stats["error_stats"],
        )

    def get_last_health(self) -> ServerHealth | None:
        """Get last health check result.

        Returns
        -------
        Optional[ServerHealth]
            Last health status or None if no check performed
        """
        return self.last_health


# noinspection PyBroadException
@final
class ConnectionManager:
    """Manages WebSocket connections and provides utilities."""

    def __init__(self, server: "WaldiezWsServer"):
        """Initialize connection manager.

        Parameters
        ----------
        server : WaldiezWsServer
            Server instance
        """
        self.server = server

    async def ping_all_clients(self) -> dict[str, bool]:
        """Ping all connected clients.

        Returns
        -------
        dict[str, bool]
            Map of client_id to ping success status
        """
        results: dict[str, bool] = {}
        ping_message: dict[str, Any] = {
            "type": "pong",
            "timestamp": time.time(),
        }

        for client_id, client in self.server.clients.items():
            try:
                success = await client.send_message(ping_message)
                results[client_id] = success
            except Exception:  # pylint: disable=broad-exception-caught
                results[client_id] = False

        return results

    async def disconnect_client(
        self, client_id: str, reason: str = "Server initiated"
    ) -> bool:
        """Disconnect a specific client.

        Parameters
        ----------
        client_id : str
            Client to disconnect
        reason : str
            Disconnection reason

        Returns
        -------
        bool
            True if client was disconnected successfully
        """
        if client_id not in self.server.clients:
            return False

        client = self.server.clients[client_id]
        try:
            await client.send_message(
                {
                    "type": "disconnect",
                    "reason": reason,
                    "timestamp": time.time(),
                }
            )
            await client.websocket.close(code=1000, reason=reason)
            return True
        except Exception:  # pylint: disable=broad-exception-caught
            return False

    def get_client_info(self, client_id: str) -> dict[str, Any] | None:
        """Get information about a specific client.

        Parameters
        ----------
        client_id : str
            Client ID

        Returns
        -------
        dict[str, Any] | None
            Client information or None if not found
        """
        if client_id not in self.server.clients:
            return None

        client = self.server.clients[client_id]
        return {
            "client_id": client_id,
            "remote_address": client.remote_address,
            "user_agent": client.user_agent,
            "is_active": client.is_active,
            "connection_time": client.connection_time,
            "connection_duration": client.connection_duration,
        }

    def list_clients(self) -> dict[str, dict[str, Any]]:
        """List all connected clients.

        Returns
        -------
        dict[str, dict[str, Any]]
            Map of client_id to client information
        """
        clients = {
            client_id: self.get_client_info(client_id)
            for client_id in self.server.clients
        }
        return {
            client_id: info
            for client_id, info in clients.items()
            if info is not None
        }


async def test_server_connection(
    host: str = "localhost", port: int = 8765, timeout: float = 5.0
) -> dict[str, Any]:
    """Test connection to WebSocket server.

    Parameters
    ----------
    host : str
        Server host
    port : int
        Server port
    timeout : float
        Connection timeout

    Returns
    -------
    dict[str, Any]
        Test results
    """
    start_time = time.time()
    result: dict[str, Any] = {
        "success": False,
        "error": None,
        "response_time_ms": 0.0,
        "server_response": None,
    }
    # pylint: disable=too-many-try-statements,broad-exception-caught
    try:
        uri = f"ws://{host}:{port}"

        async with websockets.connect(
            uri,
            ping_interval=None,
        ) as websocket:
            # Send ping message
            ping_msg = {"action": "ping"}
            await websocket.send(json.dumps(ping_msg))

            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=timeout)
            result["server_response"] = json.loads(response)
            result["success"] = True

    except asyncio.TimeoutError:
        result["error"] = "Connection timeout"
    except ConnectionRefusedError:
        result["error"] = "Connection refused - server may not be running"
    except Exception as e:
        result["error"] = str(e)

    result["response_time_ms"] = (time.time() - start_time) * 1000
    return result


# noinspection PyBroadException
def is_port_available(port: int) -> bool:
    """Check if the port is available.

    Parameters
    ----------
    port : int
        Port number

    Returns
    -------
    bool
        True if port is available
    """
    # Check IPv4
    try:
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            sock.bind(("", port))
    except BaseException:  # pylint: disable=broad-exception-caught
        return False

    # Check IPv6
    try:  # pragma: no cover
        with closing(
            socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        ) as sock:
            # Disable dual-stack to only check IPv6
            sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 1)
            sock.bind(("", port))
    except BaseException:  # pylint: disable=broad-exception-caught
        return False

    return True


def get_available_port() -> int:
    """Get an available port.

    Returns
    -------
    int
        An available port number
    """
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as soc:
        soc.bind(("", 0))
        soc.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return soc.getsockname()[1]
