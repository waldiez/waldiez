# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.flow.flow_data.*."""

import pytest

from waldiez.models.flow.flow_data import WaldiezFlowData


def test_waldiez_flow_data() -> None:
    """Test WaldiezFlowData."""
    # Given
    assistant_1 = {
        "id": "wa-1",
        "name": "assistant1",
        "type": "agent",
        "agent_type": "assistant",
    }
    assistant_2 = {
        "id": "wa-2",
        "name": "assistant2",
        "type": "agent",
        "agent_type": "assistant",
    }
    flow_data = WaldiezFlowData(
        nodes=[],
        edges=[],
        viewport={},
        agents={  # type: ignore
            "userProxyAgents": [],
            "assistantAgents": [assistant_1, assistant_2],
            "managerAgents": [],
            "ragUserProxyAgents": [],
        },
        models=[],
        tools=[],
        chats=[],
    )
    # Then
    assert not flow_data.nodes
    assert not flow_data.edges
    assert not flow_data.viewport
    assert not flow_data.agents.userProxyAgents
    assert len(flow_data.agents.assistantAgents) == 2
    assert not flow_data.agents.ragUserProxyAgents
    assert not flow_data.models
    assert not flow_data.tools
    assert not flow_data.chats

    default_data = WaldiezFlowData.default()
    assert len(list(default_data.agents.members)) > 0

    dumped = default_data.model_dump()
    dumped["isAsync"] = True
    loaded = WaldiezFlowData.model_validate(dumped)
    assert loaded.is_async
    assert loaded.chats

    with pytest.raises(ValueError):
        # at least 2 agents are required
        WaldiezFlowData(
            nodes=[],
            edges=[],
            viewport={},
            agents={  # type: ignore
                "userProxyAgents": [],
                "assistantAgents": [],
                "ragUserProxyAgents": [],
            },
            models=[],
            tools=[],
            chats=[],
        )
    with pytest.raises(ValueError):
        # not unique agent ids
        WaldiezFlowData(
            nodes=[],
            edges=[],
            viewport={},
            agents={  # type: ignore
                "userProxyAgents": [],
                "assistantAgents": [assistant_1, assistant_1],
                "ragUserProxyAgents": [],
            },
            models=[],
            tools=[],
            chats=[],
        )
