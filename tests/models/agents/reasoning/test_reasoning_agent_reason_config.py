# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Test waldiez.models.agents.reasoning.reason_config.*."""

import pytest

from waldiez.models.agents.reasoning.reasoning_agent_reason_config import (
    WaldiezReasoningAgentReasonConfig,
)


def test_waldiez_reasoning_agent_reason_config() -> None:
    """Test WaldiezReasoningAgentReasonConfig."""
    reason_config = WaldiezReasoningAgentReasonConfig(
        method="beam_search",
        max_depth=3,
        forest_size=1,
        rating_scale=10,
        beam_size=3,
        answer_approach="pool",
        nsim=3,
        exploration_constant=1.41,
    )
    assert reason_config.method == "beam_search"
    assert reason_config.max_depth == 3
    assert reason_config.forest_size == 1
    assert reason_config.rating_scale == 10
    assert reason_config.beam_size == 3
    assert reason_config.answer_approach == "pool"
    assert reason_config.nsim == 3
    assert reason_config.exploration_constant == 1.41


def test_waldiez_reasoning_agent_reason_config_method() -> None:
    """Test WaldiezReasoningAgentReasonConfig."""
    reason_config = WaldiezReasoningAgentReasonConfig(
        method="mcts",
        max_depth=3,
        forest_size=1,
        rating_scale=10,
        beam_size=3,
        answer_approach="pool",
        nsim=3,
        exploration_constant=1.41,
    )
    assert reason_config.method == "mcts"
    assert reason_config.max_depth == 3
    assert reason_config.forest_size == 1
    assert reason_config.rating_scale == 10
    assert reason_config.beam_size == 3
    assert reason_config.answer_approach == "pool"
    assert reason_config.nsim == 3
    assert reason_config.exploration_constant == 1.41


def test_waldiez_reasoning_agent_reason_config_invalid_method() -> None:
    """Test WaldiezReasoningAgentReasonConfig with invalid method."""
    with pytest.raises(ValueError):
        WaldiezReasoningAgentReasonConfig(
            method="invalid",  # type: ignore
            max_depth=3,
            forest_size=1,
            rating_scale=10,
            beam_size=3,
            answer_approach="pool",
            nsim=3,
            exploration_constant=1.41,
        )


def test_waldiez_reasoning_agent_reason_config_invalid_answer_approach() -> (
    None
):
    """Test WaldiezReasoningAgentReasonConfig with invalid answer_approach."""
    with pytest.raises(ValueError):
        WaldiezReasoningAgentReasonConfig(
            method="beam_search",
            max_depth=3,
            forest_size=1,
            rating_scale=10,
            beam_size=3,
            answer_approach="invalid",  # type: ignore
            nsim=3,
            exploration_constant=1.41,
        )
