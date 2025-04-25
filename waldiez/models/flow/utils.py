# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Helpers for the flow model."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..agents import (
    WaldiezAgent,
    WaldiezAgentNestedChat,
    WaldiezAgentNestedChatMessage,
    WaldiezSwarmAgent,
    WaldiezSwarmOnCondition,
)
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


def check_handoff_to_nested_chat(
    agent: WaldiezSwarmAgent,
    all_agents: List[WaldiezAgent],
    all_chats: List[WaldiezChat],
) -> None:
    """Check the handoffs to a nested chat.

    If we have one and the agent does not have nested_chats,
    we should generate them with the `handoff.target.id`
    as the first (chat's) message.

    Parameters
    ----------
    agent : WaldiezSwarmAgent
        The swarm agent.
    all_agents : List[WaldiezAgent]
        All agents.
    all_chats : List[WaldiezChat]
        All chats.

    Raises
    ------
    ValueError
        If the agent has a handoff to a nested chat,
        but no chat found with it as a source.
    """
    # pylint: disable=too-complex
    for handoff in agent.handoffs:
        if not isinstance(handoff, WaldiezSwarmOnCondition):
            continue
        is_nested_chat = handoff.target_type == "nested_chat"
        if is_nested_chat:
            # check if the agent already has nested_chats
            # but only to get the order (and the first chat/message)
            # either way, we must include all the connections that
            # are swarm => non-swarm
            # if we have the orders, ok, else we get them from the
            # edges positions
            all_connections = sorted(
                get_nested_chat_swarm_connections(agent, all_agents, all_chats),
                key=lambda x: x.data.order,
            )
            if not all_connections:
                raise ValueError(
                    f"Agent {agent.name} has a handoff to a nested chat, "
                    "but no chat found with it as a source."
                )
            agent_nested_chats = agent.nested_chats
            if not agent_nested_chats or not agent_nested_chats[0].messages:
                agent.data.nested_chats = [
                    WaldiezAgentNestedChat(
                        triggered_by=[],
                        messages=[
                            WaldiezAgentNestedChatMessage(
                                id=chat.id,
                                is_reply=False,
                            )
                            for chat in all_connections
                        ],
                    )
                ]
                break
            agent.data.nested_chats = merge_nested_chat_messages(
                agent_nested_chats[0].messages, all_connections
            )


def get_nested_chat_swarm_connections(
    agent: WaldiezSwarmAgent,
    all_agents: List[WaldiezAgent],
    all_chats: List[WaldiezChat],
) -> List[WaldiezChat]:
    """Get the nested chat connections.

    Parameters
    ----------
    agent : WaldiezSwarmAgent
        The swarm agent.
    all_agents : Iterator[WaldiezAgent]
        All agents.
    all_chats : List[WaldiezChat]
        All chats.

    Returns
    -------
    List[WaldiezAgentNestedChat]
        The nested chat connections.
    """
    connections_with_non_swarm_targets = []
    for chat in all_chats:
        if chat.source != agent.id:
            continue
        target_agent = next(
            (a for a in all_agents if a.id == chat.target), None
        )
        if not target_agent or target_agent.agent_type != "swarm":
            connections_with_non_swarm_targets.append(chat)
    return connections_with_non_swarm_targets


def merge_nested_chat_messages(
    agent_nested_chat_messages: List[WaldiezAgentNestedChatMessage],
    all_connections: List[WaldiezChat],
) -> List[WaldiezAgentNestedChat]:
    """Merge the nested chat messages.

    Parameters
    ----------
    all_connections : List[WaldiezChat]
        The connections.
    agent_nested_chat_messages : List[WaldiezAgentNestedChatMessage]
        The agent's nested chat messages.

    Returns
    -------
    List[WaldiezAgentNestedChat]
        The merged nested chat with all the messages.
    """
    nested_chat = WaldiezAgentNestedChat(triggered_by=[], messages=[])
    chat_ids_added: List[str] = []
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
    data: Dict[str, Any],
    flow_id: Optional[str] = None,
    name: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[List[str]] = None,
    requirements: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Get the flow from the passed data dict.

    Parameters
    ----------
    data : Dict[str, Any]
        The data dict.
    flow_id : Optional[str], optional
        The flow ID, by default None.
    name : Optional[str], optional
        The flow name, by default None.
    description : Optional[str], optional
        The flow description, by default None.
    tags : Optional[List[str]], optional
        The flow tags, by default None.
    requirements : Optional[List[str]], optional
        The flow requirements, by default None.

    Returns
    -------
    Dict[str, Any]
        The flow data.

    Raises
    ------
    ValueError
        If the flow type is not "flow".
    """
    item_type = data.get("type", "flow")
    if item_type != "flow":
        # empty flow (from exported model/skill ?)
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
