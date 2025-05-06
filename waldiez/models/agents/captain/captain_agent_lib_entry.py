# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez captain agent lib entry."""

from pydantic import Field
from typing_extensions import Annotated

from ...common import WaldiezBase


class WaldiezCaptainAgentLibEntry(WaldiezBase):
    """Captain agent lib entry."""

    name: Annotated[
        str,
        Field(
            ...,
            title="Name",
            description="The name of the agent",
        ),
    ]
    description: Annotated[
        str,
        Field(
            ...,
            title="Description",
            description="The description of the agent",
        ),
    ]
    system_message: Annotated[
        str,
        Field(
            ...,
            title="System message",
            description="The system message",
            alias="systemMessage",
        ),
    ]
