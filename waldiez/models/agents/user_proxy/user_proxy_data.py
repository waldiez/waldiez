# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""User proxy agent data module."""

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgentData


class WaldiezUserProxyData(WaldiezAgentData):
    """User proxy agent data class.

    The data for an agent with `human_input_mode`
    set to `"ALWAYS"` as default.
    See the parent's docs (`WaldiezAgentData`) for the rest of the properties.

    Attributes
    ----------
    human_input_mode : Literal["ALWAYS", "NEVER", "TERMINATE"]
        The human input mode, Defaults to `ALWAYS`
    """

    human_input_mode: Annotated[
        Literal["ALWAYS", "NEVER", "TERMINATE"],
        Field(
            "ALWAYS",
            title="Human input mode",
            description="The human input mode, Defaults to `ALWAYS`",
            alias="humanInputMode",
        ),
    ]
