# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Remote agent data model."""

from pydantic import Field
from typing_extensions import Annotated, Literal

from waldiez.models.agents.agent import WaldiezAgentData

from .remote_types import (
    WaldiezAgentRemoteClient,
    WaldiezAgentRemoteServer,
)


class WaldiezRemoteAgentData(WaldiezAgentData):
    """Remote agent data class.

    The data for a remote agent with `human_input_mode` set to `"NEVER"`.
    If the server mode is enabled,
    an a2a server is also to be generated and started before running te flow
    based on this config. Otherwise, the a2a server should already be running
    and be reachable based on the client's config.

    See the parent's docs (`WaldiezAgentData`) for the rest of the properties.

    Attributes
    ----------
    human_input_mode : Literal["ALWAYS", "NEVER", "TERMINATE"]
        The human input mode. Defaults to `NEVER`.
    server : WaldiezAgentRemoteServer
        Server configuration for exposing this agent via A2A protocol.
    client : WaldiezAgentRemoteClient
        Client configuration for connecting to remote A2A servers.
    """

    human_input_mode: Annotated[
        Literal["ALWAYS", "NEVER", "TERMINATE"],
        Field(
            "NEVER",
            title="Human input mode",
            description="The human input mode. Defaults to `NEVER`",
            alias="humanInputMode",
        ),
    ]
    server: Annotated[
        WaldiezAgentRemoteServer,
        Field(
            default_factory=WaldiezAgentRemoteServer.default,
            title="Server",
            description=(
                "Server configuration for exposing this agent via A2A protocol."
            ),
        ),
    ]
    client: Annotated[
        WaldiezAgentRemoteClient,
        Field(
            default_factory=WaldiezAgentRemoteClient.default,
            title="Client",
            description=(
                "Client configuration for connecting to remote A2A servers."
            ),
        ),
    ]
