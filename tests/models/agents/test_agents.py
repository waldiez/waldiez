# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents."""

from waldiez.models.agents import (
    WaldiezAgents,
    WaldiezAssistant,
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
