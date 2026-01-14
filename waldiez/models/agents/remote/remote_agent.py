# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportArgumentType=false,reportIncompatibleVariableOverride=false

"""Remote agent model."""

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgent
from .remote_agent_data import WaldiezRemoteAgentData


class WaldiezRemoteAgent(WaldiezAgent):
    """Remote agent model.

    Attributes
    ----------
    agent_type : Literal["remote"]
        The agent type: 'remote' for a remote agent
    data : WaldiezRemoteAgentData
        The remote agent's data
    """

    agent_type: Annotated[
        Literal["remote"],
        Field(
            "remote",
            title="Agent type",
            description="The agent type in a graph: 'remote'",
            alias="agentType",
        ),
    ] = "remote"
    data: Annotated[
        WaldiezRemoteAgentData,
        Field(
            title="Data",
            description="The remote agent's data",
            default_factory=WaldiezRemoteAgentData,
        ),
    ]
