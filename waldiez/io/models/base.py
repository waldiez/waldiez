# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Base models for structured data."""

from pydantic import BaseModel, ConfigDict, Field

from ..utils import MessageType, gen_id, now


class StructuredBase(BaseModel):
    """Base model for structured data."""

    id: str = Field(default_factory=gen_id)
    type: MessageType
    timestamp: str = Field(default_factory=now)
    model_config = ConfigDict(
        extra="ignore",
        arbitrary_types_allowed=True,
    )


class UserInputRequest(StructuredBase):
    """User input prompt model."""

    type: MessageType = "input_request"
    request_id: str
    prompt: str
    password: bool = False


class PrintMessage(StructuredBase):
    """Model for print messages."""

    type: MessageType = "print"
    data: str
