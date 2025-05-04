# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""User proxy agent model."""

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgent
from .user_proxy_data import WaldiezUserProxyData


class WaldiezUserProxy(WaldiezAgent):
    """User proxy agent model.

    A `WaldiezAgent` with agent_type `user` and
    default `human_input_mode`: `"ALWAYS"`
    See `WaldiezAgent`,`WaldiezUserProxyData`,`WaldiezAgentData` for more info.

    Attributes
    ----------
    agent_type : Literal["user", "user_proxy"]
        The agent type: 'user' for a user proxy agent
    data : WaldiezUserProxyData
        The user proxy agent's data
    """

    agent_type: Annotated[
        Literal["user", "user_proxy"],
        Field(
            "user_proxy",
            title="Agent type",
            description=(
                "The agent type in a graph. "
                "`user` is deprecated and will be removed in future versions. "
                "Use `user_proxy` instead."
            ),
            alias="agentType",
        ),
    ]
    data: Annotated[
        WaldiezUserProxyData,
        Field(
            title="Data",
            description="The user proxy agent's data",
            default_factory=WaldiezUserProxyData,
        ),
    ]
