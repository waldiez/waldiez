# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Chat specific extras module."""

from dataclasses import dataclass

from ..enums import AgentPosition, ContentOrder, ExportPosition
from ..result import ExportResult
from .base import BaseExtras


@dataclass
class ChatExtras(BaseExtras):
    """Extras for chat exporters.

    Attributes
    ----------
    chat_definition : str
        The chat definition content.
    chat_initiation : str
        The chat initiation content.
    """

    chat_prerequisites: str = ""
    chat_initiation: str = ""
    chat_registration: str = ""

    def set_chat_prerequisites(self, prerequisites: str) -> None:
        """Set the chat prerequisites.

        Parameters
        ----------
        prerequisites : str
            The chat prerequisites content.
        """
        self.chat_prerequisites = prerequisites

    def set_chat_initiation(self, initiation: str) -> None:
        """Set the chat initiation.

        Parameters
        ----------
        initiation : str
            The chat initiation content.
        """
        self.chat_initiation = initiation

    def set_chat_registration(self, registration: str) -> None:
        """Set the chat registration.

        Parameters
        ----------
        registration : str
            The chat registration content.
        """
        self.chat_registration = registration

    def add_registration(self, registration: str) -> None:
        """Add chat registration content.

        Parameters
        ----------
        registration : str
            The chat registration content.
        """
        if registration and registration.strip():
            self.chat_registration += "\n" + registration.strip() + "\n"

    def has_specific_content(self) -> bool:
        """Check for chat specific content.

        Returns
        -------
        bool
            True if there's chat specific content.
        """
        return bool(
            self.chat_initiation.strip()
            or self.chat_prerequisites.strip()
            or self.chat_registration.strip()
        )

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute chat specific content.

        Parameters
        ----------
        result : ExportResult
            The export result to contribute to.
        """
        # Chat prerequisites go before the chat definition
        if self.chat_prerequisites:
            result.add_content(
                self.chat_prerequisites,
                ExportPosition.AGENTS,
                order=ContentOrder.LATE_CLEANUP,
                skip_strip=True,
            )

        # Chat initiation goes inside "def main()"
        if self.chat_initiation:
            result.add_content(
                self.chat_initiation,
                ExportPosition.CHATS,
                order=ContentOrder.MAIN_CONTENT,
                skip_strip=True,
            )

        # Chat registration goes after all agents are defined
        # (agent.register_nested_chat..))
        if self.chat_registration:
            result.add_content(
                self.chat_registration,
                ExportPosition.AGENTS,
                agent_position=AgentPosition.AFTER_ALL,
                order=ContentOrder.POST_CONTENT,
            )
