# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.predefined._perplexity."""

# noinspection PyProtectedMember
from waldiez.models.tool.predefined._perplexity import PerplexitySearchToolImpl


def test_perplexity_search_tool_impl() -> None:
    """Test PerplexitySearchToolImpl properties."""
    tool = PerplexitySearchToolImpl()
    assert "PERPLEXITY_API_KEY" in tool.required_secrets
    assert not tool.required_kwargs
    assert tool.kwargs == {
        "model": "sonar",
        "max_tokens": 1000,
        "search_domain_filter": None,
    }
    assert tool.name == "perplexity_search"
    assert tool.description == "Search Perplexity AI for a given query."
    assert not tool.requirements
    assert tool.tags == ["perplexity", "search", "web"]
    assert tool.tool_imports == [
        "from autogen.tools.experimental import PerplexitySearchTool",
        (
            "from autogen.tools.experimental.perplexity.perplexity_search"
            " import SearchResponse"
        ),
    ]
    assert tool.get_content({"PERPLEXITY_API_KEY": "secret"})
