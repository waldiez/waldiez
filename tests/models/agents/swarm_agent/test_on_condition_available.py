# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Test waldiez.models.agents.swarm.on_condition_available."""

import pytest

from waldiez.models.agents.swarm_agent import WaldiezSwarmOnConditionAvailable


def test_waldiez_swarm_on_condition_available() -> None:
    """Test WaldiezSwarmOnConditionAvailable."""
    on_condition_available = WaldiezSwarmOnConditionAvailable(
        value=None,
        type="none",
    )
    assert on_condition_available.value is None
    assert on_condition_available.type == "none"

    with pytest.raises(ValueError):
        WaldiezSwarmOnConditionAvailable(
            value=None,
            type="invalid",  # type: ignore
        )
    with pytest.raises(ValueError):
        WaldiezSwarmOnConditionAvailable(
            value="",
            type="string",
        )


def test_waldiez_swarm_on_condition_available_string() -> None:
    """Test WaldiezSwarmOnConditionAvailable."""
    on_condition_available = WaldiezSwarmOnConditionAvailable(
        value="available",
        type="string",
    )
    assert on_condition_available.value == "available"
    assert on_condition_available.type == "string"


def test_waldiez_swarm_on_condition_available_callable() -> None:
    """Test WaldiezSwarmOnConditionAvailable."""
    callable_body = '''
def custom_on_condition_available(agent, message):
    """Check if the condition is available."""
    return True
'''
    on_condition_available = WaldiezSwarmOnConditionAvailable(
        value=callable_body,
        type="callable",
    )
    assert on_condition_available.value == callable_body
    assert on_condition_available.type == "callable"
    assert on_condition_available.available_string == (
        '    """Check if the condition is available."""\n    return True'
    )
    name, content = on_condition_available.get_available(
        name_prefix="pre",
        name_suffix="post",
    )
    assert name == "pre_custom_on_condition_available_post"
    assert content == (
        "def pre_custom_on_condition_available_post(\n"
        "    agent: ConversableAgent,\n"
        "    message: Dict[str, Any],\n"
        ") -> bool:\n"
        '    """Check if the condition is available."""\n'
        "    return True\n"
    )
