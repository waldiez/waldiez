# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Agent position generation."""

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from waldiez.models import WaldiezAgent


class AgentPositions(Enum):
    """Agent positions.

    Attributes
    ----------
    BEFORE_ALL: int
        Before all agents.
    BEFORE: int
        Before the agent.
    AS_ARGUMENT: int
        As an argument of the agent's initialization.
    AFTER: int
        After the agent.
    AFTER_ALL: int
        After all agents.
    """

    BEFORE_ALL = 0
    BEFORE = 1
    AS_ARGUMENT = 2
    AFTER = 3
    AFTER_ALL = 4


POSITIONS_WITHOUT_AGENT = [
    AgentPositions.BEFORE_ALL,
    AgentPositions.AFTER_ALL,
]


@dataclass(order=True, frozen=True, slots=True)
class AgentPosition:
    """Agent position.

    Attributes
    ----------
    agent: Optional[WaldiezAgent]
        The agent.
    position: AgentPositions
        The position.
    order: int
        The order of the agent position.

    Raises
    ------
    ValueError
        If the position is not "BEFORE_ALL" or "AFTER_ALL"
        and the agent is not provided.
    """

    agent: Optional[WaldiezAgent]
    position: AgentPositions
    order: int = 0

    def __post_init__(self) -> None:
        """Post initialization.

        Raises
        ------
        ValueError
            If the agent is not provided for the given position.
        """
        if self.agent is None and self.position not in POSITIONS_WITHOUT_AGENT:
            raise ValueError("Agent must be provided for the given position.")
