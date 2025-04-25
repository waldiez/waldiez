# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.base.utils.to_string.*."""

from waldiez.exporting.base.utils.to_string import get_item_string


# fmt: off
def test_get_item_string() -> None:
    """Test get_item_string."""
    # Given
    item1 = {
        "key1": "value1",
        "key2": ["value2", None],
        "key3": {"key4": "value4"},
    }
    # When
    result = get_item_string(item1, tabs=0)
    # Then
    excepted = """{
    "key1": "value1",
    "key2": [
        "value2",
        None
    ],
    "key3": {
        "key4": "value4"
    }
}"""
    assert result == excepted

    # Given
    item2 = {
        "key1": "value1",
        "key2": ["value2", "value3"],
        "key3": {"key4": "value4"},
    }
    # When
    result = get_item_string(item2, tabs=1)
    # Then
    excepted = """{
        "key1": "value1",
        "key2": [
            "value2",
            "value3"
        ],
        "key3": {
            "key4": "value4"
        }
    }"""
    assert result == excepted
    # Given
    item3 = ["value1", {"value2": {"key1": 4}}]
    # When
    result = get_item_string(item3, tabs=1)
    # Then
    excepted = """[
        "value1",
        {
            "value2": {
                "key1": 4
            }
        }
    ]"""

    assert result == excepted

    # Given
    item4 = {
        "key": 'r"string"'
    }
    # When
    result = get_item_string(item4, tabs=1)
    # Then
    excepted = """{
        "key": r"string"
    }"""
    assert result == excepted

# fmt: on
