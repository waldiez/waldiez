# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-param-doc,missing-yield-doc,missing-return-doc
"""WebSocket test fixtures and configuration."""

import asyncio
from typing import Any, AsyncGenerator

import pytest

from waldiez.ws import WaldiezWsServer
from waldiez.ws.utils import get_available_port

from .helpers.ws_client import WaldiezTestClient


@pytest.fixture(name="test_port")
def test_port_fixture() -> int:
    """Get an available port for testing."""
    return get_available_port()


@pytest.fixture(name="test_server")
async def test_server_fixture(
    test_port: int,
) -> AsyncGenerator[WaldiezWsServer, None]:
    """Start test server on available port."""
    server = WaldiezWsServer(host="localhost", port=test_port, max_clients=5)

    # Start server in background task
    server_task = asyncio.create_task(server.start())

    # Give server time to start
    await asyncio.sleep(0.1)

    # Verify server is running
    assert server.is_running

    yield server

    # Cleanup
    server.shutdown()
    try:
        await asyncio.wait_for(server_task, timeout=2.0)
    except asyncio.TimeoutError:
        server_task.cancel()


@pytest.fixture
async def test_client(
    test_server: WaldiezWsServer,
) -> AsyncGenerator[WaldiezTestClient, None]:
    """Connected test client."""
    client = WaldiezTestClient(host=test_server.host, port=test_server.port)

    connected = await client.connect()
    assert connected, "Failed to connect test client"

    yield client

    await client.disconnect()


@pytest.fixture
async def multiple_clients(
    test_server: WaldiezWsServer,
) -> AsyncGenerator[list[WaldiezTestClient], None]:
    """Multiple connected test clients."""
    clients: list[WaldiezTestClient] = []

    # Create and connect multiple clients
    for _ in range(3):
        client = WaldiezTestClient(host=test_server.host, port=test_server.port)
        if await client.connect():
            clients.append(client)

    yield clients

    # Cleanup all clients
    for client in clients:
        await client.disconnect()


@pytest.fixture
def sample_messages() -> dict[str, dict[str, Any] | str]:
    """Sample test messages for different actions."""
    return {
        "ping": {"action": "ping"},
        "save": {"action": "save", "message": "test flow data"},
        "run": {"action": "run", "message": "test execution data"},
        "step_run": {"action": "stepRun", "message": "test step data"},
        "convert": {"action": "convert", "flow": "test flow", "to": "py"},
        "user_input": {"action": "userInput", "message": '{"type": "test"}'},
        "control": {"action": "control", "message": '{"command": "test"}'},
        "invalid": {"action": "invalid_action"},
        "malformed": {"invalid": "no action field"},
        "bad_json": "not json at all",
    }
