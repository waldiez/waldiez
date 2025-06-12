# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Helpers for getting a group manager and a group chat."""

from waldiez.models import (
    WaldiezAgentTerminationMessage,
    WaldiezGroupManager,
    WaldiezGroupManagerData,
    WaldiezGroupManagerSpeakers,
)


def get_group_manager(
    agent_id: str,
    initial_agent_id: str,
    is_pattern_based: bool,
) -> WaldiezGroupManager:
    """Get a WaldiezGroupManager instance.

    Parameters
    ----------
    agent_id : str
        The ID of the group manager agent.
    initial_agent_id : str
        The ID of the initial agent.
    is_pattern_based : bool
        Whether the group chat is pattern-based.

    Returns
    -------
    WaldiezGroupManager
        A WaldiezGroupManager instance.
    """
    speakers = WaldiezGroupManagerSpeakers(
        selection_method="round_robin" if not is_pattern_based else "default",
        selection_custom_method=None,
        max_retries_for_selecting=None,
        selection_mode="repeat",
        allow_repeat=True,
        allowed_or_disallowed_transitions={},
        transitions_type="allowed",
    )
    return WaldiezGroupManager(
        id=agent_id,
        name="group_manager",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        agent_type="group_manager",
        data=WaldiezGroupManagerData(
            initial_agent_id=initial_agent_id,
            speakers=speakers,
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="exact",
                keywords=["TERMINATE", "STOP"],
            ),
        ),
    )
