# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-module-docstring,missing-param-doc,missing-return-doc
# pylint: disable=missing-function-docstring,missing-class-docstring
# pylint: disable=no-self-use
"""Test waldiez.exporting.chats.utils.common."""

import json
from typing import Optional

from waldiez.exporting.chats.utils.common import get_chat_message_string
from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentData,
    WaldiezAgentTerminationMessage,
    WaldiezAgentType,
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatMessageType,
    WaldiezChatNested,
    WaldiezChatSummary,
    WaldiezDefaultCondition,
    WaldiezTransitionAvailability,
)


def create_test_agent(
    agent_type: WaldiezAgentType = "user_proxy",
) -> WaldiezAgent:
    """Create a test agent with the specified type."""
    return WaldiezAgent(
        id="test_agent",
        type="agent",
        name="Test Agent",
        agent_type=agent_type,
        description="A test agent for unit testing.",
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        data=WaldiezAgentData(
            termination=WaldiezAgentTerminationMessage(type="none"),
        ),
    )


def create_test_chat(
    chat_id: str,
    message_type: WaldiezChatMessageType = "string",
    message_content: Optional[str] = None,
    use_carryover: bool = False,
) -> WaldiezChat:
    """Create a test chat with the specified parameters."""
    return WaldiezChat(
        id=chat_id,
        source="test_agent",
        target="test_target",
        type="chat",
        data=WaldiezChatData(
            name="chat_name",
            target_type="assistant",
            source_type="user_proxy",
            summary=WaldiezChatSummary(
                method="last_msg",
                prompt="This is a test chat prompt.",
            ),
            nested_chat=WaldiezChatNested(
                message=WaldiezChatMessage(
                    type="none", content=None, context={}
                ),
            ),
            message=WaldiezChatMessage(
                type=message_type,
                content=message_content,
                use_carryover=use_carryover,
            ),
            condition=WaldiezDefaultCondition.create(),
            available=WaldiezTransitionAvailability(),
        ),
    )


class TestGetChatMessageString:
    """Test the get_chat_message_string function."""

    def test_message_type_none_returns_none(self) -> None:
        """Test that message type 'none' returns None."""
        sender = create_test_agent()
        chat = create_test_chat("chat1", message_type="none")
        chat_names = {"chat1": "test_chat"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert result == "None"
        assert not content

    def test_message_content_none_returns_empty(self) -> None:
        """Test that None message content returns empty string."""
        sender = create_test_agent()
        chat = create_test_chat(
            "chat1", message_type="string", message_content=None
        )
        chat_names = {"chat1": "test_chat"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert not result
        assert not content

    def test_string_message_type_returns_content(self) -> None:
        """Test that string message type returns the message content."""
        sender = create_test_agent()
        message_text = "Hello, this is a test message!"
        chat = create_test_chat(
            "chat1", message_type="string", message_content=message_text
        )
        chat_names = {"chat1": "test_chat"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert result == f'"{message_text}"'
        assert content is None

    def test_empty_string_message_content(self) -> None:
        """Test with empty string as message content."""
        sender = create_test_agent()
        chat = create_test_chat(
            "chat1", message_type="string", message_content=""
        )
        chat_names = {"chat1": "test_chat"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert result == ""
        assert content is None

    def test_multiline_string_message_content(self) -> None:
        """Test with multiline string as message content."""
        sender = create_test_agent()
        multiline_message = "Line 1\nLine 2\nLine 3"
        chat = create_test_chat(
            "chat1", message_type="string", message_content=multiline_message
        )
        chat_names = {"chat1": "test_chat"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert result == json.dumps(multiline_message)
        assert content is None

    def test_different_chat_names(self) -> None:
        """Test with different chat names."""
        sender = create_test_agent()

        test_cases = [
            ("chat1", "simple_chat"),
            ("chat2", "complex_chat_with_underscores"),
            ("chat3", "chat_123"),
        ]

        for chat_id, chat_name in test_cases:
            chat = create_test_chat(
                chat_id, message_type="string", message_content=chat_name
            )
            chat_names = {chat_id: chat_name}
            result, _ = get_chat_message_string(sender, chat, chat_names)

            assert result is not None
            assert chat_name in result

    def test_special_characters_in_string_message(self) -> None:
        """Test string message with special characters."""
        sender = create_test_agent()
        special_message = "Special chars: @#$%^&*()[]{}|\\:;\"'<>,.?/~`"
        chat = create_test_chat(
            "chat1", message_type="string", message_content=special_message
        )
        chat_names = {"chat1": "special_chat"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert result == json.dumps(special_message)
        assert content is None

    def test_unicode_in_string_message(self) -> None:
        """Test string message with unicode characters."""
        sender = create_test_agent()
        unicode_message = "Unicode: café, naïve, 🤖, 中文"
        chat = create_test_chat(
            "chat1", message_type="string", message_content=unicode_message
        )
        chat_names = {"chat1": "unicode_chat"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert result == f'"{unicode_message}"'
        assert content is None

    def test_different_message_types(self) -> None:
        """Test with all available message types."""
        sender = create_test_agent()
        chat_names = {"chat1": "test_chat"}

        # Test "none" type
        chat_none = create_test_chat("chat1", message_type="none")
        result_none, content_none = get_chat_message_string(
            sender, chat_none, chat_names
        )
        assert result_none == "None"
        assert content_none is None

        # Test "string" type
        chat_string = create_test_chat(
            "chat1", message_type="string", message_content="test"
        )
        result_string, content_string = get_chat_message_string(
            sender, chat_string, chat_names
        )
        assert result_string == '"test"'
        assert content_string is None

        # Test "method" type
        message_content = (
            "def callable_message(sender, recipient, context):\n"
            "    return 'test_method'"
        )
        chat_method = create_test_chat(
            "chat1",
            message_type="method",
            message_content=message_content,
        )
        result_method, content_method = get_chat_message_string(
            sender, chat_method, chat_names
        )
        assert result_method is not None
        assert content_method is not None


class TestReturnTypes:
    """Test return type consistency."""

    def test_none_case_return_types(self) -> None:
        """Test return types for None cases."""
        sender = create_test_agent()
        chat = create_test_chat("chat1", message_type="none")
        chat_names = {"chat1": "test_chat"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert isinstance(result, str)
        assert result == "None"
        assert content is None

    def test_string_case_return_types(self) -> None:
        """Test return types for string cases."""
        sender = create_test_agent()
        chat = create_test_chat(
            "chat1", message_type="string", message_content="test"
        )
        chat_names = {"chat1": "test_chat"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert isinstance(result, str)
        assert content is None

    def test_method_case_return_types(self) -> None:
        """Test return types for method cases."""
        sender = create_test_agent()
        message_content = (
            "def callable_message(sender, recipient, context):\n"
            "    return 'test_method'"
        )
        chat = create_test_chat(
            "chat1", message_type="method", message_content=message_content
        )
        chat_names = {"chat1": "test_chat"}
        result, content = get_chat_message_string(sender, chat, chat_names)
        assert isinstance(result, str)
        assert isinstance(content, str)
        assert content is not None

    def test_assistant_string_message(self) -> None:
        """Test scenario with assistant sending string message."""
        sender = create_test_agent("assistant")
        message_content = (
            "Hello! I'm here to help you with your questions. "
            "How can I assist you today?"
        )
        chat = create_test_chat(
            "main_chat_001",
            message_type="string",
            message_content=message_content,
        )
        chat_names = {"main_chat_001": "main_conversation"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert result == json.dumps(message_content)
        assert content is None

    def test_realistic_empty_message_scenario(self) -> None:
        """Test realistic scenario where message is not configured."""
        sender = create_test_agent("user_proxy")
        chat = create_test_chat("empty_chat_001", message_type="none")
        chat_names = {"empty_chat_001": "unconfigured_chat"}

        result, content = get_chat_message_string(sender, chat, chat_names)

        assert result == "None"
        assert content is None

    def test_multiple_chats_scenario(self) -> None:
        """Test scenario with multiple different chats."""
        chat_names = {
            "chat1": "welcome_chat",
            "chat2": "help_chat",
            "chat3": "rag_search_chat",
        }

        # String message chat
        sender1 = create_test_agent("assistant")
        chat1 = create_test_chat(
            "chat1", message_type="string", message_content="Welcome!"
        )
        result1, content1 = get_chat_message_string(sender1, chat1, chat_names)
        assert result1 == '"Welcome!"'
        assert content1 is None

        message_content = (
            "def callable_message(sender, recipient, context):\n"
            "    return 'help_chat'"
        )
        # Method message chat
        sender2 = create_test_agent("user_proxy")
        chat2 = create_test_chat(
            "chat2", message_type="method", message_content=message_content
        )
        result2, content2 = get_chat_message_string(sender2, chat2, chat_names)
        assert result2 is not None
        assert content2 is not None
        assert "help_chat" in result2

        message_content = (
            "def callable_message(sender, recipient, context):\n"
            "    return 'rag_search_chat'"
        )
        # RAG method message chat
        sender3 = create_test_agent("rag_user_proxy")
        chat3 = create_test_chat(
            "chat3",
            message_type="method",
            message_content=message_content,
            use_carryover=True,
        )
        result3, content3 = get_chat_message_string(sender3, chat3, chat_names)
        assert result3 is not None
        assert content3 is not None
        assert "rag_search_chat" in result3

    def test_workflow_with_different_message_types(self) -> None:
        """Test a complete workflow with different message types."""
        chat_names = {
            "intro": "introduction_chat",
            "task": "task_assignment_chat",
            "result": "result_chat",
        }

        # Introduction with string message
        intro_agent = create_test_agent("assistant")
        intro_chat = create_test_chat(
            "intro",
            message_type="string",
            message_content="Let's begin the task!",
        )
        intro_result, intro_content = get_chat_message_string(
            intro_agent, intro_chat, chat_names
        )

        # Task assignment with method message
        message_content = (
            "def callable_message(sender, recipient, context):\n"
            "    return 'assign_task'"
        )
        task_agent = create_test_agent("user_proxy")
        task_chat = create_test_chat(
            "task",
            message_type="method",
            message_content=message_content,
        )
        task_result, task_content = get_chat_message_string(
            task_agent, task_chat, chat_names
        )

        # Result with no message (none type)
        result_agent = create_test_agent("assistant")
        result_chat = create_test_chat("result", message_type="none")
        result_result, result_content = get_chat_message_string(
            result_agent, result_chat, chat_names
        )

        # Verify each step
        assert intro_result == '"Let\'s begin the task!"'
        assert intro_content is None

        assert task_result is not None
        assert task_content is not None
        assert "task_assignment_chat" in task_result

        assert result_result == "None"
        assert result_content is None
