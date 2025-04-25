# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Group chat manager data."""

from typing import Optional

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgentData
from .speakers import WaldiezGroupManagerSpeakers


class WaldiezGroupManagerData(WaldiezAgentData):
    """Group chat manager data class.

    The data for an agent with `human_input_mode` set to "NEVER" as default.
    and the chat group's related extra properties.
    See the parent's docs (`WaldiezAgentData`) for the rest of the properties.

    Attributes
    ----------
    human_input_mode : Literal["ALWAYS", "NEVER", "TERMINATE"]
        The human input mode, Defaults to `NEVER`
    max_round : Optional[int]
        The maximum number of rounds to have in the group.
    admin_name : Optional[str]
        The name of the group's admin.
        Make sure you use a name of an agent in the group.
    speakers : WaldiezGroupManagerSpeakers
        The rules for the speaker selection and repetition
    enable_clear_history : Optional[bool]
        Enable clearing the history in the chat group.
    send_introductions : bool
        Send the group members' introductions.
    """

    human_input_mode: Annotated[
        Literal["ALWAYS", "NEVER", "TERMINATE"],
        Field(
            "NEVER",
            title="Human input mode",
            description="The human input mode, Defaults to `NEVER`",
            alias="humanInputMode",
        ),
    ]
    max_round: Annotated[
        Optional[int],
        Field(
            None,
            title="Max round",
            description="The maximum number of rounds to have in the group.",
            alias="maxRound",
        ),
    ]
    admin_name: Annotated[
        Optional[str],
        Field(
            None,
            title="Group Admin name",
            description=(
                "The name of the group's admin. "
                "Make sure you use a name of an agent in the group."
            ),
            alias="adminName",
        ),
    ]
    speakers: Annotated[
        WaldiezGroupManagerSpeakers,
        Field(
            title="Speakers",
            description="The rules for the speaker selection and repetition",
            default_factory=WaldiezGroupManagerSpeakers,
        ),
    ]
    enable_clear_history: Annotated[
        Optional[bool],
        Field(
            None,
            title="Enable clear history",
            description="Enable clearing hte history in the chat group.",
            alias="enableClearHistory",
        ),
    ]
    send_introductions: Annotated[
        bool,
        Field(
            False,
            title="Send Introductions",
            description="Send the group members' introductions.",
            alias="sendIntroductions",
        ),
    ]
