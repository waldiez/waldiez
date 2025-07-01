# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined Google search tool for Waldiez."""

import os
from typing import Any

from ._config import PredefinedToolConfig
from ._protocol import PredefinedTool


class GoogleSearchToolImpl(PredefinedTool):
    """Google search tool for Waldiez."""

    @property
    def name(self) -> str:
        """Tool name."""
        return "google_search"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Search Google for a given query."

    @property
    def required_secrets(self) -> list[str]:
        """Required secrets/environment variables."""
        return ["GOOGLE_SEARCH_ENGINE_ID", "GOOGLE_SEARCH_API_KEY"]

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {}

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return ["ag2[google-search,gemini,openai]"]

    @property
    def tags(self) -> list[str]:
        """Tags for the tool, used for categorization."""
        return ["google", "search", "web"]

    @property
    def tool_imports(self) -> list[str]:
        """Imports required for the tool implementation."""
        return [
            "from autogen.tools.experimental import GoogleSearchTool",
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
        for secret in self.required_secrets:
            if secret not in secrets:
                missing.append(secret)
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
        os.environ["GOOGLE_SEARCH_API_KEY"] = secrets.get(
            "GOOGLE_SEARCH_API_KEY", ""
        )
        os.environ["GOOGLE_SEARCH_ENGINE_ID"] = secrets.get(
            "GOOGLE_SEARCH_ENGINE_ID", ""
        )
        content = f"""
google_search_api_key = os.environ.get("GOOGLE_SEARCH_API_KEY", "")
if not google_search_api_key:
    raise ValueError("GOOGLE_SEARCH_API_KEY is required for Google search tool.")
google_search_engine_id = os.environ.get("GOOGLE_SEARCH_ENGINE_ID", "")
if not google_search_engine_id:
    raise ValueError("GOOGLE_SEARCH_ENGINE_ID is required for Google search tool.")
{self.name} = GoogleSearchTool(
    search_api_key=google_search_api_key,
    search_engine_id=google_search_engine_id,
)
"""
        return content


GoogleSearchTool = GoogleSearchToolImpl()
GoogleSearchConfig = PredefinedToolConfig(
    name=GoogleSearchTool.name,
    description=GoogleSearchTool.description,
    required_secrets=GoogleSearchTool.required_secrets,
    requirements=GoogleSearchTool.requirements,
    tags=GoogleSearchTool.tags,
    implementation=GoogleSearchTool,
)
