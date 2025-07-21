# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.predefined._tavily."""

from waldiez.models.tool.predefined._tavily import TavilySearchToolImpl


def test_tavily_search_tool_impl() -> None:
    """Test TavilySearchToolImpl properties."""
    tool = TavilySearchToolImpl()
    assert "TAVILY_API_KEY" in tool.required_secrets
    assert not tool.required_kwargs
    assert tool.get_content({})
