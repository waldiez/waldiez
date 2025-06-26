# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Predefined YouTube search tool for Waldiez."""

import os
from typing import Any

from ._config import PredefinedToolConfig
from ._protocol import PredefinedTool


class YouTubeSearchToolImpl(PredefinedTool):
    """YouTube search tool for Waldiez."""

    @property
    def name(self) -> str:
        """Tool name."""
        return "youtube_search"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Search YouTube for a given query."

    @property
    def required_secrets(self) -> list[str]:
        """Required secrets/environment variables."""
        return ["YOUTUBE_API_KEY"]

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {}

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return ["ag2[google-search, openai]"]

    @property
    def tags(self) -> list[str]:
        """Tags for the tool, used for categorization."""
        return ["youtube", "search", "video", "reference"]

    @property
    def tool_imports(self) -> list[str]:
        """Imports required for the tool implementation."""
        return [
            "from autogen.tools.experimental import YoutubeSearchTool",
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
        os.environ["YOUTUBE_API_KEY"] = secrets.get("YOUTUBE_API_KEY", "")
        content = """
youtube_api_key = os.environ.get("YOUTUBE_API_KEY", "")
if not youtube_api_key:
    raise ValueError("YOUTUBE_API_KEY is required for YouTube search tool.")
youtube_tool = YoutubeSearchTool(
youtube_api_key=youtube_api_key,
)
"""
        return content


YouTubeSearchTool = YouTubeSearchToolImpl()
YouTubeSearchConfig = PredefinedToolConfig(
    name=YouTubeSearchTool.name,
    description=YouTubeSearchTool.description,
    required_secrets=YouTubeSearchTool.required_secrets,
    requirements=YouTubeSearchTool.requirements,
    tags=YouTubeSearchTool.tags,
    implementation=YouTubeSearchTool,
)
