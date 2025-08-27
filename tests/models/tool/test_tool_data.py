# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.tool_data.*."""

import pytest

from waldiez.models.tool import WaldiezToolData


# noinspection PyArgumentList
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
    tool_data = WaldiezToolData(content=content, secrets={})  # pyright: ignore
    # Then
    assert tool_data.content == content
    assert not tool_data.secrets

    with pytest.raises(ValueError):
        _ = WaldiezToolData()  # pyright: ignore


def test_serialize_tool_data() -> None:
    """Test serialization of WaldiezToolData."""
    # Given
    content = "print('hello, world')"
    secrets = {"API_KEY": "api_key"}
    tool_data = WaldiezToolData(content=content, secrets=secrets)
    # When
    serialized_data = tool_data.model_dump(by_alias=True)
    # Then
    assert serialized_data["content"] == content
    assert serialized_data["secrets"] == secrets
    assert serialized_data["toolType"] == "custom"

    # When
    serialized_data = tool_data.model_dump(by_alias=False)
    # Then
    assert serialized_data["kwargs"] == {}
    assert serialized_data["tool_type"] == "custom"
