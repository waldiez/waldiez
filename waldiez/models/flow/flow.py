# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pyright: reportCallIssue=false
"""Waldiez flow model."""

from functools import cached_property

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ..agents import WaldiezAgent, WaldiezGroupManager
from ..chat import WaldiezChat
from ..common import WaldiezBase, get_id, get_waldiez_version, now
from .connection import WaldiezAgentConnection
from .flow_data import WaldiezFlowData
from .naming import WaldiezUniqueNames, ensure_unique_names


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
    tags : list[str]
        The tags of the flow.
    requirements : list[str]
        The requirements of the flow.
    skip_deps : bool | None
        Skip installing dependencies.
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
            default_factory=get_id,
        ),
    ]
    version: Annotated[
        str,
        Field(
            default_factory=get_waldiez_version,
            description="The version waldiez that was used to create the flow",
            title="Version",
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
        list[str],
        Field(
            description="The tags of the flow",
            title="Tags",
            default_factory=list,
        ),
    ]
    requirements: Annotated[
        list[str],
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
            default_factory=get_id,
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
    _ordered_flow: list[WaldiezAgentConnection] | None = None
    _single_agent_mode: bool = False
    _is_group_chat: bool = False

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
    def skip_deps(self) -> bool:
        """Check if we should install dependencies before running the flow."""
        return self.data.skip_deps is True

    @property
    def is_group_chat(self) -> bool:
        """Check if the flow is a group chat.

        Returns
        -------
        bool
            True if the flow is a group chat, False otherwise.
        """
        return self._is_group_chat

    @property
    def cache_seed(self) -> int | None:
        """Check if the flow has caching disabled.

        Returns
        -------
        bool
            True if the flow has caching disabled, False otherwise.
        """
        return self.data.cache_seed

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
    ) -> list[WaldiezAgentConnection]:
        """Get the ordered flow."""
        if self._ordered_flow is None:
            self._ordered_flow = self._get_flow_order()
        return self._ordered_flow

    @cached_property
    def unique_names(self) -> WaldiezUniqueNames:
        """Get the unique names for the flow.

        Returns
        -------
        WaldiezUniqueNames
            The unique names for the flow.
        """
        return ensure_unique_names(
            flow_id=self.id,
            flow_name=self.name,
            flow_agents=self.data.agents.members,
            flow_chats=self.data.chats,
            flow_tools=self.data.tools,
            flow_models=self.data.models,
        )

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

    @classmethod
    def default(cls) -> "WaldiezFlow":
        """Get the default flow.

        Returns
        -------
        WaldiezFlow
            The default flow.
        """
        an_id = get_id()
        return cls(
            id=an_id,
            storage_id=an_id,
            created_at=now(),
            updated_at=now(),
            type="flow",
            name="Default Flow",
            description="Default Flow",
            tags=[],
            requirements=[],
            data=WaldiezFlowData.default(),
        )

    def get_group_members(self, group_id: str) -> list[WaldiezAgent]:
        """Get the group members.

        Parameters
        ----------
        group_id : str
            The ID of the group.

        Returns
        -------
        list[WaldiezAgent]
            The list of group members.
        """
        return [
            agent
            for agent in self.data.agents.members
            if agent.data.parent_id == group_id
        ]

    def get_agent_connections(
        self, agent_id: str, all_chats: bool = True
    ) -> list[str]:
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
        list[str]
            The list of agent ids that the agent with the given ID connects to.
        """
        connections: list[str] = []
        if all_chats:
            for chat in self.data.chats:
                if chat.source == agent_id:
                    connections.append(chat.target)
                if chat.target == agent_id:
                    connections.append(chat.source)
        else:
            for entry in self.ordered_flow:
                source = entry["source"]
                target = entry["target"]
                if source.id == agent_id:
                    connections.append(target.id)
                if target.id == agent_id:
                    connections.append(source.id)
        return connections

    def get_group_chat_members(
        self, group_manager_id: str
    ) -> list[WaldiezAgent]:
        """Get the group chat members.

        Parameters
        ----------
        group_manager_id : str
            The ID of the group manager.

        Returns
        -------
        list[WaldiezAgent]
            The list of group chat members.
        """
        agent = self.get_agent_by_id(group_manager_id)
        if not agent.is_group_manager or not isinstance(
            agent, WaldiezGroupManager
        ):
            return []
        members = [
            agent
            for agent in self.data.agents.members
            if agent.data.parent_id == group_manager_id
        ]
        if agent.data.speakers.selection_method != "round_robin":
            return members
        ordered_ids = agent.get_speakers_order()
        if not ordered_ids:
            return members
        members_dict = {member.id: member for member in members}
        ordered_members = [
            members_dict[member_id]
            for member_id in ordered_ids
            if member_id in members_dict
        ]
        return ordered_members

    def _get_flow_order(
        self,
    ) -> list[WaldiezAgentConnection]:
        """Get the ordered flow."""
        if self._is_group_chat:
            # noinspection PyTypeChecker
            return self._get_group_chat_flow()
        # in the chats, there is the 'order' field, we use this,
        # we only keep the ones with order >=0
        # and sort them by this property
        ordered_flow: list[WaldiezAgentConnection] = []
        for chat in self.data.chats:
            if chat.data.order < 0:
                continue
            source = self.get_agent_by_id(chat.source)
            target = self.get_agent_by_id(chat.target)
            ordered_flow.append(
                {
                    "source": source,
                    "target": target,
                    "chat": chat,
                }
            )
            # ordered_flow.append((chat, source, target))
        if not ordered_flow:
            if len(self.data.chats) == 1:
                chat = self.data.chats[0]
                source = self.get_agent_by_id(chat.source)
                target = self.get_agent_by_id(chat.target)
                ordered_flow.append(
                    {
                        "source": source,
                        "target": target,
                        "chat": chat,
                    }
                )
        return ordered_flow

    def get_root_group_manager(self) -> WaldiezGroupManager:
        """Get the root group manager.

        Returns
        -------
        WaldiezGroupManager
            The root group manager.

        Raises
        ------
        ValueError
            If no group manager is found.
        """
        for agent in self.data.agents.groupManagerAgents:
            if agent.data.parent_id is None:  # pragma: no branch
                return agent
        raise ValueError("No group manager found.")

    def _get_group_chat_flow(
        self,
    ) -> list[WaldiezAgentConnection]:
        """Get the ordered flow for group chat.

        Returns
        -------
        list[WaldiezAgentConnection]
            The ordered flow for group chat.
        """
        # in a group chat there is no "order", the group manager
        # handles the conversation (using the group "pattern")
        # the only thin to check is if there is a user agent that connects
        # to the group manager agent (so that would be the first chat)
        # if found, we must then check if the message from the user
        # to the group manager is:
        #  - "text" or "none" => no need to create a group manager on ag2
        #  - "function/method" => create a group manager and a group chat on ag2
        # in the first case, the chat would be:
        # results = run_group_chat(
        #     pattern=pattern,
        #     messages=...,
        #     max_rounds=10
        # )
        # in the second case, the chat would be:
        # user.run(manager, ...)
        user_agent: WaldiezAgent | None = None
        to_root_manager: WaldiezChat | None = None
        root_manager: WaldiezGroupManager = self.get_root_group_manager()
        for chat in self.data.chats:
            if chat.target == root_manager.id:  # pragma: no branch
                # check if the source is a user agent
                source = self.get_agent_by_id(chat.source)
                if source.is_user:  # pragma: no branch
                    user_agent = source
                    to_root_manager = chat
                    break
        if not to_root_manager:  # pragma: no cover
            return []
        if not user_agent:  # pragma: no cover
            return []
        return [
            {
                "source": user_agent,
                "target": root_manager,
                "chat": to_root_manager,
            }
        ]

    def _validate_agent_connections(self) -> None:
        for agent in self.data.agents.members:
            if agent.is_group_member:
                # group members are allowed
                # to not connect to any other node
                # the group manager will take care of
                # the agent/speaker connections
                continue
            if not any(
                agent.id in (chat.source, chat.target)
                for chat in self.data.chats
            ):
                msg = (
                    f"Agent {agent.id} ({agent.name}) "
                    "does not connect to any other node."
                )
                raise ValueError(msg)

    @model_validator(mode="after")
    def validate_flow(self) -> Self:
        """Flow validation.

        - unique node ids
        - there are at least two agents
            - (or a single agent but not a group manager)
        - all the agents connect to at least one other agent
        - all the linked agent tools are found in the flow
        - all the linked agent models are found in the flow
        - all the managers have at least one member in the chat group
        - the ordered flow (chats with position >=0) is not empty
        - all agents' code execution config functions exist in the flow tools
        - if group chat flow, there is at least one group manager agent
        - if group chat flow, there is an initial group member agent

        Returns
        -------
        WaldiezFlow
            The validated flow.

        Raises
        ------
        ValueError
            If the ordered flow is empty.
            If the model IDs are not unique.
            If the tool IDs are not unique.
            If the agents do not connect to any other node.
            If the manager's group chat has no members.
        """
        # self.name = self.name.lower()
        all_members = list(self.data.agents.members)
        all_chats = list(self.data.chats)
        for agent in all_members:
            agent.gather_nested_chats(
                all_agents=all_members, all_chats=all_chats
            )
            agent.gather_handoffs(all_agents=all_members, all_chats=all_chats)
        self._validate_group_chat(all_members)
        if len(all_members) == 1:
            return self._validate_single_agent_mode(all_members[0])
        ordered_flow = self.ordered_flow  # could be empty (if group chat)
        if not ordered_flow and self._ordered_flow is None:
            raise ValueError("The ordered flow is empty.")
        model_ids = self._validate_flow_models()
        tools_ids = self._validate_flow_tools()
        self.data.agents.validate_flow(model_ids, tools_ids)
        self._validate_agent_connections()
        return self

    def _validate_flow_models(self) -> list[str]:
        """Validate the flow models.

        Returns
        -------
        list[str]
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

    def _validate_flow_tools(self) -> list[str]:
        """Validate the flow tools.

        Returns
        -------
        list[str]
            The list of tool IDs.

        Raises
        ------
        ValueError
            If the tool IDs are not unique.
        """
        tool_ids = [tool.id for tool in self.data.tools]
        if len(tool_ids) != len(set(tool_ids)):
            raise ValueError("Tool IDs must be unique.")
        return tool_ids

    def _validate_single_agent_mode(self, member: WaldiezAgent) -> Self:
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
            - If the only agent is a group manager.
            - If the model IDs are not unique.
            - If the tool IDs are not unique.
        """
        if member.is_group_manager:  # pragma: no cover
            raise ValueError(
                "In single agent mode, the agent must not be a group manager."
            )
        model_ids = self._validate_flow_models()
        tools_ids = self._validate_flow_tools()
        self.data.agents.validate_flow(model_ids, tools_ids)
        self._single_agent_mode = True
        return self

    def _validate_group_manager(
        self, group_manager: WaldiezGroupManager, all_member_ids: list[str]
    ) -> None:
        """Validate the group manager agents.

        Raises
        ------
        ValueError
            If there are no group manager agents.
        """
        if not group_manager.data.initial_agent_id:
            msg = (
                "The flow is a group chat but the group manager agent "
                f"{group_manager.id} has no initial agent ID."
            )
            raise ValueError(msg)
        if group_manager.data.initial_agent_id not in all_member_ids:
            msg = (
                "The flow is a group chat but the initial agent ID "
                f"{group_manager.data.initial_agent_id} is not in the flow."
            )
            raise ValueError(msg)
        group_members = self.get_group_members(group_manager.id)
        if not group_members:
            msg = (
                "The flow is a group chat but the group manager agent "
                f"{group_manager.id} has no members in the group."
            )
            raise ValueError(msg)
        group_manager.set_speakers_order(
            [member.id for member in group_members]
        )

    def _validate_group_chat(self, all_members: list[WaldiezAgent]) -> None:
        """Check if the flow is a group chat and validate it.

        Raises
        ------
        ValueError
            If the flow is a group chat and there is no group manager agent,
            if the group has no members,
            or if the group has no initial member agent.
        """
        if not self.data.agents.groupManagerAgents:
            # no group manager agents, not a group chat
            return
        self._is_group_chat = True
        if not any(agent.is_group_member for agent in self.data.agents.members):
            raise ValueError(
                "The flow is a group chat but has no members in the group."
            )
        # check if the group manager agents are the flow
        group_manager_ids = [
            agent.id for agent in self.data.agents.groupManagerAgents
        ]
        all_member_ids = [agent.id for agent in all_members]
        if not all(
            group_manager_id in all_member_ids
            for group_manager_id in group_manager_ids
        ):
            msg = (
                "The flow is a group chat but not all group manager agents are "
                "in the flow."
            )
            raise ValueError(msg)
        # check the initial_agent_id for each group
        for group_manager in self.data.agents.groupManagerAgents:
            self._validate_group_manager(group_manager, all_member_ids)
