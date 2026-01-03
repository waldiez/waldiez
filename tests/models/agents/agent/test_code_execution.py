# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.agent.code_execution.*."""

from waldiez.models.agents.agent.code_execution import (
    WaldiezAgentCodeExecutionConfig,
)


def test_waldiez_agent_code_execution() -> None:
    """Test WaldiezAgentCodeExecution."""
    code_execution = WaldiezAgentCodeExecutionConfig(
        work_dir="work_dir",
        use_docker=True,
        timeout=60,
        last_n_messages=5,
        functions=["tool-1"],
    )
    assert code_execution.work_dir == "work_dir"
    assert code_execution.use_docker
    assert code_execution.timeout == 60
    assert code_execution.last_n_messages == 5
    assert code_execution.functions == ["tool-1"]
