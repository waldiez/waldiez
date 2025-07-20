# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common utilities for exporting chats."""

import json
from typing import Optional

from waldiez.models import WaldiezAgent, WaldiezChat


def get_chat_message_string(
    sender: WaldiezAgent,
    chat: WaldiezChat,
    chat_names: dict[str, str],
) -> tuple[str, Optional[str]]:
    """Get the agent's message as a string.

    Parameters
    ----------
    sender : WaldiezAgent
        The sender.
    chat : WaldiezChat
        The chat.
    chat_names : dict[str, str]
        A mapping of chat id to chat name with all the chats in the flow.

    Returns
    -------
    tuple[str, Optional[str]]
        If the message is a string, the message content and None.
        If the message is a method, the method name and the method content.
        If the message is None, 'None' and None.
    """
    if not chat.message or chat.message.type == "none":
        return "None", None
    if chat.message.type == "string":
        if chat.message.content is None:  # pragma: no cover
            # should be coverred previousliy on pydantic validation
            return "None", None
        if not chat.message.content:
            return "", None
        return json.dumps(chat.message.content, ensure_ascii=False), None

    is_rag_with_carryover = sender.is_rag_user and chat.message.use_carryover
    chat_name = chat_names[chat.id]
    function_content, function_name = chat.get_message_function(
        name_suffix=chat_name,
        is_rag=is_rag_with_carryover,
    )
    return function_name, function_content


def get_event_handler_string(
    tab: str,
    is_async: bool,
) -> str:
    """Get the event handler string.

    Parameters
    ----------
    tab : str
        The tab string.
    is_async : bool
        Whether the handler is asynchronous.

    Returns
    -------
    str
        The event handler string.
    """
    content = (
        f"{tab}if on_event:\n"
        f"{tab}    if not isinstance(results, list):\n"
        f"{tab}        results = [results]\n"
        f"{tab}    for index, result in enumerate(results):\n"
        f"{tab}        is_last = index == len(results) - 1\n"
    )
    if is_async:
        content += (
            f"{tab}        async for event in result.events:\n"
            f"{tab}            should_continue = await on_event(event)\n"
        )
    else:
        content += (
            f"{tab}        for event in result.events:\n"
            f"{tab}            should_continue = on_event(event)\n"
        )
    content += (
        f"{tab}            if event.type == 'run_completion' and is_last:\n"
        f"{tab}                should_continue = False\n"
        f"{tab}            if not should_continue:\n"
        f"{tab}                break\n"
        f"{tab}else:\n"
        f"{tab}    if not isinstance(results, list):\n"
        f"{tab}        results = [results]\n"
        f"{tab}    for result in results:\n"
    )
    if is_async:
        content += f"{tab}        await result.process()\n"
    else:
        content += f"{tab}        result.process()\n"

    return content
