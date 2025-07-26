# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods,
# pylint: disable=too-many-arguments,too-many-positional-arguments
"""Factory for creating agent exporter."""

from pathlib import Path
from typing import Any, Callable

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentConnection,
    WaldiezChat,
    WaldiezModel,
)

from ..core import (
    ExporterContext,
    get_default_exporter_context,
)
from .exporter import AgentExporter


def create_agent_exporter(
    agent: WaldiezAgent,
    agent_names: dict[str, str],
    models: tuple[list[WaldiezModel], dict[str, str]],
    chats: tuple[list[WaldiezChat], dict[str, str]],
    tool_names: dict[str, str],
    initial_chats: list[WaldiezAgentConnection],
    is_async: bool = False,
    for_notebook: bool = False,
    cache_seed: int | None = None,
    group_chat_members: list[WaldiezAgent] | None = None,
    arguments_resolver: Callable[[WaldiezAgent], list[str]] | None = None,
    output_dir: str | Path | None = None,
    context: ExporterContext | None = None,
    **kwargs: Any,
) -> AgentExporter:
    """Create an agent exporter.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent to export.
    agent_names : dict[str, str]
        Mapping of agent IDs to names.
    models : tuple[list[WaldiezModel], dict[str, str]]
        All models and model names mapping.
    chats : tuple[list[WaldiezChat], dict[str, str]]
        All chats and chat names mapping.
    tool_names : dict[str, str]
        Mapping of tool IDs to names.
    is_async : bool, optional
        Whether the flow is async, by default False
    for_notebook : bool, optional
        Whether exporting for notebook, by default False
    cache_seed : Optional[int], optional
        Cache seed if any, by default None
    initial_chats : list[WaldiezAgentConnection]
        Initial chats for group managers, by default None
    group_chat_members : list[WaldiezAgent], optional
        Group chat members if group manager, by default None
    arguments_resolver : Callable, optional
        Function to resolve additional arguments, by default None
    output_dir : str | Path | None, optional
        Output directory for generated files, by default None
    context : ExporterContext | None, optional
        Exporter context with dependencies, by default None
    **kwargs : Any
        Additional keyword arguments.

    Returns
    -------
    AgentExporter
        The created agent exporter.
    """
    if context is None:
        context = get_default_exporter_context()
    return AgentExporter(
        agent=agent,
        agent_names=agent_names,
        models=models,
        chats=chats,
        tool_names=tool_names,
        is_async=is_async,
        for_notebook=for_notebook,
        cache_seed=cache_seed,
        initial_chats=initial_chats,
        group_chat_members=group_chat_members,
        arguments_resolver=arguments_resolver,
        output_dir=output_dir,
        context=context,
        **kwargs,
    )
