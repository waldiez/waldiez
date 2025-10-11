# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.


"""Base content models for media types."""

from typing import Any

from pydantic import BaseModel


class ImageContent(BaseModel):
    """Image content model."""

    url: str | None = None
    file: Any | None = None  # File type not directly mappable in Python
    alt: str | None = None


class VideoContent(BaseModel):
    """Video content model."""

    url: str | None = None
    file: Any | None = None
    duration: int | None = None
    thumbnailUrl: str | None = None
    mimeType: str | None = None


class AudioContent(BaseModel):
    """Audio content model."""

    url: str | None = None
    file: Any | None = None
    duration: int | None = None
    transcript: str | None = None


class FileContent(BaseModel):
    """File content model."""

    url: str | None = None
    file: Any | None = None
    name: str
    size: int | None = None
    type: str | None = None
    previewUrl: str | None = None
