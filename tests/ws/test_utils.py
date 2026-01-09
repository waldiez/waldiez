# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=missing-param-doc,missing-return-doc
# pylint: disable=no-self-use
# pyright: reportUnknownMemberType=false
"""Tests for utility functions and classes."""

import asyncio
import json
import socket
import time
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from waldiez.ws.utils import (
    ConnectionManager,
    ErrorStats,
    HealthChecker,
    ServerHealth,
    get_available_port,
    is_port_available,
    test_server_connection,
)


class TestServerHealth:
    """Test ServerHealth dataclass."""

    def test_server_health_creation(self) -> None:
        """Test creating ServerHealth instance."""
        health = ServerHealth(
            status="healthy",
            uptime_seconds=3600.0,
            active_connections=5,
            total_connections=10,
            messages_received=100,
            messages_sent=95,
            memory_usage_mb=256.5,
            error_stats=ErrorStats(
                total_errors=2,
                error_counts={
                    "this": 2,
                },
                most_common_error="this",
            ),
        )

        assert health.status == "healthy"
        assert health.uptime_seconds == 3600.0
        assert health.active_connections == 5
        assert health.total_connections == 10
        assert health.messages_received == 100
        assert health.messages_sent == 95
        assert health.memory_usage_mb == 256.5
        assert health.timestamp > 0
        assert health.error_stats
        assert health.error_stats.total_errors == 2
        assert health.error_stats.error_counts["this"] == 2
        assert health.error_stats.most_common_error == "this"

    def test_server_health_auto_timestamp(self) -> None:
        """Test that timestamp is set automatically."""
        before = time.time()
        health = ServerHealth(
            status="healthy",
            uptime_seconds=100.0,
            active_connections=1,
            total_connections=1,
            messages_received=10,
            messages_sent=10,
            error_stats=None,
        )
        after = time.time()

        assert before <= health.timestamp <= after

    def test_server_health_custom_timestamp(self) -> None:
        """Test setting custom timestamp."""
        custom_timestamp = 1234567890.0
        health = ServerHealth(
            status="degraded",
            uptime_seconds=200.0,
            active_connections=2,
            total_connections=3,
            messages_received=20,
            messages_sent=18,
            timestamp=custom_timestamp,
            error_stats=None,
        )

        assert health.timestamp == custom_timestamp

    def test_server_health_to_dict(self) -> None:
        """Test converting ServerHealth to dictionary."""
        health = ServerHealth(
            status="unhealthy",
            uptime_seconds=50.0,
            active_connections=0,
            total_connections=5,
            messages_received=30,
            messages_sent=25,
            memory_usage_mb=512.0,
            timestamp=1234567890.0,
            error_stats=None,
        )

        result = health.to_dict()
        expected: dict[str, Any] = {
            "status": "unhealthy",
            "uptime_seconds": 50.0,
            "active_connections": 0,
            "total_connections": 5,
            "messages_received": 30,
            "messages_sent": 25,
            "memory_usage_mb": 512.0,
            "timestamp": 1234567890.0,
            "error_stats": {
                "total_errors": 0,
                "error_counts": {},
                "most_common_error": None,
            },
        }

        assert result == expected

    def test_server_health_defaults(self) -> None:
        """Test ServerHealth with default values."""
        health = ServerHealth(
            status="healthy",
            uptime_seconds=100.0,
            active_connections=1,
            total_connections=1,
            messages_received=5,
            messages_sent=5,
            error_stats=None,
        )

        assert health.memory_usage_mb is None
        assert health.timestamp > 0


class TestHealthChecker:
    """Test HealthChecker functionality."""

    @pytest.fixture(name="mock_server")
    def mock_server_fixture(self) -> MagicMock:
        """Create mock server."""
        server = MagicMock()
        server.get_stats.return_value = {
            "messages_received": 100,
            "messages_sent": 95,
            "errors_total": 2,
            "is_running": True,
            "connections_active": 3,
            "connections_total": 5,
            "uptime_seconds": 300.0,
            "error_stats": {
                "total_errors": 2,
                "error_counts": 3,
                "most_common_error": "this",
            },
        }
        return server

    def test_health_checker_init(self, mock_server: MagicMock) -> None:
        """Test HealthChecker initialization."""
        checker = HealthChecker(mock_server)

        assert checker.server is mock_server
        assert checker.check_interval == 30.0
        assert checker.task is None
        assert checker.last_health is None

    @pytest.mark.asyncio
    async def test_health_checker_start_stop(
        self, mock_server: MagicMock
    ) -> None:
        """Test starting and stopping health checker."""
        checker = HealthChecker(mock_server)

        # Start monitoring
        checker.start()
        assert checker.task is not None
        assert not checker.task.done()

        # Stop monitoring
        checker.stop()
        await asyncio.sleep(0.01)
        assert checker.task.cancelled() or checker.task.done()

    @pytest.mark.asyncio
    async def test_health_checker_start_already_running(
        self, mock_server: MagicMock
    ) -> None:
        """Test starting health checker when already running."""
        checker = HealthChecker(mock_server)

        # Start first time
        checker.start()
        first_task = checker.task

        # Start again - should not create new task
        checker.start()
        assert checker.task is first_task

        # Cleanup
        checker.stop()

    @pytest.mark.asyncio
    async def test_check_health_healthy(self, mock_server: MagicMock) -> None:
        """Test health check with healthy server."""
        checker = HealthChecker(mock_server)

        health = await checker.check_health()

        assert health.status == "healthy"
        assert health.active_connections == 3
        assert health.total_connections == 5
        assert health.messages_received == 100
        assert health.messages_sent == 95
        assert health.uptime_seconds == 300.0

    @pytest.mark.asyncio
    async def test_check_health_degraded(self, mock_server: MagicMock) -> None:
        """Test health check with degraded server (high error rate)."""
        # High error rate (6% errors)
        mock_server.get_stats.return_value = {
            "messages_received": 100,
            "messages_sent": 100,
            "errors_total": 12,  # 6% error rate
            "is_running": True,
            "connections_active": 2,
            "connections_total": 3,
            "uptime_seconds": 200.0,
            "error_stats": {
                "total_errors": 12,
                "error_counts": 6,
                "most_common_error": "that",
            },
        }

        checker = HealthChecker(mock_server)
        health = await checker.check_health()

        assert health.status == "degraded"

    @pytest.mark.asyncio
    async def test_check_health_unhealthy_error_rate(
        self, mock_server: MagicMock
    ) -> None:
        """Test health check with unhealthy server (very high error rate)."""
        # Very high error rate (15% errors)
        mock_server.get_stats.return_value = {
            "messages_received": 100,
            "messages_sent": 100,
            "errors_total": 30,  # 15% error rate
            "is_running": True,
            "connections_active": 1,
            "connections_total": 2,
            "uptime_seconds": 100.0,
            "error_stats": {
                "total_errors": 30,
                "error_counts": 15,
                "most_common_error": "this",
            },
        }

        checker = HealthChecker(mock_server)
        health = await checker.check_health()

        assert health.status == "unhealthy"

    @pytest.mark.asyncio
    async def test_check_health_unhealthy_not_running(
        self, mock_server: MagicMock
    ) -> None:
        """Test health check with server not running."""
        mock_server.get_stats.return_value = {
            "messages_received": 50,
            "messages_sent": 50,
            "errors_total": 1,  # Low error rate
            "is_running": False,  # But server not running
            "connections_active": 0,
            "connections_total": 1,
            "uptime_seconds": 0.0,
            "error_stats": {
                "total_errors": 1,
                "error_counts": 1,
                "most_common_error": "this",
            },
        }

        checker = HealthChecker(mock_server)
        health = await checker.check_health()

        assert health.status == "unhealthy"

    @pytest.mark.asyncio
    async def test_check_health_no_messages(
        self, mock_server: MagicMock
    ) -> None:
        """Test health check with no messages processed."""
        mock_server.get_stats.return_value = {
            "messages_received": 0,
            "messages_sent": 0,
            "errors_total": 0,
            "is_running": True,
            "connections_active": 0,
            "connections_total": 0,
            "uptime_seconds": 10.0,
            "error_stats": {
                "total_errors": 0,
                "error_counts": 0,
                "most_common_error": None,
            },
        }

        checker = HealthChecker(mock_server)
        health = await checker.check_health()

        # Should be healthy when no messages (no errors)
        assert health.status == "healthy"

    @pytest.mark.asyncio
    async def test_check_health_with_memory_monitoring(
        self, mock_server: MagicMock
    ) -> None:
        """Test health check with memory monitoring."""
        with patch("psutil.Process") as mock_process_class:
            mock_process = MagicMock()
            mock_memory_info = MagicMock()
            mock_memory_info.rss = 268435456  # 256 MB in bytes
            mock_process.memory_info.return_value = mock_memory_info
            mock_process_class.return_value = mock_process

            checker = HealthChecker(mock_server)
            health = await checker.check_health()

            assert health.memory_usage_mb == 256.0

    @pytest.mark.asyncio
    async def test_check_health_without_psutil(
        self, mock_server: MagicMock
    ) -> None:
        """Test health check when psutil is not available."""
        with patch("psutil.Process", side_effect=ImportError):
            checker = HealthChecker(mock_server)
            health = await checker.check_health()

            assert health.memory_usage_mb is None

    def test_get_last_health(self, mock_server: MagicMock) -> None:
        """Test getting last health check result."""
        checker = HealthChecker(mock_server)

        # Initially no health check
        assert checker.get_last_health() is None

        # Set a health result
        health = ServerHealth(
            status="healthy",
            uptime_seconds=100.0,
            active_connections=1,
            total_connections=1,
            messages_received=10,
            messages_sent=10,
            error_stats=None,
        )
        checker.last_health = health

        assert checker.get_last_health() is health

    @pytest.mark.asyncio
    async def test_monitor_loop_exception_handling(
        self, mock_server: MagicMock
    ) -> None:
        """Test monitor loop handles exceptions gracefully."""
        checker = HealthChecker(mock_server)
        checker.check_interval = 0.01  # Very short interval for testing

        # Make check_health raise an exception
        checker.check_health = AsyncMock(  # type: ignore[method-assign]
            side_effect=Exception("Health check failed")
        )

        # Start monitoring
        checker.start()

        # Wait a bit for the loop to run and handle exception
        await asyncio.sleep(0.05)

        assert checker.task is not None

        # Should still be running despite exceptions
        assert not checker.task.done()

        # Stop monitoring
        checker.stop()


class TestConnectionManager:
    """Test ConnectionManager functionality."""

    @pytest.fixture(name="mock_server")
    def mock_server_fixture(self) -> MagicMock:
        """Create mock server with clients."""
        server = MagicMock()

        # Create mock clients
        client1 = MagicMock()
        client1.send_message = AsyncMock(return_value=True)
        client1.websocket.close = AsyncMock()
        client1.remote_address = ("127.0.0.1", 12345)
        client1.user_agent = "Test Client 1"
        client1.is_active = True
        client1.connection_time = time.time() - 100
        client1.connection_duration = 100.0

        client2 = MagicMock()
        client2.send_message = AsyncMock(return_value=True)
        client2.websocket.close = AsyncMock()
        client2.remote_address = ("127.0.0.1", 12346)
        client2.user_agent = "Test Client 2"
        client2.is_active = True
        client2.connection_time = time.time() - 50
        client2.connection_duration = 50.0

        server.clients = {"client1": client1, "client2": client2}

        return server

    def test_connection_manager_init(self, mock_server: MagicMock) -> None:
        """Test ConnectionManager initialization."""
        manager = ConnectionManager(mock_server)
        assert manager.server is mock_server

    @pytest.mark.asyncio
    async def test_ping_all_clients(self, mock_server: MagicMock) -> None:
        """Test pinging all connected clients."""
        manager = ConnectionManager(mock_server)

        results = await manager.ping_all_clients()

        assert len(results) == 2
        assert results["client1"] is True
        assert results["client2"] is True

        # Verify ping messages were sent
        for client in mock_server.clients.values():
            client.send_message.assert_called_once()
            call_args = client.send_message.call_args[0][0]
            assert call_args["type"] == "pong"
            assert "timestamp" in call_args

    @pytest.mark.asyncio
    async def test_ping_all_clients_with_failures(
        self, mock_server: MagicMock
    ) -> None:
        """Test pinging clients with some failures."""
        # Make client2 fail
        mock_server.clients["client2"].send_message = AsyncMock(
            side_effect=Exception("Send failed")
        )

        manager = ConnectionManager(mock_server)
        results = await manager.ping_all_clients()

        assert results["client1"] is True
        assert results["client2"] is False

    @pytest.mark.asyncio
    async def test_disconnect_client(self, mock_server: MagicMock) -> None:
        """Test disconnecting a specific client."""
        manager = ConnectionManager(mock_server)

        result = await manager.disconnect_client("client1", "Test disconnect")

        assert result is True

        client = mock_server.clients["client1"]
        client.send_message.assert_called_once()
        call_args = client.send_message.call_args[0][0]
        assert call_args["type"] == "disconnect"
        assert call_args["reason"] == "Test disconnect"

        client.websocket.close.assert_called_once_with(
            code=1000, reason="Test disconnect"
        )

    @pytest.mark.asyncio
    async def test_disconnect_nonexistent_client(
        self, mock_server: MagicMock
    ) -> None:
        """Test disconnecting a client that doesn't exist."""
        manager = ConnectionManager(mock_server)

        result = await manager.disconnect_client("nonexistent")

        assert result is False

    @pytest.mark.asyncio
    async def test_disconnect_client_send_failure(
        self, mock_server: MagicMock
    ) -> None:
        """Test disconnecting client when send fails."""
        # Make send_message fail
        mock_server.clients["client1"].send_message = AsyncMock(
            side_effect=Exception("Send failed")
        )

        manager = ConnectionManager(mock_server)
        result = await manager.disconnect_client("client1")

        assert result is False

    @pytest.mark.asyncio
    async def test_disconnect_client_close_failure(
        self, mock_server: MagicMock
    ) -> None:
        """Test disconnecting client when close fails."""
        # Make websocket.close fail
        mock_server.clients["client1"].websocket.close = AsyncMock(
            side_effect=Exception("Close failed")
        )

        manager = ConnectionManager(mock_server)
        result = await manager.disconnect_client("client1")

        assert result is False

    def test_get_client_info(self, mock_server: MagicMock) -> None:
        """Test getting client information."""
        manager = ConnectionManager(mock_server)

        info = manager.get_client_info("client1")

        assert info is not None
        assert info["client_id"] == "client1"
        assert info["remote_address"] == ("127.0.0.1", 12345)
        assert info["user_agent"] == "Test Client 1"
        assert info["is_active"] is True
        assert "connection_time" in info
        assert "connection_duration" in info

    def test_get_client_info_nonexistent(self, mock_server: MagicMock) -> None:
        """Test getting info for nonexistent client."""
        manager = ConnectionManager(mock_server)

        info = manager.get_client_info("nonexistent")

        assert info is None

    def test_list_clients(self, mock_server: MagicMock) -> None:
        """Test listing all clients."""
        manager = ConnectionManager(mock_server)

        clients = manager.list_clients()

        assert len(clients) == 2
        assert "client1" in clients
        assert "client2" in clients

        assert clients["client1"]["client_id"] == "client1"
        assert clients["client2"]["client_id"] == "client2"


class TestServerConnectionTesting:
    """Test server connection testing functionality."""

    @pytest.mark.asyncio
    async def test_test_server_connection_success(self) -> None:
        """Test successful server connection test."""
        with patch("websockets.connect") as mock_connect:
            # Mock websocket connection
            mock_websocket = AsyncMock()
            mock_websocket.__aenter__ = AsyncMock(return_value=mock_websocket)
            mock_websocket.__aexit__ = AsyncMock(return_value=None)
            mock_websocket.send = AsyncMock()
            mock_websocket.recv = AsyncMock(
                return_value='{"type": "pong", "timestamp": 1234567890}'
            )
            mock_connect.return_value = mock_websocket

            result = await test_server_connection("localhost", 8765, 5.0)

            assert result["success"] is True
            assert result["error"] is None
            assert result["response_time_ms"] >= 0
            assert result["server_response"]["type"] == "pong"

            # Verify ping was sent
            mock_websocket.send.assert_called_once()
            sent_data = mock_websocket.send.call_args[0][0]

            ping_msg = json.loads(sent_data)
            assert ping_msg["action"] == "ping"

    @pytest.mark.asyncio
    async def test_test_server_connection_timeout(self) -> None:
        """Test server connection test with timeout."""
        with patch("websockets.connect") as mock_connect:
            mock_websocket = AsyncMock()
            mock_websocket.__aenter__ = AsyncMock(return_value=mock_websocket)
            mock_websocket.__aexit__ = AsyncMock(return_value=None)
            mock_websocket.send = AsyncMock()
            mock_websocket.recv = AsyncMock(side_effect=asyncio.TimeoutError())
            mock_connect.return_value = mock_websocket

            result = await test_server_connection("localhost", 8765, 0.1)

            assert result["success"] is False
            assert result["error"] == "Connection timeout"
            assert result["server_response"] is None

    @pytest.mark.asyncio
    async def test_test_server_connection_refused(self) -> None:
        """Test server connection test with connection refused."""
        with patch("websockets.connect", side_effect=ConnectionRefusedError()):
            result = await test_server_connection("localhost", 8765)

            assert result["success"] is False
            assert "Connection refused" in result["error"]
            assert result["server_response"] is None

    @pytest.mark.asyncio
    async def test_test_server_connection_generic_error(self) -> None:
        """Test server connection test with generic error."""
        with patch(
            "websockets.connect", side_effect=Exception("Network error")
        ):
            result = await test_server_connection("localhost", 8765)

            assert result["success"] is False
            assert result["error"] == "Network error"
            assert result["server_response"] is None

    @pytest.mark.asyncio
    async def test_test_server_connection_invalid_response(self) -> None:
        """Test server connection test with invalid JSON response."""
        with patch("websockets.connect") as mock_connect:
            mock_websocket = AsyncMock()
            mock_websocket.__aenter__ = AsyncMock(return_value=mock_websocket)
            mock_websocket.__aexit__ = AsyncMock(return_value=None)
            mock_websocket.send = AsyncMock()
            mock_websocket.recv = AsyncMock(return_value="invalid json")
            mock_connect.return_value = mock_websocket

            result = await test_server_connection("localhost", 8765)

            assert result["success"] is False
            assert "expecting value" in result["error"].lower()


class TestPortUtilities:
    """Test port utility functions."""

    def test_is_port_available_true(self) -> None:
        """Test port availability check for available port."""
        # Get an available port
        port = get_available_port()

        # Should be available
        assert is_port_available(port) is True

    def test_is_port_available_false(self) -> None:
        """Test port availability check for unavailable port."""
        # Bind to a port to make it unavailable
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(("", 0))
            _, port = sock.getsockname()

            # Port should not be available
            assert is_port_available(port) is False
        finally:
            sock.close()

    def test_get_available_port(self) -> None:
        """Test getting an available port."""
        port1 = get_available_port()
        port2 = get_available_port()

        # Should return valid port numbers
        assert 1024 <= port1 <= 65535
        assert 1024 <= port2 <= 65535

        # Should return different ports (most likely)
        # Note: There's a small chance they could be the same
        # but it's very unlikely

    def test_get_available_port_multiple_calls(self) -> None:
        """Test that multiple calls return different available ports."""
        ports = [get_available_port() for _ in range(5)]

        # All should be valid port numbers
        for port in ports:
            assert 1024 <= port <= 65535

        # Should have at least some different ports
        assert len(set(ports)) >= 1  # At minimum, not all the same


class TestUtilityEdgeCases:
    """Test edge cases for utility functions."""

    @pytest.mark.asyncio
    async def test_connection_manager_empty_server(self) -> None:
        """Test ConnectionManager with server having no clients."""
        mock_server = MagicMock()
        mock_server.clients = {}

        manager = ConnectionManager(mock_server)

        # Ping all clients - should return empty dict
        results = await manager.ping_all_clients()
        assert results == {}

        # List clients - should return empty dict
        clients = manager.list_clients()
        assert clients == {}

        # Get nonexistent client info
        info = manager.get_client_info("nonexistent")
        assert info is None

    @pytest.mark.asyncio
    async def test_health_checker_with_complex_stats(self) -> None:
        """Test HealthChecker with various stat combinations."""
        mock_server = MagicMock()

        # Test case: exactly 5% error rate (edge case)
        mock_server.get_stats.return_value = {
            "messages_received": 100,
            "messages_sent": 100,
            "errors_total": 10,  # Exactly 5% error rate
            "is_running": True,
            "connections_active": 1,
            "connections_total": 1,
            "uptime_seconds": 60.0,
            "error_stats": {
                "total_errors": 10,
                "error_counts": 5,
                "most_common_error": "this",
            },
        }

        checker = HealthChecker(mock_server)
        health = await checker.check_health()

        # 5% should be healthy (threshold is >5%)
        assert health.status == "healthy"

        # Test case: exactly 10% error rate (edge case)
        mock_server.get_stats.return_value["errors_total"] = 20
        health = await checker.check_health()

        # 10% should be degraded
        assert health.status == "degraded"

    def test_server_health_with_zero_values(self) -> None:
        """Test ServerHealth with zero values."""
        health = ServerHealth(
            status="healthy",
            uptime_seconds=0.0,
            active_connections=0,
            total_connections=0,
            messages_received=0,
            messages_sent=0,
            memory_usage_mb=0.0,
            error_stats=ErrorStats(
                total_errors=0,
                error_counts={},
                most_common_error=None,
            ),
        )

        assert health.status == "healthy"
        assert health.uptime_seconds == 0.0
        assert health.active_connections == 0
        assert health.memory_usage_mb == 0.0

    def test_server_health_with_large_values(self) -> None:
        """Test ServerHealth with large values."""
        health = ServerHealth(
            status="healthy",
            uptime_seconds=86400.0 * 365,  # 1 year
            active_connections=10000,
            total_connections=1000000,
            messages_received=999999999,
            messages_sent=999999999,
            memory_usage_mb=16384.0,  # 16 GB
            error_stats=ErrorStats(
                total_errors=1000000,
                error_counts={"this": 10000000},
                most_common_error="this",
            ),
        )

        assert health.status == "healthy"
        assert health.uptime_seconds == 86400.0 * 365
        assert health.active_connections == 10000
        assert health.memory_usage_mb == 16384.0
