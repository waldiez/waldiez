# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument
# pyright: reportUnusedParameter=false
"""File media content models."""

from pathlib import Path
from typing import Literal

from pydantic import BaseModel

from .base import FileContent


# noinspection PyUnusedLocal
class FileMediaContent(BaseModel):
    """File media content."""

    type: Literal["file"] = "file"
    file: FileContent

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
        if self.file.url:
            return f"<a href='{self.file.url}'>{self.file.name}</a>"
        if self.file.file:
            return f"<a href='{self.file.file}'>{self.file.name}</a>"
        return str(self.file.file)
