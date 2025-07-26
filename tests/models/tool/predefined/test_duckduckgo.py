# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.predefined._duckduckgo."""

# noinspection PyProtectedMember
from waldiez.models.tool.predefined._duckduckgo import DuckDuckGoSearchToolImpl


def test_duckduckgo_search_tool_impl() -> None:
    """Test DuckDuckGoSearchToolImpl properties."""
    tool = DuckDuckGoSearchToolImpl()
    assert not tool.required_secrets
    assert not tool.required_kwargs
    assert not tool.kwargs
    assert tool.name == "duckduckgo_search"
    assert tool.description == "Search DuckDuckGo for a given query."
    assert tool.requirements == ["ag2[duckduckgo]", "ddgs"]
    assert tool.tags == ["duckduckgo", "search", "web"]
    assert tool.tool_imports == [
        "from autogen.tools.experimental import DuckDuckGoSearchTool"
    ]
    assert tool.get_content({})
