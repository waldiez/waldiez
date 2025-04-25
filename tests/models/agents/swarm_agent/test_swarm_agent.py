# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.swarm.WaldiezSwarmAgent."""

from waldiez.models.agents.swarm_agent import (
    WaldiezSwarmAfterWork,
    WaldiezSwarmAgent,
    WaldiezSwarmAgentData,
    WaldiezSwarmOnCondition,
    WaldiezSwarmOnConditionAvailable,
    WaldiezSwarmOnConditionTarget,
)
from waldiez.models.agents.swarm_agent.update_system_message import (
    WaldiezSwarmUpdateSystemMessage,
)


def test_waldiez_swarm_agent() -> None:
    """Test WaldiezSwarmAgent."""
    update_system_message1 = WaldiezSwarmUpdateSystemMessage(
        update_function_type="string",
        update_function="use {variable} from context",
    )
    update_system_message_function = """
def custom_update_system_message(agent, messages):
    return messages[-1]["content"]
"""
    update_system_message2 = WaldiezSwarmUpdateSystemMessage(
        update_function_type="callable",
        update_function=update_system_message_function,
    )
    after_work = WaldiezSwarmAfterWork(
        recipient_type="option", recipient="STAY"
    )
    on_condition1 = WaldiezSwarmOnCondition(
        target=WaldiezSwarmOnConditionTarget(id="agent2", order=1),
        condition="go to agent2",
        available=WaldiezSwarmOnConditionAvailable(
            type="string",
            value="is_var_bool_true",
        ),
    )
    on_condition2 = WaldiezSwarmOnCondition(
        target=WaldiezSwarmOnConditionTarget(id="agent3", order=2),
        condition="go to agent3",
        available=WaldiezSwarmOnConditionAvailable(
            type="none",
            value="any",
        ),
    )
    agent_data = WaldiezSwarmAgentData(
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
        ],
        handoffs=[on_condition1, on_condition2, after_work],
    )
    agent = WaldiezSwarmAgent(
        id="wa-1",
        type="agent",
        name="agent1",
        description="description",
        tags=[],
        requirements=[],
        agent_type="swarm",
        data=agent_data,
        created_at="2021-01-01T00:00:00Z",
        updated_at="2021-01-01T00:00:00Z",
    )
    assert agent.functions == ["function1", "function2"]
    assert agent.update_agent_state_before_reply == [
        update_system_message1,
        update_system_message2,
    ]
    assert agent.nested_chats == []
    agent_dump = agent.model_dump()
    assert agent_dump["id"] == "wa-1"
    assert agent_dump["type"] == "agent"
    assert agent_dump["agentType"] == "swarm"
    assert agent_dump["name"] == "agent1"
    assert agent_dump["description"] == "description"
    assert agent_dump["tags"] == []
    assert agent_dump["requirements"] == []
    assert agent_dump["data"] == agent_data.model_dump()
