# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Exporting teachability data for agents."""

from typing import Dict

from waldiez.models import WaldiezAgent


def get_agent_teachability_string(
    agent: WaldiezAgent,
    agent_names: Dict[str, str],
) -> str:
    """Get the teachability string to use for the agent.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    agent_names : Dict[str, str]
        A mapping of agent id to agent name.

    Returns
    -------
    str
        The teachability string
    """
    if not agent.data.teachability or not agent.data.teachability.enabled:
        return ""
    agent_name = agent_names[agent.id]
    teachability = agent.data.teachability
    content = f"{agent_name}_teachability = teachability.Teachability(" + "\n"
    content += f"    verbosity={teachability.verbosity}," + "\n"
    content += f"    reset_db={teachability.reset_db}," + "\n"
    content += f"    recall_threshold={teachability.recall_threshold}," + "\n"
    content += (
        f"    max_num_retrievals={teachability.max_num_retrievals}," + "\n"
    )
    content += ")\n\n\n"
    content += f"{agent_name}_teachability.add_to_agent({agent_name})"
    return content
