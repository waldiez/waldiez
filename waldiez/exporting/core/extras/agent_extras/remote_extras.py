# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Remote agent extras."""

from dataclasses import dataclass

from waldiez.exporting.core.result import ExportResult
from waldiez.exporting.core.types import InstanceArgument

# from ...enums import AgentPosition, ExportPosition
from .standard_extras import StandardExtras


@dataclass
class RemoteClientConfig:
    """Remote agent (client) configuration."""

    url_arg: str = "http://localhost:8000"

    def has_content(self) -> bool:
        """Check if there's any agent specific content.

        Returns
        -------
        bool
            True if there's any remote client configuration.
        """
        return bool(self.url_arg)


@dataclass
class RemoteExtras(StandardExtras):
    """Extras for remote agents."""

    server_content: str = ""
    client_config: RemoteClientConfig | None = None

    def get_client_config(self) -> RemoteClientConfig | None:
        """Get the remote client config.

        Returns
        -------
        RemoteClientConfig | None
            The remote client config.
        """
        return self.client_config

    def set_client_config(self, config: RemoteClientConfig | None) -> None:
        """Set the remote client config.

        Parameters
        ----------
        config : RemoteClientConfig | None
            The remote client config.
        """
        self.client_config = config
        if config:
            self.add_arg(
                InstanceArgument(
                    self.instance_id,
                    name="url",
                    value=f'"{config.url_arg}"',
                    tabs=1,
                )
            )

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute reasoning specific content to the export result.

        Parameters
        ----------
        result : ExportResult
            The export result to contribute to.
        """
        # if we super()... we also get the
        # 'code_execution' and 'termination' args
        # let's leave remote agent with only args that make sense
        # (url, name)
        config = self.get_client_config()
        if not config:
            return
        if config.url_arg:
            result.add_instance_argument(
                name="url",
                value=f'"{config.url_arg}"',
                instance_id=self.instance_id,
                tabs=1,
            )
            # result.add_content(
            #     f"url={config.url_arg}",
            #     position=ExportPosition.AGENTS,
            #     agent_position=AgentPosition.AS_ARGUMENT,
            #     agent_id=self.instance_id,
            # )
        # super()._contribute_specific_content(result)
        # td = (
        #     "check server and client content \n"
        #     "we also need to check (detect) if we should "
        #     "use multiple remote agents in one common server app:\n"
        #     "one server multiple endpoints, one for each agent that "
        #     "has common server configs"
        # )

    def has_specific_content(self) -> bool:
        """Check for remote-agent specific content.

        Returns
        -------
        bool
            True if there's remote agent's specific content.
        """
        if not super().has_specific_content():
            return bool(
                self.extra_args
                or self.extra_imports
                or self.before_agent.strip()
                or self.after_agent.strip()
                or self.server_content.strip()
                or (self.client_config and self.client_config.has_content())
            )
        return True
