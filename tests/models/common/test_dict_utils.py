# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.common.dict_utils.*."""

from typing import Any

import pytest

from waldiez.models.common.dict_utils import update_dict


@pytest.mark.parametrize(
    "original,expected",
    [
        ({"a": "42"}, {"a": 42}),
        ({"a": "  -42  "}, {"a": -42}),
        ({"a": "+13"}, {"a": 13}),
        ({"a": "3.14"}, {"a": 3.14}),
        ({"a": "  2.7e-3 "}, {"a": 0.0027}),
        ({"a": "true"}, {"a": True}),
        ({"a": "False"}, {"a": False}),
        ({"a": "None"}, {"a": None}),
        ({"a": "null"}, {"a": None}),
        ({"a": "nil"}, {"a": None}),
        ({"a": "undefined"}, {"a": None}),
        ({"a": '"True"'}, {"a": True}),  # unquoted first, then converted
        ({"a": "'123'"}, {"a": 123}),
        ({"a": "'some text'"}, {"a": "some text"}),
        ({"a": '"  spaced  "'}, {"a": "  spaced  "}),
        ({"a": "  "}, {"a": "  "}),  # whitespace-only remains unchanged
        ({"a": "some text"}, {"a": "some text"}),  # no conversion
        (
            {"a": 1, "b": True},
            {"a": 1, "b": True},
        ),  # non-string values unchanged
    ],
)
def test_update_dict_conversion(
    original: dict[str, Any], expected: dict[str, Any]
) -> None:
    """Test update_dict function for various cases.

    Parameters
    ----------
    original : dict[str, Any]
        The original dictionary with string values to be converted.
    expected : dict[str, Any]
        The expected dictionary after conversion.
    """
    assert update_dict(original) == expected
