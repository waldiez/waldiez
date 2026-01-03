# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Models package for structured I/O."""

# Base models
from .base import PrintMessage, StructuredBase, UserInputRequest

# Constants and mappings
from .constants import (
    CONTENT_MAPPING,
    ContentMappingEntry,
    ContentTypeKey,
    MediaContent,
)

# Content models
from .content import (
    AudioContent,
    AudioMediaContent,
    FileContent,
    FileMediaContent,
    ImageContent,
    ImageMediaContent,
    ImageUrlMediaContent,
    TextMediaContent,
    VideoContent,
    VideoMediaContent,
)

# User models
from .user_input import UserInputData
from .user_response import UserResponse

__all__ = [
    # Base models
    "StructuredBase",
    "UserInputRequest",
    "PrintMessage",
    # Content base types
    "ImageContent",
    "VideoContent",
    "AudioContent",
    "FileContent",
    "MediaContent",
    # Content models
    "TextMediaContent",
    "ImageMediaContent",
    "ImageUrlMediaContent",
    "VideoMediaContent",
    "AudioMediaContent",
    "FileMediaContent",
    # User models
    "UserInputData",
    "UserResponse",
    # Constants
    "ContentTypeKey",
    "ContentMappingEntry",
    "CONTENT_MAPPING",
]
