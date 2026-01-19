# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=no-self-use,too-few-public-methods
# pyright: reportUninitializedInstanceVariable=false
"""Remote agent configuration processor."""

from waldiez.models import (
    WaldiezAgent,
    WaldiezChat,
)

from ...core import (
    CodeExecutionConfig,
    ExporterContext,
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
        print("TODO: this")
        return self.extras
