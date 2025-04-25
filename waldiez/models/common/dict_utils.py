# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Dictionary related utilities."""

from typing import Any, Dict


def update_dict(original: Dict[str, Any]) -> Dict[str, Any]:
    """

    Try to determine the type of the dictionary values.

    Parameters
    ----------
    original : Dict[str, Any]
        The original dictionary.

    Returns
    -------
    Dict[str, Any]
        The updated dictionary with values converted to the detected types.
    """
    new_dict: Dict[str, Any] = {}
    for key, value in original.items():
        value_lower = str(value).lower()
        if value_lower in ("none", "null"):
            new_dict[key] = None
        elif value_lower in ("true", "false"):
            new_dict[key] = value_lower == "true"
        elif str(value).isdigit():
            new_dict[key] = int(value)
        elif str(value).replace(".", "").isdigit():
            try:
                new_dict[key] = float(value)
            except ValueError:  # pragma: no cover
                new_dict[key] = value
        else:
            new_dict[key] = value
    return new_dict
