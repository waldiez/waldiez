# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Test waldiez.models.chat.chat_data.*."""

from typing import Any

import pytest

from waldiez.models.chat import (
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatNested,
    WaldiezChatSummary,
)
from waldiez.models.common import (
    WaldiezDefaultCondition,
    WaldiezTransitionAvailability,
)


def test_waldiez_chat_data() -> None:
    """Test WaldiezChatData."""
    # Given
    chat_data = WaldiezChatData(
        name="chat_data",
        description="Chat data",
        source_type="user_proxy",
        target_type="assistant",
        position=-1,
        order=1,
        clear_history=False,
        message={  # type: ignore
            "type": "string",
            "content": "Hello there",
            "context": {
                "problem": "Solve this task",
                "solution": "4.2",
                "alternative_solution": "42",
                "not_a_solution": "null",
            },
        },
        nested_chat={  # type: ignore
            "message": {
                "type": "string",
                "content": "Hi",
            },
            "reply": {
                "type": "string",
                "content": "Hello",
            },
        },
        summary={  # type: ignore
            "method": "reflectionWithLlm",
            "prompt": "Summarize this chat",
            "args": {
                "summary_role": "system",
            },
        },
        max_turns=5,
        silent=False,
        prerequisites=["chat1", "chat2"],
        condition=WaldiezDefaultCondition.create(),
        available=WaldiezTransitionAvailability(),
    )

    # Then
    assert chat_data.name == "chat_data"
    assert chat_data.description == "Chat data"
    assert chat_data.position == -1
    assert chat_data.order == 1
    assert not chat_data.clear_history
    assert isinstance(chat_data.message, WaldiezChatMessage)
    assert chat_data.message.type == "string"
    assert chat_data.message.content == "Hello there"
    assert chat_data.message.context == {
        "problem": "Solve this task",
        "solution": 4.2,
        "alternative_solution": 42,
        "not_a_solution": None,
    }
    assert isinstance(chat_data.nested_chat.message, WaldiezChatMessage)
    assert chat_data.nested_chat.message.type == "string"
    assert chat_data.nested_chat.message.content == "Hi"
    assert isinstance(chat_data.nested_chat.reply, WaldiezChatMessage)
    assert chat_data.nested_chat.reply.type == "string"
    assert chat_data.nested_chat.reply.content == "Hello"
    assert chat_data.summary.method == "reflection_with_llm"
    assert chat_data.summary.prompt == "Summarize this chat"
    assert chat_data.summary.args == {"summary_role": "system"}
    assert chat_data.max_turns == 5
    assert not chat_data.silent
    assert chat_data.summary_args == {
        "summary_prompt": "Summarize this chat",
        "summary_role": "system",
    }
    chat_data.set_prerequisites([1, 2])
    chat_args = chat_data.get_chat_args(for_queue=True)
    assert chat_args["chat_id"] == 0
    assert chat_args["problem"] == "Solve this task"
    assert chat_args["solution"] == 4.2
    assert chat_args["alternative_solution"] == 42
    assert chat_args["not_a_solution"] is None

    assert chat_data.prerequisites == ["chat1", "chat2"]
    assert chat_args["prerequisites"] == [1, 2]

    model_dump = chat_data.model_dump(by_alias=True)
    assert model_dump["summary"]["method"] == "reflectionWithLlm"


def test_waldiez_chat_data_message() -> None:
    """Test WaldiezChatData message."""
    # Given
    chat_data = WaldiezChatData(
        name="chat_data",
        description="Chat data",
        source_type="user_proxy",
        target_type="assistant",
        position=0,
        clear_history=False,
        message="Hello there",
        nested_chat=WaldiezChatNested(),
        summary=WaldiezChatSummary(),
        condition=WaldiezDefaultCondition.create(),
        available=WaldiezTransitionAvailability(),
    )
    # Then
    assert isinstance(chat_data.message, WaldiezChatMessage)
    assert chat_data.message.type == "string"
    assert chat_data.message.content == "Hello there"
    # Given
    chat_data = WaldiezChatData(
        name="chat_data",
        description="Chat data",
        source_type="user_proxy",
        target_type="assistant",
        position=0,
        clear_history=False,
        message=None,  # type: ignore
    )
    # Then
    assert isinstance(chat_data.message, WaldiezChatMessage)
    assert chat_data.message.type == "none"
    assert chat_data.message.content is None

    # Given
    chat_data = WaldiezChatData(
        name="chat_data",
        description="Chat data",
        source_type="user_proxy",
        target_type="assistant",
        position=0,
        clear_history=False,
        message=42,  # type: ignore
        nested_chat=WaldiezChatNested(),
        summary=WaldiezChatSummary(),
        condition=WaldiezDefaultCondition.create(),
        available=WaldiezTransitionAvailability(),
    )
    # Then
    assert isinstance(chat_data.message, WaldiezChatMessage)
    assert chat_data.message.type == "string"
    assert chat_data.message.content == "42"

    # Given
    chat_data = WaldiezChatData(
        name="chat_data",
        description="Chat data",
        source_type="user_proxy",
        target_type="assistant",
        position=0,
        clear_history=False,
        message=(1, 2),  # type: ignore
    )
    assert isinstance(chat_data.message, WaldiezChatMessage)
    assert chat_data.message.type == "none"

    # Given
    chat_data = WaldiezChatData(
        name="chat_data",
        description="Chat data",
        source_type="user_proxy",
        target_type="assistant",
        position=0,
        clear_history=False,
        message=WaldiezChatMessage(
            type="string",
            use_carryover=False,
            content="Hello there",
            context={},
        ),
        nested_chat=WaldiezChatNested(),
        summary=WaldiezChatSummary(),
        condition=WaldiezDefaultCondition.create(),
        available=WaldiezTransitionAvailability(),
    )
    # Then
    assert isinstance(chat_data.message, WaldiezChatMessage)
    assert chat_data.message.type == "string"
    assert chat_data.message.content == "Hello there"

    # Given
    chat_data_dict: dict[str, Any] = {
        "name": "chat_data",
        "description": "Chat data",
        "source_type": "user_proxy",
        "target_type": "assistant",
        "position": 0,
        "clear_history": False,
        "message": {
            "type": "string",
            "content": "text message",
            "context": {
                "problem": "Solve this task",
                "not_a_solution": "null",
                "n_results": 42,
                "as_list": [1, 2, 3],
            },
            "use_carryover": False,
        },
    }
    # Then
    chat_data = WaldiezChatData(**chat_data_dict)  # pyright: ignore
    assert isinstance(chat_data.message, WaldiezChatMessage)
    assert chat_data.message.type == "string"
    assert chat_data.message.content == "text message"
    assert chat_data.message.context == {
        "problem": "Solve this task",
        "not_a_solution": None,
        "n_results": 42,
        "as_list": [1, 2, 3],
    }
    assert chat_data.message.use_carryover is False


def test_waldiez_chat_summary() -> None:
    """Test WaldiezChatData summary."""
    # Given
    chat_data = WaldiezChatData(
        name="chat_data",
        description="Chat data",
        source_type="user_proxy",
        target_type="assistant",
        position=0,
        clear_history=False,
        message="Hello there",
        nested_chat=WaldiezChatNested(),
        summary=WaldiezChatSummary(),
        condition=WaldiezDefaultCondition.create(),
        available=WaldiezTransitionAvailability(),
    )
    # Then
    assert chat_data.summary.method == "last_msg"
    assert not chat_data.summary_args
    model_dump = chat_data.model_dump(by_alias=True)
    assert model_dump["summary"]["method"] == "lastMsg"
    # Given
    chat_data = WaldiezChatData(
        name="chat_data",
        description="Chat data",
        source_type="user_proxy",
        target_type="assistant",
        position=0,
        clear_history=False,
        message="Hello there",
        summary={  # type: ignore
            "method": "reflectionWithLlm",
        },
    )
    # Then
    assert chat_data.summary_args
    assert (
        chat_data.summary_args["summary_prompt"]
        == "Summarize the conversation."
    )
    model_dump = chat_data.model_dump(by_alias=True)
    assert model_dump["summary"]["method"] == "reflectionWithLlm"
    # Given
    chat_data = WaldiezChatData(
        name="chat_data",
        description="Chat data",
        source_type="user_proxy",
        target_type="assistant",
        position=0,
        clear_history=False,
        message="Hello there",
        summary={  # type: ignore
            "method": "reflectionWithLlm",
            "prompt": "Summarize this chat",
            "args": {
                "summary_role": "system",
            },
        },
    )
    # Then
    model_dump = chat_data.model_dump(by_alias=True)
    assert model_dump["summary"]["method"] == "reflectionWithLlm"
    model_dump = chat_data.model_dump(by_alias=False)
    assert model_dump["summary"]["method"] == "reflection_with_llm"


def test_waldiez_chat_get_chat_args() -> None:
    """Test get_chat_args."""
    chat_data = WaldiezChatData(
        name="Chat data",
        description="Chat data",
        source_type="user_proxy",
        target_type="assistant",
        position=0,
        clear_history=False,
        message={  # type: ignore
            "type": "string",
            "content": "Hello there",
            "context": {
                "problem": "Solve this task",
                "solution": "4.2",
                "alternative_solution": "42",
                "not_a_solution": "null",
                "is_valid": "true",
            },
        },
        summary={  # type: ignore
            "method": "last_msg",
        },
    )
    chat_args = chat_data.get_chat_args(for_queue=True)
    assert chat_args["chat_id"] == 0
    assert chat_args["problem"] == "Solve this task"
    assert chat_args["solution"] == 4.2
    assert chat_args["alternative_solution"] == 42
    assert chat_args["not_a_solution"] is None


def test_waldiez_chat_invalid_message_method() -> None:
    """Test invalid message method."""
    with pytest.raises(ValueError):
        WaldiezChatData(
            name="Chat data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            position=0,
            clear_history=False,
            message={  # type: ignore
                "type": "method",
                "content": "Hello there",
            },
            summary={  # type: ignore
                "method": "reflectionWithLlm",
            },
        )
