# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.swarm.WaldiezSwarmUpdateSystemMessage."""

import pytest

from waldiez.models.agents.swarm_agent.update_system_message import (
    WaldiezSwarmUpdateSystemMessage,
)


def test_waldiez_swarm_update_system_message() -> None:
    """Test WaldiezSwarmUpdateSystemMessage with string type."""
    update_system_message = WaldiezSwarmUpdateSystemMessage(
        update_function_type="string",
        update_function="Template to {use} variables in {context}",
    )
    assert update_system_message.update_function_type == "string"
    assert update_system_message.update_function == (
        "Template to {use} variables in {context}"
    )


def test_waldiez_swarm_update_system_message_callable() -> None:
    """Test WaldiezSwarmUpdateSystemMessage with callable type."""
    callable_body = """
def custom_update_system_message(agent, messages):
    return "custom message"
"""
    update_system_message = WaldiezSwarmUpdateSystemMessage(
        update_function_type="callable",
        update_function=callable_body,
    )
    # pylint: disable=inconsistent-quotes
    expected_update_function_string = '    return "custom message"'
    assert update_system_message.update_function_type == "callable"
    # pylint: disable=protected-access
    assert update_system_message._update_function == (
        expected_update_function_string
    )


def test_waldiez_swarm_update_system_message_callable_string() -> None:
    """Test WaldiezSwarmUpdateSystemMessage with string type."""
    callable_body = """
def custom_update_system_message(agent, messages):
    return "custom message"
"""
    update_system_message = WaldiezSwarmUpdateSystemMessage(
        update_function_type="string",
        update_function=callable_body,
    )
    assert update_system_message.update_function_type == "string"
    assert update_system_message.update_function == callable_body


def test_waldiez_swarm_update_system_message_invalid_callable() -> None:
    """Test WaldiezSwarmUpdateSystemMessage with invalid callable."""
    with pytest.raises(ValueError):
        WaldiezSwarmUpdateSystemMessage(
            update_function_type="callable",
            update_function="Template to {use} variables in {context}",
        )


def test_waldiez_swarm_update_system_get_update_function() -> None:
    """Test get_update_function."""
    update_system_message = WaldiezSwarmUpdateSystemMessage(
        update_function_type="callable",
        update_function=(
            "def custom_update_system_message(agent, messages):\n"
            "    return 'custom update system message'"
        ),
    )
    update_function, function_name = update_system_message.get_update_function(
        name_prefix="prefix",
        name_suffix="suffix",
    )
    assert function_name == "prefix_custom_update_system_message_suffix"
    assert update_function == (
        "def prefix_custom_update_system_message_suffix(\n"
        "    agent: ConversableAgent,\n"
        "    messages: List[Dict[str, Any]],\n"
        ") -> str:\n"
        "    return 'custom update system message'\n"
    )
    update_function, function_name = update_system_message.get_update_function(
        name_prefix="prefix",
    )
    assert function_name == "prefix_custom_update_system_message"
    update_function, function_name = update_system_message.get_update_function(
        name_suffix="suffix",
    )
    assert function_name == "custom_update_system_message_suffix"
    update_function, function_name = update_system_message.get_update_function(
        name_prefix="pre",
        name_suffix="post",
    )
    assert function_name == "pre_custom_update_system_message_post"
    update_function, function_name = update_system_message.get_update_function(
        name_prefix="pre",
    )
    assert function_name == "pre_custom_update_system_message"
    update_function, function_name = update_system_message.get_update_function(
        name_suffix="post",
    )
    assert function_name == "custom_update_system_message_post"
    update_function, function_name = update_system_message.get_update_function()
    assert function_name == "custom_update_system_message"
