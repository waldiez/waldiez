# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.chat.chat_message."""

import pytest

from waldiez.models.chat.chat_message import (
    RAG_METHOD_WITH_CARRYOVER_BODY,
    WaldiezChatMessage,
    get_last_carryover_method_content,
)


def test_waldiez_chat_message() -> None:
    """Test WaldiezChatMessage."""
    chat_message = WaldiezChatMessage(
        type="string",
        content="content",
        context={"key": "value"},
    )
    assert chat_message.type == "string"
    assert chat_message.content == "content"
    assert chat_message.context == {"key": "value"}

    chat_message = WaldiezChatMessage(
        type="method",
        content="content",
        context={"key": "value"},
        use_carryover=False,
    )
    assert chat_message.type == "method"
    assert chat_message.content_body == "content"
    assert chat_message.context == {"key": "value"}

    chat_message = WaldiezChatMessage(
        type="rag_message_generator",
        content="content",
        context={"key": "value"},
        use_carryover=True,
    )
    assert chat_message.type == "rag_message_generator"
    expected = RAG_METHOD_WITH_CARRYOVER_BODY
    assert chat_message.content_body == expected
    assert chat_message.context == {"key": "value"}
    assert chat_message.is_method()

    chat_message = WaldiezChatMessage(
        type="rag_message_generator",
        content=None,
        context={"key": "value"},
        use_carryover=True,
    )
    assert chat_message.type == "rag_message_generator"
    expected = RAG_METHOD_WITH_CARRYOVER_BODY
    assert chat_message.content_body == expected
    assert chat_message.context == {"key": "value"}

    chat_message = WaldiezChatMessage(
        type="rag_message_generator",
        content="content",
        context={"key": "value"},
        use_carryover=False,
    )
    assert chat_message.type == "rag_message_generator"
    assert chat_message.content_body == get_last_carryover_method_content(
        text_content="content",
    )

    chat_message = WaldiezChatMessage(
        type="none",
        content=None,
        context={"key": "value"},
        use_carryover=False,
    )
    assert chat_message.type == "none"
    assert chat_message.content_body == "None"
    assert chat_message.context == {"key": "value"}

    chat_message = WaldiezChatMessage(
        type="string",
        content=None,
        context={"key": "value"},
        use_carryover=False,
    )
    assert chat_message.type == "string"
    assert chat_message.content_body == ""
    assert not chat_message.is_method()

    chat_message = WaldiezChatMessage(
        type="string",
        content="content",
        context={"key": "value"},
        use_carryover=True,
    )
    assert chat_message.type == "string"
    assert chat_message.content_body
    assert '"content" + carryover' in chat_message.content_body
    assert chat_message.context == {"key": "value"}

    with pytest.raises(ValueError):
        _ = WaldiezChatMessage(
            type="invalid",  # type: ignore
            content="content",
            context={"key": "value"},
            use_carryover=False,
        )

    with pytest.raises(ValueError):
        _ = WaldiezChatMessage(
            type="method",
            content=None,
            use_carryover=False,
            context={"key": "value"},
        )

    chat_message = WaldiezChatMessage(
        type="string",
        content=None,
        context={"key": "value"},
        use_carryover=False,
    )
    with pytest.raises(ValueError):
        chat_message.validate_method("function_name", ["arg1", "arg2"])

    chat_message = WaldiezChatMessage(
        type="string",
        content="content",
        context={"key": "value"},
        use_carryover=False,
    )

    with pytest.raises(ValueError):
        chat_message.validate_method("function_name", ["arg1", "arg2"])
