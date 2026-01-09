# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined YouTube search tool for Waldiez."""

from typing import Any

from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


class YouTubeSearchToolImpl(PredefinedTool):
    """YouTube search tool for Waldiez."""

    required_secrets: list[str] = ["YOUTUBE_API_KEY"]
    required_kwargs: dict[str, type] = {
        "youtube_search_engine_id": str,
    }

    @property
    def name(self) -> str:
        """Tool name."""
        return "youtube_search"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Search YouTube for a given query."

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return {}

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return ["ag2[google-search]"]

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
def {self.name}(
    query: str,
    max_results: int = 5,
    include_video_details: bool = True,
) -> list[dict[str, Any]]:
    """Perform a YouTube search and return formatted results.

    Args:
        query: The search query string.
        max_results: The maximum number of results to return. Defaults to 5.
        include_video_details: Whether to include detailed video information. Defaults to True.

    Returns:
        A list of dictionaries of the search results.

    Raises:
        ValueError: If YOUTUBE_API_KEY is not set or if the search fails.
    """
    youtube_api_key = os.environ.get("YOUTUBE_API_KEY", "")
    if not youtube_api_key:
        raise ValueError("YOUTUBE_API_KEY is required for YouTube search tool.")
    youtube_search_tool = YoutubeSearchTool(
        youtube_api_key=youtube_api_key,
    )
    result = youtube_search_tool(
        query=query,
        youtube_api_key=youtube_api_key,
        max_results=max_results,
        include_video_details=include_video_details,
    )
    return ReplyResult(message=f"{{result}}")
'''
        return content


# pylint: disable=invalid-name
YouTubeSearchTool = YouTubeSearchToolImpl()
YouTubeSearchConfig = PredefinedToolConfig(
    name=YouTubeSearchTool.name,
    description=YouTubeSearchTool.description,
    required_secrets=YouTubeSearchTool.required_secrets,
    required_kwargs=YouTubeSearchTool.required_kwargs,
    requirements=YouTubeSearchTool.requirements,
    tags=YouTubeSearchTool.tags,
    implementation=YouTubeSearchTool,
)
