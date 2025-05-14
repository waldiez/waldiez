# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""WebSocket IOStream implementation for AsyncIO."""

import asyncio
import json
import logging
import time
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

from .common import UserResponse
from .structured import StructuredIOStream

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
            LOG.info(json_dump)
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
                "time": int(time.time() * 1_000_000),
                "type": "input",
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
        try:
            response_dict = json.loads(response)
        except json.JSONDecodeError:
            return response
        return self._parse_response(response_dict, request_id)

    def _parse_response(self, response: dict[str, Any], request_id: str) -> str:
        if "input" in response:
            try:
                user_response = UserResponse.model_validate(response["input"])
            except Exception:  # pylint: disable=broad-exception-caught
                LOG.error("Error parsing user input response: %s", response)
                return "\n"
        else:
            # check if already in a UserResponse format
            try:
                user_response = UserResponse.model_validate(response)
            except Exception:  # pylint: disable=broad-exception-caught
                LOG.error("Error parsing user input response: %s", response)
                return "\n"
        if user_response.request_id != request_id:
            LOG.error(
                "Invalid input request_id. Expecting %s, got: %s",
                request_id,
                user_response.request_id,
            )
            return "\n"
        response_str = user_response.data.text or ""
        if user_response.data.image:
            image = StructuredIOStream.get_image(
                uploads_root=self.uploads_root,
                image_data=user_response.data.image,
                base_name=request_id,
            )
            response_str = f"{response_str} <img {image}>"
            # response_str = f"{response_str} <img {user_response.data.image}>"
        if not response_str:
            response_str = "\n"
        return response_str
