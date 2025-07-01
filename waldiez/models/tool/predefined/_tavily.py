# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined Tavily search tool for Waldiez."""

import os
from typing import Any

from ._config import PredefinedToolConfig
from ._protocol import PredefinedTool


class TavilySearchToolImpl(PredefinedTool):
    """Tavily search tool for Waldiez."""

    @property
    def name(self) -> str:
        """Tool name."""
        return "tavily_search"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Search Tavily for a given query."

    @property
    def required_secrets(self) -> list[str]:
        """Required secrets/environment variables."""
        return ["TAVILY_API_KEY"]

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {}

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return ["ag2[tavily, openai]"]

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
        missing = []
        if not secrets.get("TAVILY_API_KEY"):
            missing.append("TAVILY_API_KEY")
        return missing

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
            The content for the tool.
        """
        os.environ["TAVILY_API_KEY"] = secrets.get(
            "TAVILY_API_KEY", os.environ.get("TAVILY_API_KEY", "")
        )
        content = f"""
tavily_api_key = os.environ.get("TAVILY_API_KEY", "")
if not tavily_api_key:
    raise ValueError("TAVILY_API_KEY is required for Tavily search tool.")
{self.name} = TavilySearchTool(
    tavily_api_key=tavily_api_key,
)
"""
        return content


TavilySearchTool = TavilySearchToolImpl()
TavilySearchConfig = PredefinedToolConfig(
    name=TavilySearchTool.name,
    description=TavilySearchTool.description,
    required_secrets=TavilySearchTool.required_secrets,
    requirements=TavilySearchTool.requirements,
    tags=TavilySearchTool.tags,
    implementation=TavilySearchTool,
)
