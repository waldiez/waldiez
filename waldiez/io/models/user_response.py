# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""User response models and validation."""

import json
from pathlib import Path
from typing import Any, Callable, Union

from pydantic import field_validator

from ..utils import MessageType
from .base import StructuredBase
from .content.text import TextMediaContent
from .user_input import UserInputData


class UserResponse(StructuredBase):
    """User response model."""

    request_id: str
    type: MessageType = "input_response"
    data: Union[str, UserInputData, list[UserInputData]]

    @classmethod
    @field_validator("data", mode="before")
    def validate_data(
        cls, value: Any
    ) -> Union[str, UserInputData, list[UserInputData]]:
        """Validate the data field in UserResponse.

        Parameters
        ----------
        value: Any
            The input value to validate

        Returns
        -------
        Union[str, UserInputData, List[UserInputData]]
            The validated data
        """
        # Handle already correct types
        if cls._is_valid_type(value):
            return value

        # Handle different input types
        handlers: dict[Callable[..., Any], Any] = {
            str: cls._handle_string,
            dict: cls._handle_dict,
            list: cls._handle_list,
        }

        # Get the handler for this type, or use default handler
        # pylint: disable=line-too-long
        handler = handlers.get(
            type(value),  # pyright: ignore  # noqa: E501
            cls._handle_default,
        )
        return handler(value)

    @classmethod
    def _is_valid_type(cls, value: Any) -> bool:
        """Check if value is already a valid type.

        Parameters
        ----------
        value: Any
            The value to check

        Returns
        -------
        bool
            True if the value is already a valid type
        """
        return isinstance(value, (str, UserInputData)) or (
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
        value: str
            The string input

        Returns
        -------
        Union[str, UserInputData, List[UserInputData]]
            Processed result
        """
        # pylint: disable=too-many-try-statements
        try:
            parsed_value = json.loads(value)
            # If it parsed to a string, return it directly
            if isinstance(parsed_value, str):
                return parsed_value
            # Otherwise process it based on its type
            if isinstance(parsed_value, dict):
                return cls._handle_dict(parsed_value)  # pyright: ignore
            if isinstance(parsed_value, list):
                return cls._handle_list(parsed_value)  # pyright: ignore
            # For simple values like numbers or booleans
            return str(parsed_value)
        except json.JSONDecodeError:
            # Not valid JSON, return original string
            return value

    @classmethod
    def _handle_dict(cls, value: dict[str, Any]) -> UserInputData:
        """Handle dictionary input.

        Parameters
        ----------
        value: dict
            The dictionary input

        Returns
        -------
        UserInputData
            Processed result
        """
        # pylint: disable=broad-exception-caught
        if "content" in value:
            try:
                return UserInputData(content=value["content"])
            except Exception:
                # If that fails, try validating content directly
                try:
                    content = UserInputData.validate_content(value["content"])
                    return UserInputData(content=content)
                except Exception:
                    # Last resort: treat as text
                    return UserInputData(
                        content=TextMediaContent(
                            text=f"Invalid content: {json.dumps(value)[:100]}.."
                        )
                    )

        # Try without content field
        try:
            content = UserInputData.validate_content(value)
            return UserInputData(content=content)
        except Exception:
            # Last resort: treat as text
            return UserInputData(
                content=TextMediaContent(
                    text=f"Invalid data: {json.dumps(value)[:100]}..."
                )
            )

    @classmethod
    def _handle_list(
        cls, value: list[Any]
    ) -> Union[UserInputData, list[UserInputData]]:
        """Handle list input.

        Parameters
        ----------
        value: list
            The list input

        Returns
        -------
        Union[UserInputData, List[UserInputData]]
            Processed result - single item if list has only one element
        """
        result: list[Any] = []

        for item in value:
            # Handle different item types
            if isinstance(item, UserInputData):
                result.append(item)
            elif isinstance(item, dict):
                result.append(cls._handle_dict(item))  # pyright: ignore
            elif isinstance(item, str):
                result.append(cls._create_text_input(item))
            else:
                result.append(cls._create_text_input(str(item)))

        # If there's only one item, return it directly
        if len(result) == 1:
            return result[0]
        return result

    @classmethod
    def _handle_default(cls, value: Any) -> UserInputData:
        """Handle any other type of input.

        Parameters
        ----------
        value: Any
            The input

        Returns
        -------
        UserInputData
            Processed result
        """
        return cls._create_text_input(str(value))

    @classmethod
    def _create_text_input(cls, text: str) -> UserInputData:
        """Create a text input.

        Parameters
        ----------
        text: str
            The text

        Returns
        -------
        UserInputData
            UserInputData with text content
        """
        return UserInputData(content=TextMediaContent(text=text))

    def to_string(
        self,
        uploads_root: Path | None = None,
        base_name: str | None = None,
    ) -> str:
        """Convert the response to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the file, optional.

        Returns
        -------
        str
            The string representation of the response.
        """
        if isinstance(self.data, list):
            string = ""
            for item in self.data:
                string += (
                    item.to_string(
                        uploads_root=uploads_root, base_name=base_name
                    )
                    + " "
                )
            return string.strip()
        if isinstance(self.data, UserInputData):
            return self.data.to_string()
        if isinstance(self.data, str):  # pyright: ignore
            return self.data
        return json.dumps(self.data)
