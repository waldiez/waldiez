# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.reasoning.reasoning_agent.*."""

from waldiez.models.agents.reasoning.reasoning_agent import (
    WaldiezReasoningAgent,
)
from waldiez.models.agents.reasoning.reasoning_agent_data import (
    WaldiezReasoningAgentData,
)
from waldiez.models.agents.reasoning.reasoning_agent_reason_config import (
    WaldiezReasoningAgentReasonConfig,
)


def test_waldiez_reasoning_agent() -> None:
    """Test WaldiezReasoningAgent."""
    reasoning_agent = WaldiezReasoningAgent(
        id="wa-1",
        name="reasoning_agent",
        agent_type="reasoning",
        data=WaldiezReasoningAgentData(
            verbose=True,
            reason_config=WaldiezReasoningAgentReasonConfig(
                method="beam_search",
                max_depth=3,
                forest_size=1,
                rating_scale=10,
                beam_size=3,
                answer_approach="pool",
                nsim=3,
                exploration_constant=1.41,
            ),
        ),
    )
    assert reasoning_agent.agent_type == "reasoning"
    assert reasoning_agent.data.max_depth == 3
    assert reasoning_agent.data.beam_size == 3
    assert reasoning_agent.data.answer_approach == "pool"
    assert reasoning_agent.data.verbose is True
    assert reasoning_agent.get_reasoning_config() == {
        "method": "beam_search",
        "max_depth": 3,
        "forest_size": 1,
        "rating_scale": 10,
        "beam_size": 3,
        "answer_approach": "pool",
    }
