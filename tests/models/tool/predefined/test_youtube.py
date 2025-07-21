# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.predefined._youtube."""

from waldiez.models.tool.predefined._youtube import YouTubeSearchToolImpl


def test_youtube_search_tool_impl() -> None:
    """Test YouTubeSearchToolImpl properties."""
    tool = YouTubeSearchToolImpl()
    assert "YOUTUBE_API_KEY" in tool.required_secrets
    assert tool.required_kwargs == {"youtube_search_engine_id": str}
    assert tool.get_content({})
