# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.io.ws.*."""

import json
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from waldiez.io.models import UserInputData
from waldiez.io.ws import AsyncWebsocketsIOStream

# pylint: disable=unused-import,unused-argument,protected-access
# pylint: disable=too-many-public-methods,too-few-public-methods
# pylint: disable=missing-param-doc,missing-return-doc
# pylint: disable=attribute-defined-outside-init


# Create a mock BaseEvent for testing
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


class TestAsyncWebsocketsIOStream:
    """Test suite for AsyncWebsocketsIOStream class."""

    def setup_method(self) -> None:
        """Set up test fixtures."""
        self.sync_websocket = MagicMock()
        self.sync_websocket.send = MagicMock()
        self.sync_websocket.recv = MagicMock()
        self.async_websocket = MagicMock()
        self.async_websocket.send = AsyncMock()
        self.async_websocket.recv = AsyncMock()

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
            websocket=self.sync_websocket, uploads_root=uploads_path
        )
        assert isinstance(stream.uploads_root, Path)
        assert str(stream.uploads_root).endswith("uploads")

    def test_init_with_uploads_root_path(self, tmp_path: Path) -> None:
        """Test initialization with uploads_root as Path."""
        uploads_path = tmp_path / "uploads"
        stream = AsyncWebsocketsIOStream(
            websocket=self.sync_websocket, uploads_root=uploads_path
        )
        assert stream.uploads_root == uploads_path.resolve()

    def test_init_verbose(self) -> None:
        """Test initialization with verbose logging."""
        stream = AsyncWebsocketsIOStream(
            websocket=self.sync_websocket, verbose=True
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
            websocket=self.sync_websocket, verbose=True
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
            self.sync_stream.send(mock_event)  # pyright: ignore

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
            verbose_stream.send(mock_event)  # pyright: ignore

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
            self.sync_stream.send(mock_event)  # pyright: ignore

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

    # pylint: disable=no-self-use
    def test_input_runtime_error_fallback(self) -> None:
        """Test input fallback when asyncio.run raises RuntimeError."""
        sync_websocket = MagicMock()
        sync_websocket.send = MagicMock()
        sync_websocket.recv = MagicMock()

        sync_stream = AsyncWebsocketsIOStream(
            websocket=sync_websocket,
            is_async=False,
            uploads_root=None,
            verbose=False,
        )

        # Create a simple coroutine that we can control
        async def mock_coro() -> str:
            return "threadsafe result"

        # Instead of patching a_input, we'll manually call the RuntimeError path
        # pylint: disable=too-many-try-statements
        with (
            patch("asyncio.get_event_loop") as mock_get_event_loop,
            patch(
                "asyncio.run_coroutine_threadsafe"
            ) as mock_run_coroutine_threadsafe,
            patch(
                "asyncio.run", side_effect=RuntimeError("Event loop is running")
            ),
        ):
            mock_future = MagicMock()
            mock_future.result.return_value = "threadsafe result"
            mock_run_coroutine_threadsafe.return_value = mock_future
            coro = mock_coro()
            original_a_input = sync_stream.a_input

            def new_a_input(prompt: str = "", *, password: bool = False) -> Any:
                return coro

            try:
                sync_stream.a_input = new_a_input  # type: ignore
                result = sync_stream.input("Enter text: ")
                assert result == "threadsafe result"
                mock_get_event_loop.assert_called_once()
                mock_run_coroutine_threadsafe.assert_called_once()

            finally:
                # Clean up
                sync_stream.a_input = original_a_input  # type: ignore
                if hasattr(coro, "close"):
                    coro.close()

    @pytest.mark.asyncio
    async def test_a_input_basic(self) -> None:
        """Test async input functionality."""
        request_id = "test_request_id"

        # Mock the response
        response_data = {"request_id": request_id, "data": "async user input"}
        self.async_websocket.recv.return_value = json.dumps(response_data)

        with patch("uuid.uuid4") as mock_uuid:
            mock_uuid.return_value.hex = request_id
            result = await self.async_stream.a_input("Enter text: ")

        assert result == "async user input"

        # Verify websocket interactions
        self.async_websocket.send.assert_called_once()
        self.async_websocket.recv.assert_called_once()

        # Check the sent data
        sent_data = json.loads(self.async_websocket.send.call_args[0][0])
        assert sent_data["type"] == "input_request"
        assert sent_data["request_id"] == request_id
        assert sent_data["prompt"] == "Enter text: "
        assert sent_data["password"] is False

    @pytest.mark.asyncio
    async def test_a_input_password(self) -> None:
        """Test async input with password flag."""
        request_id = "test_request_id"

        response_data = {"request_id": request_id, "data": "secret_password"}
        self.async_websocket.recv.return_value = json.dumps(response_data)

        with patch("uuid.uuid4") as mock_uuid:
            mock_uuid.return_value.hex = request_id
            result = await self.async_stream.a_input(
                "Enter password: ", password=True
            )

        assert result == "secret_password"

        # Check the sent data includes password flag
        sent_data = json.loads(self.async_websocket.send.call_args[0][0])
        assert sent_data["password"] is True

    @pytest.mark.asyncio
    async def test_a_input_bytes_response(self) -> None:
        """Test async input with bytes response."""
        request_id = "test_request_id"

        # Mock bytes response
        response_data = {"request_id": request_id, "data": "bytes response"}
        self.async_websocket.recv.return_value = json.dumps(
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
        self.async_websocket.recv.return_value = json.dumps(response_data)

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
        self.async_websocket.recv.return_value = "plain text response"

        result = await self.async_stream.a_input("Enter text: ")

        assert result == "plain text response"

    @pytest.mark.asyncio
    async def test_a_input_invalid_json_response(self) -> None:
        """Test async input with invalid JSON response."""
        self.async_websocket.recv.return_value = "{invalid json"

        result = await self.async_stream.a_input("Enter text: ")

        assert result == "{invalid json"

    @pytest.mark.asyncio
    @patch("waldiez.io.ws.LOG")
    async def test_a_input_non_dict_response(self, mock_log: MagicMock) -> None:
        """Test async input with non-dict JSON response."""
        self.async_websocket.recv.return_value = json.dumps("string response")

        result = await self.async_stream.a_input("Enter text: ")

        # Should log error and return empty string
        mock_log.error.assert_called_once()
        assert "Invalid input response:" in mock_log.error.call_args[0][0]
        assert result == ""

    def test_parse_response_valid(self) -> None:
        """Test parsing valid response."""
        response = {"request_id": "test_id", "data": "valid response"}

        result = self.sync_stream._parse_response(  # pyright: ignore
            response,
            "test_id",
        )

        assert result == "valid response"

    @patch("waldiez.io.ws.LOG")
    def test_parse_response_validation_error(self, mock_log: MagicMock) -> None:
        """Test parsing response with validation error."""
        response = {"invalid": "response"}

        result = self.sync_stream._parse_response(  # pyright: ignore
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

        result = self.sync_stream._parse_response(  # pyright: ignore
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

    def test_get_content_string_text(self) -> None:
        """Test getting content string from text content."""
        # Mock UserInputData with text content
        mock_content = MagicMock()
        mock_content.type = "text"
        mock_content.text = "Hello, world!"

        mock_user_data = MagicMock()
        mock_user_data.content = mock_content

        result = self.sync_stream.get_content_string(mock_user_data, "test_id")

        assert result == "Hello, world!"

    @patch("waldiez.io.ws.get_image")
    def test_get_content_string_image_url(
        self, mock_get_image: MagicMock
    ) -> None:
        """Test getting content string from image_url content."""
        mock_get_image.return_value = "http://example.com/image.jpg"

        # Mock UserInputData with image_url content
        mock_image_url = MagicMock()
        mock_image_url.url = "http://example.com/image.jpg"

        mock_content = MagicMock()
        mock_content.type = "image_url"
        mock_content.image_url = mock_image_url

        mock_user_data = MagicMock()
        mock_user_data.content = mock_content

        result = self.sync_stream.get_content_string(mock_user_data, "test_id")

        assert result == "<img http://example.com/image.jpg>"
        mock_get_image.assert_called_once_with(
            uploads_root=self.sync_stream.uploads_root,
            image_data="http://example.com/image.jpg",
            base_name="test_id",
        )

    def test_get_content_string_image_url_no_url(self) -> None:
        """Test getting content string from image_url content with no URL."""
        # Mock UserInputData with empty image_url
        mock_image_url = MagicMock()
        mock_image_url.url = None

        mock_content = MagicMock()
        mock_content.type = "image_url"
        mock_content.image_url = mock_image_url

        mock_user_data = MagicMock()
        mock_user_data.content = mock_content

        result = self.sync_stream.get_content_string(mock_user_data, "test_id")

        assert result == ""

    def test_get_content_string_image_url_no_image_url(self) -> None:
        """Test getting content string from image_url with no image_url."""
        mock_content = MagicMock()
        mock_content.type = "image_url"
        mock_content.image_url = None

        mock_user_data = MagicMock()
        mock_user_data.content = mock_content

        result = self.sync_stream.get_content_string(mock_user_data, "test_id")

        assert result == ""

    @patch("waldiez.io.ws.get_image")
    def test_get_content_string_image_with_file(
        self, mock_get_image: MagicMock
    ) -> None:
        """Test getting content string from image content with file."""
        mock_get_image.return_value = "base64_encoded_image_data"

        # Mock UserInputData with image content
        mock_image = MagicMock()
        mock_image.file = "base64_encoded_image_data"
        mock_image.url = None

        mock_content = MagicMock()
        mock_content.type = "image"
        mock_content.image = mock_image

        mock_user_data = MagicMock()
        mock_user_data.content = mock_content

        result = self.sync_stream.get_content_string(mock_user_data, "test_id")

        assert result == "<img base64_encoded_image_data>"
        mock_get_image.assert_called_once_with(
            uploads_root=self.sync_stream.uploads_root,
            image_data="base64_encoded_image_data",
            base_name="test_id",
        )

    @patch("waldiez.io.ws.get_image")
    def test_get_content_string_image_with_url(
        self, mock_get_image: MagicMock
    ) -> None:
        """Test getting content string from image content with URL."""
        mock_get_image.return_value = "http://example.com/image.jpg"

        # Mock UserInputData with image content
        mock_image = MagicMock()
        mock_image.file = None
        mock_image.url = "http://example.com/image.jpg"

        mock_content = MagicMock()
        mock_content.type = "image"
        mock_content.image = mock_image

        mock_user_data = MagicMock()
        mock_user_data.content = mock_content

        result = self.sync_stream.get_content_string(mock_user_data, "test_id")

        assert result == "<img http://example.com/image.jpg>"
        mock_get_image.assert_called_once_with(
            uploads_root=self.sync_stream.uploads_root,
            image_data="http://example.com/image.jpg",
            base_name="test_id",
        )

    def test_get_content_string_image_no_data(self) -> None:
        """Test getting content string from image content with no data."""
        mock_image = MagicMock()
        mock_image.file = None
        mock_image.url = None

        mock_content = MagicMock()
        mock_content.type = "image"
        mock_content.image = mock_image

        mock_user_data = MagicMock()
        mock_user_data.content = mock_content

        result = self.sync_stream.get_content_string(mock_user_data, "test_id")

        assert result == ""

    def test_get_content_string_image_no_image(self) -> None:
        """Test getting content string from image content with no image."""
        mock_content = MagicMock()
        mock_content.type = "image"
        mock_content.image = None

        mock_user_data = MagicMock()
        mock_user_data.content = mock_content

        result = self.sync_stream.get_content_string(mock_user_data, "test_id")

        assert result == ""

    @patch("waldiez.io.ws.LOG")
    def test_get_content_string_unknown_type(self, mock_log: MagicMock) -> None:
        """Test getting content string from unknown content type."""
        mock_content = MagicMock()
        mock_content.type = "unknown_type"

        mock_user_data = MagicMock()
        mock_user_data.content = mock_content

        result = self.sync_stream.get_content_string(mock_user_data, "test_id")

        assert result == ""
        mock_log.error.assert_called_once()
        assert "Unknown content type:" in mock_log.error.call_args[0][0]

    def test_get_response_text_string_data(self) -> None:
        """Test getting response text from string data."""
        mock_response = MagicMock()
        mock_response.data = "string response"

        result = self.sync_stream.get_response_text(mock_response, "test_id")

        assert result == "string response"

    def test_get_response_text_list_data(self) -> None:
        """Test getting response text from list data."""
        mock_user_data = MagicMock(spec=UserInputData)

        # Mock the get_content_string method to return expected value
        with patch.object(
            self.sync_stream,
            "get_content_string",
            return_value="content string",
        ):
            mock_response = MagicMock()
            mock_response.data = ["string entry", mock_user_data]

            result = self.sync_stream.get_response_text(
                mock_response, "test_id"
            )

            assert result == "string entrycontent string"

    def test_get_response_text_single_user_data(self) -> None:
        """Test getting response text from single UserInputData."""
        # Create a mock that will pass the isinstance check
        mock_user_data = MagicMock(spec=UserInputData)

        # Mock the get_content_string method to return expected value
        with patch.object(
            self.sync_stream,
            "get_content_string",
            return_value="user data content",
        ):
            mock_response = MagicMock()
            mock_response.data = mock_user_data

            result = self.sync_stream.get_response_text(
                mock_response, "test_id"
            )

            assert result == "user data content"

    def test_get_response_text_other_data_type(self) -> None:
        """Test getting response text from other data types."""
        mock_response = MagicMock()
        mock_response.data = {"unexpected": "data"}

        result = self.sync_stream.get_response_text(mock_response, "test_id")

        assert result == ""

    def test_get_response_text_empty_list(self) -> None:
        """Test getting response text from empty list."""
        mock_response = MagicMock()
        mock_response.data = []

        result = self.sync_stream.get_response_text(mock_response, "test_id")

        assert result == ""
