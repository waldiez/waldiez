# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""User input data models and validation."""

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field, field_validator
from typing_extensions import Annotated

from ..utils import detect_media_type
from .constants import CONTENT_MAPPING, MediaContent
from .content.audio import AudioMediaContent
from .content.file import FileMediaContent
from .content.image import ImageMediaContent, ImageUrlMediaContent
from .content.text import TextMediaContent
from .content.video import VideoMediaContent


class UserInputData(BaseModel):
    """User's input data model."""

    content: Annotated[
        MediaContent,
        Field(discriminator="type"),
    ]

    def to_string(
        self,
        uploads_root: Path | None = None,
        base_name: str | None = None,
    ) -> str:
        """Convert the content to a string.

        Parameters
        ----------
        uploads_root : Path | None
            The root directory for storing images, optional.
        base_name : str | None
            The base name for the image file, optional.

        Returns
        -------
        str
            The string representation of the content.
        """
        return self.content.to_string(uploads_root, base_name)

    @classmethod
    def _content_from_string(cls, value: str) -> MediaContent:
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return TextMediaContent(type="text", text=value)
        if isinstance(parsed, str):
            return TextMediaContent(type="text", text=value)
        return cls.validate_content(parsed)

    @classmethod
    def _content_from_dict(cls, value: dict[str, Any]) -> MediaContent:
        """Convert a dictionary to the appropriate MediaContent type.

        Parameters
        ----------
        value : dict[str, Any]
            The input dictionary

        Returns
        -------
        MediaContent
            the appropriate MediaContent.
        """
        content_type = detect_media_type(value)

        # Get the mapping for the detected content type
        if content_type not in CONTENT_MAPPING:
            raise ValueError(f"Unsupported content type: {content_type}")

        mapping = CONTENT_MAPPING[content_type]

        # Check for any of the possible field names for this content type
        for field in mapping["fields"]:
            if field in value:
                # If we need additional parameters (e.g. FileMediaContent)
                if content_type in ["document", "file"]:
                    return mapping["cls"](
                        type=content_type,  # type: ignore
                        **{mapping["required_field"]: value[field]},
                    )
                # If we have a direct mapping
                if field == mapping["required_field"]:
                    return mapping["cls"](**{field: value[field]})
                # If we need field name conversion (e.g., url -> image_url)
                return mapping["cls"](
                    **{mapping["required_field"]: value[field]}
                )

        raise ValueError(
            "Missing required field for content type"
            f" '{content_type}' in: {value}"
        )

    @classmethod
    @field_validator("content", mode="before")
    def validate_content(cls, v: Any) -> MediaContent:  # noqa: C901,D102
        """Validate the input data content.

        Parameters
        ----------
        v: Any
            The input data content

        Returns
        -------
        MediaContent
            The validated content

        Raises
        ------
        ValueError
            If the content is not valid.
        """
        if isinstance(
            v,
            (
                TextMediaContent,
                ImageMediaContent,
                ImageUrlMediaContent,
                VideoMediaContent,
                AudioMediaContent,
                FileMediaContent,
            ),
        ):
            return v

        # If it's a string, check if it is a dumped one
        if isinstance(v, str):
            return cls._content_from_string(v)

        # If it's a dictionary, check if it has a 'type' field
        if isinstance(v, dict):
            return cls._content_from_dict(v)  # pyright: ignore

        # If it's a list
        if isinstance(v, list):
            raise ValueError(
                "List of content is not supported. "
                "Please provide a single content item."
            )

        # Default fallback
        return TextMediaContent(type="text", text=str(v))
