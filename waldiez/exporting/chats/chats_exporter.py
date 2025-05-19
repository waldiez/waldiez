# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=line-too-long
"""Chats exporter."""

from typing import Optional, Union

from waldiez.models import WaldiezAgent, WaldiezChat

from ..base import (
    AgentPosition,
    AgentPositions,
    BaseExporter,
    ExporterMixin,
    ExporterReturnType,
    ExportPosition,
    ExportPositions,
    ImportPosition,
)
from .utils import (
    export_nested_chat_registration,
    export_sequential_chat,
    export_single_chat,
)


class ChatsExporter(BaseExporter, ExporterMixin):
    """Chats exporter."""

    _chat_string: Optional[str]
    _before_chat: Optional[str]
    _generated: bool

    def __init__(
        self,
        all_agents: list[WaldiezAgent],
        agent_names: dict[str, str],
        all_chats: list[WaldiezChat],
        chat_names: dict[str, str],
        main_chats: list[tuple[WaldiezChat, WaldiezAgent, WaldiezAgent]],
        for_notebook: bool,
        is_async: bool,
    ):
        """Initialize the chats exporter.

        Parameters
        ----------
        all_agents : list[WaldiezAgent]
            All the agents in the flow.
        agent_names : dict[str, str]
            A mapping of agent id to agent name.
        all_chats : list[WaldiezChat]
            All the chats in the flow.
        chat_names : dict[str, str]
            A mapping of chat id to chat name.
        main_chats : list[tuple[WaldiezChat, WaldiezAgent, WaldiezAgent]]
            The main chats in the flow.
        for_notebook : bool
            Whether the export is for a notebook.
        is_async : bool
            Whether the chat is asynchronous.
        """
        self.all_agents = all_agents
        self.agent_names = agent_names
        self.main_chats = main_chats
        self.all_chats = all_chats
        self.chat_names = chat_names
        self.for_notebook = for_notebook
        self.is_async = is_async
        self._chat_string = None
        self._before_chat = None
        self._generated = False

    def _export_chats(self) -> None:
        """Export the chats content."""
        if len(self.main_chats) == 1:
            main_chat = self.main_chats[0]
            chat, sender, recipient = main_chat
            self._chat_string, self._before_chat = export_single_chat(
                sender=sender,
                recipient=recipient,
                chat=chat,
                agent_names=self.agent_names,
                chat_names=self.chat_names,
                serializer=self.serializer,
                string_escape=self.string_escape,
                tabs=1 if self.for_notebook else 2,
                is_async=self.is_async,
            )
            return
        self._chat_string, self._before_chat = export_sequential_chat(
            main_chats=self.main_chats,
            agent_names=self.agent_names,
            chat_names=self.chat_names,
            serializer=self.serializer,
            string_escape=self.string_escape,
            tabs=1 if self.for_notebook else 2,
            is_async=self.is_async,
        )

    def get_imports(self) -> Optional[list[tuple[str, ImportPosition]]]:
        """Get the imports string.

        Returns
        -------
        str
            The imports string.
        """
        if len(self.main_chats) == 1:
            _, sender, recipient = self.main_chats[0]
            if (
                recipient.agent_type == "group_manager"
                or sender.is_group_member
            ):
                import_string = (
                    "from autogen.agentchat import initiate_group_chat"
                )
                if self.is_async:
                    import_string = (
                        "from autogen.agentchat import a_initiate_group_chat"
                    )
                return [(import_string, ImportPosition.THIRD_PARTY)]
            # no additional imports, it is `sender.initiate_chat(....)`
            return None
        if self.is_async:
            import_string = (
                "from autogen.agentchat.chat import a_initiate_chats"
            )
        else:
            import_string = "from autogen.agentchat.chat import initiate_chats"
        return [(import_string, ImportPosition.THIRD_PARTY)]

    def generate(self) -> str:
        """Generate the chats content.

        Returns
        -------
        str
            The chats content.
        """
        if self._generated is False:
            self._export_chats()
            self._generated = True
        return self._chat_string or ""

    def get_before_export(
        self,
    ) -> Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]:
        """Generate the content before the main export.

        Returns
        -------
        Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]
            The exported content before the main export and its position.
        """
        before: list[tuple[str, Union[ExportPosition, AgentPosition]]] = []
        if self._generated is False:
            self._export_chats()
            self._generated = True
        if self._before_chat:
            before.append(
                (self._before_chat, ExportPosition(ExportPositions.CHATS))
            )
        return before

    def get_after_export(
        self,
    ) -> Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]:
        """Generate the content after the main export.

        Returns
        -------
        Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]
            The exported content after the main export and its position.
        """
        after: list[tuple[str, Union[ExportPosition, AgentPosition]]] = []
        # not per agent, we might have references to agents not yet defined.
        # let's use one string for all nested chat registrations
        nested_chat_registrations = ""
        for agent in self.all_agents:
            if (
                agent.agent_type != "group_manager"
                and not agent.is_group_member
            ):
                registration_string = export_nested_chat_registration(
                    agent=agent,
                    all_chats=self.all_chats,
                    chat_names=self.chat_names,
                    agent_names=self.agent_names,
                    string_escape=self.string_escape,
                    serializer=self.serializer,
                    is_async=self.is_async,
                )
                if registration_string:
                    nested_chat_registrations += "\n" + registration_string
        if nested_chat_registrations:
            # let's place it before the chats (after all agents are defined)
            after.append(
                (
                    nested_chat_registrations,
                    AgentPosition(None, AgentPositions.AFTER_ALL, 2),
                )
            )
        return after

    def export(self) -> ExporterReturnType:
        """Export the chats.

        Returns
        -------
        ExporterReturnType
            The exported chats, the imports, the before export strings,
            the after export strings, and the environment variables.
        """
        exported_string = self.generate()
        imports = self.get_imports()
        before_export = self.get_before_export()
        after_export = self.get_after_export()
        return {
            "content": exported_string,
            "imports": imports,
            "before_export": before_export,
            "after_export": after_export,
            "environment_variables": None,
        }
