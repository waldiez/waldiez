# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=no-self-use,too-few-public-methods
# pyright: reportUninitializedInstanceVariable=false
"""Remote agent configuration processor."""

from waldiez.models import (
    WaldiezAgent,
    WaldiezChat,
    WaldiezRemoteAgent,
)

from ...core import (
    CodeExecutionConfig,
    ExporterContext,
    RemoteClientConfig,
    SystemMessageConfig,
    TerminationConfig,
)
from ...core.extras.agent_extras import RemoteExtras


class RemoteAgentProcessor:
    """Processor for remote agent configuration."""

    extras: RemoteExtras

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_names: dict[str, str],
        tool_names: dict[str, str],
        all_agents: list[WaldiezAgent],
        all_chats: list[WaldiezChat],
        chat_names: dict[str, str],
        context: ExporterContext,
    ) -> None:
        self.agent = agent
        self.all_agents = all_agents
        self.agent_names = agent_names
        self.tool_names = tool_names
        self.all_chats = all_chats
        self.chat_names = chat_names
        self.context = context
        self.serializer = context.get_serializer().serialize

    def _get_client_config(self) -> RemoteClientConfig | None:
        if not self.agent.is_remote or not isinstance(
            self.agent, WaldiezRemoteAgent
        ):
            return None
        url = "http://localhost:8000"
        if self.agent.data.client and self.agent.data.client.url:
            url = self.agent.data.client.url
        return RemoteClientConfig(url_arg=url)

    def process(
        self,
        code_execution_config: CodeExecutionConfig | None = None,
        termination_config: TerminationConfig | None = None,
        system_message_config: SystemMessageConfig | None = None,
    ) -> RemoteExtras:
        """Process remote agent configuration.

        Parameters
        ----------
        code_execution_config : CodeExecutionConfig, optional
            Configuration for code execution, if applicable.
        termination_config : TerminationConfig, optional
            Configuration for termination, if applicable.
        system_message_config : SystemMessageConfig, optional
            Configuration for system messages, if applicable.

        Returns
        -------
        RemoteExtras
            The processed result.
        """
        self.extras = RemoteExtras(
            instance_id=self.agent.id,
            code_execution_config=code_execution_config,
            termination_config=termination_config,
            system_message_config=system_message_config,
        )
        if termination_config:
            self.extras.set_termination_config(termination_config)
        client_config = self._get_client_config()
        self.extras.set_client_config(client_config)
        return self.extras
