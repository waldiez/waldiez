# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.swarm.WaldiezAgentUpdateSystemMessage."""

import pytest

from waldiez.models.agents.agent.update_system_message import (
    WaldiezAgentUpdateSystemMessage,
)


def test_waldiez_swarm_update_system_message() -> None:
    """Test WaldiezAgentUpdateSystemMessage with string type."""
    update_system_message = WaldiezAgentUpdateSystemMessage(
        type="string",
        content="Template to {use} variables in {context}",
    )
    assert update_system_message.type == "string"
    assert update_system_message.content == (
        "Template to {use} variables in {context}"
    )


def test_waldiez_swarm_update_system_message_callable() -> None:
    """Test WaldiezAgentUpdateSystemMessage with callable type."""
    callable_body = """
def custom_update_system_message(agent, messages):
    return "custom message"
"""
    update_system_message = WaldiezAgentUpdateSystemMessage(
        type="callable",
        content=callable_body,
    )
    # pylint: disable=inconsistent-quotes
    expected_content_string = '    return "custom message"'
    assert update_system_message.type == "callable"
    # pylint: disable=protected-access
    assert update_system_message._content == (expected_content_string)


def test_waldiez_swarm_update_system_message_callable_string() -> None:
    """Test WaldiezAgentUpdateSystemMessage with string type."""
    callable_body = """
def custom_update_system_message(agent, messages):
    return "custom message"
"""
    update_system_message = WaldiezAgentUpdateSystemMessage(
        type="string",
        content=callable_body,
    )
    assert update_system_message.type == "string"
    assert update_system_message.content == callable_body


def test_waldiez_swarm_update_system_message_invalid_callable() -> None:
    """Test WaldiezAgentUpdateSystemMessage with invalid callable."""
    with pytest.raises(ValueError):
        WaldiezAgentUpdateSystemMessage(
            type="callable",
            content="Template to {use} variables in {context}",
        )


def test_waldiez_swarm_update_system_get_content() -> None:
    """Test get_content."""
    update_system_message = WaldiezAgentUpdateSystemMessage(
        type="callable",
        content=(
            "def custom_update_system_message(agent, messages):\n"
            "    return 'custom update system message'"
        ),
    )
    content, function_name = update_system_message.get_content(
        name_prefix="prefix",
        name_suffix="suffix",
    )
    assert function_name == "prefix_custom_update_system_message_suffix"
    assert content == (
        "def prefix_custom_update_system_message_suffix(\n"
        "    agent: ConversableAgent,\n"
        "    messages: list[dict[str, Any]],\n"
        ") -> str:\n"
        "    return 'custom update system message'\n"
    )
    content, function_name = update_system_message.get_content(
        name_prefix="prefix",
    )
    assert function_name == "prefix_custom_update_system_message"
    content, function_name = update_system_message.get_content(
        name_suffix="suffix",
    )
    assert function_name == "custom_update_system_message_suffix"
    content, function_name = update_system_message.get_content(
        name_prefix="pre",
        name_suffix="post",
    )
    assert function_name == "pre_custom_update_system_message_post"
    content, function_name = update_system_message.get_content(
        name_prefix="pre",
    )
    assert function_name == "pre_custom_update_system_message"
    content, function_name = update_system_message.get_content(
        name_suffix="post",
    )
    assert function_name == "custom_update_system_message_post"
    content, function_name = update_system_message.get_content()
    assert function_name == "custom_update_system_message"
