# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common data structures for agents."""

from typing import Any, Optional, Union

from pydantic import ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel
from typing_extensions import Annotated, Literal, Self

from ...common import WaldiezBase, WaldiezTransitionTarget, update_dict
from .code_execution import WaldiezAgentCodeExecutionConfig
from .human_input_mode import WaldiezAgentHumanInputMode
from .linked_tool import WaldiezAgentLinkedTool
from .nested_chat import WaldiezAgentNestedChat
from .termination_message import WaldiezAgentTerminationMessage
from .update_system_message import WaldiezAgentUpdateSystemMessage


# noqa: E501
# pylint: disable=line-too-long
class WaldiezAgentData(WaldiezBase):
    """Waldiez Agent Data.

    Attributes
    ----------
    system_message : Optional[str]
        The agent's system message. Default: None (depends on the agent's type)
    human_input_mode : Literal["ALWAYS", "NEVER", "TERMINATE"]
        The human input mode to use for the agent.
    code_execution_config : Union[WaldiezAgentCodeExecutionConfig, False]
        The code execution config. Either False (no execution) or a dict.
    agent_default_auto_reply : Optional[str]
        The agent's default auto reply when no input is received.
    max_consecutive_auto_reply : Optional[int]
        The maximum number or consecutive auto replies to use
        before ending the chat. Default: None (no limit).
    termination : WaldiezAgentTerminationMessage
        The message termination check to use (keyword, method, none)
    model_ids: List[str]
        The ids of the models to link with the agent.
    tools : list[WaldiezAgentLinkedTool]
        A list of tools (id and executor) to register.
    nested_chats : list[WaldiezAgentNestedChat]
        A list of nested chats (triggered_by, messages), to register.
    context_variables : Optional[dict[str, Any]]
        Context variables that provide a persistent context
        for the agent. Note: This will be a reference to a shared
        context for multi-agent chats. Behaves like a dictionary
        with keys and values (akin to dict[str, Any]).
    update_agent_state_before_reply : list[str |WaldiezAgentUpdateSystemMessage]
        A list of functions, including UpdateSystemMessage,
        called to update the agent's state before it replies.
        Each function is called when the agent is selected
        and before it speaks.
    handoffs : list[WaldiezAgentHandoff]
        A list of handoffs (conditions, targets) to register.
    """

    model_config = ConfigDict(
        extra="ignore",
        alias_generator=to_camel,
        populate_by_name=True,
        # we have a field starting with "model_" (model_ids)
        # this is protected by default
        protected_namespaces=(),
    )

    system_message: Annotated[
        Optional[str],
        Field(
            None,
            title="System message",
            description="The agent's system message.",
            alias="systemMessage",
        ),
    ] = None
    human_input_mode: Annotated[
        WaldiezAgentHumanInputMode,
        Field(
            "NEVER",
            title="Human input mode",
            description="The human input mode to use for the agent.",
            alias="humanInputMode",
        ),
    ] = "NEVER"
    code_execution_config: Annotated[
        Union[WaldiezAgentCodeExecutionConfig, Literal[False]],
        Field(
            False,
            title="Code execution config",
            description=(
                "The code execution config. Either False (no execution) "
                "or a `WaldiezAgentCodeExecutionConfig` with details"
            ),
            alias="codeExecutionConfig",
        ),
    ] = False
    agent_default_auto_reply: Annotated[
        Optional[str],
        Field(
            None,
            title="Agent's default auto reply",
            description=(
                "The agent's default auto reply when no input is received."
            ),
            alias="agentDefaultAutoReply",
        ),
    ] = None
    max_consecutive_auto_reply: Annotated[
        Optional[int],
        Field(
            None,
            title="Max consecutive auto reply",
            description=(
                "The maximum number or consecutive auto replies to use "
                "before ending the chat"
            ),
            alias="maxConsecutiveAutoReply",
        ),
    ] = None
    termination: Annotated[
        WaldiezAgentTerminationMessage,
        Field(
            title="Termination",
            description=(
                "The message termination check to use (keyword, method, none)"
            ),
            default_factory=WaldiezAgentTerminationMessage,
        ),
    ]
    model_ids: Annotated[
        list[str],
        Field(
            default_factory=list,
            title="Model ID",
            description=(
                "The id of the model to link with the agent. "
                "This is a reference to a model in the models registry."
            ),
            alias="modelIds",
        ),
    ] = []
    tools: Annotated[
        list[WaldiezAgentLinkedTool],
        Field(
            default_factory=list,
            title="Tools",
            description=("A list of tools (id and executor) to register."),
        ),
    ] = []
    nested_chats: Annotated[
        list[WaldiezAgentNestedChat],
        Field(
            default_factory=list,
            description=(
                "A list of nested chats (triggers, messages, ...), to register."
            ),
            alias="nestedChats",
        ),
    ] = []
    context_variables: Annotated[
        dict[str, Any],
        Field(
            default_factory=dict,  # pyright: ignore
            title="Context variables",
            description=(
                "Context variables that provide a persistent context "
                "for the agent. Note: This will be a reference to a shared "
                "context for multi-agent chats. Behaves like a dictionary "
                "with keys and values (akin to dict[str, Any])."
            ),
            alias="contextVariables",
        ),
    ] = {}

    update_agent_state_before_reply: Annotated[
        list[Union[str, WaldiezAgentUpdateSystemMessage]],
        Field(
            title="Update Agent State Before Reply",
            alias="updateAgentStateBeforeReply",
            description=(
                "A list of functions, including UpdateSystemMessage,"
                "called to update the agent's state before it replies. "
                " Each function is called when the agent is selected "
                "and before it speaks. If not an UpdateSystemMessage, "
                "it should be a skill id."
            ),
            default_factory=list,
        ),
    ] = []
    handoffs: Annotated[
        list[str],
        Field(
            default_factory=list,
            title="Handoffs",
            description=("A list of handoffs (target ids) to register."),
        ),
    ] = []
    after_work: Annotated[
        Optional[WaldiezTransitionTarget],
        Field(
            None,
            title="After work",
            description=(
                "The target to transfer control to after the agent"
                " has finished its work. (used if in a group chat)"
            ),
            alias="afterWork",
        ),
    ] = None

    parent_id: Annotated[
        Optional[str],
        Field(
            None,
            title="Parent ID",
            description=(
                "The id of the parent agent. This is used for group chats."
            ),
            alias="parentId",
        ),
    ] = None

    @model_validator(mode="after")
    def update_context_variables(self) -> Self:
        """Update the context variables.

        Returns
        -------
        Self
            The updated instance of the class.
        """
        context_vars = update_dict(self.context_variables)
        self.context_variables = context_vars
        return self
