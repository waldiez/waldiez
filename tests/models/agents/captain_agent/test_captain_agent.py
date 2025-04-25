# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.captain_agent.*."""

from waldiez.models.agents.captain_agent import WaldiezCaptainAgent


def test_waldiez_captain_agent() -> None:
    """Test `WaldiezCaptainAgent`."""
    agent = WaldiezCaptainAgent(id="wa-1", name="captain_agent")
    assert agent.agent_type == "captain"
    assert not agent.data.agent_lib
    assert not agent.data.tool_lib
    assert agent.data.max_round == 10
    assert agent.data.max_turns == 5

    agent = WaldiezCaptainAgent(
        id="wa-1",
        name="captain_agent",
        data={  # type: ignore
            "max_round": 20,
            "max_turns": 10,
            "agent_lib": [
                {
                    "name": "agent1",
                    "description": "desc1",
                    "system_message": "msg1",
                },
            ],
            "tool_lib": "default",
        },
    )
    assert agent.agent_type == "captain"
    assert agent.data.agent_lib[0].name == "agent1"
    assert agent.data.agent_lib[0].description == "desc1"
    assert agent.data.agent_lib[0].system_message == "msg1"
    assert agent.data.tool_lib == "default"
    assert agent.data.max_round == 20
    assert agent.data.max_turns == 10
