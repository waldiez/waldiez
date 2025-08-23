# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pyright: reportMissingImports=false,reportUnknownVariableType=false
# pyright: reportPossiblyUnboundVariable=false,reportUnknownMemberType=false
# pyright: reportUnknownParameterType=false,reportUnknownArgumentType=false
# pyright: reportAttributeAccessIssue=false
# pylint: disable=import-error,line-too-long
# flake8: noqa: E501
"""WebSocket server implementation for Waldiez."""

import asyncio
import logging
import re
import signal
import time
import traceback
import uuid
from pathlib import Path
from typing import Any, Sequence

from .client_manager import ClientManager
from .errors import ErrorHandler, MessageParsingError, ServerOverloadError
from .models import ConnectionNotification
from .session_manager import SessionManager
from .utils import get_available_port, is_port_available

HAS_WATCHDOG = False
try:
    from .reloader import create_file_watcher

    HAS_WATCHDOG = True  # pyright: ignore
except ImportError:
    # pylint: disable=unused-argument,missing-param-doc,missing-return-doc
    # noinspection PyUnusedLocal
    def create_file_watcher(*args: Any, **kwargs: Any) -> Any:  # type: ignore
        """No file watcher available."""


HAS_WEBSOCKETS = False
try:
    import websockets  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]
    from websockets.exceptions import (  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]
        ConnectionClosed,
        WebSocketException,
    )

    HAS_WEBSOCKETS = True  # pyright: ignore
except ImportError:
    from ._mock import (  # type: ignore[no-redef, unused-ignore, unused-import, import-not-found, import-untyped]
        websockets,
    )

    ConnectionClosed = websockets.ConnectionClosed  # type: ignore[no-redef,unused-ignore,unused-import,import-not-found,import-untyped,misc]
    WebSocketException = websockets.WebSocketException  # type: ignore[no-redef,unused-ignore,unused-import,import-not-found,import-untyped,misc]


logger = logging.getLogger(__name__)

CWD = Path.cwd()


# pylint: disable=too-many-instance-attributes
class WaldiezWsServer:
    """WebSocket server for Waldiez."""

    def __init__(
        self,
        host: str = "localhost",
        port: int = 8765,
        auto_reload: bool = False,
        workspace_dir: Path = CWD,
        max_clients: int = 1,
        allowed_origins: Sequence[re.Pattern[str]] | None = None,
        **kwargs: Any,
    ):
        """Initialize WebSocket server.

        Parameters
        ----------
        host : str
            Server host address
        port : int
            Server port
        auto_reload : bool
            Enable automatic reloading of the server on code changes
        workspace_dir : Path
            Path to the workspace directory
        max_clients : int
            Maximum number of concurrent clients (default: 1)
        allowed_origins : Sequence[re.Pattern[str]] | None
            List of allowed origins for CORS (default: None)
        ping_interval : float | None
            Ping interval in seconds
        ping_timeout : float | None
            Ping timeout in seconds
        close_timeout : float | None
            Close timeout in seconds
        max_size : int | None
            Maximum message size in bytes
        max_queue : int | None
            Maximum queue size
        write_limit : int
            Write buffer limit
        """
        self.host = host
        self.port = port
        self.auto_reload = auto_reload and HAS_WATCHDOG
        self.workspace_dir = workspace_dir
        self.max_clients = max_clients
        self.allowed_origins = allowed_origins

        # WebSocket configuration
        self.ping_interval = kwargs.get("ping_interval", 20.0)
        self.ping_timeout = kwargs.get("ping_timeout", 20.0)
        self.close_timeout = kwargs.get("close_timeout", 10.0)
        self.max_size = kwargs.get("max_size", 2**23)  # 8MB
        self.max_queue = kwargs.get("max_queue", 32)
        self.write_limit = kwargs.get("write_limit", 2**16)  # 64KB

        # Server state
        self.server: websockets.Server | None = None
        self.session_manager = SessionManager()
        self.clients: dict[str, ClientManager] = {}
        self.is_running = False
        self.start_time = 0.0
        self.error_handler = ErrorHandler()

        # Shutdown event
        self.shutdown_event = asyncio.Event()

        # Statistics
        self.stats = {
            "connections_total": 0,
            "connections_active": 0,
            "messages_received": 0,
            "messages_sent": 0,
        }

    # pylint: disable=too-complex,too-many-branches,too-many-statements
    async def _handle_client(  # noqa: C901
        self,
        websocket: websockets.ServerConnection,
    ) -> None:
        """Handle individual client connections.

        Parameters
        ----------
        websocket : websockets.WebSocketServerProtocol
            WebSocket connection
        """
        client_id = str(uuid.uuid4())

        # Check client limit
        if len(self.clients) >= self.max_clients:
            logger.warning(
                "Client limit exceeded (%d/%d), rejecting connection from %s",
                len(self.clients),
                self.max_clients,
                websocket.remote_address,
            )
            error = ServerOverloadError(len(self.clients), self.max_clients)
            await websocket.close(code=error.error_code, reason=error.message)
            return

        # Create client handler
        client_manager = ClientManager(
            websocket,
            client_id,
            self.session_manager,
            workspace_dir=self.workspace_dir,
            error_handler=self.error_handler,
        )
        self.clients[client_id] = client_manager
        self.stats["connections_total"] += 1
        self.stats["connections_active"] = len(self.clients)
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            await client_manager.send_message(
                ConnectionNotification(
                    status="connected",
                    client_id=client_id,
                    server_time=time.time(),
                ).model_dump(mode="json", fallback=str)
            )

            # Message handling loop
            # noinspection PyTypeChecker
            async for raw_message in websocket:  # pyright: ignore
                try:
                    # Parse message
                    if isinstance(raw_message, bytes):
                        message_str = raw_message.decode("utf-8")
                    else:
                        # noinspection PyUnreachableCode
                        message_str = (
                            raw_message
                            if isinstance(raw_message, str)
                            else str(raw_message)
                        )
                    response = await client_manager.handle_message(message_str)
                    self.stats["messages_received"] += 1

                    # Send response if available
                    if response:  # pragma: no branch
                        success = await client_manager.send_message(response)
                        if success:
                            self.stats["messages_sent"] += 1
                        else:
                            self.error_handler.record_send_failure(client_id)

                except ValueError as e:
                    logger.warning("Invalid message from %s: %s", client_id, e)
                    error_response = self.error_handler.handle_error(
                        MessageParsingError(str(e), str(raw_message)),
                        client_id=client_id,
                    )
                    await client_manager.send_message(error_response)

                except Exception as e:
                    traceback.print_exc()
                    logger.error(
                        "Error handling message from %s: %s", client_id, e
                    )
                    error_response = self.error_handler.handle_error(
                        e, client_id=client_id
                    )
                    await client_manager.send_message(error_response)

        except ConnectionClosed:
            logger.info("Client %s disconnected normally", client_id)

        except WebSocketException as e:
            logger.warning("WebSocket error for client %s: %s", client_id, e)
            self.error_handler.record_operational_error(
                "WebSocketException", str(e)
            )

        except Exception as e:
            logger.error(
                "Unexpected error handling client %s: %s", client_id, e
            )
            self.error_handler.record_operational_error(
                "UnexpectedError", str(e)
            )
            raise

        finally:
            # Clean up client
            if client_id in self.clients:  # pragma: no branch
                self.clients[client_id].close_connection()
                del self.clients[client_id]
                self.stats["connections_active"] = len(self.clients)

    async def start(self) -> None:
        """Start the WebSocket server.

        Raises
        ------
        RuntimeError
            If the port is already in use
        Exception
            For any other errors
        """
        if self.is_running:
            logger.warning("Server is already running")
            return

        await self.session_manager.start()
        # Check port availability
        if not self.auto_reload and not is_port_available(self.port):
            logger.warning("Port %d is not available", self.port)
            self.port = get_available_port()
            logger.info("Using port %d", self.port)

        logger.info("Starting WebSocket server on %s:%d", self.host, self.port)
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            # Create server
            # noinspection PyTypeChecker
            self.server = await websockets.serve(
                self._handle_client,
                self.host,
                self.port,
                ping_interval=self.ping_interval,
                ping_timeout=self.ping_timeout,
                close_timeout=self.close_timeout,
                max_size=self.max_size,
                max_queue=self.max_queue,
                write_limit=self.write_limit,
                origins=self.allowed_origins,
                # Additional settings
                compression=None,  # Disable compression for lower latency
                logger=logger,
                server_header="Waldiez/ws",
            )

            self.is_running = True
            self.start_time = time.time()

            logger.info("WebSocket server started successfully")
            logger.info("Server configuration:")
            logger.info("  - Host: %s", self.host)
            logger.info("  - Port: %d", self.port)
            logger.info("  - Max clients: %d", self.max_clients)
            logger.info("  - Ping interval: %s", self.ping_interval)
            logger.info("  - Max message size: %s", self.max_size)

            # Wait for shutdown
            await self.shutdown_event.wait()

        except Exception as e:
            logger.error("Failed to start server: %s", e)
            raise

        finally:
            await self.stop()

    async def stop(self) -> None:
        """Stop the WebSocket server."""
        await self.session_manager.stop()
        if not self.is_running:
            logger.warning("Server is not running")
            return

        logger.info("Stopping WebSocket server...")

        # Close all client connections
        if self.clients:
            logger.info(
                "Closing %d active client connections", len(self.clients)
            )
            close_tasks: list[Any] = []
            for client in self.clients.values():
                if client.is_active:  # pragma: no branch
                    close_tasks.append(client.websocket.close())

            if close_tasks:  # pragma: no branch
                await asyncio.gather(*close_tasks, return_exceptions=True)

        # Stop server
        if self.server:
            self.server.close()
            await self.server.wait_closed()

        self.is_running = False
        self.clients.clear()
        self.stats["connections_active"] = 0

        uptime = time.time() - self.start_time
        logger.info("WebSocket server stopped (uptime: %.1f seconds)", uptime)

    def shutdown(self) -> None:
        """Trigger server shutdown."""
        self.shutdown_event.set()

    def get_stats(self) -> dict[str, Any]:
        """Get server statistics.

        Returns
        -------
        dict[str, Any]
            Server statistics
        """
        uptime = time.time() - self.start_time if self.is_running else 0
        return {
            **self.stats,
            "uptime_seconds": uptime,
            "is_running": self.is_running,
            "server_config": {
                "host": self.host,
                "port": self.port,
                "max_clients": self.max_clients,
                "ping_interval": self.ping_interval,
                "max_size": self.max_size,
            },
            "error_stats": self.error_handler.get_error_stats(),
        }

    async def broadcast(
        self, message: dict[str, Any], exclude_client: str | None = None
    ) -> int:
        """Broadcast message to all connected clients.

        Parameters
        ----------
        message : Dict[str, Any]
            Message to broadcast
        exclude_client : Optional[str]
            Client ID to exclude from broadcast

        Returns
        -------
        int
            Number of clients that received the message
        """
        if not self.clients:
            return 0

        send_tasks: list[Any] = []
        for client_id, client in self.clients.items():
            if client_id != exclude_client and client.is_active:
                send_tasks.append(client.send_message(message))

        if not send_tasks:  # pragma: no cover
            return 0

        results = await asyncio.gather(*send_tasks, return_exceptions=True)
        successful = sum(1 for result in results if result is True)

        self.stats["messages_sent"] += successful
        return successful


async def run_server(
    host: str = "localhost",
    port: int = 8765,
    workspace_dir: Path = CWD,
    auto_reload: bool = False,
    watch_dirs: set[Path] | None = None,
    **server_kwargs: Any,
) -> None:
    """Run the WebSocket server with optional auto-reload.

    Parameters
    ----------
    host : str
        Server host
    port : int
        Server port
    workspace_dir : Path
        Path to the workspace directory
    auto_reload : bool
        Enable auto-reload on file changes
    watch_dirs : Optional[Set[Path]]
        Directories to watch for auto-reload
    **server_kwargs
        Additional server configuration
    """
    server = WaldiezWsServer(
        host=host,
        port=port,
        auto_reload=auto_reload,
        workspace_dir=workspace_dir,
        **server_kwargs,
    )

    # Set up signal handlers
    def signal_handler() -> None:
        """Handle shutdown signals."""
        logger.info("Received shutdown signal")
        server.shutdown()
        logger.info("Shutdown event set, stopping server...")

    # Register signal handlers
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        # noinspection PyTypeChecker
        loop.add_signal_handler(sig, signal_handler)

    # Set up auto-reload if requested
    file_watcher = None
    if auto_reload and HAS_WATCHDOG:
        # pylint: disable=import-outside-toplevel,too-many-try-statements
        try:
            # Determine watch directories
            if watch_dirs is None:
                project_root = Path(__file__).parents[2]

                # Watch the actual waldiez package directory
                waldiez_dir = project_root / "waldiez"
                if waldiez_dir.exists():
                    watch_dirs = {waldiez_dir}
                    logger.info(
                        "Auto-reload: watching waldiez package at %s",
                        waldiez_dir,
                    )
                else:
                    # Fallback: watch current directory
                    watch_dirs = {Path.cwd()}
                    logger.warning(
                        "Auto-reload: fallback to current directory %s",
                        Path.cwd(),
                    )

            # Create file watcher with restart callback
            file_watcher = create_file_watcher(
                root_dir=Path(__file__).parents[2],
                additional_dirs=list(watch_dirs),
                restart_callback=None,
            )
            file_watcher.start()
            logger.info(
                "Auto-reload enabled for directories: %s",
                {str(dir_) for dir_ in watch_dirs},
            )

        except ImportError as e:
            logger.warning("Auto-reload not available: %s", e)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Failed to set up auto-reload: %s", e)

    try:
        # Start server
        await server.start()
    finally:
        # Clean up file watcher
        if file_watcher:
            file_watcher.stop()
