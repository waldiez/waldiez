# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument
"""Text media content models."""

from pathlib import Path

from pydantic import BaseModel
from typing_extensions import Literal


# noinspection PyUnusedLocal
class TextMediaContent(BaseModel):
    """Text media content."""

    type: Literal["text"] = "text"
    text: str

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
        return self.text
