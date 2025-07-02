# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.tool_data.*."""

import pytest

from waldiez.models.tool import WaldiezToolData


def test_waldiez_tool_data() -> None:
    """Test WaldiezToolData."""
    # Given
    content = "print('hello, world')"
    secrets = {"API_KEY": "api_key"}
    # When
    tool_data = WaldiezToolData(content=content, secrets=secrets)
    # Then
    assert tool_data.content == content
    assert tool_data.secrets == secrets

    # Given
    tool_data = WaldiezToolData(content=content)  # pyright: ignore
    # Then
    assert tool_data.content == content
    assert not tool_data.secrets

    with pytest.raises(ValueError):
        tool_data = WaldiezToolData()  # pyright: ignore
