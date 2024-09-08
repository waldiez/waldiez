"""Waldie flow model."""

import uuid
from typing import List, Optional, Tuple

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ..agents import WaldieAgent
from ..chat import WaldieChat
from ..common import WaldieBase
from .flow_data import WaldieFlowData


class WaldieFlow(WaldieBase):
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
    data : WaldieFlowData
        The data of the flow. See `WaldieFlowData`.
    """

    id: Annotated[
        str,
        Field(
            description="The ID of the flow",
            title="ID",
            default_factory=uuid.uuid4,
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
        WaldieFlowData,
        Field(
            ...,
            description="The data of the flow",
            title="Data",
        ),
    ]

    _ordered_flow: Optional[
        List[Tuple[WaldieChat, WaldieAgent, WaldieAgent]]
    ] = None

    @property
    def ordered_flow(self) -> List[Tuple[WaldieChat, WaldieAgent, WaldieAgent]]:
        """Get the ordered flow."""
        if not self._ordered_flow:
            self._ordered_flow = self._get_flow_order()
        return self._ordered_flow

    def get_agent_by_id(self, agent_id: str) -> WaldieAgent:
        """Get the agent by ID.

        Parameters
        ----------
        agent_id : str
            The ID of the agent.

        Returns
        -------
        WaldieAgent
            The agent.

        Raises
        ------
        ValueError
            If the agent with the given ID is not found.
        """
        for user in self.data.agents.users:
            if user.id == agent_id:
                return user
        for assistant in self.data.agents.assistants:
            if assistant.id == agent_id:
                return assistant
        for manager in self.data.agents.managers:
            if manager.id == agent_id:
                return manager
        for rag_user in self.data.agents.rag_users:
            if rag_user.id == agent_id:
                return rag_user
        raise ValueError(f"Agent with ID {agent_id} not found.")

    def _get_flow_order(
        self,
    ) -> List[Tuple[WaldieChat, WaldieAgent, WaldieAgent]]:
        """Get the ordered flow."""
        # in the chats, there is the 'position' field, we use this,
        # we only keep the ones with position >=0
        # and sort them by their position
        ordered_flow: List[Tuple[WaldieChat, WaldieAgent, WaldieAgent]] = []
        sorted_chats_by_position = sorted(
            self.data.chats, key=lambda chat: chat.data.position
        )
        for chat in sorted_chats_by_position:
            if chat.data.position < 0:
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
        connections = []
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
    ) -> List[WaldieAgent]:
        """Get the group chat members.

        Parameters
        ----------
        group_manager_id : str
            The ID of the group manager.

        Returns
        -------
        List[WaldieAgent]
            The list of group chat
        """
        agent = self.get_agent_by_id(group_manager_id)
        if agent.agent_type != "manager":
            return []
        connections = self.get_agent_connections(group_manager_id)
        return [self.get_agent_by_id(member_id) for member_id in connections]

    def _validate_agent_connections(self) -> None:
        for agent in self.data.agents.members:
            if not any(
                agent.id in (chat.source, chat.target)
                for chat in self.data.chats
            ):
                raise ValueError(
                    f"Agent {agent.id} does not connect to any other node."
                )
            # already covered above
            # if agent.agent_type == "manager":
            #     chat_member_ids = self.get_agent_connections(agent.id)
            #     if not chat_member_ids:
            #         raise ValueError(
            #             f"Manager's {agent.id} group chat has no members."
            #         )

    @model_validator(mode="after")
    def validate_flow(self) -> Self:
        """Flow validation.

        - unique node ids
        - there are at least two agents
        - all the agents connect to at least one other agent
        - all the linked agent skills are found in the flow
        - all the linked agent models are found in the flow
        - all the managers have at least one member in the chat group
        - the ordered flow (chats with position >=0) is not empty
        - all agents' code execution config functions exist in the flow skills

        Returns
        -------
        WaldieFlow
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
        if not self.ordered_flow:
            raise ValueError("The ordered flow is empty.")
        model_ids = [model.id for model in self.data.models]
        if len(model_ids) != len(set(model_ids)):
            raise ValueError("Model IDs must be unique.")
        skills_ids = [skill.id for skill in self.data.skills]
        if len(skills_ids) != len(set(skills_ids)):
            raise ValueError("Skill IDs must be unique.")
        self.data.agents.validate_flow(model_ids, skills_ids)
        self._validate_agent_connections()
        return self