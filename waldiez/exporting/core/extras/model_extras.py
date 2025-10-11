# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Agent specific extras module."""

from dataclasses import dataclass
from typing import Any

from waldiez.exporting.core.result import ExportResult

from ..enums import ContentOrder, ExportPosition
from .base import BaseExtras


@dataclass
class ModelExtras(BaseExtras):
    """Extras for model exporters."""

    llm_config: dict[str, Any] | None = None
    config_file_path: str = ""

    def set_llm_config(self, config: dict[str, Any]) -> None:
        """Set the LLM configuration.

        Parameters
        ----------
        config : dict[str, Any]
            The LLM configuration.
        """
        self.llm_config = config

    def set_config_file_path(self, path: str) -> None:
        """Set the configuration file path.

        Parameters
        ----------
        path : str
            The configuration file path.
        """
        self.config_file_path = path

    def get_content(self) -> str:
        """Get the content of the LLM configuration.

        Returns
        -------
        str
            The serialized LLM configuration.
        """
        if self.llm_config and "content" in self.llm_config:
            return self.llm_config["content"]
        return ""

    def has_specific_content(self) -> bool:
        """Check for model specific content.

        Returns
        -------
        bool
            True if there's model specific content.
        """
        if self.llm_config and "content" in self.llm_config:
            return bool(self.llm_config["content"])
        return False

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute model-specific content to the export result."""
        if self.llm_config and "content" in self.llm_config:
            result.add_content(
                self.llm_config["content"],
                ExportPosition.MODELS,
                order=ContentOrder.MAIN_CONTENT,
            )
