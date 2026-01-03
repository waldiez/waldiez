# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Helpers for getting a flow."""

from waldiez.models import (
    WaldiezAgents,
    WaldiezAssistant,
    WaldiezFlow,
    WaldiezFlowData,
    WaldiezGroupManager,
)

from .agents import (
    get_assistant,
    get_captain_agent,
    get_doc_agent,
    get_rag_user,
    get_reasoning_agent,
    get_user_proxy,
)
from .chats import get_chats
from .group import get_group_manager
from .model import get_model
from .tool import get_interop_tool, get_tool


def get_flow(
    is_async: bool = False,
    is_group: bool = False,
    is_pattern_based: bool = False,
) -> WaldiezFlow:
    """Get a WaldiezFlow instance.

    Parameters
    ----------
    is_async : bool, optional
        Whether the flow is asynchronous, by default False.
    is_group : bool, optional
        Whether the flow is for a group chat, by default False.
    is_pattern_based : bool, optional
        If for group, whether the flow is pattern-based, by default False.

    Returns
    -------
    WaldiezFlow
        A WaldiezFlow instance.
    """
    model = get_model()
    custom_tool = get_tool()
    langchain_tool = get_interop_tool(tool_id="wt-2", tool_type="langchain")
    crewai_tool = get_interop_tool(tool_id="wt-3", tool_type="crewai")
    shared_tool = get_tool(tool_id="wt-4", tool_type="shared")
    chats = get_chats(is_group=is_group, count=6 if not is_group else 7)
    agents = _get_flow_agents(
        is_group=is_group,
        is_pattern_based=is_pattern_based,
    )
    flow = WaldiezFlow(
        id="wf-1",
        name="dummy_flow_name",
        type="flow",
        description="Flow Description",
        tags=["flow"],
        requirements=["chess"],
        storage_id="flow-1",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezFlowData(
            is_async=is_async,
            nodes=[],
            edges=[],
            viewport={},
            agents=agents,
            models=[model],
            tools=[custom_tool, langchain_tool, crewai_tool, shared_tool],
            chats=chats,
        ),
    )
    return flow


def _get_flow_agents(
    is_group: bool = False,
    is_pattern_based: bool = False,
) -> WaldiezAgents:
    """Get flow agents."""
    user = get_user_proxy()
    assistant1 = get_assistant()
    rag_user = get_rag_user()
    reasoning_agent = get_reasoning_agent()
    captain_agent = get_captain_agent()
    doc_agent = get_doc_agent()
    assistants: list[WaldiezAssistant] = [assistant1]
    group_managers: list[WaldiezGroupManager] = []
    if not is_group:
        assistant2 = get_assistant(agent_id="wa-3", is_multimodal=True)
        assistants.append(assistant2)
    else:
        group_manager = get_group_manager(
            agent_id="wa-3",
            initial_agent_id=assistant1.id,
            is_pattern_based=is_pattern_based,
        )
        assistant1.data.parent_id = "wa-3"  # Set parent_id for group chat
        assistant1.data.handoffs = ["nested-chat"]
        assistant2 = get_assistant(
            agent_id="wa-8",
            is_multimodal=True,
            with_nested_chat=is_pattern_based,
        )
        assistants.append(assistant2)
        assistant2.data.parent_id = "wa-3"
        captain_agent.data.parent_id = "wa-3"
        group_managers.append(group_manager)
    agents = WaldiezAgents(
        userProxyAgents=[user],
        assistantAgents=assistants,
        ragUserProxyAgents=[rag_user],
        reasoningAgents=[reasoning_agent],
        captainAgents=[captain_agent],
        groupManagerAgents=group_managers,
        docAgents=[doc_agent],
    )
    return agents
