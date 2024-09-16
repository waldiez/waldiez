"""Test waldiez.models.chat.chat_message.*."""

from typing import Dict

import pytest
from typing_extensions import Literal

from waldiez.models.chat.chat_message import (
    WaldieChatMessage,
    validate_message_dict,
)


def test_waldie_chat_message() -> None:
    """Test WaldieChatMessage."""
    # Given
    message = WaldieChatMessage(
        type="string",
        content="Hello there",
    )
    # Then
    assert message.type == "string"
    assert message.content == "Hello there"

    # Given
    message = WaldieChatMessage(
        type="method",
        content="Hello there",
    )
    # Then
    assert message.type == "method"
    assert message.content == "Hello there"

    # Given
    message = WaldieChatMessage(
        type="none",
        content=None,
    )
    # Then
    assert message.type == "none"
    assert message.content is None


def test_validate_message_dict() -> None:
    """Test validate_message_dict."""
    # Given
    message_content = """
def nested_chat_message(recipient, messages, sender, config):
    return "Hello there"
"""
    message_dict: Dict[Literal["type", "content"], str | None] = {
        "type": "string",
        "content": message_content,
    }
    # When
    message = validate_message_dict(message_dict, "nested_chat_message")
    # Then
    assert message.type == "string"
    assert message.content == message_content

    # Given
    message_content = "Hello there"
    message_dict = {
        "type": "method",
        "content": message_content,
    }
    # Then
    with pytest.raises(ValueError):
        validate_message_dict(message_dict, "nested_chat_message")

    # Given
    message_dict = {
        "type": "none",
        "content": None,
    }
    # When
    message = validate_message_dict(message_dict, "nested_chat_message")
    # Then
    assert message.type == "none"
    assert message.content is None

    # Given
    message_dict = {
        "type": "string",
        "content": None,
    }
    # Then
    with pytest.raises(ValueError):
        validate_message_dict(message_dict, "nested_chat_message")

    # Given
    message_dict = {
        "type": "method",
        "content": "",
    }
    # Then
    with pytest.raises(ValueError):
        validate_message_dict(message_dict, "nested_chat_message")

    # Given
    message_dict = {
        "type": "invalid",
        "content": "",
    }
    # Then
    with pytest.raises(ValueError):
        validate_message_dict(message_dict, "nested_chat_message")