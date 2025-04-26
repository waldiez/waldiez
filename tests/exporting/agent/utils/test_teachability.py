# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.agents.teachability.*."""

from waldiez.exporting.agent.utils.teachability import (
    get_agent_teachability_string,
)
from waldiez.models import WaldiezAgent, WaldiezAgentTeachability


def test_get_agent_teachability_string() -> None:
    """Test get_agent_teachability_string."""
    agent = WaldiezAgent(
        id="wa-1",
        name="agent",
        type="agent",
        agent_type="assistant",
        data={  # type: ignore
            "teachability": WaldiezAgentTeachability(
                enabled=True,
                verbosity=1,
                reset_db=True,
                recall_threshold=0.5,
                max_num_retrievals=10,
            ),
        },
    )
    agent_names = {"wa-1": "agent"}
    teachability_string = get_agent_teachability_string(agent, agent_names)
    expected = (
        "agent_teachability = teachability.Teachability(\n"
        "    verbosity=1,\n"
        "    reset_db=True,\n"
        "    recall_threshold=0.5,\n"
        "    max_num_retrievals=10,\n"
        ")\n\n\n"
        "agent_teachability.add_to_agent(agent)"
    )
    assert teachability_string == expected
    agent = WaldiezAgent(
        id="wa-1",
        name="agent",
        type="agent",
        agent_type="assistant",
        data={  # type: ignore
            "teachability": WaldiezAgentTeachability(
                enabled=False,
                verbosity=0,
                reset_db=False,
                recall_threshold=0.0,
                max_num_retrievals=0,
            ),
        },
    )
    agent_names = {"wa-1": "agent"}
    teachability_string = get_agent_teachability_string(agent, agent_names)
    assert teachability_string == ""
