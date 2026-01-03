# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

"""Base models for structured data."""

from typing import Any

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

    @classmethod
    def create(cls, *args: Any, **kwargs: Any) -> "PrintMessage":
        """Create a new print message.

        Parameters
        ----------
        *args : Any
            Positional arguments (not used).
        **kwargs : Any
            Keyword arguments

        Returns
        -------
        PrintMessage
            A new print message instance with the provided data.
        """
        message = " ".join(str(arg) for arg in args)
        if "file" in kwargs:
            file = kwargs.pop("file")
            if hasattr(file, "getvalue"):
                io_value = file.getvalue()
                if isinstance(io_value, bytes):
                    io_value = io_value.decode("utf-8", errors="replace")
                message += io_value
        end = kwargs.get("end", "\n")
        message += end
        return cls(data=message)
