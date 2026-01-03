# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Chats exporter."""

from typing import Any

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentConnection,
    WaldiezChat,
    WaldiezGroupManager,
)

from ..core import ChatExtras, Exporter, ExporterContext
from .processor import ChatsProcessor


class ChatsExporter(Exporter[ChatExtras]):
    """Chats exporter with structured extras."""

    def __init__(
        self,
        all_agents: list[WaldiezAgent],
        agent_names: dict[str, str],
        all_chats: list[WaldiezChat],
        chat_names: dict[str, str],
        main_chats: list[WaldiezAgentConnection],
        root_group_manager: WaldiezGroupManager | None,
        context: ExporterContext | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize the chats exporter.

        Parameters
        ----------
        all_agents : list[WaldiezAgent]
            All agents involved in the chats.
        agent_names : dict[str, str]
            Mapping of agent IDs to their names.
        all_chats : list[WaldiezChat]
            All chats to be exported.
        chat_names : dict[str, str]
            Mapping of chat IDs to their names.
        main_chats : list[WaldiezAgentConnection]
            Main chats that are connections between agents.
        root_group_manager : WaldiezGroupManager | None
            The root group manager for managing chat groups, if any.
        context : ExporterContext | None, optional
            Exporter context with dependencies, by default None
        **kwargs : Any
            Additional keyword arguments for the exporter.
        """
        super().__init__(context, **kwargs)

        self.all_agents = all_agents
        self.agent_names = agent_names
        self.all_chats = all_chats
        self.chat_names = chat_names
        self.main_chats = main_chats
        self.root_group_manager = root_group_manager
        config = self.context.get_config()
        self.for_notebook = config.for_notebook
        self.is_async = config.is_async
        self.cache_seed = config.cache_seed
        # Initialize extras with processed chat content
        self._extras = self._create_chat_extras()

    @property
    def extras(self) -> ChatExtras:
        """Get the chat extras."""
        return self._extras

    # pylint: disable=no-self-use
    def _create_chat_extras(self) -> ChatExtras:
        """Create and populate chat extras."""
        extras = ChatExtras("chats")
        message = self.context.config.message if self.context.config else None
        processor = ChatsProcessor(
            all_agents=self.all_agents,
            agent_names=self.agent_names,
            all_chats=self.all_chats,
            chat_names=self.chat_names,
            main_chats=self.main_chats,
            root_group_manager=self.root_group_manager,
            for_notebook=self.for_notebook,
            is_async=self.is_async,
            cache_seed=self.cache_seed,
            serializer=self.context.get_serializer(),
            message=message,
            extras=extras,
        )
        processor.process()
        if extras.chat_registration:
            extras.append_after_all_agents(extras.chat_registration)
        if extras.chat_prerequisites:
            extras.append_after_all_agents(extras.chat_prerequisites)
        return extras

    def generate_main_content(self) -> str | None:
        """Generate the main content of the export."""
        return None
