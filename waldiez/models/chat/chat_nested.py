# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Nested chat model."""

from typing import Any, Optional

from pydantic import Field, field_validator, model_validator
from typing_extensions import Annotated, Self

from ..common import WaldiezBase
from .chat_message import WaldiezChatMessage

NESTED_CHAT_MESSAGE = "nested_chat_message"
NESTED_CHAT_REPLY = "nested_chat_reply"
NESTED_CHAT_ARGS = ["recipient", "messages", "sender", "config"]
NESTED_CHAT_TYPES = (
    [
        "ConversableAgent",
        "List[Dict[str, Any]]",
        "ConversableAgent",
        "Dict[str, Any]",
    ],
    "Union[Dict[str, Any], str]",
)


class WaldiezChatNested(WaldiezBase):
    """Nested chat class.

    Attributes
    ----------
    message : WaldiezChatMessage
        The message in a nested chat (sender -> recipient).
    reply : WaldiezChatMessage
        The reply in a nested chat (recipient -> sender).
    """

    message: Annotated[
        Optional[WaldiezChatMessage],
        Field(
            None,
            title="Message",
            description="The message in a nested chat (sender -> recipient).",
        ),
    ]
    reply: Annotated[
        Optional[WaldiezChatMessage],
        Field(
            None,
            title="Reply",
            description="The reply in a nested chat (recipient -> sender).",
        ),
    ]

    _message_content: Optional[str] = None
    _reply_content: Optional[str] = None

    @property
    def message_content(self) -> Optional[str]:
        """Get the message content."""
        return self._message_content

    @property
    def reply_content(self) -> Optional[str]:
        """Get the reply content."""
        return self._reply_content

    # noinspection PyNestedDecorators
    @field_validator("message", "reply", mode="before")
    @classmethod
    def validate_message(cls, value: Any) -> WaldiezChatMessage:
        """Validate the message.

        Parameters
        ----------
        value : Any
            The value.

        Returns
        -------
        WaldiezChatMessage
            The validated message.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        if not value:
            return WaldiezChatMessage(
                type="none", use_carryover=False, content=None, context={}
            )
        if isinstance(value, str):
            return WaldiezChatMessage(
                type="string", use_carryover=False, content=value, context={}
            )
        if isinstance(value, dict):
            return WaldiezChatMessage.model_validate(value)
        if isinstance(value, WaldiezChatMessage):
            return value
        raise ValueError(f"Invalid message type: {type(value)}")

    @model_validator(mode="after")
    def validate_nested_chat(self) -> Self:
        """Validate the nested chat.

        Returns
        -------
        WaldiezChatNested
            The validated nested chat.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        for attr, content_attr, function_name in [
            ("message", "_message_content", NESTED_CHAT_MESSAGE),
            ("reply", "_reply_content", NESTED_CHAT_REPLY),
        ]:
            attr_value = getattr(self, attr)
            if attr_value is not None:
                setattr(self, content_attr, attr_value.content_body)
                if attr_value.type == "none":
                    setattr(self, content_attr, "")
                elif attr_value.type == "string":
                    setattr(self, content_attr, attr_value.content)
                elif attr_value.type == "method":
                    setattr(
                        self,
                        content_attr,
                        attr_value.validate_method(
                            function_name=function_name,
                            function_args=NESTED_CHAT_ARGS,
                        ),
                    )
        return self
