# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportArgumentType=false,reportIncompatibleVariableOverride=false

"""Reasoning agent model."""

from typing import Any

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgent
from .reasoning_agent_data import WaldiezReasoningAgentData


class WaldiezReasoningAgent(WaldiezAgent):
    """Reasoning agent model."""

    agent_type: Annotated[
        Literal["reasoning"],
        Field(
            "reasoning",
            title="Agent type",
            description="The agent type in a graph: 'reasoning'",
            alias="agentType",
        ),
    ]
    data: Annotated[
        WaldiezReasoningAgentData,
        Field(
            title="Data",
            description="The reasoning agent's data",
            default_factory=WaldiezReasoningAgentData,
        ),
    ]

    def get_reasoning_config(self) -> dict[str, Any]:
        """Get the reasoning configuration based on its method.

        Returns
        -------
        dict
            The reasoning configuration.
        """
        return self.data.get_reasoning_config()
