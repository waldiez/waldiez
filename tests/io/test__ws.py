# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportPrivateUsage=false,reportUnusedVariable=false
# pylint: disable=missing-param-doc,missing-type-doc,missing-return-doc
# pylint: disable=missing-yield-doc, protected-access,unused-variable
# pylint: disable=unused-argument,too-few-public-methods,missing-raises-doc
# pylint: disable=redefined-variable-type
"""Test waldiez.io._ws.*."""

import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

# noinspection PyProtectedMember
from waldiez.io._ws import (
    StarletteAdapter,
    WebSocketsAdapter,
    create_websocket_adapter,
)


@pytest.mark.asyncio
async def test_websockets_adapter_send_and_receive(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test sending and receiving messages through the WebSocketsAdapter."""
    # Mock websockets.ServerConnection
    mock_ws = MagicMock()
    mock_ws.send = AsyncMock()
    mock_ws.recv = AsyncMock(return_value="message")
    adapter = WebSocketsAdapter(mock_ws)

    await adapter.send_message("test message")
    mock_ws.send.assert_awaited_once_with("test message")

    # Normal receive returns string
    msg = await adapter.receive_message()
    assert msg == "message"

    # Receive returns bytes -> decoded
    mock_ws.recv.return_value = b"bytes message"
    msg = await adapter.receive_message()
    assert msg == "bytes message"

    # TimeoutError returns empty string
    mock_ws.recv.side_effect = asyncio.TimeoutError
    msg = await adapter.receive_message(timeout=0.01)
    assert msg == ""

    # Other exception returns empty string
    mock_ws.recv.side_effect = Exception("fail")
    msg = await adapter.receive_message()
    assert msg == ""


@pytest.mark.asyncio
async def test_starlette_adapter_send_and_receive(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test sending and receiving messages through the StarletteAdapter."""
    # Mock Starlette/FastAPI websocket
    mock_ws = MagicMock()
    mock_ws.send_text = AsyncMock()
    mock_ws.receive_text = AsyncMock(return_value="starlette message")
    adapter = StarletteAdapter(mock_ws)

    await adapter.send_message("text")
    mock_ws.send_text.assert_awaited_once_with("text")

    # Normal receive returns string
    msg = await adapter.receive_message()
    assert msg == "starlette message"

    # TimeoutError returns empty string
    mock_ws.receive_text.side_effect = asyncio.TimeoutError
    msg = await adapter.receive_message(timeout=0.01)
    assert msg == ""

    # Other exception returns empty string
    mock_ws.receive_text.side_effect = Exception("fail")
    msg = await adapter.receive_message()
    assert msg == ""


def test_create_websocket_adapter_returns_starlette_adapter() -> None:
    """Test creating a WebSocket adapter for Starlette/FastAPI."""

    # pylint: disable=too-few-public-methods,no-self-use
    # noinspection PyMethodMayBeStatic
    class DummyStarletteWS:
        """Dummy class for Starlette/FastAPI WebSocket."""

        def send_text(self, msg: str) -> None:
            """Send a text message."""

        def receive_text(self) -> str:
            """Receive a text message."""
            return "starlette message"

    ws = DummyStarletteWS()
    adapter = create_websocket_adapter(ws)
    assert adapter.__class__.__name__ == "StarletteAdapter"


def test_create_websocket_adapter_returns_websockets_adapter() -> None:
    """Test creating a WebSocket adapter for websockets."""

    # pylint: disable=too-few-public-methods,no-self-use
    # noinspection PyMethodMayBeStatic
    class DummyWebsocketsWS:
        """Dummy class for websockets.WebSocket."""

        def send(self, msg: str) -> None:
            """Send a text message."""

        def recv(self) -> str:
            """Receive a text message."""
            return "websockets message"

    ws = DummyWebsocketsWS()
    adapter = create_websocket_adapter(ws)
    assert adapter.__class__.__name__ == "WebSocketsAdapter"

    ws = DummyWebsocketsWS()
    adapter = create_websocket_adapter(ws)
    assert adapter.__class__.__name__ == "WebSocketsAdapter"


def test_create_websocket_adapter_raises_value_error() -> None:
    """Test creating a WebSocket adapter raises ValueError for unknown types."""

    class DummyUnknownWS:
        """Dummy class for unknown WebSocket types."""

    ws = DummyUnknownWS()
    with pytest.raises(ValueError):
        create_websocket_adapter(ws)
