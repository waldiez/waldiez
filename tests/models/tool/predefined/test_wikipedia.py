# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.predefined._wikipedia."""

from waldiez.models.tool.predefined._wikipedia import WikipediaSearchToolImpl


def test_wikipedia_search_tool_impl() -> None:
    """Test WikipediaSearchToolImpl properties."""
    tool = WikipediaSearchToolImpl()
    assert not tool.required_secrets
    assert "language" in tool.kwargs_types
    assert "top_k" in tool.kwargs_types
    assert "verbose" in tool.kwargs_types
    assert tool.get_content({})
