# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Utility functions for the waldiez.io package."""

import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Literal, Union

from autogen.agentchat.contrib.img_utils import get_pil_image  # type: ignore

MessageType = Literal[
    "input_request",
    "input_response",
    "print",
    "input",
]
"""Possible message types for the structured I/O stream."""

MediaType = Union[
    Literal["text"],
    Literal["image"],
    Literal["image_url"],
    Literal["video"],
    Literal["audio"],
    Literal["file"],
]
"""Possible media types for the structured I/O stream."""


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


def detect_media_type(value: dict[str, Any]) -> MediaType:
    """Detect mediatype from dict.

    Either using the 'type' field or by checking the keys.

    Parameters
    ----------
    value : dict[str, Any]
        The input dictionary

    Returns
    -------
    MediaType
        The detected media type

    Raises
    ------
    ValueError
        If the media type is not valid or not found.
    """
    valid_types = (
        "text",
        "image",
        "image_url",
        "video",
        "audio",
        "file",
    )
    if "type" in value:
        content_type = value["type"]
        if content_type not in valid_types:
            raise ValueError(f"Invalid media type: {content_type}")
        return content_type
    for valid_type in valid_types:
        if valid_type in value:
            return valid_type  # type: ignore
    raise ValueError(f"No type in value: {value}.")


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
