"""Common utilities for the I/O extensions."""

from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


def now() -> str:
    """Get the current time in ISO format.

    Returns
    -------
    str
        The current time in ISO format.
    """
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def gen_id() -> str:
    """Generate a unique ID.

    Returns
    -------
    str
        A unique ID.
    """
    return uuid4().hex


MessageType = Literal[
    "input_request",
    "input_response",
    "print",
    "input",
]
"""Possible message types for the structured I/O stream."""


class StructuredBase(BaseModel):
    """Base model for structured data.

    This class is used to define the structure of the data being sent
    and received through the I/O stream.
    """

    id: str = Field(default_factory=gen_id)
    type: MessageType
    timestamp: str = Field(default_factory=now)
    model_config = ConfigDict(
        extra="ignore",
        arbitrary_types_allowed=True,
    )


class UserInputData(BaseModel):
    """Use's input data model."""

    text: str | None = None
    image: str | None = None

    model_config = ConfigDict(extra="ignore")


class UserResponse(StructuredBase):
    """User response model."""

    request_id: str
    type: MessageType = "input_response"
    data: UserInputData


class UserInputRequest(StructuredBase):
    """User input prompt model."""

    type: MessageType = "input_request"
    request_id: str
    prompt: str
    password: bool = False


class PrintMessage(StructuredBase):
    """Model for print messages.

    This class is used to define the structure of the print messages
    being sent through the I/O stream.
    """

    type: MessageType = "print"
    data: str
