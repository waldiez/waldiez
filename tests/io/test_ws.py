# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-import,unused-argument,protected-access
# pylint: disable=too-many-public-methods,too-few-public-methods
# pylint: disable=missing-param-doc,missing-return-doc
# pylint: disable=attribute-defined-outside-init
"""Test waldiez.io.ws.*."""

import json
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from waldiez.io.ws import AsyncWebsocketsIOStream


# Create a mock BaseEvent for testing
# noinspection PyUnusedLocal
class MockEvent:
    """Mock event for testing purposes."""

    def __init__(
        self, event_type: str = "test_event", content: str = "test content"
    ):
        self.type = event_type
        self.content = content

    def model_dump(self, mode: str = "json") -> dict[str, Any]:
        """Mock model_dump method for testing."""
        return {"type": self.type, "content": self.content}


# noinspection PyTypeChecker,PyUnusedLocal
class TestAsyncWebsocketsIOStream:
    """Test suite for AsyncWebsocketsIOStream class."""

    def setup_method(self) -> None:
        """Set up test fixtures."""
        self.sync_websocket = MagicMock()
        self.sync_websocket.send_message = MagicMock()
        self.sync_websocket.receive_message = MagicMock(return_value="")
        self.async_websocket = MagicMock()
        self.async_websocket.send_message = AsyncMock()
        self.async_websocket.receive_message = AsyncMock(return_value="")

        self.sync_stream = AsyncWebsocketsIOStream(
            websocket=self.sync_websocket,
            is_async=False,
            uploads_root=None,
            verbose=False,
        )
        self.async_stream = AsyncWebsocketsIOStream(
            websocket=self.async_websocket,
            is_async=True,
            uploads_root=None,
            verbose=False,
        )

    def test_init_basic(self) -> None:
        """Test basic initialization."""
        assert self.sync_stream.websocket == self.sync_websocket
        assert self.sync_stream.is_async is False
        assert self.sync_stream.verbose is False
        assert self.sync_stream.uploads_root is None

        assert self.async_stream.websocket == self.async_websocket
        assert self.async_stream.is_async is True
        assert self.async_stream.verbose is False
        assert self.async_stream.uploads_root is None

    def test_init_with_uploads_root_string(self, tmp_path: Path) -> None:
        """Test initialization with uploads_root as string."""
        uploads_path = tmp_path / "uploads"
        stream = AsyncWebsocketsIOStream(
            websocket=self.sync_websocket,
            uploads_root=uploads_path,
        )
        assert isinstance(stream.uploads_root, Path)
        assert str(stream.uploads_root).endswith("uploads")

    def test_init_with_uploads_root_path(self, tmp_path: Path) -> None:
        """Test initialization with uploads_root as Path."""
        uploads_path = tmp_path / "uploads"
        stream = AsyncWebsocketsIOStream(
            websocket=self.sync_websocket,
            uploads_root=uploads_path,
        )
        assert stream.uploads_root == uploads_path.resolve()

    def test_init_verbose(self) -> None:
        """Test initialization with verbose logging."""
        stream = AsyncWebsocketsIOStream(
            websocket=self.sync_websocket,
            verbose=True,
        )
        assert stream.verbose is True

    def test_print_basic(self) -> None:
        """Test basic print functionality."""
        with patch("asyncio.run") as mock_asyncio_run:
            self.sync_stream.print("Hello, world!")

        # Verify asyncio.run was called
        mock_asyncio_run.assert_called_once()

    def test_print_with_custom_args(self) -> None:
        """Test print with custom separator and end."""
        with patch("asyncio.run") as mock_asyncio_run:
            self.sync_stream.print("Hello", "world", sep="-", end="!")

        # Verify asyncio.run was called
        mock_asyncio_run.assert_called_once()

    @patch("waldiez.io.ws.LOG")
    def test_print_verbose(self, mock_log: MagicMock) -> None:
        """Test print with verbose logging."""
        # Create a verbose stream
        verbose_stream = AsyncWebsocketsIOStream(
            websocket=self.sync_websocket,
            verbose=True,
        )

        # Call the print method
        with patch("asyncio.run") as mock_asyncio_run:
            verbose_stream.print("Verbose message")

        # Verify logging was called
        mock_log.info.assert_called_once()
        args = mock_log.info.call_args[0]
        assert "Verbose message" in args[0]

        # Verify asyncio.run was called
        mock_asyncio_run.assert_called_once()

    @patch("waldiez.io.ws.LOG")
    def test_print_error_handling(self, mock_log: MagicMock) -> None:
        """Test print error handling."""
        with patch("asyncio.run") as mock_asyncio_run:
            mock_asyncio_run.side_effect = Exception("Connection error")

            # Should not raise exception, but should log error
            self.sync_stream.print("Test message")

        mock_log.error.assert_called_once_with(
            "Error sending message: %s", mock_asyncio_run.side_effect
        )

    def test_send_basic(self) -> None:
        """Test basic send functionality."""
        mock_event = MockEvent("test_type", "test content")
        with patch("asyncio.run") as mock_asyncio_run:
            self.sync_stream.send(mock_event)

        mock_asyncio_run.assert_called_once()

    @patch("waldiez.io.ws.LOG")
    def test_send_verbose(self, mock_log: MagicMock) -> None:
        """Test send with verbose logging."""
        # Create a verbose stream
        verbose_stream = AsyncWebsocketsIOStream(
            websocket=self.sync_websocket, verbose=True
        )

        mock_event = MockEvent("test_type", "test content")

        # Call the send method
        with patch("asyncio.run") as mock_asyncio_run:
            verbose_stream.send(mock_event)

        # Verify logging was called
        mock_log.info.assert_called_once()
        args = mock_log.info.call_args[0]
        assert "sending:" in args[0]

        mock_asyncio_run.assert_called_once()

    @patch("waldiez.io.ws.LOG")
    def test_send_error_handling(self, mock_log: MagicMock) -> None:
        """Test send error handling."""
        with patch("asyncio.run") as mock_asyncio_run:
            # Simulate an error
            mock_asyncio_run.side_effect = Exception("Send error")

            # Create a mock event
            mock_event = MockEvent("test_type", "test content")

            # Should not raise exception, but should log error
            self.sync_stream.send(mock_event)

            mock_log.error.assert_called_once_with(
                "Error sending message: %s", mock_asyncio_run.side_effect
            )

    def test_input_sync_mode(self) -> None:
        """Test input in sync mode."""

        async def mock_a_input_coro(
            prompt: str = "", *, password: bool = False
        ) -> str:
            return "user input"

        with patch.object(
            self.sync_stream, "a_input", side_effect=mock_a_input_coro
        ):
            result = self.sync_stream.input("Enter text: ")
            assert result == "user input"

    @pytest.mark.asyncio
    async def test_a_input_basic(self) -> None:
        """Test async input functionality."""
        request_id = "test_request_id"

        # Mock the response
        response_data = {"request_id": request_id, "data": "async user input"}
        self.async_websocket.receive_message.return_value = json.dumps(
            response_data
        )

        with patch("uuid.uuid4") as mock_uuid:
            mock_uuid.return_value.hex = request_id
            result = await self.async_stream.a_input("Enter text: ")

        assert result == "async user input"

        # Verify websocket interactions
        self.async_websocket.send_message.assert_called_once()
        self.async_websocket.receive_message.assert_called_once()

        # Check the sent data
        sent_data = json.loads(
            self.async_websocket.send_message.call_args[0][0]
        )
        assert sent_data["type"] == "input_request"
        assert sent_data["request_id"] == request_id
        assert sent_data["prompt"] == "Enter text: "
        assert sent_data["password"] is False

    @pytest.mark.asyncio
    async def test_a_input_password(self) -> None:
        """Test async input with password flag."""
        request_id = "test_request_id"

        response_data = {"request_id": request_id, "data": "secret_password"}
        self.async_websocket.receive_message.return_value = json.dumps(
            response_data
        )

        with patch("uuid.uuid4") as mock_uuid:
            mock_uuid.return_value.hex = request_id
            result = await self.async_stream.a_input(
                "Enter password: ", password=True
            )

        assert result == "secret_password"

        # Check the sent data includes password flag
        sent_data = json.loads(
            self.async_websocket.send_message.call_args[0][0]
        )
        assert sent_data["password"] is True

    @pytest.mark.asyncio
    async def test_a_input_bytes_response(self) -> None:
        """Test async input with bytes response."""
        request_id = "test_request_id"

        # Mock bytes response
        response_data = {"request_id": request_id, "data": "bytes response"}
        self.async_websocket.receive_message.return_value = json.dumps(
            response_data
        ).encode("utf-8")

        with patch("uuid.uuid4") as mock_uuid:
            mock_uuid.return_value.hex = request_id
            result = await self.async_stream.a_input("Enter text: ")

        assert result == "bytes response"

    @pytest.mark.asyncio
    @patch("waldiez.io.ws.LOG")
    async def test_a_input_verbose(self, mock_log: MagicMock) -> None:
        """Test async input with verbose logging."""
        verbose_stream = AsyncWebsocketsIOStream(
            websocket=self.async_websocket, verbose=True
        )

        request_id = "test_request_id"
        response_data = {"request_id": request_id, "data": "verbose response"}
        self.async_websocket.receive_message.return_value = json.dumps(
            response_data
        )

        with patch("uuid.uuid4") as mock_uuid:
            mock_uuid.return_value.hex = request_id
            await verbose_stream.a_input("Enter text: ")

        # Verify logging was called
        mock_log.info.assert_called_once()
        args = mock_log.info.call_args[0]
        assert "Got input:" in args[0]

    @pytest.mark.asyncio
    async def test_a_input_non_json_response(self) -> None:
        """Test async input with non-JSON response."""
        self.async_websocket.receive_message.return_value = (
            "plain text response"
        )

        result = await self.async_stream.a_input("Enter text: ")

        assert result == "plain text response"

    @pytest.mark.asyncio
    async def test_a_input_invalid_json_response(self) -> None:
        """Test async input with invalid JSON response."""
        self.async_websocket.receive_message.return_value = "{invalid json"

        result = await self.async_stream.a_input("Enter text: ")

        assert result == "{invalid json"

    @pytest.mark.asyncio
    @patch("waldiez.io.ws.LOG")
    async def test_a_input_non_dict_response(self, mock_log: MagicMock) -> None:
        """Test async input with non-dict JSON response."""
        self.async_websocket.receive_message.return_value = json.dumps(
            "string response"
        )

        result = await self.async_stream.a_input("Enter text: ")

        # Should log error and return empty string
        mock_log.error.assert_called_once()
        assert "Invalid input response:" in mock_log.error.call_args[0][0]
        assert result == ""

    def test_parse_response_valid(self) -> None:
        """Test parsing valid response."""
        response = {"request_id": "test_id", "data": "valid response"}

        result = self.sync_stream._parse_response(
            response,
            "test_id",
        )

        assert result == "valid response"

    def test_parse_response_duble_dumped(self) -> None:
        """Test parsing response that is double-dumped."""
        response = {
            "request_id": "test_id",
            "data": json.dumps("valid response"),
        }
        result = self.sync_stream._parse_response(
            response,
            "test_id",
        )
        assert result == "valid response"

    @patch("waldiez.io.ws.LOG")
    def test_parse_response_validation_error(self, mock_log: MagicMock) -> None:
        """Test parsing response with validation error."""
        response = {"invalid": "response"}

        result = self.sync_stream._parse_response(
            response,
            "test_id",
        )

        # Should log error and return empty string
        mock_log.error.assert_called_once()
        assert (
            "Error parsing user input response:"
            in mock_log.error.call_args[0][0]
        )
        assert result == ""

    @patch("waldiez.io.ws.LOG")
    def test_parse_response_mismatched_request_id(
        self, mock_log: MagicMock
    ) -> None:
        """Test parsing response with mismatched request_id."""
        response = {"request_id": "wrong_id", "data": "response data"}

        result = self.sync_stream._parse_response(
            response,
            "test_id",
        )

        # Should log error and return empty string
        mock_log.error.assert_called_once()
        assert (
            "User response request ID mismatch:"
            in mock_log.error.call_args[0][0]
        )
        assert result == ""
