# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Predefined tool protocol definition for Waldiez."""

# pyright: reportReturnType=false
from typing import Protocol, runtime_checkable


@runtime_checkable
class PredefinedTool(Protocol):
    """Protocol for predefined tools in Waldiez."""

    @property
    def name(self) -> str:
        """Tool name."""

    @property
    def description(self) -> str:
        """Tool description."""

    @property
    def required_secrets(self) -> list[str]:
        """Required secrets/environment variables."""

    @property
    def kwargs(self) -> dict[str, str]:
        """Keyword arguments for the tool, used for initialization."""

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""

    @property
    def tags(self) -> list[str]:
        """Tags for the tool, used for categorization."""

    @property
    def tool_imports(self) -> list[str]:
        """Imports required for the tool implementation."""

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
