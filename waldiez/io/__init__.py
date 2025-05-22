# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# flake8: noqa: F401
# pylint: disable=unused-import,too-few-public-methods

"""IOSTream extensions.

Let's keep the redis and websockets imports optional,
and have them in the optional requirements in the package.
"""

from typing import Any

from .models import (
    AudioContent,
    AudioMediaContent,
    FileContent,
    FileMediaContent,
    ImageContent,
    ImageMediaContent,
    ImageUrlMediaContent,
    MediaContent,
    PrintMessage,
    TextMediaContent,
    UserInputData,
    UserInputRequest,
    UserResponse,
    VideoContent,
    VideoMediaContent,
)
from .structured import StructuredIOStream
from .utils import MediaType, MessageType

try:
    from .redis import RedisIOStream  # type: ignore[no-redef,unused-ignore]
except ImportError:  # pragma: no cover

    class RedisIOStream:  # type: ignore[no-redef,unused-ignore]
        """Dummy class for RedisIOStream."""

        def __init__(self, *args: Any, **kwargs: Any) -> None:
            """Initialize the RedisIOStream.

            Parameters
            ----------
            args : tuple
                Positional arguments.
            kwargs : dict
                Keyword arguments.
            """
            raise ImportError(
                "RedisIOStream is not available. "
                "Please install the required package."
            )


try:
    from .ws import (
        AsyncWebsocketsIOStream,  # type: ignore[no-redef,unused-ignore]
    )
except ImportError:  # pragma: no cover

    class AsyncWebsocketsIOStream:  # type: ignore[no-redef,unused-ignore]
        """Dummy class for AsyncWebsocketsIOStream just for the linters."""

        def __init__(self, *args: Any, **kwargs: Any) -> None:
            """Initialize the AsyncWebsocketsIOStream.

            Parameters
            ----------
            args : tuple
                Positional arguments.
            kwargs : dict
                Keyword arguments.
            """
            raise ImportError(
                "AsyncWebsocketsIOStream is not available. "
                "Please install the required package."
            )


__all__ = [
    "StructuredIOStream",
    "UserInputData",
    "UserResponse",
    "UserInputRequest",
    "PrintMessage",
    "RedisIOStream",
    "AsyncWebsocketsIOStream",
    "MessageType",
    "MediaType",
    "MediaContent",
    "TextMediaContent",
    "ImageMediaContent",
    "ImageUrlMediaContent",
    "ImageContent",
    "FileMediaContent",
    "FileContent",
    "AudioMediaContent",
    "AudioContent",
    "VideoMediaContent",
    "VideoContent",
]
