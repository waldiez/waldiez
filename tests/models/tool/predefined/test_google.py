# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.predefined.google.*."""

from waldiez.models.tool.predefined._google import GoogleSearchToolImpl


def test_google_search_tool_impl() -> None:
    """Test GoogleSearchToolImpl properties."""
    tool = GoogleSearchToolImpl()
    assert "GOOGLE_SEARCH_API_KEY" in tool.required_secrets
    assert tool.required_kwargs == {"google_search_engine_id": str}
    assert tool.get_content({})
