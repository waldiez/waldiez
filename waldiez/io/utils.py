# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Utility functions for the waldiez.io package."""

import uuid
from datetime import datetime
from pathlib import Path

from autogen.agentchat.contrib.img_utils import get_pil_image  # type: ignore


def gen_id() -> str:
    """Generate a unique identifier.

    Returns
    -------
    str
        A unique id
    """
    return str(uuid.uuid4())


def now() -> str:
    """Get the current time as an ISO string.

    Returns
    -------
    str
        The current time as an ISO string.
    """
    return datetime.now().isoformat()


def get_image(
    uploads_root: Path | None,
    image_data: str,
    base_name: str | None = None,
) -> str:
    """Store the image data in a file and return the file path.

    Parameters
    ----------
    uploads_root : Path | None
        The root directory for storing images, optional.
    image_data : str
        The base64-encoded image data.
    base_name : str | None
        The base name for the image file, optional.

    Returns
    -------
    str
        The file path of the stored image.
    """
    if uploads_root:
        # noinspection PyBroadException
        # pylint: disable=broad-exception-caught
        try:
            pil_image = get_pil_image(image_data)
        except BaseException:
            return image_data
        if not base_name:
            base_name = uuid.uuid4().hex
        file_name = f"{base_name}.png"
        file_path = uploads_root / file_name
        pil_image.save(file_path, format="PNG")
        return str(file_path)
    return image_data
