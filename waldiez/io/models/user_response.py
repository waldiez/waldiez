# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""User response model and validation."""

import json
from pathlib import Path
from typing import Any, Callable, Union

from pydantic import ValidationError, field_validator

from ..utils import MessageType
from .base import StructuredBase
from .content.text import TextMediaContent
from .user_input import UserInputData


class UserResponse(StructuredBase):
    """User response model."""

    request_id: str
    type: MessageType = "input_response"
    data: UserInputData | list[UserInputData] | str

    @field_validator("data", mode="before")
    @classmethod
    def validate_data(
        cls, value: Any
    ) -> Union[str, UserInputData, list[UserInputData]]:
        """Validate the data field in UserResponse.

        Parameters
        ----------
        value : Any
            The value to validate.

        Returns
        -------
        Union[str, UserInputData, list[UserInputData]]
            The validated value.

        Raises
        ------
        ValueError
            If the value is not valid.
        """
        if cls._is_valid_type(value):
            return value

        handlers: dict[
            type,
            Callable[[Any], Union[str, UserInputData, list[UserInputData]]],
        ] = {
            str: cls._handle_string,
            dict: cls._handle_dict,
            list: cls._handle_list,
        }

        value_type = type(value)  # pyright: ignore
        handler = handlers.get(
            value_type,  # pyright: ignore
            cls._handle_default,
        )
        result = handler(value)
        return result

    @classmethod
    def _is_valid_type(cls, value: Any) -> bool:
        """Check if value is already a valid type."""
        return isinstance(value, UserInputData) or (
            isinstance(value, list)
            and all(
                isinstance(item, UserInputData)
                for item in value  # pyright: ignore
            )
        )

    @classmethod
    def _handle_string(
        cls, value: str
    ) -> Union[str, UserInputData, list[UserInputData]]:
        """Handle string input.

        Parameters
        ----------
        value : str
            The string value to handle.

        Returns
        -------
        Union[str, UserInputData, list[UserInputData]]
            The handled value.
        """
        # pylint: disable=too-many-try-statements
        try:
            parsed_value = json.loads(value)
            if isinstance(parsed_value, dict):
                return cls._handle_dict(parsed_value)  # pyright: ignore
            if isinstance(parsed_value, list):
                return cls._handle_list(parsed_value)  # pyright: ignore
            return cls._create_text_input(str(parsed_value))
        except json.JSONDecodeError:
            return cls._create_text_input(value)

    @classmethod
    def _handle_dict(cls, value: dict[str, Any]) -> UserInputData:
        if "content" in value:
            return cls._try_parse_user_input(value)

        try:
            return UserInputData(content=value)  # type: ignore
        except (ValueError, TypeError, ValidationError):
            return cls._create_invalid_input(value, label="Invalid data")

    @classmethod
    def _try_parse_user_input(cls, value: dict[str, Any]) -> UserInputData:
        try:
            return UserInputData(content=value["content"])
        except (KeyError, ValueError, TypeError, ValidationError):
            try:
                return UserInputData(content=value)  # type: ignore
            except (ValueError, TypeError, ValidationError):
                return cls._create_invalid_input(value, label="Invalid content")

    @classmethod
    def _handle_list(
        cls, value: list[Any]
    ) -> Union[UserInputData, list[UserInputData]]:
        result: list[UserInputData] = []

        for item in value:
            if isinstance(item, UserInputData):
                result.append(item)
            elif isinstance(item, dict):
                result.append(cls._handle_dict(item))  # pyright: ignore
            elif isinstance(item, str):
                result.append(cls._create_text_input(item))
            else:
                result.append(cls._create_text_input(str(item)))

        return result[0] if len(result) == 1 else result

    @classmethod
    def _handle_default(cls, value: Any) -> UserInputData:
        return cls._create_text_input(str(value))

    @classmethod
    def _create_text_input(cls, text: str) -> UserInputData:
        return UserInputData(content=TextMediaContent(text=text))

    @classmethod
    def _create_invalid_input(cls, raw: Any, label: str) -> UserInputData:
        try:
            preview = json.dumps(raw)[:100]
        except (TypeError, ValueError):
            preview = str(raw)[:100]
        return UserInputData(
            content=TextMediaContent(text=f"{label}: {preview}...")
        )

    def to_string(
        self,
        uploads_root: Path | None = None,
        base_name: str | None = None,
    ) -> str:
        """Convert the UserResponse to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the image file, optional.

        Returns
        -------
        str
            The string representation of the UserResponse.
        """
        if isinstance(self.data, list):
            return " ".join(
                (
                    item.to_string(
                        uploads_root=uploads_root, base_name=base_name
                    )
                    if hasattr(item, "to_string")
                    else str(item)
                )
                for item in self.data
            )
        if isinstance(self.data, UserInputData):
            return self.data.to_string(
                uploads_root=uploads_root, base_name=base_name
            )
        if isinstance(self.data, str):  # pyright: ignore
            return self.data
        return (
            json.dumps(self.data)
            if hasattr(self.data, "__dict__")
            else str(self.data)
        )
