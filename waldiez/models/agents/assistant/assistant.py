# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Assistant agent model."""

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgent
from .assistant_data import WaldiezAssistantData


class WaldiezAssistant(WaldiezAgent):
    """Assistant agent model.

    A `WaldiezAgent` with agent_type `assistant` and
    default `human_input_mode`: `"NEVER"`
    See `WaldiezAgent`,`WaldiezAssistantData`,`WaldiezAgentData` for more info.

    Attributes
    ----------
    agent_type : Literal["assistant"]
        The agent type: 'assistant' for an assistant agent
    data : WaldiezAssistantData
        The assistant agent's data
    """

    agent_type: Annotated[
        Literal["assistant"],
        Field(
            "assistant",
            title="Agent type",
            description="The agent type in a graph: 'assistant'",
            alias="agentType",
        ),
    ]
    data: Annotated[
        WaldiezAssistantData,
        Field(
            title="Data",
            description="The assistant agent's data",
            default_factory=WaldiezAssistantData,
        ),
    ]
