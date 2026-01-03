# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Resoning agent extras module."""

from dataclasses import dataclass

from waldiez.exporting.core.result import ExportResult

from ...enums import AgentPosition, ExportPosition
from .standard_extras import StandardExtras


@dataclass
class ReasoningExtras(StandardExtras):
    """Extras for reasoning agents."""

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute reasoning specific content to the export result.

        Parameters
        ----------
        result : ExportResult
            The export result to contribute to.
        """
        super()._contribute_specific_content(result)
        if self.extra_args:
            for arg in self.extra_args:
                result.add_instance_argument(
                    name=arg.name,
                    value=arg.value,
                    instance_id=arg.instance_id,
                    tabs=arg.tabs,
                )
        if self.extra_imports:
            for imp in self.extra_imports:
                result.add_import(imp.statement, imp.position)
        if self.before_agent.strip():
            result.add_content(
                self.before_agent,
                position=ExportPosition.AGENTS,
                agent_position=AgentPosition.BEFORE,
                agent_id=self.instance_id,
            )
        if self.after_agent.strip():
            result.add_content(
                self.after_agent,
                position=ExportPosition.AGENTS,
                agent_position=AgentPosition.AFTER,
                agent_id=self.instance_id,
            )

    def has_specific_content(self) -> bool:
        """Check for reasoning specific content.

        Returns
        -------
        bool
            True if there's reasoning specific content.
        """
        if not super().has_specific_content():
            return bool(
                self.extra_args
                or self.extra_imports
                or self.before_agent.strip()
                or self.after_agent.strip()
            )
        return True
