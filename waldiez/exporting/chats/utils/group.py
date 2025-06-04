# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Exporting group chat utils.

Using the group patterns (no group manager agent)
"""

import json

from waldiez.models import WaldiezGroupManager


def export_group_chats(
    agent_names: dict[str, str],
    manager: WaldiezGroupManager,
    intial_chat: str | None,
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
    intial_chat : str | None
        The initial chat to use if any.
    tabs : int
        The number of tabs for indentation.
    is_async : bool
        Whether the chat is asynchronous.

    Returns
    -------
    tuple[str, str]
        The group chat string and the import string.
    """
    tab = "    " * tabs
    initiate_group_chat = "initiate_group_chat"
    if is_async:
        initiate_group_chat = "a_initiate_group_chat"
    manager_name = agent_names[manager.id]
    pattern_name = f"{manager_name}_pattern"
    content = f"{tab}results, _, __ = {initiate_group_chat}(" + "\n"
    content += f"{tab}    pattern={pattern_name}," + "\n"
    if intial_chat:
        content += f"{tab}    messages={json.dumps(intial_chat)}," + "\n"
    else:
        content += f"{tab}    messages=[],\n"
    content += f"{tab}    max_rounds={manager.data.max_round},\n"
    content += f"{tab})\n"
    return content
