# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Dictionary related utilities."""

import re
from typing import Any

BOOL_VALUES = {"true", "false"}
NULL_VALUES = {"none", "null", "nil", "undefined"}


def update_dict(original: dict[str, Any]) -> dict[str, Any]:
    """
    Try to determine the type of the dictionary values.

    Parameters
    ----------
    original : dict[str, Any]
        The original dictionary.

    Returns
    -------
    dict[str, Any]
        The updated dictionary with values converted to the detected types.
    """
    new_dict: dict[str, Any] = {}

    for key, value in original.items():
        # Skip conversion if already the desired type
        if not isinstance(value, str):
            new_dict[key] = value
            continue

        value_stripped = value.strip()
        if (
            value_stripped.startswith('"') and value_stripped.endswith('"')
        ) or (value_stripped.startswith("'") and value_stripped.endswith("'")):
            value_stripped = value_stripped[1:-1]
        if not value_stripped:  # Empty or whitespace-only
            new_dict[key] = value
            continue

        value_lower = value_stripped.lower()

        # Check for None/null
        if value_lower in NULL_VALUES:
            new_dict[key] = None
        # Check for boolean
        elif value_lower in BOOL_VALUES:
            new_dict[key] = value_lower == "true"
        # Check for integer
        elif re.fullmatch(r"[-+]?\d+", value_stripped):
            new_dict[key] = int(value_stripped)
        # Check for float
        else:
            try:
                # This handles floats, scientific notation, etc.
                float_val = float(value_stripped)
                new_dict[key] = float_val
            except ValueError:
                # Keep as string if conversion fails
                new_dict[key] = value_stripped

    return new_dict
