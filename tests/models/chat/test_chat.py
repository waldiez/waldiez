# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.chat.chat.*."""

from typing import Any

from waldiez.models.agents.rag_user_proxy import WaldiezRagUserProxy
from waldiez.models.chat.chat import WaldiezChat
from waldiez.models.chat.chat_data import WaldiezChatData
from waldiez.models.chat.chat_nested import WaldiezChatNested


# noinspection PyArgumentList
def test_waldiez_chat() -> None:
    """Test WaldiezChat."""
    # Given
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat_data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            position=0,
            clear_history=False,
            max_turns=1,
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
        ),
    )
    # Then
    assert chat.id == "wc-1"
    assert chat.name == "chat_data"
    assert chat.source == "wa-1"
    assert chat.target == "wa-2"
    assert chat.message.type == "string"
    assert chat.message.content == "Hello there"
    assert chat.chat_id == 0
    assert not chat.prerequisites
    assert isinstance(chat.nested_chat, WaldiezChatNested)
    assert chat.nested_chat.message is None
    assert chat.nested_chat.reply is None
    chat_args = chat.get_chat_args(for_queue=True)
    assert chat_args == {
        "clear_history": False,
        "max_turns": 1,
        "summary_method": "last_msg",
        "problem": "Solve this task",
        "solution": 4.2,
        "alternative_solution": 42,
        "not_a_solution": None,
        "chat_id": 0,
    }

    # Given
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="nested",
        data=WaldiezChatData(
            name="chat_data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            real_source="wa-3",
            real_target=None,
        ),
    )
    # Then
    assert chat.id == "wc-1"
    assert chat.source == "wa-3"
    assert chat.target == "wa-2"

    # Given
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat_data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            real_source=None,
            real_target="wa-4",
        ),
    )
    # Then
    assert chat.id == "wc-1"
    assert chat.source == "wa-1"
    assert chat.target == "wa-4"
    assert chat.data.real_target == "wa-4"


# noinspection PyArgumentList
def test_waldiez_chat_with_rag_user() -> None:
    """Test WaldiezChat with RAG user as a source."""
    agent = WaldiezRagUserProxy(
        id="wa-1",
        type="agent",
        agent_type="rag_user",
        name="rag_user",
        description="RAG user",
        tags=["rag_user"],
        requirements=[],
        created_at="2021-01-01T00:00:00Z",
        updated_at="2021-01-01T00:00:00Z",
        data={  # type: ignore
            "retrieve_config": {
                "n_results": 5,
            }
        },
    )
    # Given
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat_data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            message={  # type: ignore
                "type": "rag_message_generator",
                "content": None,
                "context": {},
            },
        ),
    )
    # When
    chat_args = chat.get_chat_args(for_queue=False, sender=agent)
    # Then
    assert chat_args["n_results"] == 5


# noinspection PyArgumentList
def test_waldiez_chat_get_message_function() -> None:
    """Test get_message_function."""
    # Given
    message1: dict[str, Any] = {
        "type": "string",
        "content": "Hello there",
        "context": {
            "problem": "Solve this task",
            "solution": "4.2",
            "alternative_solution": "42",
            "not_a_solution": "null",
        },
    }
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat_data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            message=message1,  # type: ignore
        ),
    )
    # When
    message_function_tuple = chat.get_message_function()
    # Then
    assert message_function_tuple == ("", "")
    message2 = {
        "type": "method",
        "content": (
            "def callable_message(sender, recipient, context):\n"
            "    return 'custom message'"
        ),
    }
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat_data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            message=message2,  # type: ignore
        ),
    )
    # When
    message_function_tuple = chat.get_message_function(
        name_prefix="pre",
        name_suffix="post",
    )
    # Then
    assert message_function_tuple[1] == "pre_callable_message_post"
    assert message_function_tuple[0] == (
        "def pre_callable_message_post(\n"
        "    sender: ConversableAgent,\n"
        "    recipient: ConversableAgent,\n"
        "    context: dict[str, Any],\n"
        ") -> Union[dict[str, Any], str]:\n"
        "    return 'custom message'\n"
    )
    message_function_tuple = chat.get_message_function(
        name_prefix="pre",
    )
    assert message_function_tuple[1] == "pre_callable_message"
    message_function_tuple = chat.get_message_function(
        name_suffix="post",
    )
    assert message_function_tuple[1] == "callable_message_post"
    message_function_tuple = chat.get_message_function()
    assert message_function_tuple[1] == "callable_message"


# noinspection PyArgumentList
def test_waldiez_chat_get_nested_chat_message_function() -> None:
    """Test get_nested_chat_message_function."""
    message1: dict[str, Any] = {
        "type": "string",
        "content": "Hello there",
        "context": {},
    }
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="nested",
        data=WaldiezChatData(
            name="chat_data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            message=message1,  # type: ignore
            nested_chat=WaldiezChatNested(
                message=message1,  # type: ignore
                reply=None,
            ),
        ),
    )
    # When
    nested_chat_message_function = chat.get_nested_chat_message_function()
    # Then
    assert nested_chat_message_function == ("", "")
    message2 = {
        "type": "method",
        "content": (
            "def nested_chat_message(recipient, messages, sender, config):\n"
            "    return 'custom message'"
        ),
    }
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="nested",
        data=WaldiezChatData(
            name="chat_data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            message=message1,  # type: ignore
            nested_chat=WaldiezChatNested(
                message=message2,  # type: ignore
                reply=None,
            ),
        ),
    )
    # When
    nested_chat_message_function = chat.get_nested_chat_message_function(
        name_prefix="pre",
        name_suffix="post",
    )
    # Then
    assert nested_chat_message_function[1] == "pre_nested_chat_message_post"
    assert nested_chat_message_function[0] == (
        "def pre_nested_chat_message_post(\n"
        "    recipient: ConversableAgent,\n"
        "    messages: list[dict[str, Any]],\n"
        "    sender: ConversableAgent,\n"
        "    config: dict[str, Any],\n"
        ") -> Union[dict[str, Any], str]:\n"
        "    return 'custom message'\n"
    )
    nested_chat_message_function = chat.get_nested_chat_message_function(
        name_prefix="pre",
    )
    assert nested_chat_message_function[1] == "pre_nested_chat_message"
    nested_chat_message_function = chat.get_nested_chat_message_function(
        name_suffix="post",
    )
    assert nested_chat_message_function[1] == "nested_chat_message_post"
    nested_chat_message_function = chat.get_nested_chat_message_function()
    assert nested_chat_message_function[1] == "nested_chat_message"


# noinspection PyArgumentList
def test_waldiez_chat_get_nested_chat_reply_function() -> None:
    """Test get_nested_chat_message_function."""
    message1: dict[str, Any] = {
        "type": "string",
        "content": "Hello there",
        "context": {},
    }
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        data=WaldiezChatData(
            name="chat_data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            message=message1,  # type: ignore
            nested_chat=WaldiezChatNested(
                message=message1,  # type: ignore
                reply=None,
            ),
        ),
    )
    # When
    nested_chat_reply_function = chat.get_nested_chat_reply_function()
    # Then
    assert nested_chat_reply_function == ("", "")
    message2 = {
        "type": "method",
        "content": (
            "def nested_chat_reply(recipient, messages, sender, config):\n"
            "    return 'custom message'"
        ),
    }
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="nested",
        data=WaldiezChatData(
            name="chat_data",
            description="Chat data",
            source_type="user_proxy",
            target_type="assistant",
            message=message1,  # type: ignore
            nested_chat=WaldiezChatNested(
                message=message1,  # type: ignore
                reply=message2,  # type: ignore
            ),
        ),
    )
    # When
    nested_chat_reply_function = chat.get_nested_chat_reply_function(
        name_prefix="pre",
        name_suffix="post",
    )
    # Then
    assert nested_chat_reply_function[1] == "pre_nested_chat_reply_post"
    assert nested_chat_reply_function[0] == (
        "def pre_nested_chat_reply_post(\n"
        "    recipient: ConversableAgent,\n"
        "    messages: list[dict[str, Any]],\n"
        "    sender: ConversableAgent,\n"
        "    config: dict[str, Any],\n"
        ") -> Union[dict[str, Any], str]:\n"
        "    return 'custom message'\n"
    )
    nested_chat_reply_function = chat.get_nested_chat_reply_function(
        name_prefix="pre",
    )
    assert nested_chat_reply_function[1] == "pre_nested_chat_reply"
    nested_chat_reply_function = chat.get_nested_chat_reply_function(
        name_suffix="post",
    )
    assert nested_chat_reply_function[1] == "nested_chat_reply_post"
    nested_chat_reply_function = chat.get_nested_chat_reply_function()
    assert nested_chat_reply_function[1] == "nested_chat_reply"
