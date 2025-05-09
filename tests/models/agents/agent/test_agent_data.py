# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.agent.agent_data.*."""

from waldiez.models.agents.agent.termination_message import (
    WaldiezAgentTerminationMessage,
)
from waldiez.models.agents.assistant.assistant_data import WaldiezAssistantData


def test_waldiez_agent_data() -> None:
    """Test WaldiezAgentData."""
    agent_data = WaldiezAssistantData(
        system_message="system_message",
        human_input_mode="NEVER",
        code_execution_config=False,
        agent_default_auto_reply="auto_reply",
        max_consecutive_auto_reply=5,
        termination=WaldiezAgentTerminationMessage(
            type="none",
            keywords=[],
            criterion=None,
            method_content=None,
        ),
        model_ids=["wm-1"],
        tools=[],
        nested_chats=[],
    )
    assert agent_data.system_message == "system_message"
    assert agent_data.human_input_mode == "NEVER"
    assert not agent_data.code_execution_config
    assert agent_data.agent_default_auto_reply == "auto_reply"
    assert agent_data.max_consecutive_auto_reply == 5
    assert agent_data.termination.type == "none"
    assert not agent_data.termination.keywords
    assert agent_data.termination.criterion is None
    assert agent_data.termination.method_content is None
    assert agent_data.model_ids == ["wm-1"]
    assert not agent_data.tools
    assert not agent_data.nested_chats


def test_is_multimodal() -> None:
    """Test is_multimodal."""
    agent_data = WaldiezAssistantData(
        system_message="system_message",
        human_input_mode="NEVER",
        code_execution_config=False,
        agent_default_auto_reply="auto_reply",
        max_consecutive_auto_reply=5,
        termination=WaldiezAgentTerminationMessage(
            type="none",
            keywords=[],
            criterion=None,
            method_content=None,
        ),
        model_ids=["wm-1"],
        tools=[],
        nested_chats=[],
        is_multimodal=True,
    )
    assert agent_data.is_multimodal
