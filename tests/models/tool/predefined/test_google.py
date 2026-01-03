# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.predefined.google.*."""

# noinspection PyProtectedMember
from waldiez.models.tool.predefined._google import GoogleSearchToolImpl


def test_google_search_tool_impl() -> None:
    """Test GoogleSearchToolImpl properties."""
    tool = GoogleSearchToolImpl()
    assert "GOOGLE_SEARCH_API_KEY" in tool.required_secrets
    assert "GOOGLE_SEARCH_ENGINE_ID" in tool.required_secrets
    assert not tool.required_kwargs
    assert tool.get_content({})
