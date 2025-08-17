# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-try-statements,broad-exception-caught
"""Enhanced test client for Waldiez WebSocket server testing."""

import json
import time
from typing import Any

import websockets


class WaldiezTestClient:
    """Enhanced test client for WebSocket server testing."""

    def __init__(self, host: str = "localhost", port: int = 8765):
        """Initialize test client.

        Parameters
        ----------
        host : str
            WebSocket server host
        port : int
            WebSocket server port
        """
        self.host = host
        self.port = port
        self.uri = f"ws://{host}:{port}"
        self.websocket: websockets.ClientConnection | None = None

    async def connect(self) -> bool:
        """Connect to WebSocket server.

        Returns
        -------
        bool
            True if connected successfully
        """
        try:
            self.websocket = await websockets.connect(self.uri)
            return True
        except Exception:
            return False

    async def disconnect(self) -> None:
        """Disconnect from WebSocket server."""
        if self.websocket:
            await self.websocket.close()
            self.websocket = None

    async def send_message(self, message: dict[str, Any]) -> dict[str, Any]:
        """Send message and wait for response.

        Parameters
        ----------
        message : dict[str, Any]
            Message to send

        Returns
        -------
        dict[str, Any]
            Server response

        Raises
        ------
        RuntimeError
            If not connected
        """
        if not self.websocket:
            raise RuntimeError("Not connected")

        # Send message
        await self.websocket.send(json.dumps(message))

        # Wait for response
        response = await self.websocket.recv()
        return json.loads(response)

    async def send_raw(self, data: str) -> dict[str, Any]:
        """Send raw string data.

        Parameters
        ----------
        data : str
            Raw data to send

        Returns
        -------
        dict[str, Any]
            Server response

        Raises
        ------
        RuntimeError
            If not connected
        """
        if not self.websocket:
            raise RuntimeError("Not connected")

        await self.websocket.send(data)
        response = await self.websocket.recv()
        return json.loads(response)

    # Assertion helpers for testing
    async def assert_ping_success(self) -> dict[str, Any]:
        """Test ping and assert successful response.

        Returns
        -------
        dict[str, Any]
            Server response
        """
        response = await self.send_message({"action": "ping"})
        assert response["type"] == "pong"
        assert "timestamp" in response
        return response

    async def assert_error_response(
        self, message: dict[str, Any], expected_code: int | None = None
    ) -> dict[str, Any]:
        """Send message and assert error response.

        Parameters
        ----------
        message : dict[str, Any]
            Message to send
        expected_code : int | None
            Expected error code

        Returns
        -------
        dict[str, Any]
            Server response
        """
        response = await self.send_message(message)
        assert response["type"] == "error"
        if expected_code:
            assert response["code"] == expected_code
        return response

    async def assert_success_response(
        self, message: dict[str, Any], expected_type: str
    ) -> dict[str, Any]:
        """Send message and assert successful response.

        Parameters
        ----------
        message : dict[str, Any]
            Message to send
        expected_type : str
            Expected response type

        Returns
        -------
        dict[str, Any]
            Server response
        """
        response = await self.send_message(message)
        assert response["type"] == expected_type
        return response

    # Convenience test methods
    async def test_ping(self) -> dict[str, Any]:
        """Test ping message.

        Returns
        -------
        dict[str, Any]
            Server response
        """
        return await self.send_message({"action": "ping"})

    async def test_save(self, data: str = "test data") -> dict[str, Any]:
        """Test save message.

        Parameters
        ----------
        data : str
            Data to save

        Returns
        -------
        dict[str, Any]
            Server response
        """
        return await self.send_message({"action": "save", "message": data})

    async def test_run(self, data: str = "test run data") -> dict[str, Any]:
        """Test run message.

        Parameters
        ----------
        data : str
            Data to run

        Returns
        -------
        dict[str, Any]
            Server response
        """
        return await self.send_message({"action": "run", "message": data})

    async def test_convert(
        self, flow: str = "test flow", to_format: str = "py"
    ) -> dict[str, Any]:
        """Test convert message.

        Parameters
        ----------
        flow : str
            Flow to convert
        to_format : str
            Target format

        Returns
        -------
        dict[str, Any]
            Server response
        """
        return await self.send_message(
            {"action": "convert", "flow": flow, "to": to_format}
        )

    async def test_user_input(
        self, data: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Test user input message.

        Parameters
        ----------
        data : dict[str, Any] | None
            User input data

        Returns
        -------
        dict[str, Any]
            Server response
        """
        if data is None:
            data = {"type": "test", "value": "user input"}

        return await self.send_message(
            {"action": "userInput", "message": json.dumps(data)}
        )

    async def test_control(
        self, data: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Test control message.

        Parameters
        ----------
        data : dict[str, Any] | None
            Control message data

        Returns
        -------
        dict[str, Any]
            Server response
        """
        if data is None:
            data = {"command": "test", "params": {}}

        return await self.send_message(
            {"action": "control", "message": json.dumps(data)}
        )


# Test runner functions (can be used in integration tests)
async def run_basic_tests(host: str = "localhost", port: int = 8765) -> bool:
    """Run basic functionality tests.

    Parameters
    ----------
    host : str
        Server host
    port : int
        Server port

    Returns
    -------
    bool
        True if all tests pass
    """
    client = WaldiezTestClient(host, port)

    try:
        if not await client.connect():
            return False

        # Test all message types
        await client.assert_ping_success()
        await client.assert_success_response(
            {"action": "save", "message": "test"}, "save_response"
        )
        await client.assert_success_response(
            {"action": "run", "message": "test"}, "run_response"
        )

        return True

    except Exception:
        return False
    finally:
        await client.disconnect()


async def run_performance_test(
    host: str = "localhost", port: int = 8765, num_messages: int = 100
) -> dict[str, float]:
    """Run performance test.

    Parameters
    ----------
    host : str
        Server host
    port : int
        Server port
    num_messages : int
        Number of messages to send

    Returns
    -------
    dict[str, float]
        Performance metrics
    """
    client = WaldiezTestClient(host, port)

    try:
        if not await client.connect():
            return {"success": False}

        start_time = time.time()

        for _ in range(num_messages):
            await client.test_ping()

        end_time = time.time()
        total_time = end_time - start_time

        return {
            "total_time": total_time,
            "messages_per_second": num_messages / total_time,
            "avg_latency_ms": (total_time / num_messages) * 1000,
            "success": True,
        }

    except Exception:
        return {"success": False}
    finally:
        await client.disconnect()
