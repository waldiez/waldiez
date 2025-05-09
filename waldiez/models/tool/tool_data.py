# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Tool model."""

from typing import Dict

from pydantic import Field
from typing_extensions import Annotated

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
    secrets : Dict[str, str]
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
    ] = "custom"
    content: Annotated[
        str,
        Field(
            ...,
            title="Content",
            description="The content (source code) of the tool.",
        ),
    ]
    secrets: Annotated[
        Dict[str, str],
        Field(
            default_factory=dict,
            title="Secrets",
            description="The secrets (environment variables) of the tool.",
        ),
    ]
