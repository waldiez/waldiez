# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.agent.linked_skill.*."""

from waldiez.models.agents.agent.linked_skill import WaldiezAgentLinkedSkill


def test_waldiez_agent_linked_skill() -> None:
    """Test WaldiezAgentLinkedSkill."""
    linked_skill = WaldiezAgentLinkedSkill(
        id="skill_id", executor_id="agent_id"
    )
    assert linked_skill.id == "skill_id"
    assert linked_skill.executor_id == "agent_id"
