# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-module-docstring,missing-class-docstring
# pylint: disable=missing-function-docstring,missing-param-doc,protected-access
# pylint: disable=missing-return-doc,unused-argument,unused-variable

"""Tests for waldiez.io.stream.*."""

import json
import queue
import sys
from typing import Any, Callable
from unittest.mock import MagicMock, patch

from autogen.events import BaseEvent  # type: ignore

from waldiez.io import StructuredIOStream


# Create a mock BaseEvent for testing
class MockEvent(BaseEvent):
    """Mock event for testing purposes."""

    type: str = "test_event"
    content: str

    def __init__(self, content: str = "test content") -> None:
        """Initialize the mock event."""
        super().__init__(content=content)


class TestStructuredIOStream:
    """Test suite for StructuredIOStream class."""

    stream: StructuredIOStream

    def setup_method(self) -> None:
        """Set up test fixtures."""
        self.stream = StructuredIOStream(
            timeout=1
        )  # Short timeout for faster tests

    def test_init(self) -> None:
        """Test initialization."""
        assert self.stream.timeout == 1

        # Test default timeout
        default_stream = StructuredIOStream()
        assert default_stream.timeout == 120

    @patch("builtins.print")
    def test_print(self, mock_print: MagicMock) -> None:
        """Test print method."""
        # Test basic print
        self.stream.print("Hello, world!")

        # Verify print was called with JSON
        args, kwargs = mock_print.call_args
        payload = json.loads(args[0])

        assert payload["type"] == "print"
        assert isinstance(payload["id"], str)
        assert isinstance(payload["timestamp"], str)
        assert payload["data"] == "Hello, world!\n"
        assert kwargs == {"flush": False}

        # Test with multiple arguments and custom sep/end
        mock_print.reset_mock()
        self.stream.print("Hello", "world", sep="-", end="!", flush=True)

        args, kwargs = mock_print.call_args
        payload = json.loads(args[0])

        assert payload["data"] == "Hello-world!"
        assert kwargs == {"flush": True}

    @patch("builtins.print")
    @patch("waldiez.io.structured.getpass")
    def test_input_password(
        self,
        mock_getpass: MagicMock,
        mock_print: MagicMock,
    ) -> None:
        """Test input method with password."""
        mock_getpass.return_value = "secret_password"

        # Mock thread to simulate user input
        def mock_thread_func(
            target: Callable[[], None],
            daemon: bool,
        ) -> MagicMock:
            """Mock thread function to simulate user input."""
            thread_mock = MagicMock()
            target()  # Execute the target function immediately
            return thread_mock

        with patch("threading.Thread", side_effect=mock_thread_func):
            result = self.stream.input("Enter password: ", password=True)

        # Verify the input request was printed
        args, _ = mock_print.call_args_list[0]
        payload = json.loads(args[0])

        assert payload["type"] == "input_request"
        assert "request_id" in payload
        assert payload["prompt"] == "Enter password: "
        assert payload["password"] is True

        # Verify the password was returned
        assert result == "secret_password"
        mock_getpass.assert_called_once_with("Enter password: ")

    @patch("builtins.print")
    @patch("builtins.input")
    def test_input_standard(
        self, mock_input: MagicMock, mock_print: MagicMock
    ) -> None:
        """Test input method with standard input."""
        mock_input.return_value = "user input"

        # Mock thread to simulate user input
        def mock_thread_func(
            target: Callable[[], None], daemon: bool
        ) -> MagicMock:
            thread_mock = MagicMock()
            target()  # Execute the target function immediately
            return thread_mock

        with patch("threading.Thread", side_effect=mock_thread_func):
            result = self.stream.input("Enter text: ")

        # Verify the input request was printed
        args, _ = mock_print.call_args_list[0]
        payload = json.loads(args[0])

        assert payload["type"] == "input_request"
        assert payload["prompt"] == "Enter text: "
        assert payload["password"] is False

        # Verify the input was returned
        assert result == "user input"
        mock_input.assert_called_once_with("Enter text: ")

    @patch("builtins.print")
    def test_input_timeout(self, mock_print: MagicMock) -> None:
        """Test input timeout."""
        # Create a queue that will never return to simulate timeout

        with patch.object(queue.Queue, "get", side_effect=queue.Empty):
            with patch.object(self.stream, "_send_input_request"):
                # Use a very short timeout to speed up the test
                self.stream.timeout = 0.1
                result = self.stream._read_user_input(  # pyright: ignore
                    "Prompt: ", False, "test_id"
                )

        # Verify timeout message was sent
        timeout_call = mock_print.call_args_list[-1]
        args, _ = timeout_call
        payload = json.loads(args[0])

        assert payload["type"] == "timeout"
        assert payload["request_id"] == "test_id"
        assert "No input received after" in payload["data"]

        # Verify empty result
        assert result == ""

    @patch("builtins.print")
    @patch("builtins.input")
    def test_input_eof_error(
        self, mock_input: MagicMock, mock_print: MagicMock
    ) -> None:
        """Test input with EOFError."""
        mock_input.side_effect = EOFError()

        # Mock thread to simulate user input
        def mock_thread_func(
            target: Callable[[], None], daemon: bool
        ) -> MagicMock:
            thread_mock = MagicMock()
            target()  # Execute the target function immediately
            return thread_mock

        with patch("threading.Thread", side_effect=mock_thread_func):
            result = self.stream.input("Enter text: ")

        # Verify the result is empty
        assert result == ""

    @patch("builtins.print")
    def test_send(self, mock_print: MagicMock) -> None:
        """Test send method."""
        # Create a mock event
        mock_event = MockEvent(content="test message")

        # Send the event
        self.stream.send(mock_event)

        # Verify print was called with JSON
        args, kwargs = mock_print.call_args
        payload = json.loads(args[0])

        assert payload["type"] == "test_event"
        assert payload["content"] == "test message"
        assert kwargs == {"flush": True}

    def test_handle_user_input_plain_text(self) -> None:
        """Test parsing plain text input."""
        # Test with plain text (non-JSON)
        result = self.stream._handle_user_input(  # pyright: ignore
            "Hello world",
            "test_id",
        )
        assert result.to_string() == "Hello world"

    def test_handle_user_input_json_response(self) -> None:
        """Test parsing JSON response input."""
        # Test with JSON that has matching request_id and string data
        json_input = json.dumps(
            {"request_id": "test_id", "data": "JSON response"}
        )
        result = self.stream._handle_user_input(  # pyright: ignore
            json_input,
            "test_id",
        )
        assert result.to_string() == "JSON response"

        # Test with JSON that has matching request_id and dict data
        json_input = json.dumps(
            {
                "request_id": "test_id",
                "data": {"text": "Hello", "image": "src='test.jpg'"},
            }
        )
        result = self.stream._handle_user_input(  # pyright: ignore
            json_input,
            "test_id",
        )
        assert result.to_string() == "<img src='test.jpg'> Hello"

        # Test with JSON that has text/image outside of data
        json_input = json.dumps(
            {
                "request_id": "test_id",
                "text": "Hello outside",
                "image": "src='outside.jpg'",
            }
        )
        result = self.stream._handle_user_input(  # pyright: ignore
            json_input,
            "test_id",
        )
        assert result.to_string() == "<img src='outside.jpg'> Hello outside"

        # Test with JSON that has no data
        json_input = json.dumps({"request_id": "test_id"})
        result = self.stream._handle_user_input(  # pyright: ignore
            json_input,
            "test_id",
        )
        assert result.to_string() == ""

        # Test with JSON that has empty data
        json_input = json.dumps({"request_id": "test_id", "data": {}})
        result = self.stream._handle_user_input(  # pyright: ignore
            json_input,
            "test_id",
        )
        assert result.to_string() == ""

        # Test with double-dumped JSON
        json_input = json.dumps(
            {"request_id": "test_id", "data": json.dumps("Hello, world!")}
        )
        result = self.stream._handle_user_input(  # pyright: ignore
            json_input,
            "test_id",
        )
        assert result.to_string() == "Hello, world!"

        json_input = json.dumps(
            {
                "request_id": "test_id",
                "data": json.dumps(
                    {"text": "Hello", "image": "src='double.jpg'"}
                ),
            }
        )
        result = self.stream._handle_user_input(  # pyright: ignore
            json_input,
            "test_id",
        )
        assert result.to_string() == "<img src='double.jpg'> Hello"

    @patch("builtins.print")
    def test_handle_user_input_mismatched_request_id(
        self, mock_print: MagicMock
    ) -> None:
        """Test parsing input with mismatched request_id."""
        json_input = json.dumps(
            {"request_id": "wrong_id", "data": "This should be ignored"}
        )
        result = self.stream._handle_user_input(  # pyright: ignore
            json_input,
            "test_id",
        )

        # Verify warning was printed
        stderr_call = None
        for call_args in mock_print.call_args_list:
            args, kwargs = call_args
            if kwargs.get("file") is sys.stderr or "stderr" in str(
                kwargs.get("file", "")
            ):
                stderr_call = call_args
                break

        # Check the warning message
        assert stderr_call is not None
        args, kwargs = stderr_call
        payload = json.loads(args[0])

        assert payload["type"] == "warning"
        assert "mismatched request_id" in payload["data"]["message"]
        assert payload["data"]["details"]["expected_id"] == "test_id"

        # Result should be empty
        assert result.to_string() == ""

    def test_handle_user_input_json_error(self) -> None:
        """Test parsing input with invalid JSON."""
        # Test with invalid JSON
        invalid_json = "{invalid: json"
        result = self.stream._handle_user_input(  # pyright: ignore
            invalid_json,
            "test_id",
        )
        assert result.to_string() == invalid_json

    def test_format_multimedia_response(self) -> None:
        """Test formatting multimedia response."""
        data: dict[str, Any] = {}
        # Test with both image and text
        data = {"image": "src='test.jpg'", "text": "Hello, world!"}
        result = self.stream._format_multimedia_response(  # pyright: ignore
            data,
        )
        assert result == "<img src='test.jpg'> Hello, world!"

        # Test with only image
        data = {"image": "src='test.jpg'"}
        result = self.stream._format_multimedia_response(  # pyright: ignore
            data,
        )
        assert result == "<img src='test.jpg'>"

        # Test with only text
        data = {"text": "Hello, world!"}
        result = self.stream._format_multimedia_response(  # pyright: ignore
            data,
        )
        assert result == "Hello, world!"

        # Test with empty data
        data = {}
        result = self.stream._format_multimedia_response(  # pyright: ignore
            data,
        )
        assert result == ""

    @patch("builtins.print")
    def test_send_timeout_message(self, mock_print: MagicMock) -> None:
        """Test sending timeout message."""
        self.stream._send_timeout_message("timeout_id")  # pyright: ignore

        args, kwargs = mock_print.call_args
        payload = json.loads(args[0])

        assert payload["type"] == "timeout"
        assert payload["request_id"] == "timeout_id"
        assert isinstance(payload["timestamp"], str)
        assert (
            f"No input received after {self.stream.timeout} seconds"
            in payload["data"]
        )
        assert kwargs == {"flush": True}
