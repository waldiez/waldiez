# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Constants and type mappings for content models."""

from typing import Type, TypedDict, Union

from typing_extensions import Literal

from .content.audio import AudioMediaContent
from .content.file import FileMediaContent
from .content.image import ImageMediaContent, ImageUrlMediaContent
from .content.text import TextMediaContent
from .content.video import VideoMediaContent

MediaContent = Union[
    TextMediaContent,
    ImageMediaContent,
    ImageUrlMediaContent,
    VideoMediaContent,
    AudioMediaContent,
    FileMediaContent,
]

ContentTypeKey = Literal[
    "text", "image", "image_url", "video", "audio", "file", "document"
]
"""Possible content types for the mapping."""


class ContentMappingEntry(TypedDict):
    """TypedDict for content mapping entries.

    Attributes
    ----------
    fields: List[str]
        List of possible field names for the content type
    cls: Type[MediaContent]
        The class to instantiate for this content type
    required_field: str
        The field name required by the class constructor
    """

    fields: list[str]
    cls: Type[MediaContent]
    required_field: str


CONTENT_MAPPING: dict[ContentTypeKey, ContentMappingEntry] = {
    "text": {
        "fields": ["text"],
        "cls": TextMediaContent,
        "required_field": "text",
    },
    "image": {
        "fields": ["image"],
        "cls": ImageMediaContent,
        "required_field": "image",
    },
    "image_url": {
        "fields": ["image_url", "url"],
        "cls": ImageUrlMediaContent,
        "required_field": "image_url",
    },
    "video": {
        "fields": ["video"],
        "cls": VideoMediaContent,
        "required_field": "video",
    },
    "audio": {
        "fields": ["audio"],
        "cls": AudioMediaContent,
        "required_field": "audio",
    },
    "document": {
        "fields": ["document", "file"],
        "cls": FileMediaContent,
        "required_field": "file",
    },
    "file": {
        "fields": ["document", "file"],
        "cls": FileMediaContent,
        "required_field": "file",
    },
}
