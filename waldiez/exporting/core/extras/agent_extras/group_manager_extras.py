# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Group manager agent specific extras module."""

from dataclasses import dataclass, field

from ...enums import (
    AgentPosition,
    ContentOrder,
    ExportPosition,
    GroupManagerStrategy,
    ImportPosition,
)
from ...result import ExportResult
from .standard_extras import StandardExtras


@dataclass
class GroupManagerExtras(StandardExtras):
    """Extras for group manager agents."""

    # Strategy determination
    strategy: GroupManagerStrategy = GroupManagerStrategy.PATTERN

    # Pattern-based content
    pattern_definition: str = ""
    pattern_class_name: str = "AutoPattern"
    pattern_imports: set[str] = field(default_factory=set)

    # Traditional GroupChat content
    group_chat_definition: str = ""
    group_chat_name: str = ""
    group_chat_argument: str = ""
    custom_speaker_selection: str = ""

    # Shared content
    context_variables_content: str = ""
    after_work_content: str = ""

    def has_specific_content(self) -> bool:
        """Check if group manager has specific content.

        Returns
        -------
        bool
            True if there is specific content for the group manager,
        """
        if not super().has_specific_content():
            return bool(
                self.pattern_definition.strip()
                or self.group_chat_definition.strip()
                or self.custom_speaker_selection.strip()
            )
        return True

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute group manager content to export.

        Parameters
        ----------
        result : ExportResult
            The export result to contribute to.
        """
        super()._contribute_specific_content(result)
        # Add pattern imports
        for import_stmt in self.pattern_imports:
            result.add_import(import_stmt, position=ImportPosition.THIRD_PARTY)

        # Add pattern definition or group chat definition
        if (
            self.strategy == GroupManagerStrategy.PATTERN
            and self.pattern_definition
        ):
            result.add_content(
                self.pattern_definition,
                ExportPosition.AGENTS,
                agent_position=AgentPosition.AFTER_ALL,
                order=ContentOrder.LATE_CLEANUP,
            )
        elif self.strategy == GroupManagerStrategy.TRADITIONAL:
            # Add custom speaker selection function first
            if self.custom_speaker_selection:
                result.add_content(
                    self.custom_speaker_selection,
                    ExportPosition.AGENTS,
                    agent_position=AgentPosition.AFTER_ALL,
                    order=ContentOrder.LATE_CLEANUP,
                )

            # Add group chat argument if specified
            if self.group_chat_argument:
                self.add_arg(self.group_chat_argument, tabs=1)

            # Add group chat definition
            if self.group_chat_definition:
                result.add_content(
                    self.group_chat_definition,
                    ExportPosition.AGENTS,
                    agent_position=AgentPosition.AFTER_ALL,
                    order=ContentOrder.LATE_CLEANUP.value - 1,
                )
