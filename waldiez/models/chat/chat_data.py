# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportArgumentType=false

"""Chat data model."""

from typing import Any

from pydantic import Field, field_validator, model_validator
from typing_extensions import Annotated, Self

from ..agents import WaldiezAgentType
from ..common import (
    WaldiezBase,
    WaldiezDefaultCondition,
    WaldiezHandoffCondition,
    WaldiezHandoffTransition,
    WaldiezTransitionAvailability,
    check_function,
    update_dict,
)
from .chat_message import (
    CALLABLE_MESSAGE,
    CALLABLE_MESSAGE_ARGS,
    WaldiezChatMessage,
)
from .chat_nested import WaldiezChatNested
from .chat_summary import (
    CALLABLE_SUMMARY,
    CALLABLE_SUMMARY_ARGS,
    WaldiezChatSummary,
)


class WaldiezChatData(WaldiezBase):
    """Chat data class.

    Attributes
    ----------
    name : str
        The name of the chat.
    source_type : WaldiezAgentType
        The agent type of the chat source.
    target_type : WaldiezAgentType
        The agent type of the chat target.
    description : str
        The description of the chat.
    position : int
        The position of the chat. Ignored (UI related).
    order : int
        The of the chat. If negative, ignored.
    clear_history : Optional[bool], optional
        Whether to clear the chat history, by default None.
    message : Union[str, WaldiezChatMessage]
        The message of the chat.
    nested_chat : WaldiezChatNested
        The nested chat config.
    summary : WaldiezChatSummary
        The summary method and options for the chat.
    max_turns : Optional[int]
        The maximum number of turns for the chat, by default None (no limit).
    silent : bool, optional
        Whether to run the chat silently, by default False (not silent).
    real_source : Optional[str]
        The real source of the chat (overrides the source).
    real_target : Optional[str]
        The real target of the chat (overrides the target).
    """

    name: Annotated[
        str, Field(..., title="Name", description="The name of the chat.")
    ]
    description: Annotated[
        str,
        Field(
            default="A new chat",
            title="Description",
            description="The description of the chat.",
        ),
    ]
    position: Annotated[
        int,
        Field(
            default=-1,
            title="Position",
            description="The position of the chat in the flow (Ignored).",
        ),
    ]
    order: Annotated[
        int,
        Field(
            default=-1,
            title="Order",
            description="The order of the chat in the flow.",
        ),
    ]
    clear_history: Annotated[
        bool,
        Field(
            default=True,
            alias="clearHistory",
            title="Clear History",
            description="Whether to clear the chat history.",
        ),
    ]
    message: Annotated[
        str | WaldiezChatMessage,
        Field(
            title="Message",
            description="The message of the chat.",
            default_factory=WaldiezChatMessage,
        ),
    ]
    nested_chat: Annotated[
        WaldiezChatNested,
        Field(
            title="Nested Chat",
            description="The nested chat.",
            alias="nestedChat",
            default_factory=WaldiezChatNested,
        ),
    ]
    summary: Annotated[
        WaldiezChatSummary,
        Field(
            default_factory=WaldiezChatSummary,
            title="Summary",
            description="The summary method options for the chat.",
        ),
    ]
    max_turns: Annotated[
        int | None,
        Field(
            default=None,
            alias="maxTurns",
            title="Max Turns",
            description="The maximum number of turns for the chat.",
        ),
    ]
    prerequisites: Annotated[
        list[str],
        Field(
            title="Prerequisites",
            description="The prerequisites (chat ids) for the chat (if async).",
            default_factory=list,
        ),
    ]
    silent: Annotated[
        bool,
        Field(
            default=False,
            title="Silent",
            description="Whether to run the chat silently.",
        ),
    ]
    real_source: Annotated[
        str | None,
        Field(
            default=None,
            alias="realSource",
            title="Real Source",
            description="The real source of the chat (overrides the source).",
        ),
    ]
    real_target: Annotated[
        str | None,
        Field(
            default=None,
            alias="realTarget",
            title="Real Target",
            description="The real target of the chat (overrides the target).",
        ),
    ]
    source_type: Annotated[
        WaldiezAgentType,
        Field(
            ...,
            alias="sourceType",
            title="Source Type",
            description="The agent type of the source.",
        ),
    ]
    target_type: Annotated[
        WaldiezAgentType,
        Field(
            ...,
            alias="targetType",
            title="Target Type",
            description="The agent type of the target.",
        ),
    ]
    condition: Annotated[
        WaldiezHandoffCondition,
        Field(
            default_factory=WaldiezDefaultCondition.create,
            alias="condition",
            title="Handoff Condition",
            description="The handoff condition to use.",
        ),
    ]
    available: Annotated[
        WaldiezTransitionAvailability,
        Field(
            default_factory=WaldiezTransitionAvailability,
            title="Availability",
            description="The availability condition for the chat.",
        ),
    ]
    after_work: Annotated[
        WaldiezHandoffTransition | None,
        Field(
            None,
            title="After Work",
            description=(
                "The target to transfer control to after the chat has "
                "finished its work. (used if in a group chat)"
            ),
            alias="afterWork",
        ),
    ]
    _message_content: str | None = None
    _summary_content: str | None = None
    _chat_id: int = 0
    _prerequisites: list[int] = []

    @property
    def message_content(self) -> str | None:
        """Get the message content."""
        return self._message_content

    @property
    def summary_content(self) -> str | None:
        """Get the message content."""
        return self._summary_content

    def get_chat_id(self) -> int:
        """Get the chat id.

        Returns
        -------
        int
            The chat id.
        """
        return self._chat_id

    def set_chat_id(self, value: int) -> None:
        """Set the chat id.

        Parameters
        ----------
        value : int
            The chat id.
        """
        self._chat_id = value

    def get_prerequisites(self) -> list[int]:
        """Get the chat prerequisites.

        Returns
        -------
        list[int]
            The chat prerequisites (if async).
        """
        return self._prerequisites

    def set_prerequisites(self, value: list[int]) -> None:
        """Set the chat prerequisites.

        Parameters
        ----------
        value : list[int]
            The chat prerequisites to set.
        """
        self._prerequisites = value

    @model_validator(mode="after")
    def validate_chat_data(self) -> Self:
        """Validate the chat data.

        Returns
        -------
        WaldiezChatData
            The validated chat data.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        if not isinstance(self.message, WaldiezChatMessage):  # pragma: no cover
            return self
        self._message_content = self.message.content
        if self.message.type == "none":
            self._message_content = None
        if self.message.type == "string":
            self._message_content = self.message.content
        if self.message.type == "method":
            valid, error_or_body = check_function(
                self.message.content or "",
                CALLABLE_MESSAGE,
                CALLABLE_MESSAGE_ARGS,
            )
            if not valid:
                raise ValueError(error_or_body)
            self._message_content = error_or_body
        self._summary_content = self.summary.content
        if self.summary.method == "custom":
            valid, error_or_body = check_function(
                self.summary.content or "",
                CALLABLE_SUMMARY,
                CALLABLE_SUMMARY_ARGS,
            )
            if not valid:
                raise ValueError(error_or_body)
            self._summary_content = error_or_body
        elif self.summary.method in ("last_msg", "lastMsg"):
            self._summary_content = "last_msg"
        elif self.summary.method in (
            "reflectionWithLlm",
            "reflection_with_llm",
        ):
            self._summary_content = "reflection_with_llm"
        return self

    # noinspection PyNestedDecorators
    @field_validator("message", mode="before")
    @classmethod
    def validate_message(cls, value: Any) -> WaldiezChatMessage:
        """Validate the message.

        Parameters
        ----------
        value : Any
            The message value.

        Returns
        -------
        WaldiezChatMessage
            The validated message value.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        if value is None:
            return WaldiezChatMessage(
                type="none", use_carryover=False, content=None, context={}
            )
        if isinstance(value, (str, int, float, bool)):
            return WaldiezChatMessage(
                type="string",
                use_carryover=False,
                content=str(value),
                context={},
            )
        if isinstance(value, dict):
            return WaldiezChatMessage.model_validate(value)
        if not isinstance(value, WaldiezChatMessage):
            return WaldiezChatMessage(
                type="none", use_carryover=False, content=None, context={}
            )
        return value

    @property
    def summary_args(self) -> dict[str, Any] | None:
        """Get the summary args."""
        if self.summary.method not in (
            "reflection_with_llm",
            "reflectionWithLlm",
            "custom",
        ):
            return None
        args: dict[str, Any] = {}
        if (
            self.summary.prompt and self.summary.method != "custom"
        ):  # pragma: no branch
            args["summary_prompt"] = self.summary.prompt
        if self.summary.args:  # pragma: no branch
            args.update(self.summary.args)
        return args

    def _get_context_args(self) -> dict[str, Any]:
        """Get the context arguments to use in autogen.

        Returns
        -------
        dict[str, Any]
            The dictionary to use for generating the kwargs.
        """
        extra_args: dict[str, Any] = {}
        if not isinstance(self.message, WaldiezChatMessage):  # pragma: no cover
            return extra_args
        extra_args.update(update_dict(self.message.context))
        return extra_args

    def get_chat_args(self, for_queue: bool) -> dict[str, Any]:
        """Get the chat arguments to use in autogen.

        Without the 'message' key.

        Parameters
        ----------
        for_queue : bool
            Whether to get the arguments for a chat queue.

        Returns
        -------
        dict[str, Any]
            The dictionary to pass as kwargs.
        """
        args: dict[str, Any] = {}
        if (
            self.summary.method and self.summary.method != "custom"
        ):  # pragma: no branch
            args["summary_method"] = str(self.summary.method)
        if self.summary_args:
            args["summary_args"] = self.summary_args
        if (
            isinstance(self.max_turns, int) and self.max_turns > 0
        ):  # pragma: no branch
            args["max_turns"] = self.max_turns
        args["clear_history"] = self.clear_history
        # args["silent"] = self.silent
        args.update(self._get_context_args())
        if for_queue:
            args["chat_id"] = self._chat_id
        if self._prerequisites:
            args["prerequisites"] = self._prerequisites
        return args
