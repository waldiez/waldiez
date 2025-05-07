# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Group chat manager agent."""

import warnings
from typing import List, Literal

from pydantic import Field, field_validator
from typing_extensions import Annotated

from ..agent import WaldiezAgent
from .group_manager_data import WaldiezGroupManagerData
from .speakers import WaldiezGroupManagerSpeakers


class WaldiezGroupManager(WaldiezAgent):
    """Group chat manager agent.

    A `WaldiezAgent` with agent_type `manager`, `human_input_mode`: `"NEVER"`
    and chat group related config for the agent.
    Also see `WaldiezAgent`, `WaldiezGroupManagerData`, `WaldiezAgentData`

    Attributes
    ----------
    agent_type : Literal["group_manager"]
        The agent type: 'group_manager' for a group manager agent
    data : WaldiezGroupManagerData
        The group manager agent's data.

    Functions
    ---------
    validate_transitions(agent_ids: List[str])
        Validate the transitions.
    """

    agent_type: Annotated[
        Literal["group_manager", "manager"],
        Field(
            "manager",
            title="Agent type",
            description=(
                "The agent type: 'group_manager' for a group manager agent"
            ),
            alias="agentType",
        ),
    ]
    data: Annotated[
        WaldiezGroupManagerData,
        Field(
            title="Data",
            description="The group manager agent's data",
            default_factory=WaldiezGroupManagerData,
        ),
    ]

    @field_validator("agent_type", mode="before")
    @classmethod
    def validate_agent_type(cls, v: str) -> Literal["group_manager"]:
        """Validate the agent type.

        The agent type must be `group_manager`.
        The other two are deprecated and will be removed in the future.

        Parameters
        ----------
        v : str
            The agent type.

        Returns
        -------
        str
            The validated agent type.

        Raises
        ------
        ValueError
            If the agent type is not `group_manager`.
        """
        if v in ["groupManager", "manager"]:
            warnings.warn(
                (
                    "The agent types 'groupManager' and 'manager' are "
                    "deprecated. Use 'group_manager' instead."
                ),
                DeprecationWarning,
                stacklevel=2,
            )
        if v != "group_manager":
            raise ValueError(
                "The agent type must be 'group_manager'. "
                "Use 'group_manager' instead."
            )
        return "group_manager"

    def validate_initial_agent_id(self, all_agent_ids: List[str]) -> None:
        """Validate the initial agent ID.

        The initial agent ID must be in the list of agent IDs.

        Parameters
        ----------
        all_agent_ids : List[str]
            The list of agent IDs.

        Raises
        ------
        ValueError
            If the initial agent ID is not in the list of agent IDs.
        """
        initial_agent_id = self.data.initial_agent_id
        if initial_agent_id not in all_agent_ids:
            raise ValueError(
                f"Initial agent ID '{initial_agent_id}' "
                f"is not in the list of agent IDs: {all_agent_ids}"
            )

    def validate_transitions(self, agent_ids: List[str]) -> None:
        """Validate the transitions.

        If the selection mode is `transition`:

        - if `allow_repeat` is a list of agent_ids,
                make sure these ids exist.
        - make sure the `allowed_or_disallowed_transitions` mapping
                has valid agent ids.

        Parameters
        ----------
        agent_ids : List[str]
            The list of agent IDs.

        Raises
        ------
        ValueError
            If the transitions are invalid.
        """
        speakers: WaldiezGroupManagerSpeakers = self.data.speakers
        if speakers.selection_mode != "transition":
            return
        allow_repeat = speakers.allow_repeat
        if isinstance(allow_repeat, list):
            for agent_id in allow_repeat:
                if agent_id not in agent_ids:
                    raise ValueError(f"Invalid agent id: {agent_id}")
        for (
            agent_id,
            transitions,
        ) in speakers.allowed_or_disallowed_transitions.items():
            if agent_id not in agent_ids:
                raise ValueError(f"Invalid agent id: {agent_id}")
            for agent_id in transitions:
                if agent_id not in agent_ids:
                    raise ValueError(f"Invalid agent id: {agent_id}")
