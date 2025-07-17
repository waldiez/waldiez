# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.core.extras.serializer."""

from typing import Any

from waldiez.exporting.core.extras.serializer import DefaultSerializer


def test_default_serializer() -> None:
    """Test the DefaultSerializer's serialize method."""
    serializer = DefaultSerializer()
    item1: dict[str, Any] = {"a": 1, "b": [2, 3], "c": {"d": "test"}}
    result = serializer.serialize(item1)
    expected = """{
        "a": 1,
        "b": [
            2,
            3
        ],
        "c": {
            "d": "test"
        }
    }"""
    assert result == expected
    item2: list[Any] = [1, 2, {"key": "value"}, [3, 4]]
    result = serializer.serialize(item2)
    expected = """[
        1,
        2,
        {
            "key": "value"
        },
        [
            3,
            4
        ]
    ]"""
    assert result == expected

    item3: dict[str, Any] = {
        "key1": "value1",
        "key2": None,
        "key3": {"key4": "value4"},
    }
    result = serializer.serialize(item3)
    expected = """{
        "key1": "value1",
        "key2": None,
        "key3": {
            "key4": "value4"
        }
    }"""
    assert result == expected
    item4 = {"key": 'r"string"'}
    result = serializer.serialize(item4)
    expected = """{
        "key": r"string"
    }"""
    assert result == expected
    # Given
    item5 = {"key": 'r"string with \\"escaped quotes\\""'}
    result = serializer.serialize(item5)
    expected = """{
        "key": r"string with \\"escaped quotes\\""
    }"""
    assert result == expected

    # Test with circular reference
    item6: dict[str, Any] = {"key": "value"}
    item6["circular"] = item6
    result = serializer.serialize(item6)
    expected = """{
        "key": "value",
        "circular": "<circular reference>"
    }"""
    assert result == expected

    # Test with empty structures
    assert serializer.serialize({}) == "{}"
    assert serializer.serialize([]) == "[]"

    item7: tuple[str, int] = ("test", 123)
    result = serializer.serialize(item7)
    expected = """(
        "test",
        123
    )"""
    assert result == expected

    item8: set[str] = {"a", "b", "c"}
    result = serializer.serialize(item8)
    assert result.startswith("{") and result.endswith("}")
    assert "a" in result and "b" in result and "c" in result
