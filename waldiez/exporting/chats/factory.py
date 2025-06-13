# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Factory function for creating a ChatsExporter instance."""

from typing import Any, Optional

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentConnection,
    WaldiezChat,
    WaldiezGroupManager,
)

from ..core import ExporterContext, get_default_exporter_context
from .exporter import ChatsExporter


def create_chats_exporter(
    all_agents: list[WaldiezAgent],
    agent_names: dict[str, str],
    all_chats: list[WaldiezChat],
    chat_names: dict[str, str],
    main_chats: list[WaldiezAgentConnection],
    root_group_manager: Optional[WaldiezGroupManager] = None,
    context: Optional[ExporterContext] = None,
    **kwargs: Any,
) -> ChatsExporter:
    """Create a chats exporter.

    Parameters
    ----------
    all_agents : list[WaldiezAgent]
        All agents involved in the chats.
    agent_names : dict[str, str]
        Mapping of agent IDs to their names.
    all_chats : list[WaldiezChat]
        All chats to be exported.
    chat_names : dict[str, str]
        Mapping of chat IDs to their names.
    main_chats : list[WaldiezAgentConnection]
        Main chats that are connections between agents.
    root_group_manager : Optional[WaldiezGroupManager], optional
        The root group manager for managing chat groups, if any.
    context : Optional[ExporterContext], optional
        Exporter context with dependencies, by default None
    **kwargs : Any
        Additional keyword arguments for the exporter.

    Returns
    -------
    ChatsExporter
        The created chats exporter.
    """
    if context is None:
        context = get_default_exporter_context()
    return ChatsExporter(
        all_agents=all_agents,
        agent_names=agent_names,
        all_chats=all_chats,
        chat_names=chat_names,
        main_chats=main_chats,
        root_group_manager=root_group_manager,
        context=context,
        **kwargs,
    )
