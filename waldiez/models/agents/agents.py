# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Waldiez agents model."""

from collections.abc import Iterator

from pydantic import Field, model_validator
from typing_extensions import Annotated, Self

from ..common import WaldiezBase
from .agent import WaldiezAgent
from .assistant import WaldiezAssistant
from .captain import WaldiezCaptainAgent
from .doc_agent import WaldiezDocAgent
from .group_manager import WaldiezGroupManager
from .rag_user_proxy import WaldiezRagUserProxy
from .reasoning import WaldiezReasoningAgent
from .remote import WaldiezRemoteAgent
from .user_proxy import WaldiezUserProxy


class WaldiezAgents(WaldiezBase):
    """Waldiez agents model.

    Attributes
    ----------
    userProxyAgents : list[WaldiezUserProxy]
        User proxy agents.
    assistantAgents : list[WaldiezAssistant]
        Assistant agents.
    ragUserProxyAgents : list[WaldiezRagUserProxy]
        RAG user proxy agents.
    reasoningAgents : list[WaldiezReasoningAgent]
        Reasoning agents.
    captainAgents : list[WaldiezCaptainAgent]
        Captain agents.
    groupManagerAgents : list[WaldiezGroupManager]
        Group manager agents.
    remoteAgents : list[WaldiezRemoteAgent]
        Remote agents.
    """

    userProxyAgents: Annotated[
        list[WaldiezUserProxy],
        Field(
            title="User Proxy Agents.",
            description="The User proxy agents in the flow.",
            default_factory=list,
        ),
    ]
    assistantAgents: Annotated[
        list[WaldiezAssistant],
        Field(
            title="Assistant Agents.",
            description="The assistant agents in the flow.",
            default_factory=list,
        ),
    ]
    ragUserProxyAgents: Annotated[
        list[WaldiezRagUserProxy],
        Field(
            title="RAG Users Proxy agents.",
            description="The RAG user proxy agents in the flow.",
            default_factory=list,
        ),
    ]
    reasoningAgents: Annotated[
        list[WaldiezReasoningAgent],
        Field(
            title="Reasoning Agents.",
            description="The Reasoning agents in the flow.",
            default_factory=list,
        ),
    ]
    captainAgents: Annotated[
        list[WaldiezCaptainAgent],
        Field(
            title="Captain Agents.",
            description="The Captain agents in the flow.",
            default_factory=list,
        ),
    ]
    groupManagerAgents: Annotated[
        list[WaldiezGroupManager],
        Field(
            title="Group Manager Agents.",
            description="The Group manager agents in the flow.",
            default_factory=list,
        ),
    ]
    docAgents: Annotated[
        list[WaldiezDocAgent],
        Field(
            title="Document Agents.",
            description="The Document agents in the flow.",
            default_factory=list,
        ),
    ]
    remoteAgents: Annotated[
        list[WaldiezRemoteAgent],
        Field(
            title="Remote Agents.",
            description="The remote agents in the flow.",
            default_factory=list,
        ),
    ]

    @property
    def members(self) -> Iterator[WaldiezAgent]:
        """Get all agents.

        Yields
        ------
        WaldiezAgent
            The agents.
        """
        yield from self.userProxyAgents
        yield from self.assistantAgents
        yield from self.ragUserProxyAgents
        yield from self.reasoningAgents
        yield from self.captainAgents
        yield from self.groupManagerAgents
        yield from self.docAgents
        yield from self.remoteAgents

    @model_validator(mode="after")
    def validate_agents(self) -> Self:
        """Validate the agents.

        - At least two agents are required.
        - All the agent IDs must be unique.

        Returns
        -------
        WaldiezAgents
            The agents.

        Raises
        ------
        ValueError
            If the agents are invalid.
        """
        all_agent_ids = [agent.id for agent in self.members]
        if len(all_agent_ids) < 1:
            raise ValueError("At least one agent is required.")
        if len(all_agent_ids) != len(set(all_agent_ids)):
            raise ValueError("Agent IDs must be unique.")
        return self

    def validate_flow(self, model_ids: list[str], tool_ids: list[str]) -> None:
        """Validate the flow of the agents.

        - Validate the linked models (the referenced model ids must exist).
        - Validate the linked tools (the referenced tool ids must exist).
        - Validate the code execution (the referenced functions must exist).

        Parameters
        ----------
        model_ids : list[str]
            The list of model IDs.
        tool_ids : list[str]
            The list of tool IDs.

        Raises
        ------
        ValueError
            If the flow is invalid.
        """
        all_agent_ids = [agent.id for agent in self.members]
        for agent in self.members:
            agent.validate_linked_models(model_ids)
            agent.validate_linked_tools(tool_ids, agent_ids=all_agent_ids)
            agent.validate_code_execution(tool_ids=tool_ids)
            if agent.is_group_manager and isinstance(
                agent, WaldiezGroupManager
            ):
                agent.validate_initial_agent_id(all_agent_ids)
                agent.validate_transitions(agent_ids=all_agent_ids)
