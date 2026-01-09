# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportUnknownVariableType=false
"""Dictionary related utilities."""

import ast
import json
import re
from typing import Any

BOOL_VALUES = {"true", "false"}
NULL_VALUES = {"none", "null", "nil", "undefined"}


def _strip_outer_quotes(value: str) -> str:
    """Remove outer quotes from a string if present."""
    value_stripped = value.strip()
    if (value_stripped.startswith('"') and value_stripped.endswith('"')) or (
        value_stripped.startswith("'") and value_stripped.endswith("'")
    ):
        return value_stripped[1:-1]
    return value_stripped


def _detect_null_or_boolean(value: str) -> bool | str | None:
    """
    Detect null values or booleans.

    Parameters
    ----------
    value : str
        The string value to check.

    Returns
    -------
    Union[None, bool, str]
        None for null values, bool for booleans, or original string if neither.
    """
    value_lower = value.lower()

    if value_lower in NULL_VALUES:
        return None
    if value_lower in BOOL_VALUES:
        return value_lower == "true"

    return value


def _detect_numeric_type(value: str) -> int | float | str:
    """
    Detect if string represents an integer or float.

    Parameters
    ----------
    value : str
        The string value to check.

    Returns
    -------
    Union[int, float, str]
        int for integers, float for floats, or original string if neither.
    """
    # Check for integer first (more specific)
    if re.fullmatch(r"[-+]?\d+", value):
        return int(value)

    # Try float conversion
    try:
        return float(value)
    except ValueError:
        return value


def _detect_container_type(
    value: str,
) -> dict[str, Any] | list[Any] | tuple[Any] | set[Any] | str:
    """
    Detect if string represents a container type (dict, list, tuple, set).

    Parameters
    ----------
    value : str
        The string value to check.

    Returns
    -------
    Union[dict[str, Any], list[Any], tuple[Any], set[Any], str]
        Parsed container or original string if not a container.
    """
    if not (value[0] in "{[(" and value[-1] in "}])"):
        return value

    # Handle empty containers
    if value in ("()", "[]", "{}"):
        return ast.literal_eval(value)

    # Try JSON first (expects double quotes)
    try:
        parsed = json.loads(value)
        if isinstance(parsed, (dict, list)):
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass

    # Fallback: Python literal (handles single quotes, tuples, sets)
    try:
        parsed = ast.literal_eval(value)
        if isinstance(parsed, (dict, list, tuple, set)):
            return parsed
    except (ValueError, SyntaxError):
        pass

    return value


def _convert_string_value(value: str) -> Any:
    """
    Convert a string value to its detected type.

    Parameters
    ----------
    value : str
        The string value to convert.

    Returns
    -------
    Any
        The converted value or original string if no conversion possible.
    """
    # Strip outer quotes if present
    cleaned_value = _strip_outer_quotes(value)

    # Skip conversion for empty strings
    if not cleaned_value:
        return value

    # Try conversions in order of specificity

    # 1. Container types (most specific structure)
    container_result = _detect_container_type(cleaned_value)
    if container_result != cleaned_value:
        return container_result

    # 2. Null and boolean values
    null_bool_result = _detect_null_or_boolean(cleaned_value)
    if null_bool_result != cleaned_value:
        return null_bool_result

    # 3. Numeric types
    numeric_result = _detect_numeric_type(cleaned_value)
    if numeric_result != cleaned_value:
        return numeric_result

    # 4. Keep as string if no conversion succeeded
    return cleaned_value


def update_dict(original: dict[str, Any]) -> dict[str, Any]:
    """
    Convert string values in a dictionary to their detected types.

    Automatically detects and converts strings that represent:
    - Boolean values (true/false)
    - Null values (none/null/nil/undefined)
    - Integers and floats
    - Container types (lists, dicts, tuples, sets)

    Parameters
    ----------
    original : dict[str, Any]
        The original dictionary with potentially string-encoded values.

    Returns
    -------
    dict[str, Any]
        A new dictionary with string values converted to their detected types.
        Non-string values are preserved unchanged.

    Examples
    --------
    >>> data = {"count": "42", "active": "true", "tags": "['a', 'b']"}
    >>> update_dict(data)
    {"count": 42, "active": True, "tags": ['a', 'b']}
    """
    converted_dict: dict[str, Any] = {}

    for key, value in original.items():
        # Only process string values
        if isinstance(value, str):
            converted_dict[key] = _convert_string_value(value)
        else:
            converted_dict[key] = value

    return converted_dict
