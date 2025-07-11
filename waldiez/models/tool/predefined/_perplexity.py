# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Predefined Perplexity AI search tool for Waldiez."""

import os
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
            "search_domain_filters": None,
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
                try:
                    casted = type_of(value)
                    if key in self.kwargs:  # pragma: no branch
                        self.kwargs[key] = casted
                except Exception:  # pylint: disable=broad-except
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
        os.environ["PERPLEXITY_API_KEY"] = secrets.get("PERPLEXITY_API_KEY", "")
        content = f"""
perplexity_api_key = os.environ.get("PERPLEXITY_API_KEY", "")
if not perplexity_api_key:
    raise ValueError("PERPLEXITY_API_KEY is required for Perplexity search.")
{self.name} = PerplexitySearchTool(
    perplexity_api_key=perplexity_api_key,
    model="{self.kwargs["model"]}",
    max_tokens={self.kwargs["max_tokens"]},
"""
        if self.kwargs["search_domain_filters"] is not None:  # pragma: no cover
            domain_fileters = self.kwargs["search_domain_filters"]
            if isinstance(domain_fileters, list):
                content += f"    search_domain_filters={domain_fileters},\n"
        content += ")"
        return content


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
