# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Ensure unique names for agents, models, tools, and chats."""

from collections.abc import Iterable
from typing import TypedDict

from ..agents import WaldiezAgent
from ..chat import WaldiezChat
from ..common import MAX_VARIABLE_LENGTH, get_valid_instance_name
from ..model import WaldiezModel
from ..tool import WaldiezTool


class WaldiezUniqueNames(TypedDict):
    """The result type for ensure_unique_names."""

    agent_names: dict[str, str]
    model_names: dict[str, str]
    tool_names: dict[str, str]
    chat_names: dict[str, str]
    agents: list[WaldiezAgent]
    models: list[WaldiezModel]
    tools: list[WaldiezTool]
    chats: list[WaldiezChat]
    flow_name: str


# pylint: disable=too-many-locals
def ensure_unique_names(
    flow_id: str,
    flow_name: str,
    flow_agents: Iterable[WaldiezAgent],
    flow_models: Iterable[WaldiezModel],
    flow_tools: Iterable[WaldiezTool],
    flow_chats: Iterable[WaldiezChat],
    max_length: int = MAX_VARIABLE_LENGTH,
    flow_name_max_length: int = 20,
) -> WaldiezUniqueNames:
    """Ensure unique names for agents, models, tools, and chats and flow.

    Parameters
    ----------
    flow_id : str
        The ID of the flow.
    flow_name : str
        The name of the flow.
    flow_agents : Iterable[WaldiezAgent]
        The agents in the flow.
    flow_models : Iterable[WaldiezModel]
        The models in the flow.
    flow_tools : Iterable[WaldiezTool]
        The tools in the flow.
    flow_chats : Iterable[WaldiezChat]
        The chats in the flow.
    max_length : int, optional
        The maximum length of the name, by default 46
    flow_name_max_length : int, optional
        The maximum length of the flow name, by default 20

    Returns
    -------
    ResultType
        The result with unique names for agents, models, tools, chats, flow.
    """
    all_names: dict[str, str] = {}
    agent_names: dict[str, str] = {}
    model_names: dict[str, str] = {}
    tool_names: dict[str, str] = {}
    chat_names: dict[str, str] = {}
    agents: list[WaldiezAgent] = []
    models: list[WaldiezModel] = []
    tools: list[WaldiezTool] = []
    chats: list[WaldiezChat] = []

    for agent in flow_agents:
        all_names = get_valid_instance_name(
            (agent.id, agent.name),
            all_names,
            prefix="wa",
            max_length=max_length,
        )
        agent_names[agent.id] = all_names[agent.id]
        agents.append(agent)

    for model in flow_models:
        all_names = get_valid_instance_name(
            (model.id, model.name),
            all_names,
            prefix="wm",
            max_length=max_length,
        )
        model_names[model.id] = all_names[model.id]
        models.append(model)

    for tool in flow_tools:
        tool_name = tool.name
        if tool.data.tool_type == "predefined" and tool.name == "waldiez_flow":
            tool_name = tool.data.kwargs.get("name", tool_name)
        all_names = get_valid_instance_name(
            (tool.id, tool_name),
            all_names,
            prefix="wt",
            max_length=max_length,
        )
        tool_names[tool.id] = all_names[tool.id]
        tools.append(tool)

    for chat in flow_chats:
        all_names = get_valid_instance_name(
            (chat.id, chat.name), all_names, prefix="wc", max_length=max_length
        )
        chat_names[chat.id] = all_names[chat.id]
        chats.append(chat)

    all_names = get_valid_instance_name(
        (flow_id, flow_name),
        all_names,
        prefix="wf",
        max_length=flow_name_max_length,
    )
    # all_names[flow_id] = all_names[flow_id].lower()
    flow_name = all_names[flow_id]

    result: WaldiezUniqueNames = {
        "agent_names": agent_names,
        "model_names": model_names,
        "tool_names": tool_names,
        "chat_names": chat_names,
        "agents": agents,
        "models": models,
        "tools": tools,
        "chats": chats,
        "flow_name": flow_name,
    }
    return result
