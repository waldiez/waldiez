# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=line-too-long
"""Utilities for exporting a single chat in a flow."""

import json
from typing import Any, Callable

from waldiez.models import (
    WaldiezAgent,
    WaldiezChat,
    WaldiezChatMessage,
    WaldiezRagUserProxy,
)

from .common import get_chat_message_string, get_event_handler_string


# pylint: disable=too-many-arguments,too-many-positional-arguments
def export_single_chat(
    sender: WaldiezAgent,
    recipient: WaldiezAgent,
    chat: WaldiezChat,
    message_kwarg: tuple[str, str],
    message_override: str | None,
    agent_names: dict[str, str],
    chat_names: dict[str, str],
    serializer: Callable[[str], str],
    tabs: int,
    is_async: bool,
    skip_cache: bool,
    tab_length: int = 4,
) -> tuple[str, str]:
    """Get the chat string when there is only one chat in the flow.

    Parameters
    ----------
    sender : WaldiezAgent
        The sender.
    recipient : WaldiezAgent
        The recipient.
    chat : WaldiezChat
        The chat.
    message_kwarg : tuple[str, str]
        The message kwarg and the var to use for it.
    message_override : str | None
        Optional initial message to pass (override flow's message if needed)
    agent_names : dict[str, str]
        A mapping of agent id to agent name.
    chat_names : dict[str, str]
        A mapping of chat id to chat name.
    serializer : Callable[[str], str]
        The serializer function to escape quotes in a string.
    tabs : int
        The number of tabs to use for indentation.
    is_async : bool
        Whether the chat is asynchronous.
    skip_cache : bool
        Whether to skip the cache argument.
    tab_length : int, optional
        The length of the tab string, by default 4.

    Returns
    -------
    tuple[str, str]
        The chat string and additional methods string if any
    """
    tab = " " * tab_length * tabs if tabs > 0 else ""
    chat_args = chat.get_chat_args(for_queue=False, sender=sender)
    if not chat_args:
        return get_empty_simple_chat_string(
            chat=chat,
            sender=sender,
            recipient=recipient,
            message_kwarg=message_kwarg,
            message_override=message_override,
            agent_names=agent_names,
            chat_names=chat_names,
            tab=tab,
            is_async=is_async,
            skip_cache=skip_cache,
        )
    return get_simple_chat_string(
        chat=chat,
        chat_args=chat_args,
        sender=sender,
        recipient=recipient,
        message_kwarg=message_kwarg,
        message_override=message_override,
        agent_names=agent_names,
        chat_names=chat_names,
        serializer=serializer,
        tabs=tabs,
        is_async=is_async,
        skip_cache=skip_cache,
    )


# pylint: disable=too-many-locals,too-many-arguments,too-many-positional-arguments
def get_simple_chat_string(
    chat: WaldiezChat,
    sender: WaldiezAgent,
    recipient: WaldiezAgent,
    message_kwarg: tuple[str, str],
    message_override: str | None,
    agent_names: dict[str, str],
    chat_names: dict[str, str],
    chat_args: dict[str, Any],
    serializer: Callable[..., str],
    tabs: int,
    is_async: bool,
    skip_cache: bool,
) -> tuple[str, str]:
    """Get the chat string when there are chat arguments.

    Parameters
    ----------
    chat : WaldiezChat
        The chat.
    sender : WaldiezAgent
        The sender.
    recipient : WaldiezAgent
        The recipient.
    message_kwarg : tuple[str, str]
        The message kwarg and the var to use for it.
    message_override : str | None
        Optional initial message to pass (override flow's message if needed)
    agent_names : dict[str, str]
        A mapping of agent id to agent name.
    chat_names : dict[str, str]
        A mapping of chat id to chat name.
    chat_args : dict[str, Any]
        The chat arguments.
    serializer : Callable[[str], str]
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
        The chat string and additional methods string if any.
    """
    message_arg, message_var = message_kwarg
    tab = "    " * tabs
    sender_name = agent_names[sender.id]
    initiate = "run"
    if is_async:
        sender_name = f"await {sender_name}"
        initiate = "a_run"
    initiate += "_iter"
    recipient_name = agent_names[recipient.id]
    chat_string = "\n" + f"{tab}results = {sender_name}.{initiate}(" + "\n"
    chat_string += f"{tab}    {recipient_name},"
    if not skip_cache:
        chat_string += "\n" + f"{tab}    cache=cache,"
    for key, value in chat_args.items():
        if key == message_arg:
            chat_string += "\n" + f"{tab}    {key}={message_var},"
            continue
        if isinstance(value, str):
            chat_string += "\n" + f'{tab}    {key}="{value}",'
        elif isinstance(value, dict):
            chat_string += (
                "\n" + f"{tab}    {key}={serializer(value, tabs=tabs + 1)},"
            )
        else:
            chat_string += "\n" + f"{tab}    {key}={value},"
    message_arg, before_chat = _get_chat_message(
        tab=tab,
        chat=chat,
        chat_names=chat_names,
        sender=sender,
        sender_name=sender_name,
        message_kwarg=message_kwarg,
        message_override=message_override,
    )
    chat_string += message_arg
    summary_arg, before_summary = _get_chat_summary(
        tab=tab,
        chat=chat,
        chat_names=chat_names,
    )
    chat_string += summary_arg
    chat_string += "\n" + f"{tab})" + "\n"
    chat_string += get_event_handler_string(space=tab, is_async=is_async)
    if before_summary:
        before_chat += "\n" + before_summary
    return chat_string, before_chat


def get_empty_simple_chat_string(
    chat: WaldiezChat,
    sender: WaldiezAgent,
    recipient: WaldiezAgent,
    message_kwarg: tuple[str, str],
    message_override: str | None,
    agent_names: dict[str, str],
    chat_names: dict[str, str],
    tab: str,
    is_async: bool,
    skip_cache: bool,
) -> tuple[str, str]:
    """Get the chat string when there are no chat arguments.

    Parameters
    ----------
    chat : WaldiezChat
        The chat.
    sender : WaldiezAgent
        The sender.
    recipient : WaldiezAgent
        The recipient.
    message_kwarg : tuple[str, str]
        The message kwarg and the var to use for it.
    message_override : str | None
        Optional initial message to pass (override flow's message if needed)
    agent_names : dict[str, str]
        A mapping of agent id to agent name.
    chat_names : dict[str, str]
        A mapping of chat id to chat name.
    tab : str
        The tab string.
    is_async : bool
        Whether the chat is asynchronous.
    skip_cache : bool
        Whether to skip the cache argument.

    Returns
    -------
    tuple[str, str]
        The chat string and additional methods string if any
    """
    sender_name = agent_names[sender.id]
    if is_async:
        sender_name = f"await {sender_name}"
    recipient_name = agent_names[recipient.id]
    initiate = "a_run_iter" if is_async else "run_iter"
    content = "\n" + f"{tab}results = {sender_name}.{initiate}(" + "\n"
    content += f"{tab}    {recipient_name}," + "\n"
    if not skip_cache:
        content += f"{tab}    cache=cache," + "\n"
    message_arg, before_message = _get_chat_message(
        tab=tab,
        chat=chat,
        chat_names=chat_names,
        sender=sender,
        sender_name=sender_name,
        message_kwarg=message_kwarg,
        message_override=message_override,
    )
    content += message_arg
    summary_arg, before_summary = _get_chat_summary(
        tab=tab,
        chat=chat,
        chat_names=chat_names,
    )
    content += summary_arg
    content += f"{tab})" + "\n"
    content += get_event_handler_string(space=tab, is_async=is_async)
    before_chat = before_message + before_summary
    return content, before_chat


def _get_chat_message(
    tab: str,
    chat: WaldiezChat,
    chat_names: dict[str, str],
    sender: WaldiezAgent,
    sender_name: str,
    message_kwarg: tuple[str, str],
    message_override: str | None,
) -> tuple[str, str]:
    """Get the chat message string.

    Parameters
    ----------
    tab : str
        The tab string.
    chat : WaldiezChat
        The chat.
    chat_names : dict[str, str]
        A mapping of chat id to chat name.
    sender : WaldiezAgent
        The sender.
    sender_name : str
        The sender name.
    message_kwarg : tuple[str, str]
        The message kwarg and the var to use for it.
    message_override : str | None
        Optional initial message to pass (override flow's message if needed)

    Returns
    -------
    tuple[str, str]
        The message argument and additional methods string if any.
    """
    before_chat = ""
    message_arg, message_var = message_kwarg
    message_arg_var = "\n" + f"{tab}    {message_arg}={message_var},"
    if message_override:
        before_chat = f"{message_var} = {json.dumps(message_override)}"
        return message_arg_var, before_chat
    if (
        sender.is_rag_user
        and isinstance(sender, WaldiezRagUserProxy)
        and chat.message.type == "rag_message_generator"
        and chat.message.use_carryover is False
    ):
        before_chat = f"{message_var}={sender_name}.message_generator"
        return message_arg_var, before_chat
    message_value, method_content = get_chat_message_string(
        sender=sender,
        chat=chat,
        chat_names=chat_names,
    )
    if message_value and isinstance(chat.data.message, WaldiezChatMessage):
        if chat.data.message.type in ("method", "rag_message_generator"):
            before_chat = method_content if method_content else ""
            before_chat += "\n"
            before_chat += f"{message_var}={message_value}"
            return message_arg_var, before_chat
        if chat.message.type == "string" and chat.data.message.content:
            before_chat += f"{message_var}={message_value}"
            return message_arg_var, before_chat
        if chat.message.type == "none":
            before_chat += f"{message_var}=None"
            return message_arg_var, before_chat
    return "", before_chat  # pragma: no cover


def _get_chat_summary(
    tab: str,
    chat: WaldiezChat,
    chat_names: dict[str, str],
) -> tuple[str, str]:
    """Get the chat summary string.

    Parameters
    ----------
    tab : str
        The tab string.
    chat : WaldiezChat
        The chat.
    chat_names : dict[str, str]
        A mapping of chat id to chat name.

    Returns
    -------
    tuple[str, str]
        The message argument and additional methods string if any.
    """
    before_summary = ""
    summary_arg = ""
    if chat.summary.method == "custom":
        chat_name = chat_names[chat.id]
        summary_source, summary_value = chat.get_summary_function(
            name_suffix=chat_name,
        )
        if summary_value and summary_source:
            summary_arg = "\n" + f"{tab}    summary_method={summary_value},"
            before_summary = summary_source

    return summary_arg, before_summary  # pragma: no cover
