# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez captain agent model."""

from typing import Literal

from pydantic import Field
from typing_extensions import Annotated

from ..agent import WaldiezAgent
from .captain_agent_data import WaldiezCaptainAgentData


class WaldiezCaptainAgent(WaldiezAgent):
    """Captain agent.

    A `WaldiezAgent` with agent_type `captain` and
    captain agent's related config for the agent.
    Also see `WaldiezAgent`, `WaldiezCaptainData`, `WaldiezAgentData`

    Attributes
    ----------
    agent_type : Literal["captain"]
        The agent type: 'captain' for a captain agent
    data : WaldiezCaptainAgentData
        The captain agent's data.
    """

    agent_type: Annotated[  # pyright: ignore
        Literal["captain"],
        Field(
            default="captain",
            title="Agent type",
            description="The agent type: 'captain' for a captain agent",
            alias="agentType",
        ),
    ]
    data: Annotated[  # pyright: ignore
        WaldiezCaptainAgentData,
        Field(
            title="Data",
            description="The captain agent's data",
            default_factory=WaldiezCaptainAgentData,  # pyright: ignore
        ),
    ]
