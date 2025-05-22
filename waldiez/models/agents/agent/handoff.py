# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Agent Handoff class."""

import uuid
from typing import Any, Optional, Union

from pydantic import Field
from typing_extensions import Annotated, Literal

from ...common import WaldiezBase

__all__ = [
    "WaldiezTransitionTarget",
    "WaldiezAgentTarget",
    "WaldiezRandomAgentTarget",
    "WaldiezSimpleTarget",
    "WaldiezGroupOrNestedTarget",
    "WaldiezStringLLMCondition",
    "WaldiezContextStrLLMCondition",
    "WaldiezStringContextCondition",
    "WaldiezExpressionContextCondition",
    "WaldiezOnCondition",
    "WaldiezOnContextCondition",
    "WaldiezAgentHandoff",
]


class WaldiezAgentTarget(WaldiezBase):
    """Agent target for handoff.

    Attributes
    ----------
    target_type : Literal["AgentTarget"]
        The type of the transition target.
    target : str
        The agent id to transfer control to.
    order : int
        The order of the target in the list of targets.
        If -1, the order is automatically determined by the json data.
    """

    target_type: Annotated[
        Literal["AgentTarget"],
        Field("AgentTarget", description="The type of the transition target."),
    ]
    target: Annotated[
        str, Field(description="The agent id to transfer control to.")
    ]
    order: Annotated[
        int,
        Field(
            -1,
            description=(
                "The order of the target in the list of targets. "
                "If -1, the order is automatically determined by the json data."
            ),
        ),
    ] = -1


class WaldiezRandomAgentTarget(WaldiezBase):
    """Random agent target for handoff.

    Attributes
    ----------
    target_type : Literal["RandomAgentTarget"]
        The type of the transition target.
    target : list[str]
        A list of agent ids to randomly select from.
    order : int
        The order of the target in the list of targets.
        If -1, the order is automatically determined by the json data.
    """

    target_type: Annotated[
        Literal["RandomAgentTarget"],
        Field(
            "RandomAgentTarget",
            description="The type of the transition target.",
        ),
    ]
    target: Annotated[
        list[str],
        Field(
            ...,
            min_length=2,
            description=(
                "A list of agent ids to randomly select from. "
                "The list must contain at least 2 agents."
            ),
        ),
    ]
    order: Annotated[
        int,
        Field(
            -1,
            description=(
                "The order of the target in the list of targets. "
                "If -1, the order is automatically determined by the json data."
            ),
        ),
    ] = -1


class WaldiezSimpleTarget(WaldiezBase):
    """Simple target for handoff.

    Attributes
    ----------
    target_type : Literal[
        "AskUserTarget",
        "GroupManagerTarget",
        "RevertToUserTarget",
        "StayTarget",
        "TerminateTarget"
    ]
        The type of the transition target.
    order : int
        The order of the target in the list of targets.
        If -1, the order is automatically determined by the json data.
    target : str
        The id of the group or nested chat to transfer control to.
    """

    target_type: Annotated[
        Literal[
            "AskUserTarget",
            "GroupManagerTarget",
            "RevertToUserTarget",
            "StayTarget",
            "TerminateTarget",
        ],
        Field(
            "TerminateTarget", description="The type of the transition target."
        ),
    ] = "TerminateTarget"
    order: Annotated[
        int,
        Field(
            -1,
            description=(
                "The order of the target in the list of targets. "
                "If -1, the order is automatically determined by the json data."
            ),
        ),
    ] = -1


class WaldiezGroupOrNestedTarget(WaldiezBase):
    """Group or nested chat target for handoff.

    Attributes
    ----------
    target_type : Literal["GroupChatTarget", "NestedChatTarget"]
        The type of the transition target.
    target : str
        The id of the group or nested chat to transfer control to.
    order : int
        The order of the target in the list of targets.
    """

    target_type: Annotated[
        Literal["GroupChatTarget", "NestedChatTarget"],
        Field(
            ...,
            description="The type of the transition target.",
        ),
    ]
    target: Annotated[
        str,
        Field(
            ...,
            description=(
                "The id of the group or nested chat to transfer control to."
            ),
        ),
    ]
    order: Annotated[
        int,
        Field(
            -1,
            description=(
                "The order of the target in the list of targets. "
                "If -1, the order is automatically determined by the json data."
            ),
        ),
    ] = -1


WaldiezTransitionTarget = Annotated[
    Union[
        WaldiezAgentTarget,
        WaldiezRandomAgentTarget,
        WaldiezGroupOrNestedTarget,
        WaldiezSimpleTarget,
    ],
    Field(discriminator="target_type"),
]


class WaldiezStringLLMCondition(WaldiezBase):
    """String-based LLM condition."""

    condition_type: Literal["string_llm"]
    prompt: str
    data: dict[str, Any] = Field(default_factory=dict)


class WaldiezContextStrLLMCondition(WaldiezBase):
    """Context variable-based LLM condition."""

    condition_type: Literal["context_str_llm"]
    context_str: str
    data: dict[str, Any] = Field(default_factory=dict)


LLMCondition = Annotated[
    Union[WaldiezStringLLMCondition, WaldiezContextStrLLMCondition],
    Field(discriminator="condition_type"),
]


class WaldiezStringContextCondition(WaldiezBase):
    """String-based context condition."""

    condition_type: Literal["string_context"]
    variable_name: str


class WaldiezExpressionContextCondition(WaldiezBase):
    """Expression-based context condition."""

    condition_type: Literal["expression_context"]
    expression: str
    data: dict[str, Any] = Field(default_factory=dict)


ContextCondition = Annotated[
    Union[WaldiezStringContextCondition, WaldiezExpressionContextCondition],
    Field(discriminator="condition_type"),
]


class WaldiezOnCondition(WaldiezBase):
    """Condition wrapper for LLM conditions."""

    target: WaldiezTransitionTarget
    condition: LLMCondition


class WaldiezOnContextCondition(WaldiezBase):
    """Condition wrapper for context conditions."""

    target: WaldiezTransitionTarget
    condition: ContextCondition


class WaldiezAgentHandoff(WaldiezBase):
    """Handoff class for Waldiez agents."""

    id: Annotated[
        str,
        Field(
            default_factory=lambda: uuid.uuid4().hex,
            description=("A unique identifier for the handoff. "),
        ),
    ]
    llm_conditions: Optional[list[WaldiezOnCondition]] = None
    context_conditions: Optional[list[WaldiezOnContextCondition]] = None
    after_work: Optional[WaldiezTransitionTarget] = None
    explicit_tool_handoff_info: Optional[dict[str, Any]] = None


WaldiezHandoffCondition = Union[WaldiezOnCondition, WaldiezOnContextCondition]
