# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.agent.linked_tool.*."""

from waldiez.models.agents.agent.linked_tool import WaldiezAgentLinkedTool


def test_waldiez_agent_linked_tool() -> None:
    """Test WaldiezAgentLinkedTool."""
    linked_tool = WaldiezAgentLinkedTool(id="tool_id", executor_id="agent_id")
    assert linked_tool.id == "tool_id"
    assert linked_tool.executor_id == "agent_id"
