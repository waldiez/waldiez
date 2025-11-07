# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Exporting group chat utils.

Using the group patterns (no group manager agent)
"""

from waldiez.models import WaldiezGroupManager

from .common import get_event_handler_string


def export_group_chats(
    agent_names: dict[str, str],
    manager: WaldiezGroupManager,
    message: tuple[str, str] | None,
    tabs: int,
    is_async: bool,
) -> str:
    """Get the group chat string.

    Parameters
    ----------
    agent_names : dict[str, str]
        The agent names.
    manager : WaldiezGroupManager
        The group manager agent.
    message : str | None
        The initial message/messages arg and value for the chat
    tabs : int
        The number of tabs for indentation.
    is_async : bool
        Whether the chat is asynchronous.

    Returns
    -------
    tuple[str, str]
        The group chat string and the import string.
    """
    space = "    " * tabs
    run_group_chat: str = "run_group_chat"
    if is_async:
        run_group_chat = "await a_run_group_chat"
    manager_name = agent_names[manager.id]
    pattern_name = f"{manager_name}_pattern"
    content: str = f"{space}results = {run_group_chat}(" + "\n"
    content += f"{space}    pattern={pattern_name}," + "\n"
    if message:
        content += f"{space}    {message[0]}={message[1]},\n"
    content += f"{space}    max_rounds={manager.data.max_round},\n"
    if is_async:
        content += f"{space}    a_pause_event=a_pause_event,\n"
    else:
        content += f"{space}    pause_event=pause_event,\n"
    content += f"{space})\n"
    content += get_event_handler_string(space=space, is_async=is_async)
    return content
