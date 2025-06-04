# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents."""

import pytest

from waldiez.models.agents import (
    WaldiezAgents,
    WaldiezAssistant,
    WaldiezGroupManager,
    WaldiezUserProxy,
)
from waldiez.models.model import WaldiezModel
from waldiez.models.tool import WaldiezTool


def test_waldiez_agents() -> None:
    """Test WaldiezAgents."""
    model = WaldiezModel(
        id="wa-1",
        name="model",
        type="model",
        description="Model",
        tags=[],
        requirements=[],
        data={},  # type: ignore
    )
    tool = WaldiezTool(
        id="wa-2",
        name="tool",
        type="tool",
        description="Tool",
        tags=[],
        requirements=[],
        data={  # type: ignore
            "content": "def tool():\n    return 'tool'",
        },
    )
    assistant = WaldiezAssistant(
        id="wa-1",
        name="assistant",
        type="agent",
        agent_type="assistant",
        description="Assistant",
        tags=[],
        requirements=[],
        data={  # type: ignore
            "model_id": model.id,
            "tools": [
                {"id": tool.id, "executor_id": "wa-1"},
            ],
        },
    )
    user = WaldiezUserProxy(
        id="wa-2",
        name="user",
        type="agent",
        agent_type="user",
        description="User",
        tags=[],
        requirements=[],
        data={},  # type: ignore
    )
    agents = WaldiezAgents(
        assistantAgents=[assistant],
        userProxyAgents=[user],
        ragUserProxyAgents=[],
        reasoningAgents=[],
        captainAgents=[],
    )
    assert agents.assistantAgents == [assistant]
    assert next(agents.members) == user
    agents.validate_flow(model_ids=[model.id], tool_ids=[tool.id])

    manager = WaldiezGroupManager(
        id="wa-3",
        name="group_manager",
        type="agent",
        agent_type="group_manager",
        description="Group Manager",
        tags=[],
        requirements=[],
        data={
            "initialAgentId": assistant.id,
        },  # type: ignore
    )
    assistant.data.parent_id = manager.id
    user.data.parent_id = manager.id
    agents = WaldiezAgents(
        assistantAgents=[assistant],
        userProxyAgents=[user],
        ragUserProxyAgents=[],
        reasoningAgents=[],
        captainAgents=[],
        groupManagerAgents=[manager],
    )
    assert agents.groupManagerAgents == [manager]
    agents.validate_flow(
        model_ids=[model.id],
        tool_ids=[tool.id],
    )

    manager.data.initial_agent_id = "not_in_agents"
    agents = WaldiezAgents(
        assistantAgents=[assistant],
        userProxyAgents=[user],
        ragUserProxyAgents=[],
        reasoningAgents=[],
        captainAgents=[],
        groupManagerAgents=[manager],
    )
    with pytest.raises(ValueError):
        agents.validate_flow(
            model_ids=[model.id],
            tool_ids=[tool.id],
        )
