# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Utilities for converting items to strings.

To be used with dicts and/or lists.
"""

from typing import Any


def get_item_string(item: Any, tabs: int = 1) -> str:
    """Convert an item to a formatted string with given indentation.

    Parameters
    ----------
    item : Any
        The item to convert.
    tabs : int, optional
        The number of tabs, by default 1.

    Returns
    -------
    str
        The formatted string.

    Example
    -------
    ```python
    >>> obj = {"a": 1, "b": [1, 2, 3]}
    >>> get_item_string(obj)
    {
        "a": 1,
        "b": [
            1,
            2,
            3
        ]
    }
    >>> obj = {"a": 1, "b": [1, 2, 3], "c": {"d": 4}}
    >>> get_item_string(obj, 2)
    {
            "a": 1,
            "b": [
                1,
                2,
                3
            ],
            "c": {
                "d": 4
            }
    }
    ```
    """
    indent = " " * 4 * tabs  # Number of spaces corresponding to the tabs
    next_indent = (
        " " * 4 * (tabs + 1)
    )  # Number of spaces corresponding to the next tab level
    if isinstance(item, dict):
        items = []
        for key, value in item.items():
            items.append(
                f'{next_indent}"{key}": {get_item_string(value, tabs + 1)}'
            )
        # python3.10? f-string expression part cannot include a backslash
        items_string = ",\n".join(items)
        to_return = "\n" + items_string + "\n" + indent
        return f"{{{to_return}}}"
    if isinstance(item, list):
        items = []
        for sub_item in item:
            items.append(f"{next_indent}{get_item_string(sub_item, tabs + 1)}")
        # python3.10? f-string expression part cannot include a backslash
        items_string = ",\n".join(items)
        to_return = "\n" + items_string + "\n" + indent
        return f"[{to_return}]"

    if isinstance(item, str):
        if item.startswith("r'") or item.startswith('r"'):
            return item
        return f'"{item}"'

    if item is None:
        return "None"
    return str(item)
