# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Waldiez Tool model."""

from typing import Any

from pydantic import Field, SerializationInfo, model_serializer, model_validator
from typing_extensions import Annotated, Self

from ..common import WaldiezBase
from .tool_type import WaldiezToolType


class WaldiezToolData(WaldiezBase):
    """Waldiez Tool Data.

    Attributes
    ----------
    tool_type : WaldiezToolType
        The type of the tool: shared, custom, langchain, crewai.
    content : str
        The content (source code) of the tool.
    secrets : dict[str, str]
        The secrets (environment variables) of the tool.
    """

    tool_type: Annotated[
        WaldiezToolType,
        Field(
            "custom",
            alias="toolType",
            title="Tool Type",
            description=(
                "The type of the tool: shared, custom, langchain, crewai."
            ),
        ),
    ]
    content: Annotated[
        str,
        Field(
            ...,
            title="Content",
            description="The content (source code) of the tool.",
        ),
    ]
    secrets: Annotated[
        dict[str, str],
        Field(
            default_factory=dict,
            title="Secrets",
            description="The secrets (environment variables) of the tool.",
        ),
    ]
    kwargs: Annotated[
        dict[str, Any],
        Field(
            default_factory=dict,
            title="Keyword Arguments",
            description=(
                "Keyword arguments for the tool, used for initialization."
            ),
        ),
    ]

    _raw_content: str = ""

    @model_validator(mode="after")
    def validate_tool_data(self) -> Self:
        """Validate the tool data.

        Returns
        -------
        Self
            The validated tool data.
        """
        self._raw_content = self.content

        return self

    @model_serializer(mode="plain", when_used="always")
    def serialize_tool_data(self, info: SerializationInfo) -> dict[str, Any]:
        """Serialize the tool data.

        Parameters
        ----------
        info : SerializationInfo
            The serialization information.

        Returns
        -------
        dict[str, Any]
            The serialized tool data.
        """
        tool_type_key = "toolType" if info.by_alias else "tool_type"
        return {
            tool_type_key: self.tool_type,
            "content": self._raw_content,
            "secrets": self.secrets,
            "kwargs": self.kwargs,
        }
