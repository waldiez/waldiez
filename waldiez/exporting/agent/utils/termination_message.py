# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Get the `is_termination_message` check for the agent."""

from typing import Tuple

from waldiez.models import WaldiezAgent


def get_is_termination_message(
    agent: WaldiezAgent, agent_name: str
) -> Tuple[str, str]:
    """Get the `is_termination_message` argument and content (if any).

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    agent_name : str
        The agent name.

    Returns
    -------
    Tuple[str, str]
        - The termination function name or lambda or None.
        - The termination function definition and content if any.

    Raises
    ------
    ValueError
        If the termination type is invalid.
    """
    if agent.data.termination.type == "none":
        return "None", ""
    if agent.data.termination.type == "keyword":
        return agent.data.termination.string, ""
    if agent.data.termination.type == "method":
        content, function_name = (
            agent.data.termination.get_termination_function(
                name_suffix=agent_name
            )
        )
        return function_name, "\n\n" + content + "\n"
    raise ValueError(f"Invalid termination type: {agent.data.termination.type}")
