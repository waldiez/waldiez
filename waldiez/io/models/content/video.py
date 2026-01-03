# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument
# pyright: reportUnusedParameter=false
"""Video and audio media content models."""

from pathlib import Path

from pydantic import BaseModel
from typing_extensions import Literal

from .base import VideoContent


# noinspection PyUnusedLocal
class VideoMediaContent(BaseModel):
    """Video media content."""

    type: Literal["video"] = "video"
    video: VideoContent

    def to_string(
        self,
        uploads_root: Path | None,
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
        if self.video.url:
            return f"<video src='{self.video.url}'></video>"
        if self.video.file:
            return f"<video src='{self.video.file}'></video>"
        return str(self.video.file)
