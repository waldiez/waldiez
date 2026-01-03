# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Predefined tool configuration for Waldiez."""

from dataclasses import dataclass
from typing import Any

from .protocol import PredefinedTool


@dataclass
class PredefinedToolConfig:
    """Configuration for a predefined tool."""

    name: str
    description: str
    required_secrets: list[str]
    required_kwargs: dict[str, type]
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

    def validate_kwargs(self, kwargs: dict[str, str]) -> list[str]:
        """Validate keyword arguments and return list of missing required ones.

        Parameters
        ----------
        kwargs : dict[str, str]
            Dictionary of keyword arguments.

        Returns
        -------
        list[str]
            List of missing required keyword arguments.
        """
        return self.implementation.validate_kwargs(kwargs)

    def get_content(
        self,
        secrets: dict[str, str],
        runtime_kwargs: dict[str, Any] | None = None,
    ) -> str:
        """Get the content of the tool.

        Parameters
        ----------
        secrets : dict[str, str]
            Dictionary of secrets/environment variables.
        runtime_kwargs : dict[str, Any] | None, optional
            Runtime keyword arguments to customize the content generation.

        Returns
        -------
        str
            Content of the tool.
        """
        return self.implementation.get_content(secrets, runtime_kwargs)
