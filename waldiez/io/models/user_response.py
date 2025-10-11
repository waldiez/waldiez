# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportUnnecessaryIsInstance=false,reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false,reportArgumentType=false

"""User response model and validation."""

import json
from pathlib import Path
from typing import Any, Callable

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

    # noinspection PyNestedDecorators
    @field_validator("data", mode="before")
    @classmethod
    def validate_data(
        cls, value: Any
    ) -> str | UserInputData | list[UserInputData] | None:
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
        if value is None:
            return ""
        if cls._is_valid_type(value):
            return value

        handlers: dict[
            type,
            Callable[[Any], str | UserInputData | list[UserInputData]],
        ] = {
            str: cls._handle_string,
            dict: cls._handle_dict,
            list: cls._handle_list,
        }

        value_type = type(value)
        handler = handlers.get(
            value_type,
            cls._handle_default,
        )
        result = handler(value)
        return result

    @classmethod
    def _is_valid_type(cls, value: Any) -> bool:
        """Check if value is already a valid type."""
        return isinstance(value, UserInputData) or (
            isinstance(value, list)
            and all(isinstance(item, UserInputData) for item in value)
        )

    @classmethod
    def _handle_string(
        cls, value: str
    ) -> str | UserInputData | list[UserInputData]:
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
                return cls._handle_dict(parsed_value)
            if isinstance(parsed_value, list):
                return cls._handle_list(parsed_value)
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
    ) -> UserInputData | list[UserInputData]:
        result: list[UserInputData] = []

        for item in value:
            if isinstance(item, UserInputData):
                result.append(item)
            elif isinstance(item, dict):
                result.append(cls._handle_dict(item))
            elif isinstance(item, str):
                result.append(cls._create_text_input(item))
            elif isinstance(item, list):
                nested_result = cls._handle_list(item)
                if isinstance(nested_result, list):
                    result.extend(nested_result)
                else:
                    result.append(nested_result)
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
        except (TypeError, ValueError):  # pragma: no cover
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
                [
                    (
                        item.to_string(
                            uploads_root=uploads_root, base_name=base_name
                        )
                        if hasattr(item, "to_string")
                        else (
                            item
                            if isinstance(item, str)  # pragma: no cover
                            else str(item)
                        )  # pragma: no cover
                    )
                    for item in self.data
                ]
            ).strip()
        if isinstance(self.data, UserInputData):
            return self.data.to_string(
                uploads_root=uploads_root, base_name=base_name
            ).strip()
        # we have probably returned sth till here
        if isinstance(self.data, str):  # pragma: no cover
            return self.data
        # noinspection PyUnreachableCode
        return (  # pragma: no cover
            json.dumps(self.data)
            if hasattr(self.data, "__dict__")
            else str(self.data)
        )
