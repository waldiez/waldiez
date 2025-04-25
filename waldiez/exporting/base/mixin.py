# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""The base exporter mixin."""

from typing import Any, Dict, Tuple

from .utils import (
    CommentKey,
    comment,
    get_comment,
    get_escaped_string,
    get_item_string,
    get_path_string,
    get_valid_instance_name,
)


class ExporterMixin:
    """Static methods to be used by the exporters."""

    @staticmethod
    def serializer(item: Any, tabs: int = 1) -> str:
        """Get the string representation of an item.

        Parameters
        ----------
        item : Any
            The item.
        tabs : int, optional
            The number of tabs for indentation, by default 1.
        Returns
        -------
        str
            The string representation of the item.
        """
        return get_item_string(item=item, tabs=tabs)

    @staticmethod
    def path_resolver(path: str) -> str:
        """Get the path string.

        Parameters
        ----------
        path : str
            The path.

        Returns
        -------
        str
            The path string.
        """
        return get_path_string(path)

    @staticmethod
    def string_escape(string: str) -> str:
        """Get a string with escaped quotes and newlines.

        Parameters
        ----------
        string : str
            The original string.

        Returns
        -------
        str
            The escaped string.
        """
        return get_escaped_string(string)

    @staticmethod
    def get_comment(key: CommentKey, for_notebook: bool) -> str:
        """Get the comment string.

        Parameters
        ----------
        key : CommentKey
            The comment key.
        for_notebook : bool
            Whether the comment is for a notebook or not.
        Returns
        -------
        str
            The comment string.
        """
        return get_comment(key=key, for_notebook=for_notebook)

    @staticmethod
    def comment(for_notebook: bool, hashtags: int = 1) -> str:
        """Comment the text.

        Parameters
        ----------
        for_notebook : bool
            Whether the comment is for a notebook or not.
        hashtags : int, optional
            The number of hashtags (for notebooks), by default 1.

        Returns
        -------
        str
            The commented text.
        """
        return comment(for_notebook=for_notebook, hashtags=hashtags)

    @staticmethod
    def get_valid_instance_name(
        instance: Tuple[str, str],
        current_names: Dict[str, str],
        prefix: str = "w",
        max_length: int = 64,
    ) -> Dict[str, str]:
        """Get a valid instance name.

        Parameters
        ----------
        instance : Tuple[str, str]
            The instance id and possible name.
        current_names : Dict[str, str]
            The current names.
        prefix : str, optional
            The prefix for the instance name, by default "w".
        max_length : int, optional
            The maximum length of the variable name, by default 64
        Returns
        -------
        Dict[str, str]
            The updated dictionary of current names.
        """
        return get_valid_instance_name(
            instance=instance,
            current_names=current_names,
            prefix=prefix,
            max_length=max_length,
        )
