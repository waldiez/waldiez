# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.reasoning.reason_agent_data.*."""

from waldiez.models.agents.reasoning.reasoning_agent_data import (
    WaldiezReasoningAgentData,
)


def test_waldiez_reasoning_agent_data_beam_search() -> None:
    """Test WaldiezReasoningAgentData."""
    reasoning_agent_data = WaldiezReasoningAgentData(
        max_depth=3,
        beam_size=3,
        answer_approach="pool",
        verbose=True,
        reason_config={  # type: ignore
            "method": "beam_search",
            "max_depth": 3,
            "forest_size": 1,
            "rating_scale": 10,
            "beam_size": 3,
            "answer_approach": "pool",
        },
    )
    assert reasoning_agent_data.max_depth == 3
    assert reasoning_agent_data.beam_size == 3
    assert reasoning_agent_data.answer_approach == "pool"
    assert reasoning_agent_data.verbose is True
    assert reasoning_agent_data.get_reasoning_config() == {
        "method": "beam_search",
        "max_depth": 3,
        "forest_size": 1,
        "rating_scale": 10,
        "beam_size": 3,
        "answer_approach": "pool",
    }


def test_waldiez_reasoning_agent_data_mcts() -> None:
    """Test WaldiezReasoningAgentData."""
    reasoning_agent_data = WaldiezReasoningAgentData(
        max_depth=3,
        beam_size=3,
        answer_approach="pool",
        verbose=True,
        reason_config={  # type: ignore
            "method": "mcts",
            "max_depth": 3,
            "forest_size": 1,
            "rating_scale": 10,
            "nsim": 3,
            "exploration_constant": 1.41,
        },
    )
    assert reasoning_agent_data.max_depth == 3
    assert reasoning_agent_data.beam_size == 3
    assert reasoning_agent_data.answer_approach == "pool"
    assert reasoning_agent_data.verbose is True
    assert reasoning_agent_data.get_reasoning_config() == {
        "method": "mcts",
        "max_depth": 3,
        "forest_size": 1,
        "rating_scale": 10,
        "nsim": 3,
        "exploration_constant": 1.41,
    }


def test_waldiez_reasoning_agent_data_lats() -> None:
    """Test WaldiezReasoningAgentData."""
    reasoning_agent_data = WaldiezReasoningAgentData(
        max_depth=3,
        beam_size=3,
        answer_approach="pool",
        verbose=True,
        reason_config={  # type: ignore
            "method": "lats",
            "max_depth": 3,
            "forest_size": 1,
            "rating_scale": 10,
            "nsim": 3,
            "exploration_constant": 1.41,
        },
    )
    assert reasoning_agent_data.max_depth == 3
    assert reasoning_agent_data.beam_size == 3
    assert reasoning_agent_data.answer_approach == "pool"
    assert reasoning_agent_data.verbose is True
    assert reasoning_agent_data.get_reasoning_config() == {
        "method": "lats",
        "max_depth": 3,
        "forest_size": 1,
        "rating_scale": 10,
        "nsim": 3,
        "exploration_constant": 1.41,
    }
