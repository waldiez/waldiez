# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""RAG related extras."""

from dataclasses import dataclass, field

from waldiez.exporting.core.result import ExportResult

from ...enums import AgentPosition, ExportPosition
from .standard_extras import StandardExtras


@dataclass
class RAGUserExtras(StandardExtras):
    """RAG configuration."""

    before_content: str = ""
    imports: set[str] = field(default_factory=set)

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute RAG specific content to the export result."""
        if self.extra_args:
            for arg in self.extra_args:
                result.add_instance_argument(
                    name=arg.name,
                    value=arg.value,
                    instance_id=arg.instance_id,
                    tabs=arg.tabs,
                )
        if self.imports:
            for imp in self.imports:
                result.add_import(imp)
        if self.before_content.strip():
            result.add_content(
                self.before_content,
                position=ExportPosition.AGENTS,
                agent_position=AgentPosition.BEFORE,
                agent_id=self.instance_id,
            )

    def has_specific_content(self) -> bool:
        """Check if there's any RAG content.

        Returns
        -------
        bool
            True if there's any RAG configuration.
        """
        if not super().has_specific_content():
            return bool(
                self.extra_args or self.before_content.strip() or self.imports
            )
        return True
