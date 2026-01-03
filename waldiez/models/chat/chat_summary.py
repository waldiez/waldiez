# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez chat summary options."""

from typing import Any

from pydantic import (
    Field,
    FieldSerializationInfo,
    field_serializer,
    field_validator,
    model_validator,
)
from typing_extensions import Annotated, Literal, Self

from ..common import WaldiezBase, check_function

WaldiezChatSummaryMethod = Literal[
    "reflectionWithLlm", "lastMsg", "reflection_with_llm", "last_msg", "custom"
]
"""Possible methods for the LLM summary."""

CALLABLE_SUMMARY = "callable_summary"
CALLABLE_SUMMARY_ARGS = ["sender", "recipient", "summary_args"]
CALLABLE_SUMMARY_TYPES = (
    ["ConversableAgent", "ConversableAgent", "dict[str, Any]"],
    "str",
)


class WaldiezChatSummary(WaldiezBase):
    """Llm summary method options.

    Attributes
    ----------
    method : Optional[WaldiezChatSummaryMethod]
        The method to use for the LLM summary. Defaults to "last_msg".
    prompt : str
        The prompt for the LLM summary method.
    args : Optional[dict[str, Any]]
        The additional arguments for the LLM summary method, by default None.
    """

    method: Annotated[
        WaldiezChatSummaryMethod | None,
        Field(
            default="last_msg",
            title="Method",
            description="The method to use for the LLM summary.",
        ),
    ]
    prompt: Annotated[
        str,
        Field(
            default="Summarize the conversation.",
            title="Prompt",
            description="The prompt for the LLM summary method.",
        ),
    ]
    content: Annotated[
        str,
        Field(
            default="",
            title="Content",
            description="The content of the method if using 'custom'.",
        ),
    ]
    args: Annotated[
        dict[str, str],
        Field(
            title="Arguments",
            description="The additional arguments for the LLM summary method.",
            default_factory=dict,
        ),
    ]

    def validate_custom_method(
        self,
        function_name: str,
        function_args: list[str],
    ) -> str:
        """Validate custom summary method.

        Parameters
        ----------
        function_name : str
            The method name.
        function_args : list[str]
            The expected method arguments.

        Returns
        -------
        str
            The validated method body.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        if not self.content:
            raise ValueError(
                "The message content is required for the method type"
            )
        is_valid, error_or_body = check_function(
            code_string=self.content,
            function_name=function_name,
            function_args=function_args,
        )
        if not is_valid:
            raise ValueError(error_or_body)
        return error_or_body

    # noinspection PyNestedDecorators
    @field_validator("method", mode="before")
    @classmethod
    def validate_summary_method(
        cls, value: WaldiezChatSummaryMethod | None
    ) -> WaldiezChatSummaryMethod | None:
        """Validate the summary method.

        Parameters
        ----------
        value : Optional[WaldiezChatSummaryMethod]
            The passed WaldiezChatSummaryMethod

        Returns
        -------
        WaldiezChatSummaryMethod | None
            The validated message summary method
        """
        if str(value).lower() == "none":
            return None
        if value == "lastMsg":
            return "last_msg"
        if value == "reflectionWithLlm":
            return "reflection_with_llm"
        if value not in ("last_msg", "reflection_with_llm", "custom"):
            return None
        return value

    @model_validator(mode="after")
    def validate_summary(self) -> Self:
        """Validate the content (if not a method).

        Returns
        -------
        WaldiezChatSummary
            The validated instance.

        Raises
        ------
        ValueError
            If the content is invalid.
        """
        if self.method == "custom":
            if not self.content:
                raise ValueError("The summary content is required.")
        return self

    # noinspection PyNestedDecorators
    @field_serializer("method")
    @classmethod
    def serialize_summary_method(
        cls, value: Any, info: FieldSerializationInfo
    ) -> Any:
        """Serialize summary method.

        Parameters
        ----------
        value : Any
            The value to serialize.
        info : FieldSerializationInfo
            The serialization info.

        Returns
        -------
        Any
            The serialized value.
        """
        if info.by_alias:
            if value == "reflection_with_llm":
                return "reflectionWithLlm"
            if value == "last_msg":
                return "lastMsg"
        return value
