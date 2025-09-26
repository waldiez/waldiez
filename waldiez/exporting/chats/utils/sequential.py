# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Utility functions for exporting sequential chats."""

from typing import Callable

from waldiez.models import (
    WaldiezAgentConnection,
    WaldiezChatMessage,
    WaldiezRagUserProxy,
)

from .common import get_chat_message_string, get_event_handler_string


def export_sequential_chat(
    main_chats: list[WaldiezAgentConnection],
    chat_names: dict[str, str],
    agent_names: dict[str, str],
    serializer: Callable[..., str],
    tabs: int,
    is_async: bool,
    skip_cache: bool,
) -> tuple[str, str]:
    """Get the chats content, when there are more than one chats in the flow.

    Parameters
    ----------
    main_chats : list[WaldiezAgentConnection]
        The main chats.
    chat_names : dict[str, str]
        A mapping of chat id to chat name.
    agent_names : dict[str, str]
        A mapping of agent id to agent name.
    serializer : Callable[..., str]
        The serializer function to escape quotes in a string.
    tabs : int
        The number of tabs to use for indentation.
    is_async : bool
        Whether the chat is asynchronous.
    skip_cache : bool
        Whether to skip the cache argument.

    Returns
    -------
    tuple[str, str]
        The main chats content and additional methods string if any.
    """
    tab = "    " * tabs if tabs > 0 else ""
    content = "\n"
    additional_methods_string = ""
    sender = main_chats[0]["source"]
    content += _get_initiate_chats_line(
        tab=tab,
        is_async=is_async,
        sender=agent_names[sender.id],
    )
    for idx, connection in enumerate(main_chats):
        chat_string, additional_methods = _get_chat_dict_string(
            is_first=idx == 0,
            chat_names=chat_names,
            connection=connection,
            agent_names=agent_names,
            serializer=serializer,
            tabs=tabs + 1,
            skip_cache=skip_cache,
        )
        additional_methods_string += additional_methods
        content += "\n" + f"{tab}    {chat_string}"
    content += "\n" + "    " * tabs + "])\n"
    content += get_event_handler_string(space=tab, is_async=is_async)
    return content, additional_methods_string


# noinspection PyTypeChecker
def _get_chat_dict_string(
    connection: WaldiezAgentConnection,
    is_first: bool,
    chat_names: dict[str, str],
    agent_names: dict[str, str],
    serializer: Callable[..., str],
    tabs: int,
    skip_cache: bool,
) -> tuple[str, str]:
    """Get a chat dictionary string.

    If the chat message is a separate method and not a string or a lambda,
    we return the method string (definition and body) as well as the rest
    of the arguments.

    Parameters
    ----------
    is_first : bool
        Whether this is the first chat in the sequence.
    connection : WaldiezAgentConnection
        The connection object containing the chat and agents.
    chat_names : dict[str, str]
        A mapping of chat id to chat name.
    agent_names : dict[str, str]
        A mapping of agent id to agent name.
    serializer : Callable[[str], str]
        The function to serialize the dictionaries or lists.
    tabs : int
        The number of tabs to use for indentation.
    skip_cache : bool
        Whether to skip the cache argument.

    Returns
    -------
    tuple[str, str]
        The chat dictionary string and additional methods string if any.
    """
    tab = "    " * tabs
    chat = connection["chat"]
    sender = connection["source"]
    chat_string = _get_chat_string_start(
        connection=connection,
        is_first=is_first,
        agent_names=agent_names,
        serializer=serializer,
        tabs=tabs,
        skip_cache=skip_cache,
    )
    if (
        sender.is_rag_user
        and isinstance(sender, WaldiezRagUserProxy)
        and chat.message.type == "rag_message_generator"
    ):
        message = f"{agent_names[sender.id]}.message_generator"
        chat_string += "\n" + f'{tab}    "message": {message},'
        chat_string += "\n" + tab + "},"
        return chat_string, ""
    additional_methods_string = ""
    message, method_content = get_chat_message_string(
        sender=sender,
        chat=chat,
        chat_names=chat_names,
    )
    if message and isinstance(chat.data.message, WaldiezChatMessage):
        if chat.data.message.type == "method":
            if method_content:
                additional_methods_string += "\n" + method_content
            chat_string += "\n" + f'{tab}    "message": {message},'
        elif chat.data.message.type == "string" and chat.data.message.content:
            chat_string += "\n" + f'{tab}    "message": {message},'
    chat_string += "\n" + tab + "},"
    return chat_string, additional_methods_string


def _get_chat_string_start(
    connection: WaldiezAgentConnection,
    is_first: bool,
    agent_names: dict[str, str],
    serializer: Callable[..., str],
    tabs: int,
    skip_cache: bool,
) -> str:
    tab = "    " * tabs
    chat = connection["chat"]
    sender = connection["source"]
    recipient = connection["target"]
    chat_args = chat.get_chat_args(for_queue=True, sender=sender)
    # chat_args = update_summary_chat_args(chat_args)
    chat_string = "{"
    if not is_first:
        chat_string += "\n" + f'{tab}    "sender": {agent_names[sender.id]},'
    chat_string += "\n" + f'{tab}    "recipient": {agent_names[recipient.id]},'
    if not skip_cache:
        chat_string += "\n" + f'{tab}    "cache": cache,'
    # additional_methods_string = ""
    for key, value in chat_args.items():
        if isinstance(value, (dict, str)):
            chat_string += (
                "\n" + f'{tab}    "{key}": {serializer(value, tabs=tabs + 1)},'
            )
        else:
            chat_string += "\n" + f'{tab}    "{key}": {value},'
    return chat_string


def _get_initiate_chats_line(
    tab: str,
    is_async: bool,
    sender: str,
) -> str:
    """Get the initiate chats line.

    Parameters
    ----------
    tab : str
        The tab string.
    is_async : bool
        Whether the chat is asynchronous.
    sender : str
        The sender that starts the chat.

    Returns
    -------
    str
        The initiate chats line.
    """
    results_is = f"{tab}results = "
    initiate = f"{sender}.sequential_run"
    if is_async:
        results_is += "await "
        initiate = f"{sender}.a_sequential_run"
    return results_is + initiate + "(["
