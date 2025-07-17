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
