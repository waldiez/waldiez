# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.agent.nested_chat.*."""

from waldiez.models.agents.agent.nested_chat import (
    WaldiezAgentNestedChat,
    WaldiezAgentNestedChatMessage,
)


def test_waldiez_agent_nested_chat_message() -> None:
    """Test WaldiezAgentNestedChatMessage."""
    message = WaldiezAgentNestedChatMessage(
        id="message_id",
        is_reply=False,
    )
    assert message.id == "message_id"
    assert not message.is_reply


def test_waldiez_agent_nested_chat() -> None:
    """Test WaldiezAgentNestedChat."""
    # noinspection PyArgumentList
    nested_chat = WaldiezAgentNestedChat(
        triggered_by=["wa-1"],
        messages=[WaldiezAgentNestedChatMessage(id="wc-2", is_reply=True)],
    )
    assert nested_chat.triggered_by[0] == "wa-1"
    assert nested_chat.messages[0].id == "wc-2"
    assert nested_chat.messages[0].is_reply
