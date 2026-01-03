# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Agent specific extras module."""
# pylint: disable=too-few-public-methods

from dataclasses import dataclass

from ..enums import ContentOrder, ExportPosition
from ..result import ExportResult
from .base import BaseExtras


@dataclass
class ToolExtras(BaseExtras):
    """Extras for tool exporters."""

    function_content: str = ""
    registration_content: str = ""

    def add_function_content(self, content: str) -> None:
        """Add function definition content.

        Parameters
        ----------
        content : str
            The function content to add.
        """
        if content and content.strip():  # pragma: no branch
            if self.function_content:
                self.function_content += "\n\n" + content.rstrip()
            else:
                self.function_content = content.rstrip()
            while not self.function_content.endswith("\n\n"):
                self.function_content += "\n\n"

    def add_registration_content(self, content: str) -> None:
        """Add function registration content.

        Parameters
        ----------
        content : str
            The registration content to add.
        """
        if content and content.strip():  # pragma: no branch
            self.registration_content += "\n" + content.rstrip() + "\n"

    def has_specific_content(self) -> bool:
        """Check for tool specific content.

        Returns
        -------
        bool
            True if there's tool specific content.
        """
        return bool(
            self.function_content.strip() or self.registration_content.strip()
        )

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute tool specific content.

        Parameters
        ----------
        result : ExportResult
            The export result to contribute to.
        """
        # Function definitions go in TOOLS section
        if self.function_content:
            result.add_content(
                self.function_content,
                ExportPosition.TOOLS,
                order=ContentOrder.PRE_CONTENT,
            )

        # Registration content goes after agents
        if self.registration_content:
            result.add_content(
                self.registration_content,
                ExportPosition.AGENTS,
                # After agents but before handoffs
                order=ContentOrder.CLEANUP,
            )
