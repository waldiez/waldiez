# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined Tavily search tool for Waldiez."""

from typing import Any

from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


class TavilySearchToolImpl(PredefinedTool):
    """Tavily search tool for Waldiez."""

    required_secrets: list[str] = ["TAVILY_API_KEY"]
    required_kwargs: dict[str, type] = {}

    @property
    def name(self) -> str:
        """Tool name."""
        return "tavily_search"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Search Tavily for a given query."

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {}

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return ["ag2[tavily]"]

    @property
    def tags(self) -> list[str]:
        """Tags for the tool, used for categorization."""
        return ["tavily", "search", "web"]

    @property
    def tool_imports(self) -> list[str]:
        """Imports required for the tool implementation."""
        return [
            "from autogen.tools.experimental import TavilySearchTool",
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
        missing: list[str] = []
        if not secrets.get("TAVILY_API_KEY"):
            missing.append("TAVILY_API_KEY")
        return missing

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
from autogen.agentchat import ReplyResult


def {self.name}(
    query: str,
    search_depth: str = "basic",
    topic: str = "general",
    include_answer: str = "basic",
    include_raw_content: bool = False,
    include_domains: list[str] = [],
    num_results: int = 5,
) -> ReplyResult:
    """Performs a search using the Tavily API and returns formatted results.

            Args:
                query: The search query string.
                search_depth: The depth of the search ('basic' or 'advanced'). Defaults to "basic".
                include_answer: Whether to include an AI-generated answer ('basic' or 'advanced'). Defaults to "basic".
                include_raw_content: Whether to include raw content in the results. Defaults to False.
                include_domains: A list of domains to include in the search. Defaults to [].
                num_results: The maximum number of results to return. Defaults to 5.

            Returns:
                A list of dictionaries, each containing 'title', 'link', and 'snippet' of a search result.

            Raises:
                ValueError: If the Tavily API key is not available.
    """
    tavily_api_key = os.environ.get("TAVILY_API_KEY", "")
    if not tavily_api_key:
        raise ValueError("TAVILY_API_KEY is required for Tavily search tool.")
    {self.name}_tool = TavilySearchTool(
        tavily_api_key=tavily_api_key,
    )
    result = {self.name}_tool(
        query=query,
        tavily_api_key=tavily_api_key,
        search_depth=search_depth,
        topic=topic,
        include_answer=include_answer,
        include_raw_content=include_raw_content,
        include_domains=include_domains,
        num_results=num_results,
    )
    return ReplyResult(message=f"{{result}}")
'''
        return content


# pylint: disable=invalid-name
TavilySearchTool = TavilySearchToolImpl()
TavilySearchConfig = PredefinedToolConfig(
    name=TavilySearchTool.name,
    description=TavilySearchTool.description,
    required_secrets=TavilySearchTool.required_secrets,
    required_kwargs=TavilySearchTool.required_kwargs,
    requirements=TavilySearchTool.requirements,
    tags=TavilySearchTool.tags,
    implementation=TavilySearchTool,
)
