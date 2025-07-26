# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined SearxNG search tool for Waldiez."""

from typing import Any

from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


class SearxNGSearchToolImpl(PredefinedTool):
    """SearxNG search tool for Waldiez."""

    required_secrets: list[str] = []
    required_kwargs: dict[str, type] = {}
    kwarg_types: dict[str, type] = {
        "base_url": str,
    }

    @property
    def name(self) -> str:
        """Tool name."""
        return "searxng_search"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Search SearxNG for a given query."

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {
            "base_url": "https://searxng.site/search",
        }

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return []

    @property
    def tags(self) -> list[str]:
        """Tags for the tool, used for categorization."""
        return ["searxng", "search", "web"]

    @property
    def tool_imports(self) -> list[str]:
        """Imports required for the tool implementation."""
        return [
            "from autogen.tools.experimental import SearxngSearchTool",
        ]

    def validate_secrets(self, secrets: dict[str, str]) -> list[str]:
        """Validate secrets and return list of missing required ones.

        Parameters
        ----------
        secrets : dict[str, str]
            Dictionary of secrets to validate.

        Returns
        -------
        list[str]
            List of missing required secrets.
        """
        return []  # No secrets required for this tool.

    # noinspection DuplicatedCode
    def validate_kwargs(self, kwargs: dict[str, Any]) -> list[str]:
        """Validate keyword arguments and return list of missing required ones.

        Parameters
        ----------
        kwargs : dict[str, Any]
            Dictionary of keyword arguments to validate.

        Returns
        -------
        list[str]
            List of missing required keyword arguments.
        """
        for key, value in self.kwargs.items():
            if key in kwargs:  # pragma: no branch
                type_of = self.kwarg_types.get(key, str)
                # pylint: disable=broad-exception-caught
                # noinspection PyBroadException
                try:
                    casted = type_of(value)
                    if key in self.kwargs:  # pragma: no branch
                        self.kwargs[key] = casted
                except Exception:
                    pass
        return []

    def get_content(
        self,
        secrets: dict[str, str],
    ) -> str:
        """Get content for the tool.

        Parameters
        ----------
        secrets : dict[str, str]
            Dictionary of secrets/environment variables.

        Returns
        -------
        str
            Content retrieved by the tool.
        """
        content = f'''
def {self.name}(
        query: str,
        max_results: int = 5,
        categories: list[str] | None = None,
        language: str | None = None,
    ) -> list[dict[str, Any]]:
    """Perform a SearxNG search and return formatted results.

    Args:
        query: The search query string.
        max_results: The maximum number of results to return. Defaults to 5.
        categories: List of categories to search in.
        language: Language code (e.g., 'en-US').
        base_url: SearxNG instance URL.

    Returns:
        A list of dictionaries, each containing 'title', 'link', and 'snippet' of a search result.
    """
    tool = SearxngSearchTool(
        base_url="{self.kwargs["base_url"]}",
    )
    return tool(
        query=query,
        max_results=max_results,
        categories=categories,
        language=language,
    )
'''
        return content


SearxNGSearchTool = SearxNGSearchToolImpl()
SearxNGSearchConfig = PredefinedToolConfig(
    name=SearxNGSearchTool.name,
    description=SearxNGSearchTool.description,
    tags=SearxNGSearchTool.tags,
    requirements=SearxNGSearchTool.requirements,
    required_kwargs=SearxNGSearchTool.required_kwargs,
    required_secrets=SearxNGSearchTool.required_secrets,
    implementation=SearxNGSearchTool,
)
