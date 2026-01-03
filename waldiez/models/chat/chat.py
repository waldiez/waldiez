# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=too-many-public-methods
# pyright: reportDeprecated=false,reportUnknownMemberType=false
# pyright: reportAttributeAccessIssue=false,reportUnknownVariableType=false

"""Waldiez chat model."""

from typing import TYPE_CHECKING, Any, Optional

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from waldiez.models.chat.chat_summary import WaldiezChatSummary

from ..common import (
    WaldiezAgentTarget,
    WaldiezBase,
    WaldiezHandoff,
    WaldiezHandoffCondition,
    WaldiezTransitionAvailability,
    WaldiezTransitionTarget,
    generate_function,
)
from .chat_data import WaldiezChatData
from .chat_message import (
    CALLABLE_MESSAGE,
    CALLABLE_MESSAGE_ARGS,
    CALLABLE_MESSAGE_RAG_WITH_CARRYOVER_TYPES,
    CALLABLE_MESSAGE_TYPES,
    RAG_METHOD_WITH_CARRYOVER_BODY,
    WaldiezChatMessage,
)
from .chat_nested import (
    NESTED_CHAT_ARGS,
    NESTED_CHAT_MESSAGE,
    NESTED_CHAT_REPLY,
    NESTED_CHAT_TYPES,
    WaldiezChatNested,
)
from .chat_summary import (
    CALLABLE_SUMMARY,
    CALLABLE_SUMMARY_ARGS,
    CALLABLE_SUMMARY_TYPES,
)

if TYPE_CHECKING:
    from ..agents import WaldiezAgent

WaldiezChatType = Literal["chat", "nested", "group", "hidden"]
"""Possible chat types: "chat", "nested", "group", "hidden"."""


# noinspection PyUnresolvedReferences
class WaldiezChat(WaldiezBase):
    """Chat class.

    Attributes
    ----------
    id : str
        The chat ID.
    source : str
        The source of the chat (sender).
    target : str
        The target of the chat (recipient).
    type : WaldiezChatType
        The type of the chat data: "chat", "nested", "group", or "hidden".
    data : WaldiezChatData
        The chat data.
        See `waldiez.models.chat.WaldiezChatData` for more information.
    name : str
        The chat name.
    nested_chat : WaldiezChatNested
        The nested chat message/reply if any.
    message : WaldiezChatMessage
        The chat message.
    message_content : str | None
        The chat message content if any. If method, the method's body.

    Functions
    ---------
    get_chat_args()
        Get the chat arguments to use in autogen.
    """

    id: Annotated[
        str,
        Field(
            ...,
            title="ID",
            description="The chat ID.",
        ),
    ]
    type: Annotated[
        WaldiezChatType,
        Field(
            default="chat",
            title="Type",
            description="The type of the chat data.",
        ),
    ]
    source: Annotated[
        str,
        Field(
            ...,
            title="Source",
            description="The chat source.",
        ),
    ]
    target: Annotated[
        str,
        Field(
            ...,
            title="Target",
            description="The chat target.",
        ),
    ]
    data: Annotated[
        WaldiezChatData,
        Field(
            ...,
            title="Data",
            description="The chat data.",
        ),
    ]

    @property
    def name(self) -> str:
        """Get the name."""
        return self.data.name

    @property
    def description(self) -> str:
        """Get the description."""
        return self.data.description

    @property
    def order(self) -> int:
        """Get the order."""
        return self.data.order

    @property
    def nested_chat(self) -> WaldiezChatNested:
        """Get the nested chat."""
        return self.data.nested_chat

    @property
    def message(self) -> WaldiezChatMessage:
        """Get the message."""
        if isinstance(
            self.data.message, str
        ):  # pragma: no cover (just for the lint)
            return WaldiezChatMessage(
                type="string",
                use_carryover=False,
                content=self.data.message,
                context={},
            )
        return self.data.message

    @property
    def summary(self) -> WaldiezChatSummary:
        """Get the summary."""
        return self.data.summary

    @property
    def message_content(self) -> str | None:
        """Get the message content."""
        return self.data.message_content

    @property
    def summary_content(self) -> str | None:
        """Get the summary content."""
        return self.data.summary_content

    @property
    def max_turns(self) -> int | None:
        """Get the max rounds for the chat."""
        return self.data.max_turns

    @property
    def chat_id(self) -> int:
        """Get the chat ID."""
        return self.data.get_chat_id()

    @property
    def prerequisites(self) -> list[int]:
        """Get the chat prerequisites."""
        return self.data.get_prerequisites()

    @property
    def condition(self) -> WaldiezHandoffCondition:
        """Get the handoff condition."""
        return self.data.condition

    @property
    def available(self) -> WaldiezTransitionAvailability:
        """Get the transition availability."""
        return self.data.available

    @model_validator(mode="after")
    def _validate_chat(self) -> Self:
        """Override if needed the source and target of the chat."""
        if self.data.real_source:
            self.source = self.data.real_source
        if self.data.real_target:
            self.target = self.data.real_target
        return self

    def as_handoff(
        self,
    ) -> WaldiezHandoff:
        """Convert the chat to a handoff.

        Returns
        -------
        WaldiezHandoff
            The handoff representation of the chat.
        """
        # noinspection PyTypeHints
        target: WaldiezTransitionTarget = WaldiezAgentTarget(
            target_type="AgentTarget",
            value=[self.target],
        )
        return WaldiezHandoff(
            target=target,
            condition=self.condition,
            available=self.available,
        )

    def set_chat_id(self, value: int) -> None:
        """Set the chat ID.

        Parameters
        ----------
        value : int
            The chat ID.
        """
        self.data.set_chat_id(value)

    def set_prerequisites(self, value: list[int]) -> None:
        """Set the chat prerequisites.

        Parameters
        ----------
        value : list[int]
            The chat prerequisites.
        """
        self.data.set_prerequisites(value)

    def get_message_function(
        self,
        name_prefix: str | None = None,
        name_suffix: str | None = None,
        is_rag: bool = False,
    ) -> tuple[str, str]:
        """Get the message function.

        Parameters
        ----------
        name_prefix : str
            The function name prefix.
        name_suffix : str
            The function name suffix.
        is_rag : bool
            If the message is from a RAG user.

        Returns
        -------
        tuple[str, str]
            The message function and the function name.
        """
        if self.message.type in ("string", "none") or (
            not self.message_content and is_rag is False
        ):
            return "", ""
        function_types = CALLABLE_MESSAGE_TYPES
        function_name = CALLABLE_MESSAGE
        if name_prefix:
            function_name = f"{name_prefix}_{function_name}"
        if name_suffix:
            function_name = f"{function_name}_{name_suffix}"
        if is_rag and self.message.type == "rag_message_generator":
            function_types = CALLABLE_MESSAGE_RAG_WITH_CARRYOVER_TYPES
            return (
                generate_function(
                    function_name=function_name,
                    function_args=CALLABLE_MESSAGE_ARGS,
                    function_types=function_types,
                    function_body=self.message.content_body
                    or RAG_METHOD_WITH_CARRYOVER_BODY,
                ),
                function_name,
            )
        return (
            generate_function(
                function_name=function_name,
                function_args=CALLABLE_MESSAGE_ARGS,
                function_types=function_types,
                function_body=self.message_content or "",
            ),
            function_name,
        )

    def get_summary_function(
        self,
        name_prefix: str | None = None,
        name_suffix: str | None = None,
    ) -> tuple[str, str]:
        """Get the summary function.

        Parameters
        ----------
        name_prefix : str
            The function name prefix.
        name_suffix : str
            The function name suffix.

        Returns
        -------
        tuple[str, str]
            The message function and the function name.
        """
        if self.summary.method != "custom":
            return "", ""
        function_types = CALLABLE_SUMMARY_TYPES
        function_name = CALLABLE_SUMMARY
        if name_prefix:
            function_name = f"{name_prefix}_{function_name}"
        if name_suffix:
            function_name = f"{function_name}_{name_suffix}"
        return (
            generate_function(
                function_name=function_name,
                function_args=CALLABLE_SUMMARY_ARGS,
                function_types=function_types,
                function_body=self.summary_content or "",
            ),
            function_name,
        )

    @staticmethod
    def _get_nested_chat_function(
        content: str | None,
        function_name_base: str,
        name_prefix: str | None = None,
        name_suffix: str | None = None,
    ) -> tuple[str, str]:
        """Get the nested chat function.

        Parameters
        ----------
        content : str
            The content for the function body.
        function_name_base : str
            The base name of the function.
        name_prefix : str
            The function name prefix.
        name_suffix : str
            The function name suffix.

        Returns
        -------
        tuple[str, str]
            The generated function and its name.
        """
        if not content:
            return "", ""
        function_name = function_name_base
        if name_prefix:
            function_name = f"{name_prefix}_{function_name}"
        if name_suffix:
            function_name = f"{function_name}_{name_suffix}"
        return (
            generate_function(
                function_name=function_name,
                function_args=NESTED_CHAT_ARGS,
                function_types=NESTED_CHAT_TYPES,
                function_body=content,
            ),
            function_name,
        )

    def get_nested_chat_message_function(
        self,
        name_prefix: str | None = None,
        name_suffix: str | None = None,
    ) -> tuple[str, str]:
        """Get the nested chat message function.

        Parameters
        ----------
        name_prefix : str | None
            The function name prefix.
        name_suffix : str | None
            The function name suffix.

        Returns
        -------
        tuple[str, str]
            The nested chat message function and the function name.
        """
        if not self.nested_chat.message or (
            self.nested_chat.message.use_carryover is False
            and self.nested_chat.message.type
            in (
                "string",
                "none",
            )
        ):
            return "", ""
        return self._get_nested_chat_function(
            content=self.nested_chat.message_content,
            function_name_base=NESTED_CHAT_MESSAGE,
            name_prefix=name_prefix,
            name_suffix=name_suffix,
        )

    def get_nested_chat_reply_function(
        self,
        name_prefix: str | None = None,
        name_suffix: str | None = None,
    ) -> tuple[str, str]:
        """Get the nested chat reply function.

        Parameters
        ----------
        name_prefix : str | None
            The function name prefix.
        name_suffix : str | None
            The function name suffix.

        Returns
        -------
        tuple[str, str]
            The nested chat reply function and the function name.
        """
        if not self.nested_chat.reply or (
            self.nested_chat.reply.use_carryover is False
            and self.nested_chat.reply.type
            in (
                "string",
                "none",
            )
        ):
            return "", ""
        return self._get_nested_chat_function(
            content=self.nested_chat.reply_content,
            function_name_base=NESTED_CHAT_REPLY,
            name_prefix=name_prefix,
            name_suffix=name_suffix,
        )

    def get_chat_args(
        self,
        for_queue: bool,
        sender: Optional["WaldiezAgent"] = None,
    ) -> dict[str, Any]:
        """Get the chat arguments to use in autogen.

        Parameters
        ----------
        for_queue : bool
            Whether to get the chat arguments for a chat queue.
        sender : WaldiezAgent, optional
            The sender agent, to check if it's a RAG user.

        Returns
        -------
        dict
            The chat arguments.
        """
        args_dict = self.data.get_chat_args(for_queue)
        if (
            sender
            and sender.is_rag_user
            and self.message.type == "rag_message_generator"
            and hasattr(sender.data, "retrieve_config")
        ):
            # check for n_results in agent data, to add in context
            n_results = sender.data.retrieve_config.n_results
            if isinstance(n_results, int) and n_results > 0:
                args_dict["n_results"] = n_results
        return args_dict

    def model_dump(self, **kwargs: Any) -> dict[str, Any]:
        """Dump the model to a dict including the chat attributes.

        Parameters
        ----------
        kwargs : Any
            The keyword arguments.

        Returns
        -------
        dict[str, Any]
            The model dump with the chat attributes.
        """
        dump = super().model_dump(**kwargs)
        dump["name"] = self.name
        dump["description"] = self.description
        dump["nested_chat"] = self.nested_chat.model_dump()
        dump["message"] = self.message.model_dump()
        dump["message_content"] = self.message_content
        dump["max_turns"] = self.max_turns
        dump["summary"] = self.summary.model_dump()
        dump["summary_content"] = self.summary_content
        return dump
