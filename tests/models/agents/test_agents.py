# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents."""

from waldiez.models.agents import (
    WaldiezAgents,
    WaldiezAssistant,
    WaldiezUserProxy,
)
from waldiez.models.model import WaldiezModel
from waldiez.models.skill import WaldiezSkill


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
    skill = WaldiezSkill(
        id="wa-2",
        name="skill",
        type="skill",
        description="Skill",
        tags=[],
        requirements=[],
        data={  # type: ignore
            "content": "def skill():\n    return 'skill'",
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
            "model_ids": [model.id],
            "skills": [
                {"id": skill.id, "executor_id": "wa-1"},
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
        assistants=[assistant],
        users=[user],
        managers=[],
        rag_users=[],
        swarm_agents=[],
        reasoning_agents=[],
        captain_agents=[],
    )
    assert agents.assistants == [assistant]
    assert next(agents.members) == user
    agents.validate_flow(model_ids=[model.id], skill_ids=[skill.id])
