# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Export reasoning agent to string."""

from typing import Callable

from waldiez.models import WaldiezAgent, WaldiezReasoningAgent


def get_reasoning_agent_extras(
    agent: WaldiezAgent,
    serializer: Callable[..., str],
) -> str:
    """Get the reasoning agent extras.

    Parameters
    ----------
    agent : WaldiezReasoningAgent
        The reasoning agent.
    serializer : Callable[..., str]
        The serializer to get the string representation of an object.

    Returns
    -------
    str
        The reasoning agent extras.
    """
    if agent.agent_type != "reasoning" or not isinstance(
        agent, WaldiezReasoningAgent
    ):
        return ""
    reasoning_config = agent.get_reasoning_config()
    serialized = serializer(reasoning_config)
    content = "\n    verbose=" + f"{agent.data.verbose},"
    content += "\n    reason_config=" + f"{serialized},"
    return content
