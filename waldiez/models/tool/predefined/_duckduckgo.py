# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Predefined DuckDuckGo search tool for Waldiez."""

from typing import Any

from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


class DuckDuckGoSearchToolImpl(PredefinedTool):
    """DuckDuckGo search tool for Waldiez."""

    required_secrets: list[str] = []
    required_kwargs: dict[str, type] = {}

    @property
    def name(self) -> str:
        """Tool name."""
        return "duckduckgo_search"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Search DuckDuckGo for a given query."

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {}

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return ["ag2[duckduckgo]", "ddgs"]

    @property
    def tags(self) -> list[str]:
        """Tags for the tool, used for categorization."""
        return ["duckduckgo", "search", "web"]

    @property
    def tool_imports(self) -> list[str]:
        """Imports required for the tool implementation."""
        return [
            "from autogen.tools.experimental import DuckDuckGoSearchTool",
        ]

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
        # no secrets required for DuckDuckGo search tool
        return []

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
        # no keyword arguments required for DuckDuckGo search tool
        return []

    def get_content(
        self,
        secrets: dict[str, str],
        runtime_kwargs: dict[str, Any] | None = None,
    ) -> str:
        """Get content for the tool.

        Parameters
        ----------
        secrets : dict[str, str]
            Dictionary of secrets/environment variables.

        runtime_kwargs : dict[str, Any] | None, optional
            Runtime keyword arguments to customize the content generation.

        Returns
        -------
        str
            The content for the tool.
        """
        content = f'''
def {self.name}(query: str, num_results: int = 5) -> ReplyResult:
    """Perform a DuckDuckGo search and return formatted results.

    Args:
        query: The search query string.
        num_results: The maximum number of results to return. Defaults to 5.

    Returns:
        A list of dictionaries of the search results.
    """
    tool = DuckDuckGoSearchTool()
    result = tool(query=query, num_results=num_results)
    return ReplyResult(message=f"{{result}}")
'''
        return content


# pylint: disable=invalid-name
DuckDuckGoSearchTool = DuckDuckGoSearchToolImpl()
DuckDuckGoSearchConfig = PredefinedToolConfig(
    name=DuckDuckGoSearchTool.name,
    description=DuckDuckGoSearchTool.description,
    required_secrets=DuckDuckGoSearchTool.required_secrets,
    required_kwargs=DuckDuckGoSearchTool.required_kwargs,
    requirements=DuckDuckGoSearchTool.requirements,
    tags=DuckDuckGoSearchTool.tags,
    implementation=DuckDuckGoSearchTool,
)
