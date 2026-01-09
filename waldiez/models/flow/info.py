# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Waldiez chat info model."""

from collections.abc import Iterable

from pydantic import Field
from typing_extensions import Annotated

from ..agents import WaldiezAgent, WaldiezAgentHumanInputMode, WaldiezAgentType
from ..common import (
    WaldiezBase,
)


class WaldiezAgentInfo(WaldiezBase):
    """Agent info class.

    Attributes
    ----------
    id : str
        The ID of the agent.
    name : str
        The name of the agent.
    human_input_mode : WaldiezAgentHumanInputMode
        The human input mode of the agent
        (e.g., "ALWAYS", "NEVER", "TERMINATE").
    agent_type : WaldiezAgentType
        The type of the agent (e.g., "user", "assistant").
    """

    id: Annotated[str, Field(description="ID of the agent")]
    name: Annotated[str, Field(description="Name of the agent")]
    human_input_mode: Annotated[
        WaldiezAgentHumanInputMode,
        Field(description="Human input mode of the agent"),
    ]
    agent_type: Annotated[
        WaldiezAgentType,
        Field(description="Type of the agent (e.g., 'user', 'assistant')"),
    ]


class WaldiezFlowInfo(WaldiezBase):
    """Flow info class.

    Attributes
    ----------
    participants : WaldiezAgentInfo
        The chat info of the participant in the flow.
    """

    participants: Annotated[
        list[WaldiezAgentInfo],
        Field(
            description="List of chat participants with their info",
            default_factory=list,
        ),
    ]

    @classmethod
    def create(
        cls, agents: Iterable[WaldiezAgent], agent_names: dict[str, str]
    ) -> "WaldiezFlowInfo":
        """Create a WaldiezFlowInfo instance from a list of agents.

        Parameters
        ----------
        agents : Iterable[WaldiezAgent]
            The agents to include in the flow info.
        agent_names : dict[str, str]
            A dictionary mapping agent IDs to their names.

        Returns
        -------
        WaldiezFlowInfo
            An instance of WaldiezFlowInfo containing the agent info.
        """
        participants: list[WaldiezAgentInfo] = []
        for agent in agents:
            participants.append(
                WaldiezAgentInfo(
                    id=agent.id,
                    name=agent_names.get(agent.id, agent.name),
                    human_input_mode=agent.data.human_input_mode,
                    agent_type=agent.agent_type,
                )
            )
        return cls(participants=participants)
