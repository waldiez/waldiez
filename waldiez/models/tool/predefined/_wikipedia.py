# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined Wikipedia search tool for Waldiez."""

from typing import Any

from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


class WikipediaSearchToolImpl(PredefinedTool):
    """Wikipedia search tool for Waldiez."""

    required_secrets: list[str] = []
    kwargs_types: dict[str, type] = {
        "language": str,
        "top_k": int,
        "verbose": bool,
    }
    required_kwargs: dict[str, type] = {}

    @property
    def name(self) -> str:
        """Tool name."""
        return "wikipedia_search"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Search Wikipedia for a given query."

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {
            "language": "en",
            "top_k": 3,
            "verbose": False,
        }

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return ["ag2[wikipedia]"]

    @property
    def tags(self) -> list[str]:
        """Tags for the tool, used for categorization."""
        return ["wikipedia", "search", "knowledge", "reference"]

    @property
    def tool_imports(self) -> list[str]:
        """Imports required for the tool implementation."""
        return [
            "from autogen.tools.experimental import WikipediaQueryRunTool",
            "from autogen.tools.experimental import WikipediaPageLoadTool",
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
        return []

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
            if key in kwargs:
                type_of = self.kwargs_types.get(key, str)
                # pylint: disable=broad-exception-caught
                # noinspection PyBroadException,TryExceptPass
                try:
                    casted = type_of(value)
                    if key in self.kwargs:
                        self.kwargs[key] = casted
                except Exception:
                    pass
        return []

    # pylint: disable=unused-argument
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
        content = f'''
def {self.name}(query: str, language: str = "en", top_k: int = 3, verbose: bool = False) -> Union[list[str], str]:
    """Search Wikipedia for a given query and return results.

    Args:
        query: The search query string.
        language: The language to search in (default: "en").
        top_k: The number of top results to return (default: 3).
        verbose: Whether to include additional information in the results (default: False).

    Returns
    -------
        Union[list[str], str]: A list of search results or a message if no results found.
    """
    tool = WikipediaQueryRunTool(
'''
        for key, value in self.kwargs.items():
            content += f"       {key}={value!r},\n"
        content += "    )\n"
        content += """
    result = tool(query=query)
    return ReplyResult(message=f"{result}")
"""
        return content


# pylint: disable=invalid-name
WikipediaSearchTool = WikipediaSearchToolImpl()
WikipediaSearchConfig = PredefinedToolConfig(
    name=WikipediaSearchTool.name,
    description=WikipediaSearchTool.description,
    required_secrets=WikipediaSearchTool.required_secrets,
    required_kwargs=WikipediaSearchTool.required_kwargs,
    requirements=WikipediaSearchTool.requirements,
    tags=WikipediaSearchTool.tags,
    implementation=WikipediaSearchTool,
)
