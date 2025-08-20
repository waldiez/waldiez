# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-param-doc,missing-return-doc
# pylint: disable=no-self-use,unused-argument,too-many-try-statements
# pylint: disable=broad-exception-caught,protected-access,
# pylint: disable=attribute-defined-outside-init,missing-raises-doc
# pyright: reportPrivateUsage=false,reportUnknownMemberType=false
"""Tests for WebSocket server functionality."""

import asyncio
import json
import re
import signal
import time
from collections import deque
from pathlib import Path
from types import SimpleNamespace
from typing import Any, AsyncIterator, Iterable
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import websockets

from waldiez.ws.server import WaldiezWsServer, run_server
from waldiez.ws.utils import get_available_port


class FakeWebSocket:
    """Fake WebSocket for testing."""

    def __init__(
        self,
        messages: Iterable[Any] = ('{"action": "ping"}',),
        *,
        remote: tuple[str, int] = ("127.0.0.1", 12345),
        headers: dict[str, str] | None = None,
    ) -> None:
        self._queue = deque(messages)
        self.remote_address = remote
        self.request = SimpleNamespace(
            headers=headers or {"User-Agent": "Test Client"}
        )
        self.request_headers = self.request.headers
        self._closed = False

    async def send(self, data: Any) -> None:
        """Send a message."""
        await asyncio.sleep(0.1)

    async def close(self) -> None:
        """Close the WebSocket connection."""
        self._closed = True
        await asyncio.sleep(0.1)

    async def recv(self) -> Any:
        """Receive a message."""
        if self._queue:
            return self._queue.popleft()
        if self._closed:
            # match the real behavior: async iterator stops on normal closure
            raise websockets.ConnectionClosedOK(None, None, None)
        await asyncio.sleep(0.1)
        raise websockets.ConnectionClosedOK(None, None, None)

    def __aiter__(self) -> AsyncIterator[Any]:
        """Return an asynchronous iterator."""
        return self

    async def __anext__(self) -> Any:
        """Return the next message."""
        return await self.recv()


class TestWaldiezWsServer:
    """Test WebSocket server functionality."""

    def setup_method(self) -> None:
        """Set up test method."""
        self.host = "localhost"
        self.port = get_available_port()

    def test_server_init_defaults(self) -> None:
        """Test server initialization with default parameters."""
        server = WaldiezWsServer()

        assert server.host == "localhost"
        assert server.port == 8765
        assert server.max_clients == 1
        assert server.allowed_origins is None
        assert server.ping_interval == 20.0
        assert server.ping_timeout == 20.0
        assert server.close_timeout == 10.0
        assert server.max_size == 2**23
        assert server.max_queue == 32
        assert server.write_limit == 2**16

        assert not server.is_running
        assert server.server is None
        assert not server.clients
        assert server.start_time == 0.0

    def test_server_init_custom(self) -> None:
        """Test server initialization with custom parameters."""
        allowed_origins = [re.compile(r".*\.example\.com")]

        server = WaldiezWsServer(
            host="0.0.0.0",
            port=9000,
            max_clients=5,
            allowed_origins=allowed_origins,
            ping_interval=30.0,
            ping_timeout=25.0,
            close_timeout=15.0,
            max_size=1024**2,
            max_queue=64,
            write_limit=8192,
        )

        assert server.host == "0.0.0.0"
        assert server.port == 9000
        assert server.max_clients == 5
        assert server.allowed_origins == allowed_origins
        assert server.ping_interval == 30.0
        assert server.ping_timeout == 25.0
        assert server.close_timeout == 15.0
        assert server.max_size == 1024**2
        assert server.max_queue == 64
        assert server.write_limit == 8192

    @pytest.mark.asyncio
    async def test_server_start_stop(self) -> None:
        """Test basic server start and stop."""
        server = WaldiezWsServer(host=self.host, port=self.port)

        # Start server in background task
        start_task = asyncio.create_task(server.start())
        await asyncio.sleep(0.5)  # Give server time to start

        try:
            assert server.is_running
            assert server.server is not None
            assert server.start_time > 0

        finally:
            # Stop server
            server.shutdown()
            await asyncio.wait_for(start_task, timeout=2.0)

        assert not server.is_running
        assert len(server.clients) == 0

    @pytest.mark.asyncio
    async def test_server_already_running(self) -> None:
        """Test starting server when already running."""
        server = WaldiezWsServer(host=self.host, port=self.port)

        start_task = asyncio.create_task(server.start())
        await asyncio.sleep(0.1)

        try:
            # Try to start again - should do nothing
            await server.start()
            assert server.is_running

        finally:
            server.shutdown()
            await asyncio.wait_for(start_task, timeout=2.0)

    @pytest.mark.asyncio
    async def test_server_stop_not_running(self) -> None:
        """Test stopping server when not running."""
        server = WaldiezWsServer(host=self.host, port=self.port)

        # Should not raise exception
        await server.stop()
        assert not server.is_running

    @pytest.mark.asyncio
    async def test_server_port_unavailable(self) -> None:
        """Test server behavior when port is not available."""
        # Start first server
        server1 = WaldiezWsServer(host=self.host, port=self.port)
        start_task1 = asyncio.create_task(server1.start())
        await asyncio.sleep(0.5)

        try:
            # Start second server on same port
            server2 = WaldiezWsServer(host=self.host, port=self.port)
            start_task2 = asyncio.create_task(server2.start())
            await asyncio.sleep(0.5)

            # Second server should pick different port
            assert server2.port != self.port
            assert server2.is_running

            server2.shutdown()
            await asyncio.wait_for(start_task2, timeout=2.0)

        finally:
            server1.shutdown()
            await asyncio.wait_for(start_task1, timeout=2.0)

    @pytest.mark.asyncio
    async def test_client_connection_limit(self) -> None:
        """Test client connection limit enforcement."""
        server = WaldiezWsServer(host=self.host, port=self.port, max_clients=1)

        start_task = asyncio.create_task(server.start())
        await asyncio.sleep(0.1)

        try:
            # Mock WebSocket connections
            mock_websocket1 = FakeWebSocket()

            mock_websocket2 = FakeWebSocket()
            mock_websocket2.close = AsyncMock()  # type: ignore

            # First client should connect
            handle_task1 = asyncio.create_task(
                server._handle_client(mock_websocket1)  # type: ignore
            )
            await asyncio.sleep(0.1)

            assert len(server.clients) == 1

            # Second client should be rejected
            handle_task2 = asyncio.create_task(
                server._handle_client(mock_websocket2)  # type: ignore
            )
            await asyncio.sleep(0.1)

            # Second client should be closed
            mock_websocket2.close.assert_called_once()

            # Clean up
            handle_task1.cancel()
            handle_task2.cancel()
            try:
                await handle_task1
            except asyncio.CancelledError:
                pass
            try:
                await handle_task2
            except asyncio.CancelledError:
                pass

        finally:
            server.shutdown()
            await asyncio.wait_for(start_task, timeout=2.0)

    @pytest.mark.asyncio
    async def test_message_handling(self) -> None:
        """Test client message handling."""
        server = WaldiezWsServer(host=self.host, port=self.port)

        start_task = asyncio.create_task(server.start())
        await asyncio.sleep(0.1)

        try:
            # Mock WebSocket connection with ping message
            ping_message = json.dumps(
                {"action": "ping", "echo_data": {"test": "data"}}
            )

            mock_websocket = FakeWebSocket([ping_message])

            # Mock client manager
            mock_client_manager = MagicMock()
            mock_client_manager.handle_message = AsyncMock(return_value=None)
            mock_client_manager.send_message = AsyncMock(return_value=True)
            mock_client_manager.close_connection = MagicMock()
            mock_client_manager.is_active = True

            with patch(
                "waldiez.ws.server.ClientManager",
                return_value=mock_client_manager,
            ):
                handle_task = asyncio.create_task(
                    server._handle_client(mock_websocket)  # type: ignore
                )
                await asyncio.sleep(0.1)

                # Verify message was handled
                mock_client_manager.handle_message.assert_called_once()

                handle_task.cancel()
                try:
                    await handle_task
                except asyncio.CancelledError:
                    pass

        finally:
            server.shutdown()
            await asyncio.wait_for(start_task, timeout=2.0)

    @pytest.mark.asyncio
    async def test_invalid_message_handling(self) -> None:
        """Test handling of invalid messages."""
        server = WaldiezWsServer(host=self.host, port=self.port)

        start_task = asyncio.create_task(server.start())
        await asyncio.sleep(0.1)

        try:
            # Mock WebSocket with invalid JSON
            invalid_message = "invalid json"

            mock_websocket = FakeWebSocket([invalid_message])

            mock_client_manager = MagicMock()
            mock_client_manager.handle_message = AsyncMock(
                side_effect=ValueError("Invalid JSON")
            )
            mock_client_manager.send_message = AsyncMock(return_value=True)
            mock_client_manager.close_connection = MagicMock()
            mock_client_manager.is_active = True

            with patch(
                "waldiez.ws.server.ClientManager",
                return_value=mock_client_manager,
            ):
                handle_task = asyncio.create_task(
                    server._handle_client(mock_websocket)  # type: ignore
                )
                await asyncio.sleep(0.1)

                # Error response should be sent
                mock_client_manager.send_message.assert_called()

                handle_task.cancel()
                try:
                    await handle_task
                except asyncio.CancelledError:
                    pass

        finally:
            server.shutdown()
            await asyncio.wait_for(start_task, timeout=2.0)

    #     @pytest.mark.asyncio
    #     async def test_websocket_exception_handling(self) -> None:
    #         """Test handling of WebSocket exceptions."""
    #         server = WaldiezWsServer(host=self.host, port=self.port)

    #         start_task = asyncio.create_task(server.start())
    #         await asyncio.sleep(0.1)

    #         try:
    #             mock_websocket = AsyncMock()
    #             mock_websocket.remote_address = ("127.0.0.1", 12345)
    #             mock_websocket.request = None
    #             mock_websocket.__aiter__ = AsyncMock(
    #                 side_effect=WebSocketException("Connection error")
    #             )

    #             mock_client_manager = MagicMock()
    #             mock_client_manager.close_connection = MagicMock()
    #             mock_client_manager.is_active = True

    #             with patch(
    #                 "waldiez.ws.server.ClientManager",
    #                 return_value=mock_client_manager,
    #             ):
    #                 handle_task = asyncio.create_task(
    #                     server._handle_client(mock_websocket)
    #                 )
    #                 await asyncio.sleep(0.1)

    #                 # Error should be handled gracefully
    #                 mock_client_manager.close_connection.assert_called_once()

    #                 handle_task.cancel()
    #                 try:
    #                     await handle_task
    #                 except asyncio.CancelledError:
    #                     pass

    #         finally:
    #             server.shutdown()
    #             await asyncio.wait_for(start_task, timeout=2.0)

    def test_get_stats(self) -> None:
        """Test getting server statistics."""
        server = WaldiezWsServer(host=self.host, port=self.port, max_clients=5)

        # Set some test data
        server.stats["connections_total"] = 10
        server.stats["messages_received"] = 50
        server.is_running = True
        server.start_time = time.time() - 100

        stats = server.get_stats()

        assert stats["connections_total"] == 10
        assert stats["messages_received"] == 50
        assert stats["is_running"] is True
        assert stats["uptime_seconds"] > 0
        assert "server_config" in stats
        assert stats["server_config"]["host"] == self.host
        assert stats["server_config"]["max_clients"] == 5
        assert "error_stats" in stats

    def test_get_stats_not_running(self) -> None:
        """Test getting stats when server is not running."""
        server = WaldiezWsServer()

        stats = server.get_stats()

        assert stats["uptime_seconds"] == 0
        assert stats["is_running"] is False

    @pytest.mark.asyncio
    async def test_broadcast_no_clients(self) -> None:
        """Test broadcasting with no connected clients."""
        server = WaldiezWsServer()

        result = await server.broadcast({"type": "test", "data": "hello"})

        assert result == 0

    @pytest.mark.asyncio
    async def test_broadcast_with_clients(self) -> None:
        """Test broadcasting to connected clients."""
        server = WaldiezWsServer()

        # Mock clients
        mock_client1 = MagicMock()
        mock_client1.send_message = AsyncMock(return_value=True)
        mock_client1.is_active = True

        mock_client2 = MagicMock()
        mock_client2.send_message = AsyncMock(return_value=True)
        mock_client2.is_active = True

        mock_client3 = MagicMock()
        mock_client3.send_message = AsyncMock(return_value=False)
        mock_client3.is_active = True

        server.clients = {
            "client1": mock_client1,
            "client2": mock_client2,
            "client3": mock_client3,
        }

        message = {"type": "broadcast", "data": "test"}
        result = await server.broadcast(message)

        # Should send to all active clients
        mock_client1.send_message.assert_called_once_with(message)
        mock_client2.send_message.assert_called_once_with(message)
        mock_client3.send_message.assert_called_once_with(message)

        # Should return count of successful sends
        assert result == 2
        assert server.stats["messages_sent"] == 2

    @pytest.mark.asyncio
    async def test_broadcast_exclude_client(self) -> None:
        """Test broadcasting with client exclusion."""
        server = WaldiezWsServer()

        mock_client1 = MagicMock()
        mock_client1.send_message = AsyncMock(return_value=True)
        mock_client1.is_active = True

        mock_client2 = MagicMock()
        mock_client2.send_message = AsyncMock(return_value=True)
        mock_client2.is_active = True

        server.clients = {
            "client1": mock_client1,
            "client2": mock_client2,
        }

        message = {"type": "broadcast", "data": "test"}
        result = await server.broadcast(message, exclude_client="client1")

        # Should only send to client2
        mock_client1.send_message.assert_not_called()
        mock_client2.send_message.assert_called_once_with(message)

        assert result == 1

    def test_shutdown(self) -> None:
        """Test server shutdown signal."""
        server = WaldiezWsServer()

        assert not server.shutdown_event.is_set()

        server.shutdown()

        assert server.shutdown_event.is_set()


class TestRunServer:
    """Test run_server function."""

    @pytest.mark.asyncio
    async def test_run_server_basic(self) -> None:
        """Test basic run_server functionality."""
        with patch("waldiez.ws.server.WaldiezWsServer") as mock_server_class:
            mock_server = MagicMock()
            mock_server.start = AsyncMock()
            mock_server_class.return_value = mock_server

            # Mock signal handling
            with patch("asyncio.get_running_loop") as mock_loop:
                mock_loop.return_value.add_signal_handler = MagicMock()

                run_task = asyncio.create_task(
                    run_server(host="localhost", port=8765, auto_reload=False)
                )

                # Cancel after a short time to avoid hanging
                await asyncio.sleep(0.1)
                run_task.cancel()

                try:
                    await run_task
                except asyncio.CancelledError:
                    pass

                # Verify server was created and started
                mock_server_class.assert_called_once_with(
                    host="localhost",
                    port=8765,
                    workspace_dir=Path.cwd(),
                )
                mock_server.start.assert_called_once()

    @pytest.mark.asyncio
    async def test_run_server_with_auto_reload(self) -> None:
        """Test run_server with auto-reload enabled."""
        with patch("waldiez.ws.server.WaldiezWsServer") as mock_server_class:
            mock_server = MagicMock()
            mock_server.start = AsyncMock()
            mock_server_class.return_value = mock_server

            with patch("waldiez.ws.server.create_file_watcher") as mock_watcher:
                mock_watcher_instance = MagicMock()
                mock_watcher_instance.start = MagicMock()
                mock_watcher_instance.stop = MagicMock()
                mock_watcher.return_value = mock_watcher_instance

                with patch("asyncio.get_running_loop") as mock_loop:
                    mock_loop.return_value.add_signal_handler = MagicMock()

                    run_task = asyncio.create_task(
                        run_server(
                            host="localhost", port=8765, auto_reload=True
                        )
                    )

                    await asyncio.sleep(0.1)
                    run_task.cancel()

                    try:
                        await run_task
                    except asyncio.CancelledError:
                        pass

                    # Verify file watcher was created and started
                    mock_watcher.assert_called_once()
                    mock_watcher_instance.start.assert_called_once()

    @pytest.mark.asyncio
    async def test_run_server_with_watch_dirs(self) -> None:
        """Test run_server with custom watch directories."""
        watch_dirs = {Path("/test/dir1"), Path("/test/dir2")}

        with patch("waldiez.ws.server.WaldiezWsServer") as mock_server_class:
            mock_server = MagicMock()
            mock_server.start = AsyncMock()
            mock_server_class.return_value = mock_server

            with patch("waldiez.ws.server.create_file_watcher") as mock_watcher:
                mock_watcher_instance = MagicMock()
                mock_watcher_instance.start = MagicMock()
                mock_watcher_instance.stop = MagicMock()
                mock_watcher.return_value = mock_watcher_instance

                with patch("asyncio.get_running_loop") as mock_loop:
                    mock_loop.return_value.add_signal_handler = MagicMock()

                    run_task = asyncio.create_task(
                        run_server(
                            host="localhost",
                            port=8765,
                            auto_reload=True,
                            watch_dirs=watch_dirs,
                        )
                    )

                    await asyncio.sleep(0.1)
                    run_task.cancel()

                    try:
                        await run_task
                    except asyncio.CancelledError:
                        pass

                    # Verify file watcher was called with custom dirs
                    call_args = mock_watcher.call_args
                    assert call_args[1]["additional_dirs"] == list(watch_dirs)

    @pytest.mark.asyncio
    async def test_run_server_signal_handling(self) -> None:
        """Test signal handling in run_server."""
        with patch("waldiez.ws.server.WaldiezWsServer") as mock_server_class:
            mock_server = MagicMock()
            mock_server.start = AsyncMock()
            mock_server.shutdown = MagicMock()
            mock_server_class.return_value = mock_server

            with patch("asyncio.get_running_loop") as mock_loop:
                mock_event_loop = MagicMock()
                mock_loop.return_value = mock_event_loop

                run_task = asyncio.create_task(run_server())
                await asyncio.sleep(0.1)

                # Verify signal handlers were registered
                assert mock_event_loop.add_signal_handler.call_count == 2
                calls = mock_event_loop.add_signal_handler.call_args_list

                # Extract signal numbers from calls
                signals = [call[0][0] for call in calls]
                assert signal.SIGTERM in signals
                assert signal.SIGINT in signals

                # Test signal handler by calling it
                signal_handler = calls[0][0][1]  # Get the handler function
                signal_handler()

                # Verify shutdown was called
                mock_server.shutdown.assert_called_once()

                run_task.cancel()
                try:
                    await run_task
                except asyncio.CancelledError:
                    pass

    @pytest.mark.asyncio
    async def test_run_server_auto_reload_import_error(self) -> None:
        """Test run_server when auto-reload dependencies are missing."""
        with patch("waldiez.ws.server.WaldiezWsServer") as mock_server_class:
            mock_server = MagicMock()
            mock_server.start = AsyncMock()
            mock_server_class.return_value = mock_server

            with patch(
                "waldiez.ws.server.create_file_watcher",
                side_effect=ImportError("watchdog not available"),
            ):
                with patch("asyncio.get_running_loop") as mock_loop:
                    mock_loop.return_value.add_signal_handler = MagicMock()

                    run_task = asyncio.create_task(run_server(auto_reload=True))

                    await asyncio.sleep(0.1)
                    run_task.cancel()

                    try:
                        await run_task
                    except asyncio.CancelledError:
                        pass

                    # Server should still start despite auto-reload failure
                    mock_server.start.assert_called_once()

    @pytest.mark.asyncio
    async def test_run_server_kwargs_passthrough(self) -> None:
        """Test that server kwargs are passed through correctly."""
        with patch("waldiez.ws.server.WaldiezWsServer") as mock_server_class:
            mock_server = MagicMock()
            mock_server.start = AsyncMock()
            mock_server_class.return_value = mock_server

            with patch("asyncio.get_running_loop") as mock_loop:
                mock_loop.return_value.add_signal_handler = MagicMock()

                run_task = asyncio.create_task(
                    run_server(
                        host="0.0.0.0",
                        port=9000,
                        max_clients=10,
                        ping_interval=30.0,
                    )
                )

                await asyncio.sleep(0.1)
                run_task.cancel()

                try:
                    await run_task
                except asyncio.CancelledError:
                    pass

                # Verify all kwargs were passed to server
                mock_server_class.assert_called_once_with(
                    host="0.0.0.0",
                    port=9000,
                    max_clients=10,
                    ping_interval=30.0,
                    workspace_dir=Path.cwd(),
                )


class TestServerIntegration:
    """Integration tests for server functionality."""

    @pytest.mark.asyncio
    async def test_full_server_lifecycle(self) -> None:
        """Test complete server lifecycle with real WebSocket connection."""
        port = get_available_port()
        server = WaldiezWsServer(host="localhost", port=port)

        # Start server
        start_task = asyncio.create_task(server.start())
        await asyncio.sleep(0.2)  # Give server time to start

        try:
            assert server.is_running

            # Test connection using websockets client
            uri = f"ws://localhost:{port}"
            try:
                async with websockets.connect(uri) as websocket:
                    # Send ping message
                    ping_msg = json.dumps(
                        {"type": "ping", "echo_data": {"test": "integration"}}
                    )
                    await websocket.send(ping_msg)

                    # Should receive connection notification first
                    response1 = await asyncio.wait_for(
                        websocket.recv(), timeout=2.0
                    )
                    data1 = json.loads(response1)
                    assert data1["type"] == "connection"
                    assert data1["status"] == "connected"

                    # Then should receive pong response
                    response2 = await asyncio.wait_for(
                        websocket.recv(), timeout=2.0
                    )
                    data2 = json.loads(response2)
                    assert data2["type"] == "pong"

            except asyncio.TimeoutError:
                pytest.fail("Connection or response timeout")
            except BaseException:
                pytest.fail("Could not connect to server")

        finally:
            server.shutdown()
            await asyncio.wait_for(start_task, timeout=3.0)

    @pytest.mark.asyncio
    async def test_client_limit_enforcement(self) -> None:
        """Test that client limits are properly enforced."""
        port = get_available_port()
        server = WaldiezWsServer(host="localhost", port=port, max_clients=1)

        start_task = asyncio.create_task(server.start())
        await asyncio.sleep(0.2)

        try:
            uri = f"ws://localhost:{port}"

            # First client should connect successfully
            websocket1 = await websockets.connect(uri)

            try:
                # Receive connection notification
                response1 = await asyncio.wait_for(
                    websocket1.recv(), timeout=2.0
                )
                data1 = json.loads(response1)
                assert data1["type"] == "connection"
                assert data1["status"] == "connected"

                # Second client should be rejected
                try:
                    websocket2 = await websockets.connect(uri)
                    await asyncio.sleep(0.1)
                    # Connection should close immediately
                    # assert websocket2.closed
                    await websocket2.close()
                except websockets.exceptions.ConnectionClosedError:
                    # Expected - connection was closed by server
                    pass

            finally:
                await websocket1.close()

        finally:
            server.shutdown()
            await asyncio.wait_for(start_task, timeout=3.0)

    @pytest.mark.asyncio
    async def test_server_error_handling(self) -> None:
        """Test server handles errors gracefully."""
        port = get_available_port()
        server = WaldiezWsServer(host="localhost", port=port)

        start_task = asyncio.create_task(server.start())
        await asyncio.sleep(0.2)

        try:
            uri = f"ws://localhost:{port}"
            async with websockets.connect(uri) as websocket:
                # Send invalid message
                await websocket.send("invalid json")

                # Should receive connection notification first
                response1 = await websocket.recv()
                data1 = json.loads(response1)
                assert data1["type"] == "connection"

                # Then should receive error response
                response2 = await websocket.recv()
                data2 = json.loads(response2)
                assert data2["type"] == "error"
                assert "Invalid message format" in data2["error"]

        finally:
            server.shutdown()
            await asyncio.wait_for(start_task, timeout=3.0)
