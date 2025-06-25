# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Predefined tool configuration for Waldiez."""

from dataclasses import dataclass

from ._protocol import PredefinedTool


@dataclass
class PredefinedToolConfig:
    """Configuration for a predefined tool."""

    name: str
    description: str
    required_secrets: list[str]
    requirements: list[str]
    tags: list[str]
    implementation: PredefinedTool

    def validate_secrets(self, secrets: dict[str, str]) -> list[str]:
        """Validate secrets and return list of missing required ones.

        Parameters
        ----------
        secrets : dict[str, str]
            Dictionary of secrets/environment variables.

        Returns
        -------
        list[str]
            List of missing required secrets.
        """
        return self.implementation.validate_secrets(secrets)

    def get_content(
        self,
        secrets: dict[str, str],
    ) -> str:
        """Get the content of the tool.

        Parameters
        ----------
        secrets : dict[str, str]
            Dictionary of secrets/environment variables.

        Returns
        -------
        str
            Content of the tool.
        """
        return self.implementation.get_content(secrets)
