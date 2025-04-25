# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.swarm.WaldiezSwarmData."""

from typing import List

import pytest
from waldiez.models.agents.swarm_agent import (
    WaldiezSwarmAfterWork,
    WaldiezSwarmAgentData,
    WaldiezSwarmHandoff,
    WaldiezSwarmOnCondition,
    WaldiezSwarmOnConditionAvailable,
    WaldiezSwarmOnConditionTarget,
    WaldiezSwarmUpdateSystemMessage,
)


def get_swarm_agent_data(no_after_works: int = 1) -> WaldiezSwarmAgentData:
    """Return WaldiezSwarmAgentData.

    Parameters
    ----------
    no_after_works : int
        Number of after_works to include in the handoffs.

    Returns
    -------
    WaldiezSwarmAgentData
        The WaldiezSwarmAgentData object.
    """
    after_work = WaldiezSwarmAfterWork(
        recipient_type="option",
        recipient="TERMINATE",
    )
    on_condition = WaldiezSwarmOnCondition(
        target=WaldiezSwarmOnConditionTarget(id="agent2", order=1),
        condition="go to agent2",
        available=WaldiezSwarmOnConditionAvailable(
            type="string",
            value="context_var1",
        ),
    )
    update_system_message1 = WaldiezSwarmUpdateSystemMessage(
        update_function_type="string",
        update_function=(
            "update_system_message based on the {variable} in the context"
        ),
    )
    update_system_message2 = WaldiezSwarmUpdateSystemMessage(
        update_function_type="callable",
        update_function=(
            "def custom_update_system_message(\n"
            "    agent: ConversableAgent,\n"
            "    messages: List[Dict[str, Any]],\n"
            ") -> str:\n"
            "    return 'custom update system message'"
        ),
    )
    update_system_message3 = "function 3"
    handoffs: List[WaldiezSwarmHandoff] = (
        [after_work, on_condition]
        if no_after_works == 1
        else [after_work, on_condition, after_work]
    )
    return WaldiezSwarmAgentData(
        system_message="system message",
        skills=[],
        model_ids=["model1", "model2"],
        human_input_mode="NEVER",
        code_execution_config=False,
        agent_default_auto_reply=None,
        max_consecutive_auto_reply=None,
        teachability=None,
        termination={  # type: ignore
            "type": "none",
            "keywords": [],
            "criterion": "exact",
        },
        nested_chats=[],
        functions=["function1", "function2"],
        update_agent_state_before_reply=[
            update_system_message1,
            update_system_message2,
            update_system_message3,
        ],
        handoffs=handoffs,
    )


def test_waldiez_swarm_agent_data() -> None:
    """Test WaldiezSwarmAgentData."""
    swarm_data = get_swarm_agent_data()
    assert swarm_data.functions == ["function1", "function2"]


def test_waldiez_swarm_data_invalid() -> None:
    """Test WaldiezSwarmAgentData with invalid data."""
    with pytest.raises(ValueError):
        WaldiezSwarmAgentData(
            system_message="system message",
            skills=[],
            model_ids=["model1", "model2"],
            human_input_mode="NEVER",
            code_execution_config=False,
            agent_default_auto_reply=None,
            max_consecutive_auto_reply=None,
            teachability=None,
            termination={  # type: ignore
                "type": "none",
                "keywords": [],
                "criterion": "exact",
            },
            nested_chats=[],
            functions=["function1", "function2"],
            update_agent_state_before_reply=[
                WaldiezSwarmUpdateSystemMessage(
                    update_function_type="callable",
                    update_function=("invalid data"),
                ),
            ],
            handoffs=[],
        )
    with pytest.raises(ValueError):
        get_swarm_agent_data(2)
