# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Base content models for media types."""

from typing import Any, Optional

from pydantic import BaseModel


class ImageContent(BaseModel):
    """Image content model."""

    url: Optional[str] = None
    file: Optional[Any] = None  # File type not directly mappable in Python
    alt: Optional[str] = None


class VideoContent(BaseModel):
    """Video content model."""

    url: Optional[str] = None
    file: Optional[Any] = None
    duration: Optional[int] = None
    thumbnailUrl: Optional[str] = None
    mimeType: Optional[str] = None


class AudioContent(BaseModel):
    """Audio content model."""

    url: Optional[str] = None
    file: Optional[Any] = None
    duration: Optional[int] = None
    transcript: Optional[str] = None


class FileContent(BaseModel):
    """File content model."""

    url: Optional[str] = None
    file: Optional[Any] = None
    name: str
    size: Optional[int] = None
    type: Optional[str] = None
    previewUrl: Optional[str] = None
