# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""WebSocket IOStream implementation for AsyncIO."""

import asyncio
import json
import logging
import uuid
from pathlib import Path
from typing import Any

try:
    import websockets
except ImportError as error:
    raise ImportError(
        "websockets package is required for AsyncWebsocketsIOStream. "
        "Please install it with `pip install websockets`."
    ) from error
from autogen.events import BaseEvent  # type: ignore
from autogen.io import IOStream  # type: ignore

from .models import (
    UserInputData,
    UserResponse,
)
from .utils import get_image, now

LOG = logging.getLogger(__name__)


class AsyncWebsocketsIOStream(IOStream):
    """AsyncIO WebSocket class to handle communication."""

    def __init__(
        self,
        websocket: websockets.ServerConnection,
        is_async: bool = False,
        uploads_root: str | Path | None = None,
        verbose: bool = False,
    ) -> None:
        """Initialize the AsyncIOWebsockets instance.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        is_async : bool
            Whether the connection is asynchronous.
        uploads_root : str | Path | None
            The root directory for uploads.
        verbose : bool
            Whether to enable verbose logging.
        """
        super().__init__()
        self.websocket = websocket
        self.is_async = is_async
        self.verbose = verbose
        if isinstance(uploads_root, str):
            uploads_root = Path(uploads_root)
        if uploads_root is not None:
            uploads_root = uploads_root.resolve()
        self.uploads_root = uploads_root

    def print(self, *args: Any, **kwargs: Any) -> None:
        """Print to the WebSocket connection.

        Parameters
        ----------
        args : tuple
            The arguments to print.
        kwargs : dict
            The keyword arguments to print.
        """
        sep = kwargs.get("sep", " ")
        end = kwargs.get("end", "\n")
        msg = sep.join(str(arg) for arg in args) + end
        json_dump = json.dumps(
            {
                "type": "print",
                "message": msg,
            }
        )
        if self.verbose:
            LOG.info(json_dump)
        asyncio.run(
            self.websocket.send(json_dump),
        )

    def send(self, message: BaseEvent) -> None:
        """Send a message to the WebSocket connection.

        Parameters
        ----------
        message : str
            The message to send.
        """
        message_dump = message.model_dump(mode="json")
        json_dump = json.dumps(message_dump)
        if self.verbose:
            LOG.info("sending: \n%s\n", json_dump)
        asyncio.run(
            self.websocket.send(json_dump),
        )

    def input(self, prompt: str = "", *, password: bool = False) -> str:
        """Sync-compatible input (will run the async version in the loop).

        Parameters
        ----------
        prompt : str
            The prompt to display.
        password : bool
            Whether to hide the input.

        Returns
        -------
        str
            The user input.
        """
        coro = self.a_input(prompt, password=password)
        if self.is_async:
            # conversable_agent has:
            # iostream = IOStream.get_default()
            # reply = await iostream.input(prompt)  # ? await ?
            return coro  # type: ignore
        try:
            return asyncio.run(coro)
        except RuntimeError:
            loop = asyncio.get_event_loop()
            future = asyncio.run_coroutine_threadsafe(coro, loop)
            return future.result()

    # pylint: disable=unused-argument,no-self-use
    async def a_input(self, prompt: str = "", *, password: bool = False) -> str:
        """Get input from the WebSocket connection.

        Parameters
        ----------
        prompt : str
            The prompt to display.
        password : bool
            Whether to hide the input.

        Returns
        -------
        str
            The user input.
        """
        request_id = uuid.uuid4().hex
        prompt_dump = json.dumps(
            {
                "id": request_id,
                "timestamp": now(),
                "type": "input_request",
                "request_id": request_id,
                "prompt": prompt,
                "password": password,
            }
        )
        await self.websocket.send(prompt_dump)
        response = await self.websocket.recv()
        # response = asyncio.run(self.websocket.recv())
        if isinstance(response, bytes):
            response = response.decode("utf-8")
        if self.verbose:
            LOG.info("Got input: %s ...", response[:300])
        response_dict: dict[str, Any] | str
        try:
            response_dict = json.loads(response)
        except json.JSONDecodeError:
            return response if isinstance(response, str) else str(response)
        if not isinstance(response_dict, dict):
            LOG.error("Invalid input response: %s", response)
            return ""
        return self._parse_response(response_dict, request_id)

    def _parse_response(self, response: dict[str, Any], request_id: str) -> str:
        """Parse the response from the WebSocket connection.

        Parameters
        ----------
        response : dict
            The response from the WebSocket connection.
        request_id : str
            The request ID of the input request.
        """
        if "data" in response:
            response_data = response["data"]
            if isinstance(response, str):  # double dumped?
                try:
                    response_data = json.loads(response_data)
                except json.JSONDecodeError:
                    pass
                else:
                    response["data"] = response_data
        try:
            user_response = UserResponse.model_validate(response)
        except Exception as error:  # pylint: disable=broad-exception-caught
            LOG.error("Error parsing user input response: %s", error)
            return ""
        if user_response.request_id != request_id:
            LOG.error(
                "User response request ID mismatch: %s != %s",
                user_response.request_id,
                request_id,
            )
            return ""
        return self.get_response_text(user_response, request_id)

    # pylint: disable=too-many-return-statements
    def get_content_string(
        self, user_response_data: UserInputData, request_id: str
    ) -> str:
        """Get the string content from the user input data.

        Parameters
        ----------
        user_response_data : UserInputData
            The user input data to parse.
        request_id : str
            The request ID of the input request.

        Returns
        -------
        str
            The string content of the user input data.
        """
        if user_response_data.content.type == "text":
            return user_response_data.content.text
        if user_response_data.content.type == "image_url":
            if not user_response_data.content.image_url:
                return ""
            image_url = user_response_data.content.image_url
            if not image_url or not image_url.url:
                return ""
            image = get_image(
                uploads_root=self.uploads_root,
                image_data=image_url.url,
                base_name=request_id,
            )
            return f"<img {image}>"
        if user_response_data.content.type == "image":
            if not user_response_data.content.image:
                return ""
            image_data = (
                user_response_data.content.image.file
                or user_response_data.content.image.url
            )
            if not image_data:
                return ""
            image = get_image(
                uploads_root=self.uploads_root,
                image_data=image_data,
                base_name=request_id,
            )
            return f"<img {image}>"
        # if user_response_data.content.type == "audio":
        #     audio = StructuredIOStream.get_audio(
        #         uploads_root=self.uploads_root,
        #         audio_data=user_response_data.content.audio.file,
        #         base_name=request_id,
        #     )
        #     return f"<audio {audio}>"
        # if user_response_data.content.type == "video":
        #     video = StructuredIOStream.get_video(
        #         uploads_root=self.uploads_root,
        #         video_data=user_response_data.content.video.file,
        #         base_name=request_id,
        #     )
        #     return f"<video {video}>"
        # if user_response_data.content.type == "file":
        #     file = StructuredIOStream.get_file(
        #         uploads_root=self.uploads_root,
        #         file_data=user_response_data.content.file.file,
        #         base_name=request_id,
        #     )
        #     return f"<file {file}>"...
        LOG.error(
            "Unknown content type: %s",
            user_response_data.content.type,
        )
        return ""

    def get_response_text(
        self, user_response: UserResponse, request_id: str
    ) -> str:
        """Get the text content from the user response.

        Parameters
        ----------
        user_response : UserResponse
            The user response to parse.
        request_id : str
            The request ID of the input request.

        Returns
        -------
        str
            The text data of the user response.
        """
        response_str = ""
        if isinstance(user_response.data, str):
            return user_response.data
        if isinstance(user_response.data, list):
            for entry in user_response.data:
                if isinstance(entry, str):
                    response_str += entry
                else:
                    response_str += self.get_content_string(entry, request_id)
            return response_str
        if isinstance(user_response.data, UserInputData):  # pyright: ignore
            return self.get_content_string(user_response.data, request_id)
        return response_str
