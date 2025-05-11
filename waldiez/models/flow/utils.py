# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Helpers for the flow model."""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from ..agents import WaldiezAgentNestedChat, WaldiezAgentNestedChatMessage
from ..chat import WaldiezChat


def id_factory() -> str:
    """Generate a unique ID.

    Returns
    -------
    str
        The unique ID.
    """
    now_td = datetime.now(timezone.utc)
    now_str = now_td.strftime("%Y%m%d%H%M%S%f")
    return f"{now_str}-{uuid.uuid4().hex}"


def merge_nested_chat_messages(
    agent_nested_chat_messages: list[WaldiezAgentNestedChatMessage],
    all_connections: list[WaldiezChat],
) -> list[WaldiezAgentNestedChat]:
    """Merge the nested chat messages.

    Parameters
    ----------
    all_connections : list[WaldiezChat]
        The connections.
    agent_nested_chat_messages : list[WaldiezAgentNestedChatMessage]
        The agent's nested chat messages.

    Returns
    -------
    list[WaldiezAgentNestedChat]
        The merged nested chat with all the messages.
    """
    nested_chat = WaldiezAgentNestedChat(triggered_by=[], messages=[])
    chat_ids_added: list[str] = []
    for message in agent_nested_chat_messages:
        chat = next((c for c in all_connections if c.id == message.id), None)
        if chat and chat.id not in chat_ids_added:
            nested_chat.messages.append(
                WaldiezAgentNestedChatMessage(
                    id=chat.id,
                    is_reply=False,
                )
            )
            chat_ids_added.append(chat.id)
    for chat in all_connections:
        if chat.id not in chat_ids_added:
            nested_chat.messages.append(
                WaldiezAgentNestedChatMessage(
                    id=chat.id,
                    is_reply=False,
                )
            )
            chat_ids_added.append(chat.id)
    nested_chat.messages.sort(key=lambda x: chat_ids_added.index(x.id))
    return [nested_chat]


def get_flow_data(
    data: dict[str, Any],
    flow_id: Optional[str] = None,
    name: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[list[str]] = None,
    requirements: Optional[list[str]] = None,
) -> dict[str, Any]:
    """Get the flow from the passed data dict.

    Parameters
    ----------
    data : dict[str, Any]
        The data dict.
    flow_id : Optional[str], optional
        The flow ID, by default None.
    name : Optional[str], optional
        The flow name, by default None.
    description : Optional[str], optional
        The flow description, by default None.
    tags : Optional[list[str]], optional
        The flow tags, by default None.
    requirements : Optional[list[str]], optional
        The flow requirements, by default None.

    Returns
    -------
    dict[str, Any]
        The flow data.

    Raises
    ------
    ValueError
        If the flow type is not "flow".
    """
    item_type = data.get("type", "flow")
    if item_type != "flow":
        # empty flow (from exported model/tool ?)
        raise ValueError(f"Invalid flow type: {item_type}")
    from_args = {
        "id": flow_id,
        "name": name,
        "description": description,
        "tags": tags,
        "requirements": requirements,
    }
    for key, value in from_args.items():
        if value:
            data[key] = value
    if "name" not in data:
        data["name"] = "Waldiez Flow"
    if "description" not in data:
        data["description"] = "Waldiez Flow description"
    if "tags" not in data:
        data["tags"] = []
    if "requirements" not in data:
        data["requirements"] = []
    return data
