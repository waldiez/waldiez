# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Swarm condition model for handoff."""

from pydantic import Field
from typing_extensions import Annotated

from ...common import WaldiezBase


class WaldiezSwarmOnConditionTarget(WaldiezBase):
    """Swarm condition target.

    If the condition's target is "agent", the id refers to the agent's ID.
    If the condition's target is "nested_chat", the id refers to the edge's ID.

    Attributes
    ----------
    id : str
        The ID of the target agent or edge.
    order : int
        The order of the target agent or edge.
    """

    id: Annotated[
        str,
        Field(
            ...,
            title="ID",
            description="The ID of the target agent or edge.",
        ),
    ]
    order: Annotated[
        int,
        Field(
            ...,
            title="Order",
            description="The order of the target agent or edge.",
        ),
    ]
