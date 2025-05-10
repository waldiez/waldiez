# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common data structures for agents."""

from typing import Any, Dict, List, Optional, Union

from pydantic import ConfigDict, Field
from pydantic.alias_generators import to_camel
from typing_extensions import Annotated, Literal

from ...common import WaldiezBase
from .code_execution import WaldiezAgentCodeExecutionConfig
from .handoff import WaldiezAgentHandoff
from .linked_tool import WaldiezAgentLinkedTool
from .nested_chat import WaldiezAgentNestedChat
from .termination_message import WaldiezAgentTerminationMessage


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
    model_id: Optional[str]
        The id of the model to link with the agent.
    tools : List[WaldiezAgentLinkedTool]
        A list of tools (id and executor) to register.
    nested_chats : List[WaldiezAgentNestedChat]
        A list of nested chats (triggered_by, messages), to register.
    context_variables : Optional[Dict[str, Any]]
        Context variables that provide a persistent context
        for the agent. Note: This will be a reference to a shared
        context for multi-agent chats. Behaves like a dictionary
        with keys and values (akin to dict[str, Any]).
    handoffs : List[WaldiezAgentHandoff]
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
    ]
    human_input_mode: Annotated[
        Literal["ALWAYS", "NEVER", "TERMINATE"],
        Field(
            "NEVER",
            title="Human input mode",
            description="The human input mode to use for the agent.",
            alias="humanInputMode",
        ),
    ]
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
    ]
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
    ]
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
    ]
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
    model_id: Annotated[
        Optional[str],
        Field(
            None,
            title="Model ID",
            description=(
                "The id of the model to link with the agent. "
                "This is a reference to a model in the models registry."
            ),
            alias="modelId",
        ),
    ] = None
    tools: Annotated[
        List[WaldiezAgentLinkedTool],
        Field(
            default_factory=list,
            title="Tools",
            description=("A list of tools (id and executor) to register."),
        ),
    ]
    nested_chats: Annotated[
        List[WaldiezAgentNestedChat],
        Field(
            default_factory=list,
            description=(
                "A list of nested chats (triggered_by, messages), to register."
            ),
            alias="nestedChats",
        ),
    ]
    context_variables: Annotated[
        Optional[Dict[str, Any]],
        Field(
            default_factory=dict,
            title="Context variables",
            description=(
                "Context variables that provide a persistent context "
                "for the agent. Note: This will be a reference to a shared "
                "context for multi-agent chats. Behaves like a dictionary "
                "with keys and values (akin to dict[str, Any])."
            ),
            alias="contextVariables",
        ),
    ] = None
    handoffs: Annotated[
        List[WaldiezAgentHandoff],
        Field(
            default_factory=list,
            title="Handoffs",
            description=(
                "A list of handoffs (conditions, targets) to register."
            ),
        ),
    ] = []
