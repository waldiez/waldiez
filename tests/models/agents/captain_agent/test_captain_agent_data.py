# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Test waldiez.models.agents.captain_agent.captain_agent_data.*."""

from waldiez.models.agents.captain.captain_agent_data import (
    WaldiezCaptainAgentData,
)
from waldiez.models.agents.captain.captain_agent_lib_entry import (
    WaldiezCaptainAgentLibEntry,
)

from .example_agent_lib import EXAMPLE_AGENT_LIB


# noinspection PyArgumentList
def test_waldiez_captain_agent_data() -> None:
    """Test `WaldiezCaptainAgentData`."""
    data = WaldiezCaptainAgentData(
        agent_lib=[],
        tool_lib=None,
        max_round=20,
    )
    assert not data.agent_lib
    assert not data.tool_lib
    assert data.max_round == 20
    assert data.max_turns == 5

    data = WaldiezCaptainAgentData(
        agent_lib=[
            WaldiezCaptainAgentLibEntry(
                name="agent1",
                description="desc1",
                system_message="msg1",
            ),
        ],
        tool_lib="default",
        max_round=20,
        max_turns=10,
    )
    assert data.agent_lib[0].name == "agent1"
    assert data.agent_lib[0].description == "desc1"
    assert data.agent_lib[0].system_message == "msg1"
    assert data.tool_lib == "default"
    assert data.max_round == 20
    assert data.max_turns == 10

    data = WaldiezCaptainAgentData(
        agent_lib=EXAMPLE_AGENT_LIB,  # type: ignore
        tool_lib="default",
        max_round=20,
        max_turns=10,
    )
    for i, agent in enumerate(data.agent_lib):
        assert agent.name == EXAMPLE_AGENT_LIB[i]["name"]
        assert agent.description == EXAMPLE_AGENT_LIB[i]["description"]
        assert agent.system_message == EXAMPLE_AGENT_LIB[i]["system_message"]
