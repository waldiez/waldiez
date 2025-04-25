# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.swarm.on_condition."""

import pytest
from waldiez.models.agents.swarm_agent import (
    WaldiezSwarmOnCondition,
    WaldiezSwarmOnConditionAvailable,
    WaldiezSwarmOnConditionTarget,
)


def test_waldiez_swarm_on_condition() -> None:
    """Test WaldiezSwarmOnCondition."""
    on_condition = WaldiezSwarmOnCondition(
        target=WaldiezSwarmOnConditionTarget(id="target", order=1),
        condition="condition",
        available=WaldiezSwarmOnConditionAvailable(
            value=None,
            type="none",
        ),
    )
    assert on_condition.target.id == "target"
    assert on_condition.condition == "condition"
    assert on_condition.available.value is None
    assert on_condition.available.type == "none"


def test_waldiez_swarm_on_condition_available_string() -> None:
    """Test WaldiezSwarmOnCondition."""
    # this means, that in the context,
    # there should be a variable called "available" which is a boolean value
    on_condition = WaldiezSwarmOnCondition(
        target=WaldiezSwarmOnConditionTarget(id="target", order=1),
        condition="condition",
        available=WaldiezSwarmOnConditionAvailable(
            value="available",
            type="string",
        ),
    )
    assert on_condition.target.id == "target"
    assert on_condition.condition == "condition"
    assert on_condition.available.value == "available"
    assert on_condition.available.type == "string"


def test_waldiez_swarm_on_condition_available_callable() -> None:
    """Test WaldiezSwarmOnCondition."""
    callable_body = """
def custom_on_condition_available(agent, message):
    return True
"""
    on_condition = WaldiezSwarmOnCondition(
        target=WaldiezSwarmOnConditionTarget(id="target", order=1),
        condition="condition",
        available=WaldiezSwarmOnConditionAvailable(
            value=callable_body,
            type="callable",
        ),
    )
    expected_available_string = (
        "def custom_on_condition_available(\n"
        "    agent: ConversableAgent,\n"
        "    message: Dict[str, Any],\n"
        ") -> bool:\n    return True\n"
    )
    available = on_condition.get_available()
    assert available[1] == expected_available_string
    assert available[0] == "custom_on_condition_available"
    assert on_condition.available.type == "callable"


def test_waldiez_swarm_on_condition_invalid_callable_body() -> None:
    """Test WaldiezSwarmOnCondition."""
    with pytest.raises(ValueError):
        WaldiezSwarmOnCondition(
            target=WaldiezSwarmOnConditionTarget(id="target", order=1),
            condition="condition",
            available=WaldiezSwarmOnConditionAvailable(
                value="INVALID",
                type="callable",
            ),
        )


def test_waldiez_swarm_on_condition_invalid_callable_no_body() -> None:
    """Test WaldiezSwarmOnCondition."""
    with pytest.raises(ValueError):
        WaldiezSwarmOnCondition(
            target=WaldiezSwarmOnConditionTarget(id="target", order=1),
            condition="condition",
            available=WaldiezSwarmOnConditionAvailable(
                value=None,
                type="callable",
            ),
        )


def test_waldiez_swarm_on_condition_invalid_callable_signature() -> None:
    """Test WaldiezSwarmOnCondition."""
    callable_body = """
    def custom_on_condition_available():
        return True
"""

    with pytest.raises(ValueError):
        WaldiezSwarmOnCondition(
            target=WaldiezSwarmOnConditionTarget(id="target", order=1),
            condition="condition",
            available=WaldiezSwarmOnConditionAvailable(
                value=callable_body,
                type="callable",
            ),
        )


def test_waldiez_swarm_on_condition_invalid_type() -> None:
    """Test WaldiezSwarmOnCondition."""
    with pytest.raises(ValueError):
        WaldiezSwarmOnCondition(
            target=WaldiezSwarmOnConditionTarget(id="target", order=1),
            condition="condition",
            available=WaldiezSwarmOnConditionAvailable(
                value="INVALID",
                type="invalid",  # type: ignore
            ),
        )
