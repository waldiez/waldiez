# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=missing-param-doc,missing-type-doc,missing-return-doc
# pylint: disable=no-self-use
"""Tests for waldiez.io.models.base.*."""

import pytest

from waldiez.io.models.base import PrintMessage, UserInputRequest


class TestStructuredBase:
    """Test suite for StructuredBase class."""

    def test_structured_base_creation(self) -> None:
        """Test creating a StructuredBase instance."""
        # Can't instantiate abstract base directly,
        # so we'll use a concrete subclass
        message = PrintMessage(data="test message")
        assert message.type == "print"
        assert message.data == "test message"
        assert isinstance(message.id, str)
        assert len(message.id) > 0
        assert isinstance(message.timestamp, str)
        assert len(message.timestamp) > 0

    def test_structured_base_custom_values(self) -> None:
        """Test creating StructuredBase with custom id and timestamp."""
        custom_id = "custom_id_456"
        custom_timestamp = "2024-12-31T23:59:59Z"

        message = PrintMessage(
            id=custom_id, timestamp=custom_timestamp, data="test"
        )

        assert message.id == custom_id
        assert message.timestamp == custom_timestamp

    def test_structured_base_extra_fields_ignored(self) -> None:
        """Test that extra fields are ignored due to model config."""
        # This should not raise an error due to extra="ignore"
        message = PrintMessage(
            data="test",
            extra_field="should_be_ignored",  # type: ignore
        )

        assert message.data == "test"
        assert not hasattr(message, "extra_field")


class TestUserInputRequest:
    """Test suite for UserInputRequest class."""

    def test_user_input_request_creation(self) -> None:
        """Test creating a UserInputRequest instance."""
        request = UserInputRequest(
            request_id="req_123", prompt="Enter your name:"
        )

        assert request.type == "input_request"
        assert request.request_id == "req_123"
        assert request.prompt == "Enter your name:"
        assert request.password is False

    def test_user_input_request_with_password(self) -> None:
        """Test creating a UserInputRequest with password flag."""
        request = UserInputRequest(
            request_id="req_456", prompt="Enter password:", password=True
        )

        assert request.type == "input_request"
        assert request.request_id == "req_456"
        assert request.prompt == "Enter password:"
        assert request.password is True

    def test_user_input_request_inherits_base_fields(self) -> None:
        """Test that UserInputRequest inherits from StructuredBase."""
        request = UserInputRequest(request_id="req_789", prompt="Test prompt")

        # Should have inherited fields
        assert hasattr(request, "id")
        assert hasattr(request, "timestamp")
        assert isinstance(request.id, str)
        assert isinstance(request.timestamp, str)

    def test_user_input_request_type_override(self) -> None:
        """Test that type field is properly overridden."""
        # Even if we try to set a different type, it should be "input_request"
        request = UserInputRequest(request_id="req_999", prompt="Test")

        assert request.type == "input_request"

    def test_user_input_request_required_fields(self) -> None:
        """Test that required fields are enforced."""
        # Missing request_id should raise validation error
        with pytest.raises(ValueError):
            UserInputRequest(prompt="Test prompt")  # type: ignore

        # Missing prompt should raise validation error
        with pytest.raises(ValueError):
            UserInputRequest(request_id="req_123")  # type: ignore


class TestPrintMessage:
    """Test suite for PrintMessage class."""

    def test_print_message_creation(self) -> None:
        """Test creating a PrintMessage instance."""
        message = PrintMessage(data="Hello, world!")

        assert message.type == "print"
        assert message.data == "Hello, world!"

    def test_print_message_inherits_base_fields(self) -> None:
        """Test that PrintMessage inherits from StructuredBase."""
        message = PrintMessage(data="Test message")

        # Should have inherited fields
        assert hasattr(message, "id")
        assert hasattr(message, "timestamp")
        assert isinstance(message.id, str)
        assert isinstance(message.timestamp, str)

    def test_print_message_type_override(self) -> None:
        """Test that type field is properly overridden."""
        message = PrintMessage(data="Test")
        assert message.type == "print"

    def test_print_message_empty_data(self) -> None:
        """Test PrintMessage with empty data."""
        message = PrintMessage(data="")
        assert message.data == ""
        assert message.type == "print"

    def test_print_message_multiline_data(self) -> None:
        """Test PrintMessage with multiline data."""
        multiline_data = "Line 1\nLine 2\nLine 3"
        message = PrintMessage(data=multiline_data)
        assert message.data == multiline_data

    def test_print_message_unicode_data(self) -> None:
        """Test PrintMessage with unicode data."""
        unicode_data = "Hello 世界 🌍 café naïve"
        message = PrintMessage(data=unicode_data)
        assert message.data == unicode_data

    def test_print_message_required_fields(self) -> None:
        """Test that required fields are enforced."""
        # Missing data should raise validation error
        with pytest.raises(ValueError):
            PrintMessage()  # type: ignore

    def test_print_message_model_dump(self) -> None:
        """Test that PrintMessage can be serialized."""
        message = PrintMessage(data="Test message")
        dumped = message.model_dump()

        assert isinstance(dumped, dict)
        assert dumped["type"] == "print"
        assert dumped["data"] == "Test message"
        assert "id" in dumped
        assert "timestamp" in dumped

    def test_print_message_model_dump_json(self) -> None:
        """Test that PrintMessage can be serialized to JSON."""
        message = PrintMessage(data="Test message")
        json_str = message.model_dump_json()

        assert isinstance(json_str, str)
        assert '"type":"print"' in json_str
        assert '"data":"Test message"' in json_str
