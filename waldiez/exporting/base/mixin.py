# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""The base exporter mixin."""

from typing import Any

from .utils import (
    CommentKey,
    comment,
    get_agent_llm_config_arg,
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
        instance: tuple[str, str],
        current_names: dict[str, str],
        prefix: str = "w",
        max_length: int = 64,
    ) -> dict[str, str]:
        """Get a valid instance name.

        Parameters
        ----------
        instance : tuple[str, str]
            The instance id and possible name.
        current_names : dict[str, str]
            The current names.
        prefix : str, optional
            The prefix for the instance name, by default "w".
        max_length : int, optional
            The maximum length of the variable name, by default 64

        Returns
        -------
        dict[str, str]
            The updated dictionary of current names.
        """
        return get_valid_instance_name(
            instance=instance,
            current_names=current_names,
            prefix=prefix,
            max_length=max_length,
        )

    @staticmethod
    def get_agent_llm_config_arg(
        agent: Any,
        all_models: list[Any],
        model_names: dict[str, str],
        cache_seed: int | None,
        as_dict: bool | None = False,
        tabs: int = 1,
    ) -> str:
        """Get the string representation of the agent's llm config argument.

        Parameters
        ----------
        agent : Any
            The agent.
        all_models : list[Any]
            All the models in the flow.
        model_names : dict[str, str]
            A mapping of model ids to model names.
        cache_seed : int, optional
            The cache seed to use, by default None.
        as_dict : bool, optional
            Whether to return the argument as a dictionary, by default False.
        tabs : int, optional
            The number of tabs for indentation, by default 1.

        Returns
        -------
        str
            The agent's llm config argument to use.
        """
        return get_agent_llm_config_arg(
            agent=agent,
            all_models=all_models,
            model_names=model_names,
            cache_seed=cache_seed,
            as_dict=bool(as_dict),
            tabs=tabs,
        )
