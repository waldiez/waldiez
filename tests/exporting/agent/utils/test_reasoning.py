# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.agent.utils.reasoning.*."""

from waldiez.exporting.agent.utils.reasoning import get_reasoning_agent_extras
from waldiez.exporting.base import ExporterMixin
from waldiez.models import WaldiezAgent, WaldiezReasoningAgent


def test_get_reasoning_agent_extras() -> None:
    """Test get_reasoning_agent_extras."""
    # Given
    agent: WaldiezAgent = WaldiezAgent(
        id="wa-1",
        name="agent1",
        agent_type="assistant",
    )
    # When
    reasoning_agent_extras = get_reasoning_agent_extras(
        agent,
        serializer=ExporterMixin.serializer,
    )
    # Then
    assert reasoning_agent_extras == ""

    # Given
    agent = WaldiezReasoningAgent(
        id="wa-2",
        name="agent2",
    )
    # When
    reasoning_agent_extras = get_reasoning_agent_extras(
        agent,
        serializer=ExporterMixin.serializer,
    )
    # Then
    assert reasoning_agent_extras == (
        "\n    verbose=True,"
        "\n    reason_config={\n"
        '        "method": "beam_search",\n'
        '        "max_depth": 3,\n'
        '        "forest_size": 1,\n'
        '        "rating_scale": 10,\n'
        '        "beam_size": 3,\n'
        '        "answer_approach": "pool"\n'
        "    },"
    )

    # Given
    agent = WaldiezReasoningAgent(
        id="wa-3",
        name="agent3",
        data={  # type: ignore
            "verbose": False,
            "reason_config": {
                "method": "mcts",
                "max_depth": 5,
                "forest_size": 2,
                "rating_scale": 7,
                "nsim": 5,
                "exploration_constant": 1.5,
            },
        },
    )
    # When
    reasoning_agent_extras = get_reasoning_agent_extras(
        agent,
        serializer=ExporterMixin.serializer,
    )
    # Then
    assert reasoning_agent_extras == (
        "\n    verbose=False,"
        "\n    reason_config={\n"
        '        "method": "mcts",\n'
        '        "max_depth": 5,\n'
        '        "forest_size": 2,\n'
        '        "rating_scale": 7,\n'
        '        "nsim": 5,\n'
        '        "exploration_constant": 1.5\n'
        "    },"
    )
