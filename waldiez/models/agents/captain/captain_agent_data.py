# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez captain agent data."""

from typing import List, Optional

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgentData
from .captain_agent_lib_entry import WaldiezCaptainAgentLibEntry


class WaldiezCaptainAgentData(WaldiezAgentData):
    """Captain agent data class.

    The data for a captain agent.
    Extends `WaldiezAgentData`.
    Extra attributes:
    - `agent_lib`: Optional list of agent lib entries
    - `tool_lib`:
    - `max_round`: The maximum number of rounds in a group chat
    - `max_turns`: The maximum number of turns for a chat
    See the parent's docs (`WaldiezAgentData`) for the rest of the properties.
    """

    agent_lib: Annotated[
        List[WaldiezCaptainAgentLibEntry],
        Field(
            default_factory=list,
            title="Agent lib",
            description="The agent lib",
            alias="agentLib",
        ),
    ] = []
    tool_lib: Annotated[
        Optional[Literal["default"]],
        Field(
            None,
            title="Tool lib",
            description="Whether to use the default tool lib",
            alias="toolLib",
        ),
    ] = None
    max_round: Annotated[
        int,
        Field(
            10,
            title="Max round",
            description="The maximum number of rounds in a group chat",
            alias="maxRound",
        ),
    ] = 10
    max_turns: Annotated[
        int,
        Field(
            5,
            title="Max turns",
            description="The maximum number of turns for a chat",
            alias="maxTurns",
        ),
    ] = 5
