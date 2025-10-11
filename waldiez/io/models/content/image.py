# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument
# pyright: reportUnusedParameter=false
"""Image media content models."""

from pathlib import Path

from pydantic import BaseModel
from typing_extensions import Literal

from ...utils import get_image
from .base import ImageContent


# noinspection DuplicatedCode
class ImageMediaContent(BaseModel):
    """Image media content."""

    type: Literal["image"] = "image"
    image: ImageContent

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
        if self.image.url:
            image = get_image(
                uploads_root=uploads_root,
                image_data=self.image.url,
                base_name=base_name,
            )
            return f"<img {image}>"
        if self.image.file:
            image = get_image(
                uploads_root=uploads_root,
                image_data=self.image.file,
                base_name=base_name,
            )
            return f"<img {image}>"
        return str(self.image.file)


class ImageUrlMediaContent(BaseModel):
    """Image URL media content."""

    type: Literal["image_url"] = "image_url"
    image_url: ImageContent

    # noinspection DuplicatedCode
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
        if self.image_url.url:
            image = get_image(
                uploads_root=uploads_root,
                image_data=self.image_url.url,
                base_name=base_name,
            )
            return f"<img {image}>"
        if self.image_url.file:
            image = get_image(
                uploads_root=uploads_root,
                image_data=self.image_url.file,
                base_name=base_name,
            )
            return f"<img {image}>"
        return str(self.image_url.file)
