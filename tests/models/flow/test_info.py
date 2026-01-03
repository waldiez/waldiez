# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc,too-few-public-methods,unused-argument
"""Test waldiez.models.flow.info.*."""

import pytest
from pydantic import ValidationError

from waldiez.models.agents import WaldiezAgentHumanInputMode, WaldiezAgentType
from waldiez.models.flow.info import WaldiezAgentInfo, WaldiezFlowInfo


def test_waldiez_agent_info_attributes() -> None:
    """Test WaldiezAgentInfo attributes."""
    agent_info = WaldiezAgentInfo(
        id="agent007",
        name="Agent007",
        human_input_mode="ALWAYS",
        agent_type="user",
    )
    assert agent_info.name == "Agent007"
    assert agent_info.human_input_mode == "ALWAYS"
    assert agent_info.agent_type == "user"


# noinspection PyArgumentList
def test_waldiez_agent_info_validation_error() -> None:
    """Test WaldiezAgentInfo validation error."""
    # Missing required fields should raise ValidationError
    with pytest.raises(ValidationError):
        WaldiezAgentInfo()


def test_waldiez_flow_info_create(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test WaldiezFlowInfo creation."""

    class DummyAgentData:
        """Dummy agent data."""

        def __init__(
            self, human_input_mode: WaldiezAgentHumanInputMode
        ) -> None:
            """Initialize DummyAgentData."""
            self.human_input_mode = human_input_mode

    class DummyAgent:
        """Dummy agent."""

        def __init__(
            self,
            id_: str,
            name: str,
            human_input_mode: WaldiezAgentHumanInputMode,
            agent_type: WaldiezAgentType,
        ) -> None:
            """Initialize DummyAgent."""
            self.id = id_
            self.name = name
            self.data = DummyAgentData(human_input_mode)
            self.agent_type = agent_type

    agents = [
        DummyAgent(
            "agent1",
            "Alpha",
            "ALWAYS",
            "user",
        ),
        DummyAgent(
            "agent2",
            "Beta",
            "NEVER",
            "assistant",
        ),
    ]
    agent_names = {
        "agent1": "Custom Alpha",
        # "agent2" intentionally missing to test fallback to agent.name
    }

    flow_info = WaldiezFlowInfo.create(agents, agent_names)  # type: ignore
    assert len(flow_info.participants) == 2

    # Check that agent1 uses custom name
    assert flow_info.participants[0].name == "Custom Alpha"
    assert flow_info.participants[0].human_input_mode == "ALWAYS"
    assert flow_info.participants[0].agent_type == "user"

    # Check that agent2 falls back to default name
    assert flow_info.participants[1].name == "Beta"
    assert flow_info.participants[1].human_input_mode == "NEVER"
    assert flow_info.participants[1].agent_type == "assistant"


def test_waldiez_flow_info_participants_default_factory() -> None:
    """Test default factory for participants."""
    flow_info = WaldiezFlowInfo()
    assert not flow_info.participants
