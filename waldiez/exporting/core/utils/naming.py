# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Ensure unique names for agents, models, tools, and chats."""

import re
from typing import TypedDict

from waldiez.models import (
    Waldiez,
    WaldiezAgent,
    WaldiezChat,
    WaldiezModel,
    WaldiezTool,
)

MAX_VARIABLE_LENGTH = 46


class ResultType(TypedDict):
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


def get_valid_python_variable_name(
    possible: str,
    prefix: str = "w",
    max_length: int = MAX_VARIABLE_LENGTH,
) -> str:
    """Get a valid Python variable name from a possible name.

    Parameters
    ----------
    possible : str
        The possible name.
    prefix : str, optional
        The prefix to use if the name starts with a digit or special character
    max_length : int, optional
        The maximum length of the variable name.

    Returns
    -------
    str
        The valid Python variable name.
    """
    if not possible or not possible.strip():
        return prefix + "_"

    # First handle arrow operators specifically
    possible = possible.replace("->", "to")
    possible = possible.replace("=>", "to")
    possible = possible.replace("<-", "from")
    possible = possible.replace("<=", "from")

    # Replace non-ASCII characters and non-word characters with underscores
    # \W matches any non-word character, but in Python's re module,
    # \w includes Unicode letters by default, so we need to be more explicit
    # to replace Unicode letters with underscores for valid Python identifiers
    possible = re.sub(r"[^\w]", "_", possible)  # Replace non-word chars
    possible = re.sub(r"[^\x00-\x7F]", "_", possible)  # Replace non-ASCII chars

    # Convert to lowercase and truncate
    possible = possible.lower()[:max_length]

    # Remove trailing underscores from truncation
    possible = possible.rstrip("_")

    if not possible:
        return prefix + "_"

    # Handle names starting with underscore
    if possible.startswith("_"):
        return f"{prefix}{possible}"

    # Handle names starting with digit
    if possible[0].isdigit():
        return f"{prefix}_{possible}"

    return possible


def get_valid_instance_name(
    instance: tuple[str, str],
    current_names: dict[str, str],
    prefix: str = "w",
    max_length: int = MAX_VARIABLE_LENGTH,
) -> dict[str, str]:
    """Get a valid instance name.

    If the instance id is already in the current names nothing is done.
    If the name already exists in the current names,
        the name is updated (with an index suffix).

    Parameters
    ----------
    instance : tuple[str, str]
        The instance id and possible name.
    current_names : dict[str, str]
        The current names.
    prefix : str, optional
        The prefix to use if the name starts with a digit,
        if the name is already in the current names,
        or if the name is already in the current names with an index suffix.
    max_length : int, optional
        The maximum length of the variable name.

    Returns
    -------
    dict[str, str]
        The updated names.
    """
    instance_id, possible_name = instance[0], instance[1][:max_length]

    if instance_id in current_names:
        # already in the current names (by its id)
        return current_names

    new_names = current_names.copy()
    name = get_valid_python_variable_name(
        possible_name, prefix=prefix, max_length=max_length
    )

    if name in current_names.values():
        name = f"{prefix}_{name}"

    if name in current_names.values():
        index = 1
        while f"{name}_{index}" in current_names.values():
            index += 1
        name = f"{name}_{index}"

    new_names[instance_id] = name
    return new_names


# pylint: disable=too-many-locals
def ensure_unique_names(
    waldiez: Waldiez,
    max_length: int = 46,
    flow_name_max_length: int = 20,
) -> ResultType:
    """Ensure unique names for agents, models, tools, and chats and flow.

    Parameters
    ----------
    waldiez : Waldiez
        The Waldiez instance.
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

    for agent in waldiez.agents:
        all_names = get_valid_instance_name(
            (agent.id, agent.name),
            all_names,
            prefix="wa",
            max_length=max_length,
        )
        agent_names[agent.id] = all_names[agent.id]
        agents.append(agent)

    for model in waldiez.models:
        all_names = get_valid_instance_name(
            (model.id, model.name),
            all_names,
            prefix="wm",
            max_length=max_length,
        )
        model_names[model.id] = all_names[model.id]
        models.append(model)

    for tool in waldiez.tools:
        all_names = get_valid_instance_name(
            (tool.id, tool.name),
            all_names,
            prefix="ws",
            max_length=max_length,
        )
        tool_names[tool.id] = all_names[tool.id]
        tools.append(tool)

    for chat in waldiez.flow.data.chats:
        all_names = get_valid_instance_name(
            (chat.id, chat.name), all_names, prefix="wc", max_length=max_length
        )
        chat_names[chat.id] = all_names[chat.id]
        chats.append(chat)

    all_names = get_valid_instance_name(
        (waldiez.flow.id, waldiez.flow.name),
        all_names,
        prefix="wf",
        max_length=flow_name_max_length,
    )
    flow_name = all_names[waldiez.flow.id]

    result: ResultType = {
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
