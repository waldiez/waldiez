# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=invalid-name

"""Waldiez Agent Handoff class."""

from typing import Any

from pydantic import Field
from typing_extensions import Annotated, Literal

from .base import WaldiezBase

__all__ = [
    "WaldiezTransitionAvailability",
    "WaldiezTransitionTarget",
    "WaldiezAgentTarget",
    "WaldiezRandomAgentTarget",
    "WaldiezSimpleTarget",
    "WaldiezGroupOrNestedTarget",
    "WaldiezStringLLMCondition",
    "WaldiezContextStrLLMCondition",
    "WaldiezStringContextCondition",
    "WaldiezExpressionContextCondition",
    "WaldiezLLMBasedTransition",
    "WaldiezContextBasedTransition",
    "WaldiezHandoff",
    "WaldiezHandoffCondition",
    "WaldiezHandoffTransition",
    "WaldiezLLMBasedCondition",
    "WaldiezContextBasedCondition",
    "WaldiezDefaultCondition",
]


class WaldiezAgentTarget(WaldiezBase):
    """Agent target for handoff.

    Attributes
    ----------
    target_type : Literal["AgentTarget"]
        The type of the transition target.
    value : str
        The agent id to transfer control to.
    """

    target_type: Annotated[
        Literal["AgentTarget"],
        Field("AgentTarget", description="The type of the transition target."),
    ]
    value: Annotated[
        list[str],
        Field(
            min_length=1,
            max_length=1,
            description="The agent id to transfer control to.",
        ),
    ]


class WaldiezRandomAgentTarget(WaldiezBase):
    """Random agent target for handoff.

    Attributes
    ----------
    target_type : Literal["RandomAgentTarget"]
        The type of the transition target.
    value : list[str]
        A list of agent ids to randomly select from.
    """

    target_type: Annotated[
        Literal["RandomAgentTarget"],
        Field(
            "RandomAgentTarget",
            description="The type of the transition target.",
        ),
    ]
    value: Annotated[
        list[str],
        Field(
            min_length=2,
            description=(
                "A list of agent ids to randomly select from. "
                "The list must contain at least 2 agents."
            ),
        ),
    ]


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
    value : list[str]
        A list of values for the target, not actually used
        (just for consistency with other targets).
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
    ]
    value: Annotated[
        list[str],
        Field(
            default_factory=list,
        ),
    ]  # not actually used (just for consistency with other targets)


class WaldiezGroupOrNestedTarget(WaldiezBase):
    """Group or nested chat target for handoff.

    Attributes
    ----------
    target_type : Literal["GroupChatTarget", "NestedChatTarget"]
        The type of the transition target.
    value : str
        The id of the group or nested chat to transfer control to.
    """

    target_type: Annotated[
        Literal["GroupChatTarget", "NestedChatTarget"],
        Field(
            ...,
            description="The type of the transition target.",
            alias="targetType",
        ),
    ]
    value: Annotated[
        list[str],
        Field(
            ...,
            min_length=1,
            description=(
                "The id of the group (manager) "
                "or nested chat (source) to transfer control to."
            ),
        ),
    ]


WaldiezTransitionTarget = Annotated[
    WaldiezAgentTarget
    | WaldiezRandomAgentTarget
    | WaldiezGroupOrNestedTarget
    | WaldiezSimpleTarget,
    Field(discriminator="target_type"),
]


class WaldiezStringLLMCondition(WaldiezBase):
    """String-based LLM condition."""

    condition_type: Literal["string_llm"]
    prompt: str
    data: dict[str, Any] = Field(default_factory=dict)

    def is_not_empty(self) -> bool:
        """Check if the condition is not empty.

        Returns
        -------
        bool
            True if the condition has a non-empty prompt,
            False otherwise.
        """
        return bool(self.prompt.strip()) or bool(self.data)

    def is_empty(self) -> bool:
        """Check if the condition is empty.

        Returns
        -------
        bool
            True if the condition has an empty prompt,
            False otherwise.
        """
        return not self.is_not_empty()


class WaldiezContextStrLLMCondition(WaldiezBase):
    """Context variable-based LLM condition."""

    condition_type: Literal["context_str_llm"]
    context_str: str
    data: dict[str, Any] = Field(default_factory=dict)

    def is_not_empty(self) -> bool:
        """Check if the condition is not empty.

        Returns
        -------
        bool
            True if the condition has a non-empty context string,
            False otherwise.
        """
        return bool(self.context_str.strip()) or bool(self.data)

    def is_empty(self) -> bool:
        """Check if the condition is empty.

        Returns
        -------
        bool
            True if the condition has an empty context string,
            False otherwise.
        """
        return not self.is_not_empty()


WaldiezLLMBasedCondition = Annotated[
    WaldiezStringLLMCondition | WaldiezContextStrLLMCondition,
    Field(discriminator="condition_type"),
]


class WaldiezStringContextCondition(WaldiezBase):
    """String-based context condition."""

    condition_type: Literal["string_context"]
    variable_name: str

    def is_not_empty(self) -> bool:
        """Check if the condition is not empty.

        Returns
        -------
        bool
            True if the condition has a non-empty variable name,
            False otherwise.
        """
        return bool(self.variable_name.strip())

    def is_empty(self) -> bool:
        """Check if the condition is empty.

        Returns
        -------
        bool
            True if the condition has an empty variable name,
            False otherwise.
        """
        return not self.is_not_empty()


class WaldiezExpressionContextCondition(WaldiezBase):
    """Expression-based context condition."""

    condition_type: Literal["expression_context"]
    expression: str
    data: dict[str, Any] = Field(default_factory=dict)

    def is_not_empty(self) -> bool:
        """Check if the condition is not empty.

        Returns
        -------
        bool
            True if the condition has a non-empty expression,
            False otherwise.
        """
        return bool(self.expression.strip()) or bool(self.data)

    def is_empty(self) -> bool:
        """Check if the condition is empty.

        Returns
        -------
        bool
            True if the condition has an empty expression,
            False otherwise.
        """
        return not self.is_not_empty()


WaldiezContextBasedCondition = Annotated[
    WaldiezStringContextCondition | WaldiezExpressionContextCondition,
    Field(discriminator="condition_type"),
]


# Union type for just the condition types (without targets)
WaldiezHandoffCondition = (
    WaldiezLLMBasedCondition | WaldiezContextBasedCondition
)


# pylint: disable=too-few-public-methods
class WaldiezDefaultCondition:
    """Get the default condition for handoff transitions."""

    @classmethod
    def create(cls) -> WaldiezHandoffCondition:
        """Get the default condition for handoff transitions.

        Returns
        -------
        WaldiezStringLLMCondition
            A default LLM condition with empty prompt and data.
        """
        return WaldiezStringLLMCondition(
            condition_type="string_llm",
            prompt="",
            data={},
        )


class WaldiezTransitionAvailability(WaldiezBase):
    """Availability condition for transitions.

    Attributes
    ----------
    type : Literal["string", "expression", "none"]
        The type of the availability condition.
        Can be "string", "expression", or "none".
    value : str
        The value of the availability condition.
        If type is "none", this value is ignored.
        If type is "string", this is a string condition.
        If type is "expression", this is an expression condition.
    """

    type: Literal["string", "expression", "none"] = "none"
    value: str = ""


# noinspection PyTypeHints
class WaldiezLLMBasedTransition(WaldiezBase):
    """Condition wrapper for LLM conditions."""

    target: WaldiezTransitionTarget
    condition: WaldiezLLMBasedCondition
    available: WaldiezTransitionAvailability


# noinspection PyTypeHints
class WaldiezContextBasedTransition(WaldiezBase):
    """Condition wrapper for context conditions."""

    target: WaldiezTransitionTarget
    condition: WaldiezContextBasedCondition
    available: WaldiezTransitionAvailability


# Union type for complete transitions (condition + target)
WaldiezHandoffTransition = (
    WaldiezLLMBasedTransition | WaldiezContextBasedTransition
)


class WaldiezHandoff(WaldiezBase):
    """Handoff class for Waldiez agents and chats.

    Attributes
    ----------
    target : WaldiezTransitionTarget
        The target to transfer control to.
        Can be an agent, group, nested chat, or simple target.
    condition : WaldiezHandoffCondition
        The condition to use for the handoff.
        If not provided, the handoff will always be available.
    available : WaldiezTransitionAvailability
        The availability of the handoff.
        If not provided, the handoff will always be available.
    """

    target: Annotated[
        WaldiezTransitionTarget,
        Field(
            ...,
            description=(
                "The target to transfer control to. "
                "Can be an agent, group, nested chat, or simple target."
            ),
            discriminator="target_type",
        ),
    ]
    condition: Annotated[
        WaldiezHandoffCondition,
        Field(
            default_factory=WaldiezDefaultCondition.create,
            title="Condition",
            description=(
                "The condition to use for the handoff. "
                "If not provided, the handoff will always be available."
            ),
            discriminator="condition_type",
        ),
    ]
    available: Annotated[
        WaldiezTransitionAvailability,
        Field(
            default_factory=WaldiezTransitionAvailability,
            title="Available",
            description=(
                "The availability of the handoff. "
                "If not provided, the handoff will always be available."
            ),
        ),
    ]

    def is_llm_based(self) -> bool:
        """Check if the handoff is LLM-based.

        Returns
        -------
        bool
            True if the handoff condition is LLM-based,
            False otherwise.
        """
        return self.condition.condition_type in {
            "string_llm",
            "context_str_llm",
        }

    def is_context_based(self) -> bool:
        """Check if the handoff is context-based.

        Returns
        -------
        bool
            True if the handoff condition is context-based,
            False otherwise.
        """
        return self.condition.condition_type in {
            "string_context",
            "expression_context",
        }

    def is_not_empty(self) -> bool:
        """Check if the handoff is not empty.

        Returns
        -------
        bool
            True if the handoff has a non-empty target,
            condition, or availability, False otherwise.
        """
        return self.condition.is_not_empty() or self.available.type != "none"

    def is_empty(self) -> bool:
        """Check if the handoff is empty.

        Returns
        -------
        bool
            True if the handoff has an empty target,
            condition, and availability, False otherwise.
        """
        return not self.is_not_empty()
