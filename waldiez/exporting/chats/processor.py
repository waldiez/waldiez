# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Chats processor."""

from dataclasses import dataclass
from typing import Optional

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentConnection,
    WaldiezChat,
    WaldiezGroupManager,
)

from ..core import (
    ChatExtras,
    ImportPosition,
    ImportStatement,
    Serializer,
)
from .utils import (
    export_group_chats,
    export_nested_chat_registration,
    export_sequential_chat,
    export_single_chat,
)


@dataclass
class ChatParams:
    """Parameters for the chat export processor."""

    main: list[WaldiezAgentConnection]
    """Main chats that are connections between agents."""
    all: list[WaldiezChat]
    """All the chats in the flow."""
    names: dict[str, str]
    """Mapping of chat IDs to their names."""


# pylint: disable=too-many-arguments,too-many-positional-arguments
# noinspection PyTypeChecker
class ChatsProcessor:
    """Processor for chats export."""

    def __init__(
        self,
        all_agents: list[WaldiezAgent],
        agent_names: dict[str, str],
        all_chats: list[WaldiezChat],
        chat_names: dict[str, str],
        main_chats: list[WaldiezAgentConnection],
        root_group_manager: WaldiezGroupManager | None,
        for_notebook: bool,
        is_async: bool,
        cache_seed: Optional[int],
        serializer: Serializer,
        extras: ChatExtras,
    ) -> None:
        """Initialize the chats processor.

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
        for_notebook : bool
            Whether the export is for a notebook.
        is_async : bool
            Whether the chat is asynchronous.
        cache_seed : int | None
            The cache seed for the export, if any.
        serializer : Serializer
            The serializer to use for escaping quotes in strings.
        extras : ChatExtras
            The structured extras for the chats export.
        """
        self._all_agents = all_agents
        self._agent_names = agent_names
        self._chats = ChatParams(
            main=main_chats,
            all=all_chats,
            names=chat_names,
        )
        self._root_group_manager = root_group_manager
        self._is_async = is_async
        self._for_notebook = for_notebook
        self._cache_seed = cache_seed
        self._serializer = serializer
        self._extras = extras
        chat_tabs = 1
        if cache_seed is not None:
            chat_tabs += 1
        self._chat_tabs = chat_tabs

    def is_group_patterned(self) -> bool:
        """Check if the chats are group patterned.

        Returns
        -------
        bool
            True if the chats are group patterned, False otherwise.
        """
        if len(self._chats.main) == 0 and self._root_group_manager is not None:
            return True
        if len(self._chats.main) == 1:
            main_chat = self._chats.main[0]
            sender = main_chat["source"]
            recipient = main_chat["target"]
            if recipient.is_group_manager or sender.is_group_member:
                return True
        return False

    def process(self) -> None:
        """Process the chats export."""
        self._gather_imports()
        self._handle_chat_registrations()
        chat_initiation = self._generate_chat_initiation()
        self._extras.set_chat_initiation(chat_initiation)

    def _generate_chat_initiation(self) -> str:
        """Generate the chat definition string.

        Returns
        -------
        str
            The chat definition string.
        """
        if len(self._chats.main) == 0:
            if not self._root_group_manager:
                return ""
            return export_group_chats(
                agent_names=self._agent_names,
                manager=self._root_group_manager,
                initial_chat=None,
                tabs=self._chat_tabs,
                is_async=self._is_async,
            )
        if len(self._chats.main) == 1:
            main_chat = self._chats.main[0]
            chat = main_chat["chat"]
            sender = main_chat["source"]
            recipient = main_chat["target"]
            if (
                isinstance(recipient, WaldiezGroupManager)
                and not chat.message.is_method()
            ):
                chat_massage_string: str | None = None
                if chat.message.type == "string":
                    chat_massage_string = chat.message.content
                return export_group_chats(
                    agent_names=self._agent_names,
                    manager=recipient,
                    initial_chat=chat_massage_string,
                    tabs=self._chat_tabs,
                    is_async=self._is_async,
                )
            chat_string, before_chat = export_single_chat(
                sender=sender,
                recipient=recipient,
                chat=chat,
                agent_names=self._agent_names,
                chat_names=self._chats.names,
                serializer=self._serializer.serialize,
                tabs=self._chat_tabs,
                is_async=self._is_async,
                skip_cache=self._cache_seed is None,
            )
            if before_chat:
                self._extras.set_chat_prerequisites(before_chat)
            return chat_string
        chat_string, before_chat = export_sequential_chat(
            main_chats=self._chats.main,
            agent_names=self._agent_names,
            chat_names=self._chats.names,
            serializer=self._serializer.serialize,
            tabs=self._chat_tabs,
            is_async=self._is_async,
            skip_cache=self._cache_seed is None,
        )
        if before_chat:
            self._extras.set_chat_prerequisites(before_chat)
        return chat_string

    def _handle_chat_registrations(self) -> None:
        """Handle chat registrations."""
        for agent in self._all_agents:
            if (
                agent.agent_type != "group_manager"
                and not agent.is_group_member
            ):
                registration_string = export_nested_chat_registration(
                    agent=agent,
                    all_chats=self._chats.all,
                    chat_names=self._chats.names,
                    agent_names=self._agent_names,
                    serializer=self._serializer.serialize,
                    is_async=self._is_async,
                )
                self._extras.add_registration(registration_string)

    def _gather_imports(self) -> None:
        """Get the imports string.

        Returns
        -------
        list[tuple[str, ImportPosition]]
            List of import strings and their positions.
        """
        if self.is_group_patterned():
            if self._is_async:
                import_string = "from autogen.agentchat import a_run_group_chat"
            else:
                import_string = "from autogen.agentchat import run_group_chat"
            self._extras.add_import(
                ImportStatement(
                    statement=import_string, position=ImportPosition.THIRD_PARTY
                )
            )
