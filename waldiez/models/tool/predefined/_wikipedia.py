# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Predefined Wikipedia search tool for Waldiez."""

from typing import Any

from ._protocol import PredefinedTool


class WikipediaSearchToolImpl(PredefinedTool):
    """Wikipedia search tool for Waldiez."""

    @property
    def name(self) -> str:
        """Tool name."""
        return "wikipedia_search"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Search Wikipedia for a given query and return the summary."

    @property
    def required_secrets(self) -> list[str]:
        """Required secrets/environment variables."""
        return []

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {
            "language": "en",
            "top_k": 3,
            "truncate": 4000,
            "verbose": False,
        }

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return ["ag2[wikipedia, openai]"]

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
        content = "wikipedia_query_run_tool = WikipediaQueryRunTool(\n"
        for key, value in self.kwargs.items():
            content += f"    {key}={value!r},\n"
        content += ")\n"
        return content


WikipediaSearchTool = WikipediaSearchToolImpl()
