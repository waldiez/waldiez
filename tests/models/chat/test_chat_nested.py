# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.chat.chat_nested.*."""

import pytest

from waldiez.models.chat.chat_message import WaldiezChatMessage
from waldiez.models.chat.chat_nested import WaldiezChatNested


def test_waldiez_chat_nested() -> None:
    """Test WaldiezChatNested."""
    # Given
    reply = WaldiezChatMessage(
        type="string",
        use_carryover=False,
        content="Hi",
        context={},
    )
    # When
    chat_nested = WaldiezChatNested(
        message="Hello there",  # type: ignore
        reply=reply,
    )
    # Then
    assert isinstance(chat_nested.message, WaldiezChatMessage)
    assert chat_nested.message.content == "Hello there"
    assert isinstance(chat_nested.reply, WaldiezChatMessage)
    assert chat_nested.reply.type == "string"
    assert chat_nested.reply.content == "Hi"

    # Given
    reply = None  # type: ignore
    message_content = """
def nested_chat_message(recipient, messages, sender, config):
    return "Hello there"
"""
    message = WaldiezChatMessage(
        type="method",
        use_carryover=False,
        content=message_content,
        context={},
    )
    # When
    chat_nested = WaldiezChatNested(
        message=message,
        reply=reply,
    )
    # Then
    assert isinstance(chat_nested.message, WaldiezChatMessage)
    assert chat_nested.message.type == "method"
    assert chat_nested.message.content == message_content
    assert chat_nested.message_content == '    return "Hello there"'
    assert isinstance(chat_nested.reply, WaldiezChatMessage)
    assert chat_nested.reply.type == "none"
    assert chat_nested.reply.content is None

    # Given
    message_content = "Hello there"
    reply_content = """
def nested_chat_reply(recipient, messages, sender, config):
    return "Hi"
"""
    # When
    chat_nested = WaldiezChatNested(
        message={  # type: ignore
            "type": "string",
            "content": message_content,
        },
        reply={  # type: ignore
            "type": "method",
            "content": reply_content,
        },
    )
    # Then
    assert isinstance(chat_nested.message, WaldiezChatMessage)
    assert chat_nested.message.type == "string"
    assert chat_nested.message.content == "Hello there"
    assert isinstance(chat_nested.reply, WaldiezChatMessage)
    assert chat_nested.reply.type == "method"
    assert chat_nested.reply.content == reply_content
    assert chat_nested.reply_content == '    return "Hi"'

    with pytest.raises(ValueError):
        _ = WaldiezChatNested(
            message=WaldiezChatMessage(
                type="string",
                use_carryover=False,
                content="Hello there",
                context={},
            ),
            reply=45,  # type: ignore
        )
