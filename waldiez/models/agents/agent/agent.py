# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-public-methods
"""Base agent class to be inherited by all agents."""

import warnings
from typing import TYPE_CHECKING

from pydantic import Field, field_validator
from typing_extensions import Annotated, Literal

from ...common import (
    WaldiezBase,
    WaldiezGroupOrNestedTarget,
    WaldiezHandoff,
    now,
)
from .agent_data import WaldiezAgentData
from .agent_type import WaldiezAgentType
from .code_execution import WaldiezAgentCodeExecutionConfig
from .nested_chat import WaldiezAgentNestedChat, WaldiezAgentNestedChatMessage

if TYPE_CHECKING:
    # noinspection PyUnusedImports
    from ...chat import WaldiezChat


# noinspection PyUnresolvedReferences,PyNestedDecorators
class WaldiezAgent(WaldiezBase):
    """Waldiez Agent to be inherited by all other agents.

    Attributes
    ----------
    id : str
        The ID of the agent.
    type : Literal["agent"]
        The type of the "node" in a graph: "agent"
    agent_type : WaldiezAgentType
        The type of the agent
    name: str
        The name of the agent.
    description : str
        The description of the agent.
    tags : list[str]
        Tags for this agent.
    requirements : list[str]
        Python requirements for the agent.
    created_at : str
        The date and time when the agent was created.
    updated_at : str
        The date and time when the agent was last updated.
    data: WaldiezAgentData
        The data (properties) of this agent.
        See `waldiez.models.agents.WaldiezAgentData` for more info.

    Functions
    ---------
    validate_linked_tools(tool_ids: list[str], agent_ids: list[str])
        Validate the tools linked to the agent.
    validate_linked_models(model_ids: list[str])
        Validate the models linked to the agent.
    """

    id: Annotated[
        str, Field(..., title="ID", description="The agents unique id")
    ]
    type: Annotated[
        Literal["agent"],
        Field(
            "agent",
            title="Type",
            description="The type of the 'node' in a graph.",
        ),
    ] = "agent"
    agent_type: Annotated[
        WaldiezAgentType,
        Field(
            ...,
            title="Agent type",
            description=(
                "The type of the agent: user_proxy, assistant, group_manager, "
                "rag_user_proxy or reasoning"
            ),
        ),
    ]
    name: Annotated[
        str, Field(..., title="Name", description="The name of the agent")
    ]
    description: Annotated[
        str,
        Field(
            default="Agent's description",
            title="Description",
            description="The description of the agent",
        ),
    ] = "Agent's description"
    tags: Annotated[
        list[str],
        Field(
            title="Tags",
            description="Tags of the agent",
            default_factory=list,
        ),
    ] = []
    requirements: Annotated[
        list[str],
        Field(
            title="Requirements",
            description="Python requirements for the agent",
            default_factory=list,
        ),
    ] = []
    created_at: Annotated[
        str,
        Field(
            title="Created at",
            description="The date and time when the agent was created",
            default_factory=now,
        ),
    ]
    updated_at: Annotated[
        str,
        Field(
            title="Updated at",
            description="The date and time when the agent was last updated",
            default_factory=now,
        ),
    ]
    data: Annotated[
        WaldiezAgentData,
        Field(
            title="Data",
            description="The data (properties) of the agent",
            default_factory=WaldiezAgentData,  # pyright: ignore
        ),
    ]

    _handoffs: Annotated[
        list[WaldiezHandoff],
        Field(
            init=False,  # this is not a field in the constructor
            default_factory=list[WaldiezHandoff],
            title="Handoffs",
            description=(
                "A list of handoffs (target ids) to register. "
                "These are used to transfer control to another agent or chat."
            ),
        ),
    ] = []

    _checked_nested_chats: Annotated[bool, Field(init=False, default=False)] = (
        False
    )
    _checked_handoffs: Annotated[bool, Field(init=False, default=False)] = False

    @property
    def args_to_skip(self) -> list[str]:
        """Get the set of arguments to skip when generating the agent string.

        Returns
        -------
        list[str]
            The list of arguments to skip.
        """
        if self.is_doc_agent:
            return [
                "description",
                "human_input_mode",
                "max_consecutive_auto_reply",
                "default_auto_reply",
                "code_execution_config",
                "is_termination_msg",
                "functions",
                "update_agent_state_before_reply",
            ]
        return []

    @property
    def handoffs(self) -> list[WaldiezHandoff]:
        """Get the handoffs for this agent.

        Returns
        -------
        list[WaldiezHandoff]
            The list of handoffs for this agent.

        Raises
        ------
        RuntimeError
            If handoffs have not been gathered yet.
        """
        if not self._checked_handoffs:
            raise RuntimeError(
                "Handoffs have not been gathered yet. "
                "Call gather_handoffs() first."
            )
        return self._handoffs

    @field_validator("agent_type")
    @classmethod
    def validate_agent_type(cls, v: WaldiezAgentType) -> WaldiezAgentType:
        """Validate the agent type.

        Parameters
        ----------
        v : WaldiezAgentType
            The agent type.

        Returns
        -------
        WaldiezAgentType
            The validated agent type.

        Raises
        ------
        ValueError
            If the agent type is not valid.
        """

        def _get_warning_message(old_type: str, new_type: str) -> str:
            return (
                f"The agent type '{old_type}' is deprecated. "
                f"Use '{new_type}' instead."
            )

        if v == "user":
            warnings.warn(
                _get_warning_message("user", "user_proxy"),
                DeprecationWarning,
                stacklevel=2,
            )
            return "user_proxy"
        if v == "rag_user":
            warnings.warn(
                _get_warning_message("rag_user", "rag_user_proxy"),
                DeprecationWarning,
                stacklevel=2,
            )
            return "rag_user_proxy"
        return v

    @property
    def is_group_member(self) -> bool:
        """Check if the agent is a group member.

        Returns
        -------
        bool
            True if the agent is a group member, False otherwise.
        """
        return (
            self.agent_type not in ("group_manager", "manager")
            and self.data.parent_id is not None
        )

    @property
    def is_captain(self) -> bool:
        """Check if the agent is a captain.

        Returns
        -------
        bool
            True if the agent is a captain, False otherwise.
        """
        return self.agent_type == "captain"

    @property
    def is_reasoning(self) -> bool:
        """Check if the agent is a reasoning agent.

        Returns
        -------
        bool
            True if the agent is a reasoning agent, False otherwise.
        """
        return self.agent_type == "reasoning"

    @property
    def is_user(self) -> bool:
        """Check if the agent is a user.

        Returns
        -------
        bool
            True if the agent is a user, False otherwise.
        """
        return self.agent_type in (
            "user",
            "user_proxy",
            "rag_user",
            "rag_user_proxy",
        )

    @property
    def is_assistant(self) -> bool:
        """Check if the agent is an assistant.

        Returns
        -------
        bool
            True if the agent is an assistant, False otherwise.
        """
        return self.agent_type == "assistant"

    @property
    def is_rag_user(self) -> bool:
        """Check if the agent is a RAG user.

        Returns
        -------
        bool
            True if the agent is a RAG user, False otherwise.
        """
        return self.agent_type in ("rag_user", "rag_user_proxy")

    @property
    def is_doc_agent(self) -> bool:
        """Check if the agent is a doc agent.

        Returns
        -------
        bool
            True if the agent is a doc agent, False otherwise.
        """
        return self.agent_type == "doc_agent"

    @property
    def is_group_manager(self) -> bool:
        """Check if the agent is a group manager.

        Returns
        -------
        bool
            True if the agent is a group manager, False otherwise.
        """
        return self.agent_type in ("group_manager", "manager")

    @property
    def ag2_class(self) -> str:
        """Return the AG2 class of the agent."""
        class_name = "ConversableAgent"
        if self.is_group_member:
            return self.get_group_member_class_name()
        if self.is_assistant:  # pragma: no branch
            return self.get_assistant_class_name()
        if self.is_user:
            class_name = "UserProxyAgent"
        if self.is_rag_user:
            class_name = "RetrieveUserProxyAgent"
        if self.is_reasoning:
            class_name = "ReasoningAgent"
        if self.is_captain:
            class_name = "CaptainAgent"
        if self.is_group_manager:
            class_name = "GroupChatManager"
        if self.is_doc_agent:
            class_name = "DocAgent"
        return class_name  # pragma: no cover

    def get_group_member_class_name(self) -> str:
        """Get the class name for a group member agent.

        Returns
        -------
        str
            The class name for the group member agent.
        """
        if (
            getattr(self.data, "is_multimodal", False) is True
        ):  # pragma: no branch
            return "MultimodalConversableAgent"
        if self.is_captain:  # pragma: no branch
            return "CaptainAgent"
        if self.is_reasoning:  # pragma: no branch
            return "ReasoningAgent"
        if self.is_doc_agent:  # pragma: no branch
            return "DocAgent"
        return "ConversableAgent"  # pragma: no cover

    def get_assistant_class_name(self) -> str:
        """Get the class name for an assistant agent.

        Returns
        -------
        str
            The class name for the assistant agent.
        """
        if getattr(self.data, "is_multimodal", False) is True:
            class_name = "MultimodalConversableAgent"
        else:
            class_name = "AssistantAgent"
        return class_name  # pragma: no cover

    @property
    def ag2_imports(self) -> set[str]:
        """Return the AG2 imports of the agent.

        Returns
        -------
        set[str]
            A set of import statements required for the agent class.

        Raises
        ------
        ValueError
            If the agent class is unknown and no imports are defined.
        """
        agent_class = self.ag2_class
        imports = {"import autogen"}
        match agent_class:
            case "AssistantAgent":
                imports.add("from autogen import AssistantAgent")
            case "UserProxyAgent":
                imports.add("from autogen import UserProxyAgent")
            case "RetrieveUserProxyAgent":
                imports.add(
                    "from autogen.agentchat.contrib.retrieve_user_proxy_agent "
                    "import RetrieveUserProxyAgent"
                )
            case "MultimodalConversableAgent":
                imports.add(
                    "from "
                    "autogen.agentchat.contrib.multimodal_conversable_agent "
                    "import MultimodalConversableAgent"
                )
            case "ReasoningAgent":
                imports.add(
                    "from autogen.agents.experimental import ReasoningAgent"
                )
            case "CaptainAgent":
                imports.add(
                    "from autogen.agentchat.contrib.captainagent "
                    "import CaptainAgent"
                )
            case "GroupChatManager":  # pragma: no branch
                imports.add("from autogen import GroupChat")
                imports.add("from autogen.agentchat import GroupChatManager")
                imports.add(
                    "from autogen.agentchat.group import ContextVariables"
                )
            case "DocAgent":
                imports.add("from autogen.agents.experimental import DocAgent")
            case "ConversableAgent":
                imports.add("from autogen import ConversableAgent")
            case _:  # pragma: no cover
                raise ValueError(
                    f"Unknown agent class: {agent_class}. "
                    "Please implement the imports for this class."
                )
        return imports

    def validate_linked_tools(
        self, tool_ids: list[str], agent_ids: list[str]
    ) -> None:
        """Validate the tools.

        Parameters
        ----------
        tool_ids : list[str]
            The list of tool IDs.
        agent_ids : list[str]
            The list of agent IDs.

        Raises
        ------
        ValueError
            If a tool or agent is not found
        """
        # if the config dict has tools, make sure they can be found
        for tool in self.data.tools:
            if tool.id not in tool_ids:
                raise ValueError(
                    f"Tool '{tool.id}' not found in agent's {self.id} tools"
                )
            if tool.executor_id not in agent_ids:
                raise ValueError(
                    f"Agent '{tool.executor_id}' not found in agents"
                )

    def validate_linked_models(self, model_ids: list[str]) -> None:
        """Validate the models.

        Parameters
        ----------
        model_ids : List[str]
            The list of model IDs.

        Raises
        ------
        ValueError
            If a model is not found
        """
        # if the config dict has models, make sure they can be found
        for model in self.data.model_ids:
            if model not in model_ids:
                raise ValueError(
                    f"Model '{model}' not found in agent's {self.id} models"
                )

    def validate_code_execution(self, tool_ids: list[str]) -> None:
        """Validate the code execution config.

        Parameters
        ----------
        tool_ids : list[str]
            The list of tool IDs.

        Raises
        ------
        ValueError
            If a function is not found
        """
        # if the config dict has functions, make sure they can be found
        if isinstance(
            self.data.code_execution_config, WaldiezAgentCodeExecutionConfig
        ):
            for function in self.data.code_execution_config.functions:
                if function not in tool_ids:
                    raise ValueError(
                        f"Function '{function}' not found in tools"
                    )

    def gather_nested_chats(
        self,
        all_agents: list["WaldiezAgent"],
        all_chats: list["WaldiezChat"],
    ) -> None:
        """Gather the nested chats for the agent.

        Parameters
        ----------
        all_agents : list["WaldiezAgent"]
            All the agents in the flow.
        all_chats : list["WaldiezChat"]
            All the chats in the flow.
        """
        if self._checked_nested_chats:
            return
        self._checked_nested_chats = True
        all_chat_ids = {chat.id for chat in all_chats}
        all_agent_ids = {agent.id for agent in all_agents}
        # only use chats that do have messages and "triggered_by"
        nested_chats: list[WaldiezAgentNestedChat] = []
        for chat in self.data.nested_chats:
            if not chat.messages or not chat.triggered_by:  # pragma: no cover
                continue
            # make sure the ids exist
            chat.messages = [
                message
                for message in chat.messages
                if message.id in all_chat_ids
            ]
            chat.triggered_by = [
                agent_id
                for agent_id in chat.triggered_by
                if agent_id in all_agent_ids
            ]
            if chat.messages and chat.triggered_by:  # pragma: no branch
                nested_chats.append(chat)
        self.data.nested_chats = nested_chats

    def gather_handoff_ids(
        self,
        group_chats: list["WaldiezChat"],
        nested_chat_id: str,
    ) -> None:
        """Gather all the handoff IDs for this agent.

        This method will gather all the handoff IDs from the agent's data,
        including those that might not be passed in data.handoffs.

        Parameters
        ----------
        group_chats : list["WaldiezChat"]
            The list of group chats that this agent is part of.
        nested_chat_id : str
            The ID of the nested chat to include in handoffs if it exists.

        """
        existing_handoffs = set(self.data.handoffs)
        has_nested_chat = len(self.data.nested_chats) > 0 and any(
            chat.messages for chat in self.data.nested_chats
        )
        # Step 1: Add missing group chat handoffs
        # These are chats between group members (equivalent to groupEdges)
        for chat in group_chats:
            if chat.id not in existing_handoffs:
                self.data.handoffs.append(chat.id)
                existing_handoffs.add(chat.id)

        # Step 2: Add nested chat if it exists and is not already in handoffs
        if (
            has_nested_chat and nested_chat_id not in existing_handoffs
        ):  # pragma: no branch
            self.data.handoffs.append(nested_chat_id)
            existing_handoffs.add(nested_chat_id)

        # Step 3: Validate all handoffs still exist
        # Remove any handoffs that reference non-existent chats
        valid_chat_ids = {chat.id for chat in group_chats}
        if has_nested_chat:  # pragma: no branch
            valid_chat_ids.add(nested_chat_id)

        # Filter out invalid handoffs
        self.data.handoffs = [
            handoff
            for handoff in self.data.handoffs
            if handoff in valid_chat_ids
        ]

    def gather_handoffs(
        self,
        all_agents: list["WaldiezAgent"],
        all_chats: list["WaldiezChat"],
    ) -> None:
        """Gather all the handoffs including.

        Including ones that might not be passed in data.handoffs.

        Parameters
        ----------
        all_agents : list["WaldiezAgent"]
            The list of all agents in the flow.
        all_chats : list["WaldiezChat"]
            The list of all chats in the flow.

        """
        self.gather_nested_chats(all_agents, all_chats)
        if not self.is_group_member or self._checked_handoffs:
            return
        nested_chat_id = "nested-chat"
        self._checked_handoffs = True
        group_chats, group_nested_chats = self._get_agent_chats(
            all_agents, all_chats
        )
        if group_nested_chats:  # pragma: no branch
            self._ensure_one_nested_chat(group_nested_chats)
        self.gather_handoff_ids(
            group_chats=group_chats, nested_chat_id=nested_chat_id
        )
        # generate the actual handoff instances
        for handoff_id in self.data.handoffs:
            if handoff_id == nested_chat_id:
                nested_chat_handoff = self._generate_handoff_from_nested(
                    group_nested_chats
                )
                if nested_chat_handoff:  # pragma: no branch
                    self._handoffs.append(nested_chat_handoff)
            else:
                chat = next(
                    (chat for chat in group_chats if chat.id == handoff_id),
                    None,
                )
                if chat:  # pragma: no branch
                    self._handoffs.append(chat.as_handoff())

    def _ensure_one_nested_chat(
        self,
        group_nested_chats: list["WaldiezChat"],
    ) -> None:
        """Ensure that there is at least one nested chat."""
        if not self.data.nested_chats:  # pragma: no branch
            # create one from the group chats.
            triggered_by = [self.id]
            messages = [
                WaldiezAgentNestedChatMessage(id=chat.id, is_reply=False)
                for chat in group_nested_chats
            ]
            chats_with_condition = [
                chat
                for chat in group_nested_chats
                if chat.condition.is_not_empty()
            ]
            if not chats_with_condition:
                chat_with_condition = group_nested_chats[0]
            else:
                chat_with_condition = chats_with_condition[0]
            nested_chat = WaldiezAgentNestedChat(
                triggered_by=triggered_by,
                messages=messages,
                condition=chat_with_condition.condition,  # pyright: ignore
                available=chat_with_condition.available,  # pyright: ignore
            )
            self.data.nested_chats.append(nested_chat)

    def _generate_handoff_from_nested(
        self,
        group_nested_chats: list["WaldiezChat"],
    ) -> WaldiezHandoff | None:
        """Generate a handoff from a nested chat.

        Parameters
        ----------
        group_nested_chats : list["WaldiezChat"]
            The list of nested (out of the group) chats
            that this agent is part of.

        Returns
        -------
        WaldiezHandoff | None
            A handoff instance if a nested chat with messages exists,
            otherwise None.
        """
        if not group_nested_chats:
            return None
        # Check if we have any nested chats with messages
        if not self.data.nested_chats or not any(
            chat.messages for chat in self.data.nested_chats
        ):
            return None
        # get the first (and probably only) nested chat
        nested_chat = self.data.nested_chats[0]
        target = WaldiezGroupOrNestedTarget(
            target_type="NestedChatTarget",
            value=[message.id for message in nested_chat.messages],
        )
        return WaldiezHandoff(
            target=target,
            available=nested_chat.available,
            condition=nested_chat.condition,
        )

    def _get_agent_chats(
        self,
        all_agents: list["WaldiezAgent"],
        all_chats: list["WaldiezChat"],
    ) -> tuple[list["WaldiezChat"], list["WaldiezChat"]]:
        """Get all chats originating from this agent.

        Parameters
        ----------
        all_agents : list["WaldiezAgent"]
            The list of all agents.
        all_chats : list["WaldiezChat"]
            The list of all chats if the flow.

        Returns
        -------
        tuple[list["WaldiezChat"], list["WaldiezChat"]]
            A tuple containing two lists:
            - group_chats: Chats that are between group members.
            - group_nested_chats: Chats that are from this agent to an agent
            that is not a group member.
        """
        agent_chats: list["WaldiezChat"] = [
            chat for chat in all_chats if chat.source == self.id
        ]
        group_chats: list["WaldiezChat"] = []
        group_nested_chats: list["WaldiezChat"] = []
        # make sure we have prepared the nested chats
        for chat in agent_chats:
            target_agent = next(
                (agent for agent in all_agents if agent.id == chat.target),
                None,
            )
            if target_agent:  # pragma: no branch
                if target_agent.is_group_member:
                    group_chats.append(chat)
                else:
                    group_nested_chats.append(chat)
        return group_chats, group_nested_chats
