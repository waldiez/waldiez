# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined Perplexity AI search tool for Waldiez."""

from typing import Any

from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


class PerplexitySearchToolImpl(PredefinedTool):
    """Perplexity AI search tool for Waldiez."""

    required_secrets: list[str] = ["PERPLEXITY_API_KEY"]
    required_kwargs: dict[str, type] = {}
    kwarg_types: dict[str, type] = {
        "model": str,
        "max_tokens": int,
        "search_domain_filters": list,
    }

    @property
    def name(self) -> str:
        """Tool name."""
        return "perplexity_search"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Search Perplexity AI for a given query."

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {
            "model": "sonar",
            "max_tokens": 1000,
            "search_domain_filter": None,
        }

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return []

    @property
    def tags(self) -> list[str]:
        """Tags for the tool, used for categorization."""
        return ["perplexity", "search", "web"]

    @property
    def tool_imports(self) -> list[str]:
        """Imports required for the tool implementation."""
        return [
            "from autogen.tools.experimental import PerplexitySearchTool",
            "from autogen.tools.experimental.perplexity.perplexity_search import SearchResponse",
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
        missing_secrets: list[str] = []
        if not secrets.get("PERPLEXITY_API_KEY"):
            missing_secrets.append("PERPLEXITY_API_KEY")
        return missing_secrets

    # noinspection DuplicatedCode
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
        """
        for key, value in self.kwargs.items():
            if key in kwargs:  # pragma: no branch
                type_of = self.kwarg_types.get(key, str)
                # pylint: disable=broad-exception-caught
                # noinspection PyBroadException,TryExceptPass
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
            Content retrieved by the tool.
        """
        model = self.kwargs["model"]
        max_tokens = self.kwargs["max_tokens"]
        search_domain_filter = self.kwargs["search_domain_filter"]
        content = f'''

from autogen.agentchat import ReplyResult


def {self.name}(
    query: str,
    model: str = "{model}",
    max_tokens: int = {max_tokens},
    search_domain_filter: Optional[list[str]] = {search_domain_filter},
) -> ReplyResult:
    """Perform a Perplexity AI search and return formatted results.

    Args:
        query: The search query string.
        model: The model to use for the search. Defaults to "{model}".
        max_tokens: The maximum number of tokens to return. Defaults to {max_tokens}.
        search_domain_filter: List of domain filters for the search. Defaults to {search_domain_filter}.
    Returns:
        A list of dictionaries of the search results.
    """
    perplexity_api_key = os.environ.get("PERPLEXITY_API_KEY", "")
    if not perplexity_api_key:
        raise ValueError("PERPLEXITY_API_KEY is required for Perplexity search tool.")
    perplexity_search_tool = PerplexitySearchTool(
        api_key=perplexity_api_key,
        model=model,
        max_tokens=max_tokens,
        search_domain_filter=search_domain_filter,
    )
    result = perplexity_search_tool(query=query)
    return ReplyResult(message=f"{{result}}")
'''
        return content


# pylint: disable=invalid-name
PerplexitySearchTool = PerplexitySearchToolImpl()
PerplexitySearchConfig = PredefinedToolConfig(
    name=PerplexitySearchTool.name,
    description=PerplexitySearchTool.description,
    required_secrets=PerplexitySearchTool.required_secrets,
    required_kwargs=PerplexitySearchTool.required_kwargs,
    requirements=PerplexitySearchTool.requirements,
    tags=PerplexitySearchTool.tags,
    implementation=PerplexitySearchTool,
)
