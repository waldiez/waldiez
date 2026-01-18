# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Remote agent types."""

from typing import Any

from pydantic import Field, model_validator
from typing_extensions import Annotated, Self

from ...common import WaldiezBase, update_dict


class WaldiezAgentRemoteCardExtension(WaldiezBase):
    """Remote agent card extension.

    Attributes
    ----------
    uri : str
        The extension URI.
    description : str
        A human-readable description of the extension.
    required : bool
        Whether the extension is required.
    params : Dict[str, Any]
        Additional parameters for the extension.
    """

    uri: Annotated[
        str,
        Field(
            ...,
            title="URI",
            description="The extension URI",
        ),
    ]
    description: Annotated[
        str,
        Field(
            "",
            title="Description",
            description="A human-readable description of the extension",
        ),
    ]
    required: Annotated[
        bool,
        Field(
            False,
            title="Required",
            description="Whether the extension is required",
        ),
    ]
    params: Annotated[
        dict[str, Any],
        Field(
            default_factory=dict,
            title="Params",
            description="Additional parameters for the extension",
        ),
    ]


class WaldiezAgentRemoteCardCapabilities(WaldiezBase):
    """Remote agent card capabilities.

    Attributes
    ----------
    streaming : bool
        Whether streaming is supported.
    push_notifications : bool
        Whether push notifications are supported.
    extensions : List[WaldiezAgentRemoteCardExtension]
        List of supported extensions.
    """

    streaming: Annotated[
        bool,
        Field(
            True,
            title="Streaming",
            description="Whether streaming is supported",
        ),
    ]
    push_notifications: Annotated[
        bool,
        Field(
            True,
            title="Push Notifications",
            description="Whether push notifications are supported",
            alias="pushNotifications",
        ),
    ]
    extensions: Annotated[
        list[WaldiezAgentRemoteCardExtension],
        Field(
            default_factory=list,
            title="Extensions",
            description="List of supported extensions",
        ),
    ]

    @classmethod
    def default(cls) -> "WaldiezAgentRemoteCardCapabilities":
        """Get the default (empty) remote card capabilities.

        Returns
        -------
        WaldiezAgentRemoteCardCapabilities
            The default remote card capabilities.
        """
        return WaldiezAgentRemoteCardCapabilities(
            streaming=False, push_notifications=False, extensions=[]
        )


class WaldiezAgentRemoteCard(WaldiezBase):
    """Remote agent server card.

    Attributes
    ----------
    name : Optional[str]
        A human-readable name for the agent.
        Uses original agent name if not set.
    description : Optional[str]
        A human-readable description of the agent, assisting users
        and other agents in understanding its purpose.
        Uses original agent description if not set.
    url : Optional[str]
        The preferred endpoint URL for interacting with the agent.
        This URL MUST support the transport specified by 'preferredTransport'.
        Uses original A2aAgentServer url if not set.
    version : Optional[str]
        The agent's own version number. The format is defined by the provider.
    default_input_modes : List[str]
        Default set of supported input MIME types for all skills,
        which can be overridden on a per-skill basis.
    default_output_modes : List[str]
        Default set of supported output MIME types for all skills,
        which can be overridden on a per-skill basis.
    capabilities : Optional[WaldiezAgentRemoteCardCapabilities]
        A declaration of optional capabilities supported by the agent.
    skills : List[str]
        The set of skill IDs that the agent can perform.
    """

    name: Annotated[
        str | None,
        Field(
            None,
            title="Name",
            description="A human-readable name for the agent",
        ),
    ]
    description: Annotated[
        str | None,
        Field(
            None,
            title="Description",
            description="A human-readable description of the agent",
        ),
    ]
    url: Annotated[
        str | None,
        Field(
            None,
            title="URL",
            description=(
                "The preferred endpoint URL for interacting with the agent"
            ),
        ),
    ]
    version: Annotated[
        str | None,
        Field(
            None,
            title="Version",
            description="The agent's own version number",
        ),
    ]
    default_input_modes: Annotated[
        list[str],
        Field(
            default_factory=list,
            title="Default Input Modes",
            description="Set of supported input MIME types for all skills",
            alias="defaultInputModes",
        ),
    ]
    default_output_modes: Annotated[
        list[str],
        Field(
            default_factory=list,
            title="Default Output Modes",
            description="Set of supported output MIME types for all skills",
            alias="defaultOutputModes",
        ),
    ]
    capabilities: Annotated[
        WaldiezAgentRemoteCardCapabilities | None,
        Field(
            default=WaldiezAgentRemoteCardCapabilities.default,
            title="Capabilities",
            description=(
                "A declaration of optional capabilities supported by the agent"
            ),
        ),
    ]
    skills: Annotated[
        list[str],
        Field(
            default_factory=list,
            title="Skills",
            description="The set of skill/tool IDs that the agent can perform",
        ),
    ]


class WaldiezAgentRemoteServerConfig(WaldiezBase):
    """Remote agent server configuration.

    Attributes
    ----------
    url : Optional[str]
        The base URL for the A2A server.
    agent_card : Optional[WaldiezAgentRemoteCard]
        Configuration for the base agent card.
    card_modifier : Optional[str]
        Function to modify the base agent card.
        (Callable[[AgentCard], AgentCard]).
    extended_agent_card : Optional[WaldiezAgentRemoteCard]
        Configuration for the extended agent card.
    extended_card_modifier : Optional[str]
        Function to modify the extended agent card.
        (Callable[[AgentCard, ServerCallContext], AgentCard]).
    """

    url: Annotated[
        str | None,
        Field(
            None,
            title="URL",
            description="The base URL for the A2A server",
        ),
    ]
    agent_card: Annotated[
        WaldiezAgentRemoteCard | None,
        Field(
            None,
            title="Agent Card",
            description="Configuration for the base agent card",
            alias="agentCard",
        ),
    ]
    card_modifier: Annotated[
        str | None,
        Field(
            None,
            title="Card Modifier",
            description="Function to modify the base agent card",
            alias="cardModifier",
        ),
    ]
    extended_agent_card: Annotated[
        WaldiezAgentRemoteCard | None,
        Field(
            None,
            title="Extended Agent Card",
            description="Configuration for the extended agent card",
            alias="extendedAgentCard",
        ),
    ]
    extended_card_modifier: Annotated[
        str | None,
        Field(
            None,
            title="Extended Card Modifier",
            description="Function to modify the extended agent card",
            alias="extendedCardModifier",
        ),
    ]


class WaldiezAgentRemoteServer(WaldiezBase):
    """Remote agent server settings.

    Attributes
    ----------
    enabled : bool
        Whether the remote server is enabled.
    config : Optional[WaldiezAgentRemoteServerConfig]
        The server configuration.
    """

    enabled: Annotated[
        bool,
        Field(
            False,
            title="Enabled",
            description="Whether the remote server is enabled",
        ),
    ]
    config: Annotated[
        WaldiezAgentRemoteServerConfig | None,
        Field(
            None,
            title="Config",
            description="The server configuration",
        ),
    ]

    @classmethod
    def default(cls) -> "WaldiezAgentRemoteServer":
        """Get the default remote server config.

        Returns
        -------
        WaldiezAgentRemoteServer
            The default remote server config.
        """
        return WaldiezAgentRemoteServer(
            enabled=False,
            config=None,
        )


class WaldiezAgentRemoteClient(WaldiezBase):
    """Remote agent client settings.

    Attributes
    ----------
    url : Optional[str]
        The URL for the remote client connection.
    name : Optional[str]
        The name of the client.
    silent : Optional[bool]
        Whether the client should operate silently.
    max_reconnects : Optional[int]
        Maximum number of reconnection attempts.
    polling_interval : Optional[float]
        Polling interval in seconds.
    """

    url: Annotated[
        str | None,
        Field(
            None,
            title="URL",
            description="The URL for the remote client connection",
        ),
    ]
    name: Annotated[
        str | None,
        Field(
            None,
            title="Name",
            description="The name of the client",
        ),
    ]
    silent: Annotated[
        bool | None,
        Field(
            None,
            title="Silent",
            description="Whether the client should operate silently",
        ),
    ]
    max_reconnects: Annotated[
        int | None,
        Field(
            None,
            title="Max Reconnects",
            description="Maximum number of reconnection attempts",
            alias="maxReconnects",
        ),
    ]
    polling_interval: Annotated[
        float | None,
        Field(
            None,
            title="Polling Interval",
            description="Polling interval in seconds",
            alias="pollingInterval",
        ),
    ]
    headers: Annotated[
        dict[str, Any],
        Field(
            default_factory=dict,
            title="Headers",
            description="Custom headers for the client connection",
        ),
    ]

    @model_validator(mode="after")
    def validate_remote_client(self) -> Self:
        """Validate the header data.

        Returns
        -------
        WaldiezAgentRemoteClient
            The validated chat data.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        self.headers = update_dict(self.headers)
        return self

    @classmethod
    def default(cls) -> "WaldiezAgentRemoteClient":
        """Get the default remote client settings.

        Returns
        -------
        WaldiezAgentRemoteClient
            The default remote client settings.
        """
        return WaldiezAgentRemoteClient(
            url=None,
            name=None,
            silent=True,
            max_reconnects=None,
            polling_interval=None,
            headers={},
        )
