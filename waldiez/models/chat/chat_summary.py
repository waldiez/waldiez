# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez chat summary options."""

from typing import Any, Dict, Optional

from pydantic import (
    Field,
    FieldSerializationInfo,
    field_serializer,
    field_validator,
)
from typing_extensions import Annotated, Literal

from ..common import WaldiezBase

WaldiezChatSummaryMethod = Literal[
    "reflectionWithLlm",
    "lastMsg",
    "reflection_with_llm",
    "last_msg",
]
"""Possible methods for the LLM summary."""


class WaldiezChatSummary(WaldiezBase):
    """Llm summary method options.

    Attributes
    ----------
    method : Optional[WaldiezChatSummaryMethod]
        The method to use for the LLM summary. Defaults to "last_msg".
    prompt : str
        The prompt for the LLM summary method.
    args : Optional[Dict[str, Any]]
        The additional arguments for the LLM summary method, by default None.
    """

    method: Annotated[
        Optional[WaldiezChatSummaryMethod],
        Field(
            "last_msg",
            title="Method",
            description="The method to use for the LLM summary.",
        ),
    ]
    prompt: Annotated[
        str,
        Field(
            "",
            title="Prompt",
            description="The prompt for the LLM summary method.",
        ),
    ]
    args: Annotated[
        Dict[str, str],
        Field(
            title="Arguments",
            description="The additional arguments for the LLM summary method.",
            default_factory=dict,
        ),
    ]

    # noinspection PyNestedDecorators
    @field_validator("method", mode="before")
    @classmethod
    def validate_summary_method(
        cls, value: Optional[WaldiezChatSummaryMethod]
    ) -> Optional[WaldiezChatSummaryMethod]:
        """Validate the summary method.

        Parameters
        ----------
        value : Optional[WaldiezChatSummaryMethod]
            The passed WaldiezChatSummaryMethod

        Returns
        -------
        Optional[WaldiezChatSummaryMethod]
            The validated message summary method
        """
        if str(value).lower() == "none":
            return None
        if value == "lastMsg":
            return "last_msg"
        if value == "reflectionWithLlm":
            return "reflection_with_llm"
        return value

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
        if info.by_alias is True:
            if value == "reflection_with_llm":
                return "reflectionWithLlm"
            if value == "last_msg":
                return "lastMsg"
        return value
