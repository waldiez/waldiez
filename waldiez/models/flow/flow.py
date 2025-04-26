# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez flow model."""

import uuid
from typing import List, Optional, Tuple

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ..agents import WaldiezAgent, WaldiezSwarmAgent
from ..chat import WaldiezChat
from ..common import WaldiezBase, now
from .flow_data import WaldiezFlowData
from .utils import check_handoff_to_nested_chat, id_factory


class WaldiezFlow(WaldiezBase):
    """Flow data class.

    Attributes
    ----------
    id : str
        The ID of the flow.
    type : Literal["flow"], optional
        The type of the "node" in a graph: "flow".
    name : str
        The name of the flow.
    description : str
        The description of the flow.
    tags : List[str]
        The tags of the flow.
    requirements : List[str]
        The requirements of the flow.
    storage_id : str
        The storage ID of the flow (ignored, UI related).
    created_at : str
        The date and time when the flow was created.
    updated_at : str
        The date and time when the flow was last updated.
    data : WaldiezFlowData
        The data of the flow. See `WaldiezFlowData`.
    """

    id: Annotated[
        str,
        Field(
            description="The ID of the flow",
            title="ID",
            default_factory=id_factory,
        ),
    ]
    type: Annotated[
        Literal["flow"],
        Field(
            "flow",
            description="The type of the 'node' in a graph",
            title="Type",
        ),
    ]
    name: Annotated[
        str,
        Field(
            ...,
            description="The name of the flow",
            title="Name",
        ),
    ]
    description: Annotated[
        str,
        Field(
            ...,
            description="The description of the flow",
            title="Description",
        ),
    ]
    tags: Annotated[
        List[str],
        Field(
            description="The tags of the flow",
            title="Tags",
            default_factory=list,
        ),
    ]
    requirements: Annotated[
        List[str],
        Field(
            description="The requirements of the flow",
            title="Requirements",
            default_factory=list,
        ),
    ]
    data: Annotated[
        WaldiezFlowData,
        Field(
            ...,
            description="The data of the flow",
            title="Data",
        ),
    ]
    storage_id: Annotated[
        str,
        Field(
            uuid.uuid4(),
            description="The storage ID of the flow (ignored, UI related)",
            title="Storage ID",
            alias="storageId",
        ),
    ]
    created_at: Annotated[
        str,
        Field(
            default_factory=now,
            title="Created At",
            description="The date and time when the flow was created.",
        ),
    ]
    updated_at: Annotated[
        str,
        Field(
            default_factory=now,
            title="Updated At",
            description="The date and time when the flow was last updated.",
        ),
    ]
    _ordered_flow: Optional[
        List[Tuple[WaldiezChat, WaldiezAgent, WaldiezAgent]]
    ] = None
    _single_agent_mode: bool = False

    @property
    def is_async(self) -> bool:
        """Check if the flow is asynchronous.

        Returns
        -------
        bool
            True if the flow is asynchronous, False otherwise.
        """
        return self.data.is_async

    @property
    def cache_seed(self) -> Optional[int]:
        """Check if the flow has caching disabled.

        Returns
        -------
        bool
            True if the flow has caching disabled, False otherwise.
        """
        return self.data.cache_seed

    @property
    def is_swarm_flow(self) -> bool:
        """Check if the flow is a swarm flow.

        Returns
        -------
        bool
            True if the flow is a swarm flow, False otherwise.
        """
        return any(
            agent.agent_type == "swarm" for agent in self.data.agents.members
        )

    @property
    def is_single_agent_mode(self) -> bool:
        """Check if the flow is in single agent mode.

        Returns
        -------
        bool
            True if the flow is in single agent mode, False otherwise.
        """
        return self._single_agent_mode

    @property
    def ordered_flow(
        self,
    ) -> List[Tuple[WaldiezChat, WaldiezAgent, WaldiezAgent]]:
        """Get the ordered flow."""
        if not self._ordered_flow:
            self._ordered_flow = self._get_flow_order()
        return self._ordered_flow

    def get_agent_by_id(self, agent_id: str) -> WaldiezAgent:
        """Get the agent by ID.

        Parameters
        ----------
        agent_id : str
            The ID of the agent.

        Returns
        -------
        WaldiezAgent
            The agent.

        Raises
        ------
        ValueError
            If the agent with the given ID is not found.
        """
        for agent in self.data.agents.members:
            if agent.id == agent_id:
                return agent
        raise ValueError(f"Agent with ID {agent_id} not found.")

    def _get_flow_order(
        self,
    ) -> List[Tuple[WaldiezChat, WaldiezAgent, WaldiezAgent]]:
        """Get the ordered flow."""
        # in the chats, there is the 'order' field, we use this,
        # we only keep the ones with order >=0
        # and sort them by this property
        ordered_flow: List[Tuple[WaldiezChat, WaldiezAgent, WaldiezAgent]] = []
        # if swarm, we only keep the first chat
        if self.is_swarm_flow:
            ordered_flow = self._get_swarm_flow()
        if ordered_flow:
            return ordered_flow
        for chat in self.data.chats:
            if chat.data.order < 0:
                continue
            source = self.get_agent_by_id(chat.source)
            target = self.get_agent_by_id(chat.target)
            ordered_flow.append((chat, source, target))
        if not ordered_flow:
            if len(self.data.chats) == 1:
                chat = self.data.chats[0]
                source = self.get_agent_by_id(chat.source)
                target = self.get_agent_by_id(chat.target)
                ordered_flow.append((chat, source, target))
        return ordered_flow

    def _get_swarm_flow(
        self,
    ) -> List[Tuple[WaldiezChat, WaldiezAgent, WaldiezAgent]]:
        # valid "first" chat:
        # - source is a user|rag_user and target is a swarm
        # - source is a swarm and target is a  (and source.is_initial)
        valid_chats: List[WaldiezChat] = []
        for chat in self.data.chats:
            target = self.get_agent_by_id(chat.target)
            source = self.get_agent_by_id(chat.source)
            if (
                source.agent_type in ["user", "rag_user"]
                and target.agent_type == "swarm"
            ):
                return [(chat, source, target)]
            if source.agent_type == "swarm" and target.agent_type == "swarm":
                valid_chats.append(chat)
        if not valid_chats:
            return []
        for valid_chat in valid_chats:
            source = self.get_agent_by_id(valid_chat.source)
            if isinstance(source, WaldiezSwarmAgent) and source.is_initial:
                return [
                    (
                        valid_chat,
                        source,
                        self.get_agent_by_id(valid_chat.target),
                    )
                ]
        first_chat: Optional[WaldiezChat] = None
        # first check the order
        by_order = sorted(
            filter(lambda edge: edge.data.order >= 0, valid_chats),
            key=lambda edge: edge.data.order,
        )
        if not by_order:
            # let's order by position
            by_position = sorted(
                valid_chats,
                key=lambda chat: chat.data.position,
            )
            if by_position:
                first_chat = by_position[0]
            else:
                first_chat = valid_chats[0]
        else:
            first_chat = by_order[0]
        if first_chat:
            source = self.get_agent_by_id(first_chat.source)
            target = self.get_agent_by_id(first_chat.target)
            return [(first_chat, source, target)]
        return []

    def get_agent_connections(
        self, agent_id: str, all_chats: bool = True
    ) -> List[str]:
        """Get the agent connections.

        Parameters
        ----------
        agent_id : str
            The ID of the agent.
        all_chats : bool, optional
            If True, get the connections from all the chats, otherwise
            get the connections from the ordered flow (main chat flow).

        Returns
        -------
        List[str]
            The list of agent ids that the agent with the given ID connects to.
        """
        connections: List[str] = []
        if all_chats:
            for chat in self.data.chats:
                if chat.source == agent_id:
                    connections.append(chat.target)
                if chat.target == agent_id:
                    connections.append(chat.source)
        else:
            for _, source, target in self.ordered_flow:
                if source.id == agent_id:
                    connections.append(target.id)
                if target.id == agent_id:
                    connections.append(source.id)
        return connections

    def get_group_chat_members(
        self, group_manager_id: str
    ) -> List[WaldiezAgent]:
        """Get the group chat members.

        Parameters
        ----------
        group_manager_id : str
            The ID of the group manager.

        Returns
        -------
        List[WaldiezAgent]
            The list of group chat
        """
        agent = self.get_agent_by_id(group_manager_id)
        if agent.agent_type != "manager":
            return []
        connections = self.get_agent_connections(
            group_manager_id,
            all_chats=True,
        )
        return [self.get_agent_by_id(member_id) for member_id in connections]

    def get_initial_swarm_agent(self) -> Optional[WaldiezAgent]:
        """Get the initial swarm agent.

        Returns
        -------
        Optional[WaldiezAgent]
            The initial swarm agent if found, None otherwise.
        """
        fallback_agent = None
        for chat in self.data.chats:
            source_agent = self.get_agent_by_id(chat.source)
            target_agent = self.get_agent_by_id(chat.target)
            if (
                target_agent.agent_type == "swarm"
                and source_agent.agent_type != "swarm"
            ):
                return target_agent
            if (
                source_agent.agent_type == "swarm"
                and target_agent.agent_type == "swarm"
            ):
                fallback_agent = source_agent
                break
        for swarm_agent in self.data.agents.swarm_agents:
            if swarm_agent.is_initial:
                return swarm_agent
        return fallback_agent

    def get_swarm_chat_members(
        self,
        initial_agent: WaldiezAgent,
    ) -> Tuple[List[WaldiezAgent], Optional[WaldiezAgent]]:
        """Get the swarm chat members.

        Parameters
        ----------
        initial_agent : WaldiezAgent
            The initial agent.

        Returns
        -------
        Tuple[List[WaldiezAgent], Optional[WaldiezAgent]]
            The list of swarm chat members and the user agent if any.
        """
        if initial_agent.agent_type != "swarm":
            return [], None
        members: List[WaldiezAgent] = [initial_agent]
        user_agent: Optional[WaldiezAgent] = None
        visited_agents = set()
        visited_agents.add(initial_agent.id)
        connections = self.get_agent_connections(
            initial_agent.id,
            all_chats=True,
        )
        while connections:
            agent_id = connections.pop()
            if agent_id in visited_agents:
                continue
            agent = self.get_agent_by_id(agent_id)
            visited_agents.add(agent_id)
            if agent.agent_type == "swarm":
                members.append(agent)
                connections.extend(
                    self.get_agent_connections(agent_id, all_chats=True)
                )
            if agent.agent_type in ["user", "rag_user"] and not user_agent:
                user_agent = agent
        return members, user_agent

    def _validate_agent_connections(self) -> None:
        for agent in self.data.agents.members:
            if not any(
                agent.id in (chat.source, chat.target)
                for chat in self.data.chats
            ):
                raise ValueError(
                    f"Agent {agent.id} ({agent.name}) "
                    "does not connect to any other node."
                )

    @model_validator(mode="after")
    def validate_flow(self) -> Self:
        """Flow validation.

        - unique node ids
        - there are at least two agents
            - (or a single agent but not a group manager or a swarm agent)
        - all the agents connect to at least one other agent
        - all the linked agent skills are found in the flow
        - all the linked agent models are found in the flow
        - all the managers have at least one member in the chat group
        - the ordered flow (chats with position >=0) is not empty
        - all agents' code execution config functions exist in the flow skills
        - if swarm flow, there is at least one swarm agent
        - if swarm flow, there is an initial swarm agent

        Returns
        -------
        WaldiezFlow
            The validated flow.

        Raises
        ------
        ValueError
            If the ordered flow is empty.
            If the model IDs are not unique.
            If the skill IDs are not unique.
            If the agents do not connect to any other node.
            If the manager's group chat has no members.
        """
        all_members = list(self.data.agents.members)
        if len(all_members) == 1:
            return self.validate_single_agent_mode(all_members[0])
        if not self.ordered_flow:
            raise ValueError("The ordered flow is empty.")
        model_ids = self.validate_flow_models()
        skills_ids = self.validate_flow_skills()
        self.data.agents.validate_flow(model_ids, skills_ids)
        self._validate_agent_connections()
        if self.is_swarm_flow:
            for swarm_agent in self.data.agents.swarm_agents:
                check_handoff_to_nested_chat(
                    swarm_agent,
                    all_agents=list(self.data.agents.members),
                    all_chats=self.data.chats,
                )
        return self

    def validate_flow_models(self) -> List[str]:
        """Validate the flow models.

        Returns
        -------
        List[str]
            The list of model IDs.

        Raises
        ------
        ValueError
            If the model IDs are not unique.
        """
        model_ids = [model.id for model in self.data.models]
        if len(model_ids) != len(set(model_ids)):
            raise ValueError("Model IDs must be unique.")
        return model_ids

    def validate_flow_skills(self) -> List[str]:
        """Validate the flow skills.

        Returns
        -------
        List[str]
            The list of skill IDs.

        Raises
        ------
        ValueError
            If the skill IDs are not unique.
        """
        skill_ids = [skill.id for skill in self.data.skills]
        if len(skill_ids) != len(set(skill_ids)):
            raise ValueError("Skill IDs must be unique.")
        return skill_ids

    def validate_single_agent_mode(self, member: WaldiezAgent) -> Self:
        """Flow validation for single agent mode.

        Parameters
        ----------
        member : WaldiezAgent
            The only agent in the flow

        Returns
        -------
        WaldiezFlow
            The validated flow.

        Raises
        ------
        ValueError
            - If the only agent is a group manager or a swarm agent.
            - If the model IDs are not unique.
            - If the skill IDs are not unique.
        """
        if member.agent_type in ["manager", "swarm"]:
            raise ValueError(
                "In single agent mode, "
                "the agent must not be a group manager or a swarm agent."
            )
        model_ids = self.validate_flow_models()
        skills_ids = self.validate_flow_skills()
        self.data.agents.validate_flow(model_ids, skills_ids)
        self._single_agent_mode = True
        return self
