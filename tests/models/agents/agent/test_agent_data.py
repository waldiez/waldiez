# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.agent.agent_data.*."""

from waldiez.models.agents.agent.agent_data import WaldiezAgentData
from waldiez.models.agents.agent.teachability import WaldiezAgentTeachability
from waldiez.models.agents.agent.termination_message import (
    WaldiezAgentTerminationMessage,
)


def test_waldiez_agent_data() -> None:
    """Test WaldiezAgentData."""
    agent_data = WaldiezAgentData(
        system_message="system_message",
        human_input_mode="NEVER",
        code_execution_config=False,
        agent_default_auto_reply="auto_reply",
        max_consecutive_auto_reply=5,
        teachability=WaldiezAgentTeachability(
            enabled=False,
            verbosity=0,
            reset_db=False,
            recall_threshold=0.0,
            max_num_retrievals=0,
        ),
        termination=WaldiezAgentTerminationMessage(
            type="none",
            keywords=[],
            criterion=None,
            method_content=None,
        ),
        model_ids=["wm-1"],
        skills=[],
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
    assert not agent_data.skills
    assert not agent_data.nested_chats


def test_is_multimodal() -> None:
    """Test is_multimodal."""
    agent_data = WaldiezAgentData(
        system_message="system_message",
        human_input_mode="NEVER",
        code_execution_config=False,
        agent_default_auto_reply="auto_reply",
        max_consecutive_auto_reply=5,
        teachability=WaldiezAgentTeachability(
            enabled=False,
            verbosity=0,
            reset_db=False,
            recall_threshold=0.0,
            max_num_retrievals=0,
        ),
        termination=WaldiezAgentTerminationMessage(
            type="none",
            keywords=[],
            criterion=None,
            method_content=None,
        ),
        model_ids=["wm-1"],
        skills=[],
        nested_chats=[],
        is_multimodal=True,
    )
    assert agent_data.is_multimodal
