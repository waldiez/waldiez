# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Predefined tool protocol definition for Waldiez."""

# pyright: reportReturnType=false
from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class PredefinedTool(Protocol):
    """Protocol for predefined tools in Waldiez."""

    required_secrets: list[str]
    required_kwargs: dict[str, type]

    @property
    def name(self) -> str:
        """Tool name."""

    @property
    def description(self) -> str:
        """Tool description."""

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

    def validate_kwargs(self, kwargs: dict[str, Any]) -> list[str]:
        """Validate keyword arguments and return list of missing required ones.

        Parameters
        ----------
        kwargs : dict[str, Any]
            Dictionary of keyword arguments.

        Returns
        -------
        list[str]
            List of missing required keyword arguments.

        Raises
        ------
        ValueError
            If any required keyword arguments are missing or of incorrect type.
        """
