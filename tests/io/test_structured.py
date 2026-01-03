# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pyright: reportPrivateUsage=false,reportMissingTypeStubs=false
# pylint: disable=missing-module-docstring,missing-class-docstring,no-self-use
# pylint: disable=missing-function-docstring,missing-param-doc,protected-access
# pylint: disable=missing-return-doc,unused-argument,unused-variable

"""Tests for waldiez.io.stream.*."""

import json
from pathlib import Path
from typing import Any, Callable
from unittest.mock import MagicMock, patch

import pytest
from autogen.events import BaseEvent  # type: ignore
from autogen.events.agent_events import TextEvent  # type: ignore

from waldiez.io import StructuredIOStream


# Create a mock BaseEvent for testing
class MockEvent(BaseEvent):
    """Mock event for testing purposes."""

    type: str = "test_event"
    content: str

    def __init__(self, content: str = "test content") -> None:
        """Initialize the mock event."""
        super().__init__(content=content)


# pylint: disable=too-many-public-methods
# noinspection PyUnusedLocal
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
        assert payload["data"] == "Hello, world!"
        assert kwargs == {"flush": True}

        # Test with multiple arguments and custom sep/end
        mock_print.reset_mock()
        self.stream.print("Hello", "world", sep="-", end="!", flush=False)

        args, kwargs = mock_print.call_args
        payload = json.loads(args[0][:-1])

        assert payload["data"] == "Hello-world"
        assert kwargs == {"flush": False}

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
        assert "flush" in kwargs
        assert kwargs["flush"] is True

    def test_handle_user_input_plain_text(self) -> None:
        """Test parsing plain text input."""
        # Test with plain text (non-JSON)
        result = self.stream._handle_user_input(
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
        result = self.stream._handle_user_input(
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
        result = self.stream._handle_user_input(
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
        result = self.stream._handle_user_input(
            json_input,
            "test_id",
        )
        assert result.to_string() == "<img src='outside.jpg'> Hello outside"

        # Test with JSON that has no data
        json_input = json.dumps({"request_id": "test_id"})
        result = self.stream._handle_user_input(
            json_input,
            "test_id",
        )
        assert result.to_string() == ""

        # Test with JSON that has empty data
        json_input = json.dumps({"request_id": "test_id", "data": {}})
        result = self.stream._handle_user_input(
            json_input,
            "test_id",
        )
        assert result.to_string() == ""

        # Test with double-dumped JSON
        json_input = json.dumps(
            {"request_id": "test_id", "data": json.dumps("Hello, world!")}
        )
        result = self.stream._handle_user_input(
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
        result = self.stream._handle_user_input(
            json_input,
            "test_id",
        )
        assert result.to_string() == "<img src='double.jpg'> Hello"

    @patch("builtins.print")
    def test_print_with_json_dumped(self, mock_print: MagicMock) -> None:
        """Test printing with JSON dumped data."""
        # Test with valid JSON dumped string
        valid_json = json.dumps({"key": "value"})
        self.stream.print(valid_json)
        # Verify print was called with JSON
        args, kwargs = mock_print.call_args
        payload = json.loads(args[0])
        assert payload["type"] == "print"
        assert payload["key"] == "value"
        assert kwargs == {"flush": True}

    def test_handle_user_input_json_error(self) -> None:
        """Test parsing input with invalid JSON."""
        # Test with invalid JSON
        invalid_json = "{invalid: json"
        result = self.stream._handle_user_input(
            invalid_json,
            "test_id",
        )
        assert result.to_string() == invalid_json

    def test_format_multimedia_response(self) -> None:
        """Test formatting multimedia response."""
        data: dict[str, Any] = {}
        # Test with both image and text
        data = {"image": "src='test.jpg'", "text": "Hello, world!"}
        result = self.stream._format_multimedia_response(
            data,
        )
        assert result == "<img src='test.jpg'> Hello, world!"

        # Test with only image
        data = {"image": "src='test.jpg'"}
        result = self.stream._format_multimedia_response(
            data,
        )
        assert result == "<img src='test.jpg'>"

        # Test with only text
        data = {"text": "Hello, world!"}
        result = self.stream._format_multimedia_response(
            data,
        )
        assert result == "Hello, world!"

        # Test with empty data
        data = {}
        result = self.stream._format_multimedia_response(
            data,
        )
        assert result == ""

    @patch("builtins.print")
    def test_send_timeout_message(self, mock_print: MagicMock) -> None:
        """Test sending timeout message."""
        self.stream._send_timeout_message("timeout_id")

        args, kwargs = mock_print.call_args
        payload = json.loads(args[0])

        assert payload["type"] == "timeout"
        assert payload["request_id"] == "timeout_id"
        assert isinstance(payload["timestamp"], str)
        assert (
            f"No input received after {self.stream.timeout} seconds"
            in payload["data"]
        )
        assert "flush" in kwargs
        assert kwargs["flush"] is True
        # assert kwargs == {"flush": True}

    def test_init_with_uploads_root_string(self, tmp_path: Path) -> None:
        """Test initialization with uploads_root as string."""
        # Test with string path
        stream = StructuredIOStream(uploads_root=str(tmp_path))
        assert stream.uploads_root == tmp_path.resolve()

    def test_init_with_uploads_root_path_object(self, tmp_path: Path) -> None:
        """Test initialization with uploads_root as Path object."""
        stream = StructuredIOStream(uploads_root=tmp_path)
        assert stream.uploads_root == tmp_path.resolve()

    def test_init_creates_uploads_root_directory(self, tmp_path: Path) -> None:
        """Test that uploads_root directory is created if it doesn't exist."""
        non_existent_path = Path(tmp_path) / "new_folder" / "nested"

        # Ensure the path doesn't exist initially
        assert not non_existent_path.exists()

        # Create stream with non-existent path
        stream = StructuredIOStream(uploads_root=non_existent_path)

        # Verify the directory was created
        assert stream.uploads_root == non_existent_path.resolve()
        assert non_existent_path.exists()

    def test_handle_user_input_list_response(self) -> None:
        """Test handling list response data."""
        # Test with valid list data
        valid_list_data = [
            {"type": "text", "content": "Hello"},
            {"type": "image", "content": "image_data"},
        ]
        json_input = json.dumps(
            {"request_id": "test_id", "data": valid_list_data}
        )

        stream = StructuredIOStream()
        result = stream._handle_user_input(json_input, "test_id")

        # Should return UserResponse with list data
        assert result.request_id == "test_id"
        assert isinstance(result.data, list)

    def test_handle_user_input_empty_list(self) -> None:
        """Test handling empty list response."""
        json_input = json.dumps({"request_id": "test_id", "data": []})

        stream = StructuredIOStream()
        result = stream._handle_user_input(json_input, "test_id")

        assert result.to_string() == ""

    def test_load_user_input_double_json_decode_scenarios(self) -> None:
        """Test various double JSON decoding scenarios."""
        stream = StructuredIOStream()

        # Test double-dumped string
        double_dumped = json.dumps("Hello, world!")
        result = stream._load_user_input(double_dumped)
        assert result == "Hello, world!"

        # Test double-dumped dict with string data
        inner_dict = {"key": "value"}
        double_dumped_dict = json.dumps(json.dumps(inner_dict))
        result = stream._load_user_input(double_dumped_dict)
        assert result == inner_dict

        # Test triple-nested JSON (should stop at double)
        triple_dumped = json.dumps(json.dumps(json.dumps("deep")))
        result = stream._load_user_input(triple_dumped)
        assert result == json.dumps("deep")  # Should only decode twice

        # Test non-dict result after first decode
        list_data = ["item1", "item2"]
        dumped_list = json.dumps(list_data)
        result = stream._load_user_input(dumped_list)
        assert result == str(list_data)  # Should convert to string

        # Test dict with data field containing double-dumped JSON
        dict_with_double_data = {
            "data": json.dumps({"nested": "value"}),
            "other": "field",
        }
        dumped_dict = json.dumps(dict_with_double_data)
        result = stream._load_user_input(dumped_dict)

        expected: dict[str, Any] = {
            "data": {"nested": "value"},  # Should be decoded
            "other": "field",
        }
        assert result == expected

        # Test dict with data field containing invalid JSON (should not decode)
        dict_with_invalid_data = {"data": "not json", "other": "field"}
        dumped_dict = json.dumps(dict_with_invalid_data)
        result = stream._load_user_input(dumped_dict)
        assert result == dict_with_invalid_data

    def test_format_multimedia_response_with_content_wrapper(self) -> None:
        """Test formatting multimedia response with content wrapper."""
        # Test data wrapped in "content" key
        wrapped_data = {
            "content": {"image": "src='wrapped.jpg'", "text": "Wrapped content"}
        }

        stream = StructuredIOStream()
        result = stream._format_multimedia_response(wrapped_data)

        assert result == "<img src='wrapped.jpg'> Wrapped content"

        # Test nested content wrapper
        nested_wrapped = {"content": {"content": {"text": "Deeply nested"}}}

        result = stream._format_multimedia_response(nested_wrapped)
        assert result == "Deeply nested"

    def test_send_text_event(
        self,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        """Test that send() uses syncify for async on_send."""
        event = TextEvent(
            content="Hello, world!",
            sender="test_sender",
            recipient="test_recipient",
        )
        stream = StructuredIOStream()
        stream.send(event)
        captured = capsys.readouterr()
        assert "Hello, world!" in captured.out

    def test_send_text_event_with_dict_content(
        self,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        """Test sending a text event with dictionary content."""
        event = TextEvent(
            content=[{"content": "Hello, world!"}],
            sender="test_sender",
            recipient="test_recipient",
        )
        stream = StructuredIOStream()
        stream.send(event)
        captured = capsys.readouterr()
        assert "Hello, world!" in captured.out
