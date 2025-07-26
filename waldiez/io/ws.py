# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-try-statements
"""WebSocket IOStream implementation for AsyncIO."""

import asyncio
import json
import logging
import uuid
from pathlib import Path
from typing import Any

from autogen.events import BaseEvent  # type: ignore
from autogen.io import IOStream  # type: ignore
from autogen.messages import BaseMessage  # type: ignore

from ._ws import (
    WebSocketConnection,
    create_websocket_adapter,
    is_websocket_available,
)
from .models import UserResponse
from .utils import (
    get_message_dump,
    is_json_dumped,
    now,
    try_parse_maybe_serialized,
)

LOG = logging.getLogger(__name__)

if not is_websocket_available():
    raise ImportError(
        "WebSocket support requires "
        "either the 'websockets' or 'starlette' package. "
        "Please install one of them with "
        "`pip install websockets` or `pip install starlette`."
    )


class AsyncWebsocketsIOStream(IOStream):
    """AsyncIO WebSocket class to handle communication."""

    def __init__(
        self,
        websocket: Any,
        is_async: bool = False,
        uploads_root: str | Path | None = None,
        verbose: bool = False,
        receive_timeout: float | None = 120.0,
    ) -> None:
        """Initialize the AsyncWebsocketsIOStream instance.

        Parameters
        ----------
        websocket : Any
            The WebSocket connection (either websockets or Starlette/FastAPI).
        is_async : bool
            Whether the connection is asynchronous.
        uploads_root : str | Path | None
            The root directory for uploads.
        verbose : bool
            Whether to enable verbose logging.
        receive_timeout : float | None
            Default timeout for receiving messages in seconds.
            If None, defaults to 120 seconds.
        """
        super().__init__()

        # Create the WebSocket adapter
        if hasattr(websocket, "send_message") and hasattr(
            websocket, "receive_message"
        ):
            self.websocket: WebSocketConnection = websocket
        else:
            self.websocket = create_websocket_adapter(websocket)

        self.is_async = is_async
        self.verbose = verbose
        self.receive_timeout = receive_timeout

        if isinstance(uploads_root, str):
            uploads_root = Path(uploads_root)
        if uploads_root is not None:
            uploads_root = uploads_root.resolve()
        self.uploads_root = uploads_root

    def _try_send(self, json_dump: str) -> None:
        try:
            # Check if we're already in an async context
            loop = None
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                pass

            if loop is not None:
                # We're in an async context, create a task
                asyncio.create_task(self.websocket.send_message(json_dump))
            else:
                # We're not in an async context, run the coroutine
                asyncio.run(self.websocket.send_message(json_dump))

        except BaseException as error:  # pylint: disable=broad-exception-caught
            LOG.error("Error sending message: %s", error)

    def print(self, *args: Any, **kwargs: Any) -> None:
        """Print to the WebSocket connection.

        Parameters
        ----------
        args : tuple
            The arguments to print.
        kwargs : Any
            The keyword arguments to print.
        """
        sep = kwargs.get("sep", " ")
        end = kwargs.get("end", "\n")
        msg = sep.join(str(arg) for arg in args)

        is_dumped = is_json_dumped(msg)
        if is_dumped and end.endswith("\n"):
            msg = json.loads(msg)
        else:
            msg = f"{msg}{end}"

        json_dump = json.dumps(
            {
                "type": "print",
                "data": msg,
            }
        )

        if self.verbose:
            LOG.info(json_dump)
        self._try_send(json_dump)

    def send(self, message: BaseEvent | BaseMessage) -> None:
        """Send a message to the WebSocket connection.

        Parameters
        ----------
        message : BaseEvent | BaseMessage
            The message to send.
        """
        message_dump = get_message_dump(message)

        if message_dump.get("type") == "text":
            content_block = message_dump.get("content")
            if (
                isinstance(content_block, dict)
                and "content" in content_block
                and isinstance(content_block["content"], str)
            ):
                inner_content = content_block["content"]
                content_block["content"] = try_parse_maybe_serialized(
                    inner_content
                )
                message_dump["content"] = content_block

        json_dump = json.dumps(message_dump, ensure_ascii=False)

        if self.verbose:
            LOG.info("sending: \n%s\n", json_dump)

        self._try_send(json_dump)

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
            return coro  # type: ignore  # pragma: no cover

        try:
            return asyncio.run(coro)
        except RuntimeError:
            loop = asyncio.get_event_loop()
            future = asyncio.run_coroutine_threadsafe(coro, loop)
            return future.result()

    async def a_input(
        self,
        prompt: str = "",
        *,
        password: bool = False,
        timeout: float | None = None,
    ) -> str:
        """Get input from the WebSocket connection.

        Parameters
        ----------
        prompt : str
            The prompt to display.
        password : bool
            Whether to hide the input.
        timeout : float | None
            Timeout for receiving the response in seconds.
            If None, uses the instance's default receive_timeout.

        Returns
        -------
        str
            The user input, or empty string if timeout exceeded.
        """
        if timeout is None:
            timeout = self.receive_timeout or 120.0

        request_id = uuid.uuid4().hex
        prompt_dump = json.dumps(
            {
                "id": request_id,
                "timestamp": now(),
                "type": "input_request",
                "request_id": request_id,
                "prompt": prompt,
                "password": password,
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    }
                ],
            }
        )

        await self.websocket.send_message(prompt_dump)
        response = await self.websocket.receive_message(timeout=timeout)

        # Handle empty response from timeout
        if not response:
            LOG.warning("Input request timed out after %s seconds", timeout)
            return ""

        if self.verbose:
            LOG.info("Got input: %s ...", response[:300])

        response_dict: dict[str, Any] | str
        try:
            response_dict = json.loads(response)
        except json.JSONDecodeError:
            return response

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

        Returns
        -------
        str
            The parsed response content.
        """
        if "data" in response:
            response_data = response["data"]
            if isinstance(response_data, str):  # pragma: no branch
                try:
                    # double dumped?
                    parsed = json.loads(response_data)
                except json.JSONDecodeError:
                    pass
                else:
                    response["data"] = parsed

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

        return user_response.to_string(
            uploads_root=self.uploads_root,
            base_name=request_id,
        )
