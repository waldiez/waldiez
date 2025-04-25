# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.captain_agent.captain_agent_lib_entry.*."""

from waldiez.models.agents.captain_agent.captain_agent_lib_entry import (
    WaldiezCaptainAgentLibEntry,
)

from .example_agent_lib import EXAMPLE_AGENT_LIB


def test_waldiez_captain_agent_lib_entry() -> None:
    """Test `WaldiezCaptainAgentLibEntry`."""
    entry = WaldiezCaptainAgentLibEntry(
        name="agent1",
        description="desc1",
        system_message="msg1",
    )
    assert entry.name == "agent1"
    assert entry.description == "desc1"
    assert entry.system_message == "msg1"
    for agent in EXAMPLE_AGENT_LIB:
        entry = WaldiezCaptainAgentLibEntry(
            name=agent["name"],
            description=agent["description"],
            system_message=agent["system_message"],
        )
        assert entry.name == agent["name"]
        assert entry.description == agent["description"]
        assert entry.system_message == agent["system_message"]
