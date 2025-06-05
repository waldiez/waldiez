# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""User input data models and validation."""

import json
import os
from pathlib import Path
from typing import Any, Union
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator
from typing_extensions import Annotated

from ..utils import detect_media_type
from .constants import CONTENT_MAPPING, ContentMappingEntry, MediaContent
from .content.audio import AudioMediaContent
from .content.base import (
    AudioContent,
    FileContent,
    ImageContent,
    VideoContent,
)
from .content.file import FileMediaContent
from .content.image import ImageMediaContent, ImageUrlMediaContent
from .content.text import TextMediaContent
from .content.video import VideoMediaContent


class UserInputData(BaseModel):
    """User's input data model."""

    content: Annotated[
        Union[MediaContent, list[MediaContent]],
        Field(
            description="The content of the input data.",
            title="Content",
        ),
    ]

    def __str__(self) -> str:
        """Get the string representation of the content."""
        return self.to_string()

    def __repr__(self) -> str:
        """Get the string representation of the UserInputData."""
        return f"UserInputData(content={self.to_string()})"

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
        if isinstance(self.content, list):
            return " ".join(
                item.to_string(uploads_root, base_name)  # pyright: ignore
                for item in self.content
            )
        return self.content.to_string(uploads_root, base_name)

    @classmethod
    def content_from_string(cls, value: str) -> MediaContent:
        """Convert a string to the appropriate MediaContent type.

        Parameters
        ----------
        value : str
            The input string

        Returns
        -------
        MediaContent
            the appropriate MediaContent.
        """
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return TextMediaContent(type="text", text=value)
        if isinstance(parsed, str):
            return TextMediaContent(type="text", text=value)
        return cls.validate_content(parsed)

    @classmethod
    def content_from_dict(cls, value: dict[str, Any]) -> MediaContent:
        """Convert a dictionary to the appropriate MediaContent type.

        Parameters
        ----------
        value : dict[str, Any]
            The input dictionary

        Returns
        -------
        MediaContent
            the appropriate MediaContent.

        Raises
        ------
        ValueError
            If the content type is not supported or
            if any required field is missing.
        """
        content_type = detect_media_type(value)

        # Get the mapping for the detected content type
        if content_type not in CONTENT_MAPPING:
            raise ValueError(f"Unsupported content type: {content_type}")

        # Get the mapping for the content type
        mapping = CONTENT_MAPPING[content_type]
        return cls._build_media_content(value, mapping, content_type)

    @classmethod
    def _build_media_content(
        cls,
        value: dict[str, Any],
        mapping: ContentMappingEntry,
        content_type: str,
    ) -> MediaContent:
        """Try to construct the appropriate MediaContent from the mapping."""
        for field in mapping["fields"]:
            if field not in value:
                continue

            raw_val = value[field]

            if field == mapping["required_field"]:
                # if we have direct mapping to the required field,
                # let's try to instantiate the class directly
                try:
                    return mapping["cls"](**{field: raw_val})
                except ValueError:
                    pass  # let's try to convert it

            converted = cls._convert_simple_content(
                raw_val, mapping["required_field"]
            )
            if converted is not None:  # pragma: no branch
                return mapping["cls"](
                    **{mapping["required_field"]: converted}  # type: ignore
                )

        raise ValueError(
            "Missing required field for content type "
            f"'{content_type}' in: {value}"
        )

    @staticmethod
    def _convert_simple_content(
        raw_val: Any, target_field: str
    ) -> ImageContent | VideoContent | AudioContent | FileContent | None:
        """Convert a simple string to the appropriate content, if applicable."""
        if not isinstance(raw_val, str):  # pragma: no cover
            return None

        if target_field in ("image_url", "image"):
            return ImageContent(url=raw_val)
        if target_field == "video":
            return VideoContent(url=raw_val)
        if target_field == "audio":
            return AudioContent(url=raw_val)
        if target_field == "file":
            filename = extract_filename_from_path(raw_val)
            return FileContent(name=filename, url=raw_val)

        return None  # pragma: no cover

    @field_validator("content", mode="before")
    @classmethod
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
            return cls.content_from_string(v)

        # If it's a dictionary, check if it has a 'type' field
        if isinstance(v, dict):
            return cls.content_from_dict(v)  # pyright: ignore

        # If it's a list
        if isinstance(v, list):
            return [cls.validate_content(item) for item in v]  # type: ignore

        # Default fallback
        return TextMediaContent(type="text", text=str(v))


def extract_filename_from_path(path_or_url: str) -> str:
    """Extract the filename from a given path or URL.

    Parameters
    ----------
    path_or_url: str
        The path or URL from which to extract the filename.

    Returns
    -------
    str
        The extracted filename.
    """
    if "://" in path_or_url:
        # It's a URL - parse it properly
        parsed = urlparse(path_or_url)
        # Extract filename from the path component
        filename = os.path.basename(parsed.path)

        # Handle edge cases where path might be empty or end with /
        if not filename and parsed.path.endswith("/"):
            # Try to get the last directory name
            path_parts = [p for p in parsed.path.split("/") if p]
            filename = path_parts[-1] if path_parts else parsed.netloc
        elif not filename:
            # Fallback to using netloc (domain) if no path
            filename = parsed.netloc

        return filename
    # else:
    # Local file path
    return os.path.basename(path_or_url)
