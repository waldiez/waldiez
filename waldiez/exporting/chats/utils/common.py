# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common utilities for exporting chats."""

from typing import Any, Callable, Dict, Optional, Tuple

from waldiez.models import WaldiezAgent, WaldiezChat


def update_summary_chat_args(
    chat_args: Dict[str, Any],
    string_escape: Callable[[str], str],
) -> Dict[str, Any]:
    """Escape quotes in the summary args if they are strings.

    Parameters
    ----------
    chat_args : Dict[str, Any]
        The chat arguments.
    string_escape : Callable[[str], str]
        The function to escape the string

    Returns
    -------
    Dict[str, Any]
        The chat arguments with the summary prompt escaped.
    """
    if "summary_args" in chat_args and isinstance(
        chat_args["summary_args"], dict
    ):
        for key, value in chat_args["summary_args"].items():
            if isinstance(value, str):
                chat_args["summary_args"][key] = string_escape(value)
    return chat_args


def get_chat_message_string(
    sender: WaldiezAgent,
    chat: WaldiezChat,
    chat_names: Dict[str, str],
    string_escape: Callable[[str], str],
) -> Tuple[str, Optional[str]]:
    """Get the agent's message as a string.

    Parameters
    ----------
    sender : WaldiezAgent
        The sender.
    chat : WaldiezChat
        The chat.
    chat_names : Dict[str, str]
        A mapping of chat id to chat name with all the chats in the flow.
    string_escape : Callable[[str], str]
        The function to escape the string.

    Returns
    -------
    Tuple[str, Optional[str]]
        If the message is a string, the message content and None.
        If the message is a method, the method name and the method content.
        If the message is None, 'None' and None.
    """
    if (
        not chat.message
        or chat.message.type == "none"
        or chat.message.content is None
        or chat.message_content is None
    ):
        return "None", None
    if chat.message.type == "string":
        return string_escape(chat.message.content), None

    is_rag_with_carryover = (
        sender.agent_type == "rag_user" and chat.message.use_carryover
    )
    chat_name = chat_names[chat.id]
    function_content, function_name = chat.get_message_function(
        name_suffix=chat_name,
        is_rag=is_rag_with_carryover,
    )
    return function_name, function_content
