# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument
# pyright: reportUnusedParameter=false
"""Audio media content models."""

from pathlib import Path
from typing import Literal

from pydantic import BaseModel

from .base import AudioContent


# noinspection PyUnusedLocal
class AudioMediaContent(BaseModel):
    """Audio media content."""

    type: Literal["audio"] = "audio"
    audio: AudioContent

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
        if self.audio.url:
            return f"<audio src='{self.audio.url}'></audio>"
        if self.audio.file:
            return f"<audio src='{self.audio.file}'></audio>"
        return str(self.audio.file)
