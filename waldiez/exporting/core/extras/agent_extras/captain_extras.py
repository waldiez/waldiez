# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Captain agent extras module."""

from dataclasses import dataclass
from typing import Any

from waldiez.exporting.core.result import ExportResult

from .standard_extras import StandardExtras


@dataclass
class CaptainExtras(StandardExtras):
    """Extras for captain agents."""

    nested_config: dict[str, Any] | None = None

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute captain specific content to the export result.

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

    def set_nested_config(self, config: dict[str, Any]) -> None:
        """Set the nested configuration.

        Parameters
        ----------
        config : Dict[str, Any]
            The nested configuration.
        """
        self.nested_config = config

    def has_specific_content(self) -> bool:
        """Check for captain specific content.

        Returns
        -------
        bool
            True if there's captain specific content.
        """
        if not super().has_specific_content():
            return bool(self.extra_args or self.nested_config)
        return True
