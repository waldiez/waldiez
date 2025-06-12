# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Agent Tool Model."""

from pydantic import Field
from typing_extensions import Annotated

from ...common import WaldiezBase


class WaldiezAgentLinkedTool(WaldiezBase):
    """Waldiez Agent Linked Tool.

    Attributes
    ----------
    id : str
        The id of the tool to use.
    executor_id: str
        The id of the agent to use that tool.
    """

    id: Annotated[
        str, Field(..., title="ID", description="The id of the tool to use.")
    ]
    executor_id: Annotated[
        str,
        Field(
            ...,
            title="Executor ID",
            description="The id of the agent to use that tool.",
        ),
    ]
