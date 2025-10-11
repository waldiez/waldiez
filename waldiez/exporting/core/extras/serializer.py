# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-return-statements
# pyright: reportUnknownArgumentType=false,reportUnknownVariableType=false
"""serializer for converting items to formatted strings."""

import json
from typing import Any

from ..protocols import Serializer


# pylint: disable=too-few-public-methods,no-self-use
class DefaultSerializer(Serializer):
    """Default serializer for Waldiez items."""

    # noinspection PyProtocol
    def serialize(self, obj: Any, **kwargs: Any) -> str:
        """Serialize an item to a formatted string.

        Parameters
        ----------
        obj : Any
            The item to serialize.
        **kwargs : Any
            Additional keyword arguments, such as `tabs` for indentation level.

        Returns
        -------
        str
            The serialized string representation of the item.
        """
        tabs = kwargs.get("tabs", 1)
        return serialize_item(obj, tabs)


def serialize_item(
    item: Any,
    tabs: int = 1,
    visited: set[int] | None = None,
) -> str:
    """Convert an item to a formatted string with given indentation.

    Parameters
    ----------
    item : Any
        The item to convert.
    tabs : int, optional
        The number of tabs, by default 1.
    visited : set[int], optional
        A set of visited IDs, by default None

    Returns
    -------
    str
        The formatted string.

    Example
    -------
    ```python
    >>> obj = {"a": 1, "b": [1, 2, 3]}
    >>> serialize_item(obj)
    {
        "a": 1,
        "b": [
            1,
            2,
            3
        ]
    }
    >>> obj = {"a": 1, "b": [1, 2, 3], "c": {"d": 4}}
    >>> serialize_item(obj, 2)
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
    if visited is None:
        visited = set()

    if callable(item):
        return item.__name__

    # Handle primitives and preformatted literals
    if isinstance(item, (str, int, float, bool)) or item is None:
        return _format_primitive(item)

    # Handle circular references in containers
    if isinstance(item, (dict, list, tuple, set)) and id(item) in visited:
        return '"<circular reference>"'

    next_indent = " " * 4 * (tabs + 1)
    visited.add(id(item))

    if isinstance(item, dict):
        items: list[str] = []
        for key, value in item.items():
            key_str = f'{next_indent}"{key}"'
            value_str = serialize_item(value, tabs + 1, visited)
            items.append(f"{key_str}: {value_str}")
        return _format_container(items, "{", "}", tabs)

    if isinstance(item, list):
        items = [
            f"{next_indent}{serialize_item(sub_item, tabs + 1, visited)}"
            for sub_item in item
        ]
        return _format_container(items, "[", "]", tabs)

    if isinstance(item, tuple):
        items = [
            f"{next_indent}{serialize_item(sub_item, tabs + 1, visited)}"
            for sub_item in item
        ]
        return _format_container(items, "(", ")", tabs)

    if isinstance(item, set):
        items = [
            f"{next_indent}{serialize_item(sub_item, tabs + 1, visited)}"
            for sub_item in item
        ]
        return _format_container(items, "{", "}", tabs)

    # Fallback for unknown object types
    return repr(item)


def _format_primitive(item: Any) -> str:
    """Format a primitive or formatted literal for code-safe output."""
    if isinstance(item, str):
        if item.startswith("r'") or item.startswith('r"'):
            return item
        return json.dumps(item, ensure_ascii=False)
    return str(item)


def _format_container(
    items_list: list[str],
    open_char: str,
    close_char: str,
    tabs: int,
) -> str:
    """Format containers consistently with indentation."""
    indent = " " * 4 * tabs
    if not items_list:
        return f"{open_char}{close_char}"
    items_string = ",\n".join(items_list)
    return f"{open_char}\n{items_string}\n{indent}{close_char}"
