# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=line-too-long
# pyright: reportUnknownMemberType=false,reportUnknownParameterType=false
# pyright: reportUnknownVariableType=false,reportUnknownArgumentType=false
"""WebSocket IOStream implementation for AsyncIO."""

import asyncio
import logging
from typing import Any, Protocol

HAS_WS_LIB = False

try:
    from starlette.websockets import WebSocket  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]  # noqa

    HAS_WS_LIB = True  # pyright: ignore
except ImportError:  # pragma: no cover
    pass

try:
    import websockets  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]  # noqa

    HAS_WS_LIB = True  # pyright: ignore
except ImportError:  # pragma: no cover
    pass


class WebSocketConnection(Protocol):
    """Protocol for WebSocket connections."""

    async def send_message(self, message: str) -> None:
        """Send a message over the WebSocket connection.

        Parameters
        ----------
        message : str
            The message to send.
        """

    async def receive_message(
        self,
        timeout: float = 120,
    ) -> str:  # pyright: ignore
        """Receive a message from the WebSocket connection.

        Parameters
        ----------
        timeout : float, optional
            The timeout for receiving the message. Defaults to 120 seconds.
            If the timeout is reached, an empty string is returned.
            If an error occurs, an empty string is returned.

        Returns
        -------
        str
            The received message.
        """


class WebSocketsAdapter:
    """Adapter for websockets library connections."""

    def __init__(self, websocket: "websockets.ServerConnection"):
        """Initialize the adapter.

        Parameters
        ----------
        websocket : ServerConnection
            The websockets library connection.
        """
        self.websocket = websocket
        self.log = logging.getLogger(__name__)

    async def send_message(self, message: str) -> None:
        """Send a message using websockets library.

        Parameters
        ----------
        message : str
            The message to send.
        """
        await self.websocket.send(message)

    async def receive_message(self, timeout: float = 120) -> str:
        """Receive a message using websockets library.

        Parameters
        ----------
        timeout : float, optional
            The timeout for receiving the message. Defaults to 120 seconds.

        Returns
        -------
        str
            The received message, decoded as a string.
        """
        # pylint: disable=too-many-try-statements
        # noinspection PyBroadException
        try:
            response = await asyncio.wait_for(
                self.websocket.recv(), timeout=timeout
            )
            if isinstance(response, bytes):
                return response.decode("utf-8", errors="replace")
            # noinspection PyUnreachableCode
            return response if isinstance(response, str) else str(response)
        except asyncio.TimeoutError:
            return ""
        except BaseException as exc:  # pylint: disable=broad-exception-caught
            self.log.error(
                "WebsocketsAdapter: Error receiving message: %s", exc
            )  # pragma: no cover
            return ""


class StarletteAdapter:
    """Adapter for Starlette/FastAPI WebSocket connections."""

    def __init__(self, websocket: "WebSocket"):
        """Initialize the adapter.

        Parameters
        ----------
        websocket : WebSocket
            The Starlette/FastAPI WebSocket connection.
        """
        self.websocket = websocket
        self.log = logging.getLogger(__name__)

    async def send_message(self, message: str) -> None:
        """Send a message using Starlette WebSocket.

        Parameters
        ----------
        message : str
            The message to send.
        """
        await self.websocket.send_text(message)

    async def receive_message(self, timeout: float = 120) -> str:
        """Receive a message using Starlette WebSocket.

        Parameters
        ----------
        timeout : float, optional
            The timeout for receiving the message. Defaults to 120 seconds.

        Returns
        -------
        str
            The received message, decoded as a string.
        """
        # noinspection PyBroadException
        try:
            return await asyncio.wait_for(
                self.websocket.receive_text(), timeout=timeout
            )
        except asyncio.TimeoutError:
            return ""
        except BaseException as exc:  # pylint: disable=broad-exception-caught
            self.log.error(
                "StarletteAdapter: Error receiving message: %s", exc
            )  # pragma: no cover
            return ""


def create_websocket_adapter(websocket: Any) -> WebSocketConnection:
    """Create an appropriate adapter for the given WebSocket connection.

    Parameters
    ----------
    websocket : Any
        The WebSocket connection (websockets or Starlette).

    Returns
    -------
    WebSocketConnection
        An adapter that implements the WebSocketConnection protocol.

    Raises
    ------
    ValueError
        If the WebSocket type is not supported.
    """
    # Check for Starlette/FastAPI WebSocket
    if hasattr(websocket, "send_text") and hasattr(websocket, "receive_text"):
        return StarletteAdapter(websocket)

    # Check for websockets library
    if hasattr(websocket, "send") and hasattr(websocket, "recv"):
        return WebSocketsAdapter(websocket)

    raise ValueError(
        "Unsupported WebSocket type. "
        "Must be either websockets.ServerConnection "
        "or starlette.websockets.WebSocket. "
        f"Received: {type(websocket)}"
    )


def is_websocket_available() -> bool:
    """Check if any WebSocket library is available.

    Returns
    -------
    bool
        True if websockets or starlette is available, False otherwise.
    """
    return HAS_WS_LIB
