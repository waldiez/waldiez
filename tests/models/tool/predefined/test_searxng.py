# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.predefined._searxng."""

from waldiez.models.tool.predefined._searxng import SearxNGSearchToolImpl


def test_searxng_search_tool_impl() -> None:
    """Test SearxNGSearchToolImpl properties."""
    tool = SearxNGSearchToolImpl()
    assert not tool.required_secrets
    assert not tool.required_kwargs
    assert tool.kwargs == {
        "base_url": "https://searxng.site/search",
    }
    assert tool.name == "searxng_search"
    assert tool.description == "Search SearxNG for a given query."
    assert not tool.requirements
    assert tool.tags == ["searxng", "search", "web"]
    assert tool.tool_imports == [
        "from autogen.tools.experimental import SearxngSearchTool",
    ]
    assert tool.get_content({})
