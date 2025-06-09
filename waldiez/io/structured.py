# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Structured I/O stream for JSON-based communication over stdin/stdout."""

import ast
import json
import queue
import sys
import threading
from getpass import getpass
from pathlib import Path
from typing import Any
from uuid import uuid4

from autogen.events import BaseEvent  # type: ignore
from autogen.io import IOStream  # type: ignore

from .models import (
    PrintMessage,
    UserInputData,
    UserInputRequest,
    UserResponse,
)
from .utils import gen_id, get_image, now


class StructuredIOStream(IOStream):
    """Structured I/O stream using stdin and stdout."""

    uploads_root: Path | None = None

    def __init__(
        self, timeout: float = 120, uploads_root: Path | str | None = None
    ) -> None:
        self.timeout = timeout
        if uploads_root is not None:
            self.uploads_root = Path(uploads_root).resolve()
            if not self.uploads_root.exists():
                self.uploads_root.mkdir(parents=True, exist_ok=True)

    # noinspection PyMethodMayBeStatic
    # pylint: disable=no-self-use
    def print(self, *args: Any, **kwargs: Any) -> None:
        """Structured print to stdout.

        Parameters
        ----------
        args : Any
            The data to print.
        kwargs : Any
        """
        sep = kwargs.get("sep", " ")
        end = kwargs.get("end", "\n")
        message = sep.join(map(str, args)) + end
        payload = PrintMessage(
            id=uuid4().hex,
            timestamp=now(),
            data=message,
        ).model_dump(mode="json")
        flush = kwargs.get("flush", True)
        print(json.dumps(payload), flush=flush)

    def input(self, prompt: str = "", *, password: bool = False) -> str:
        """Structured input from stdin.

        Parameters
        ----------
        prompt : str, optional
            The prompt to display. Defaults to "".
        password : bool, optional
            Whether to read a password. Defaults to False.

        Returns
        -------
        str
            The line read from the input stream.
        """
        request_id = uuid4().hex
        prompt = prompt or "> "

        self._send_input_request(prompt, request_id, password)
        user_input_raw = self._read_user_input(prompt, password, request_id)
        response = self._handle_user_input(user_input_raw, request_id)
        user_response = response.to_string(
            uploads_root=self.uploads_root,
            base_name=request_id,
        )
        print("Got user input:", user_response, flush=True)
        return user_response

    # noinspection PyMethodMayBeStatic
    # pylint: disable=no-self-use
    def send(self, message: BaseEvent) -> None:
        """Structured sending of a BaseEvent.

        Parameters
        ----------
        message : BaseEvent
            The message to send.
        """
        message_dump = message.model_dump(mode="json")
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
        print(json.dumps(message_dump), flush=True)

    # noinspection PyMethodMayBeStatic
    # pylint: disable=no-self-use
    def _send_input_request(
        self,
        prompt: str,
        request_id: str,
        password: bool,
    ) -> None:
        payload = UserInputRequest(
            request_id=request_id,
            prompt=prompt,
            password=password,
        ).model_dump(mode="json")
        print(json.dumps(payload), flush=True)

    def _read_user_input(
        self,
        prompt: str,
        password: bool,
        request_id: str,
    ) -> str:
        input_queue: queue.Queue[str] = queue.Queue()

        def read_input() -> None:
            """Read user input from stdin."""
            try:
                user_input = (
                    getpass(prompt).strip()
                    if password
                    else input(prompt).strip()
                )
                input_queue.put(user_input)
            except EOFError:
                input_queue.put("")

        input_thread = threading.Thread(target=read_input, daemon=True)
        input_thread.start()

        try:
            return input_queue.get(timeout=self.timeout)
        except queue.Empty:
            self._send_timeout_message(request_id)
            return ""

    def _send_timeout_message(self, request_id: str) -> None:
        timeout_payload = {
            "id": gen_id(),
            "type": "timeout",
            "request_id": request_id,
            "timestamp": now(),
            "data": f"No input received after {self.timeout} seconds.",
        }
        print(json.dumps(timeout_payload), flush=True)

    def _handle_user_input(
        self, user_input_raw: str, request_id: str
    ) -> UserResponse:
        """Handle user input and return the appropriate response.

        Parameters
        ----------
        user_input_raw : str
            The raw user input string.
        request_id : str
            The request ID to match against.

        Returns
        -------
        UserResponse
            The structured user response.
        """
        user_input = self._load_user_input(user_input_raw)
        if isinstance(user_input, str):
            return UserResponse(data=user_input, request_id=request_id)
        return self._parse_user_input(user_input, request_id)

    @staticmethod
    def _load_user_input(user_input_raw: str) -> str | dict[str, Any]:
        """Load user input from a raw string.

        Parameters
        ----------
        user_input_raw : str
            The raw user input string.

        Returns
        -------
        str | dict[str, Any]
            The loaded user input, either as a string or a dictionary.
        """
        response: str | dict[str, Any] = user_input_raw
        try:
            # Attempt to parse the input as JSON
            response = json.loads(user_input_raw)
        except json.JSONDecodeError:
            # If it's not valid JSON, return as is
            # This allows for backwards compatibility with raw text input
            return user_input_raw
        if isinstance(response, str):
            # double inner dumped?
            try:
                response = json.loads(response)
            except json.JSONDecodeError:
                # If it's not valid JSON, return as is
                return response
        if not isinstance(response, dict):
            return str(response)
        if "data" in response and isinstance(response["data"], str):
            # double inner dumped?
            try:
                response["data"] = json.loads(response["data"])
            except json.JSONDecodeError:
                pass
        return response

    def _parse_user_input(
        self, user_input: dict[str, Any], request_id: str
    ) -> UserResponse:
        """Parse user input and return the appropriate response.

        Parameters
        ----------
        user_input : str
            The raw user input string.
        request_id : str
            The request ID to match against.

        Returns
        -------
        UserResponse
            The structured user response.
        """
        # Load the user input
        if user_input.get("request_id") == request_id:
            # We have a valid response to our request
            data = user_input.get("data")
            if not data:
                # let's check if text|image keys are sent (outside data)
                if "image" in user_input or "text" in user_input:
                    return UserResponse(
                        request_id=request_id,
                        data=self._format_multimedia_response(
                            request_id=request_id, data=user_input
                        ),
                    )
            if isinstance(data, list):
                return self._handle_list_response(
                    data,  # pyright: ignore
                    request_id=request_id,
                )
            if not data or not isinstance(data, (str, dict)):
                # No / invalid data provided in the response
                return UserResponse(
                    request_id=request_id,
                    data="",
                )
            # Process different data types
            if isinstance(data, str):
                # double inner dumped?
                data = self._load_user_input(data)
            if isinstance(data, dict):
                return UserResponse(
                    data=self._format_multimedia_response(
                        request_id=request_id,
                        data=data,  # pyright: ignore
                    ),
                    request_id=request_id,
                )
            # For other types (numbers, bools ,...),
            #  let's just convert to string
            return UserResponse(
                data=str(data), request_id=request_id
            )  # pragma: no cover
        # This response doesn't match our request_id, log and return empty
        self._log_mismatched_response(request_id, user_input)
        return UserResponse(
            request_id=request_id,
            data="",
        )

    def _handle_list_response(
        self,
        data: list[dict[str, Any]],
        request_id: str,
    ) -> UserResponse:
        if len(data) == 0:  # pyright: ignore
            # Empty list, return empty response
            return UserResponse(
                request_id=request_id,
                data="",
            )

        input_data: list[UserInputData] = []
        for entry in data:  # pyright: ignore
            # pylint: disable=broad-exception-caught
            try:
                content = UserInputData.model_validate(entry)
                input_data.append(content)
            except Exception as error:  # pragma: no cover
                print({"type": "error", "message": str(error)}, file=sys.stderr)
                continue
        if not input_data:  # pragma: no cover
            # No valid data in the list, return empty response
            return UserResponse(
                request_id=request_id,
                data="",
            )
        return UserResponse(
            request_id=request_id,
            data=input_data,
        )

    @staticmethod
    def _log_mismatched_response(expected_id: str, response: Any) -> None:
        """Log information about mismatched response IDs.

        Parameters
        ----------
        expected_id : str
            The request ID we were expecting
        response : Any
            The response received
        """
        # Create a log message
        log_payload: dict[str, Any] = {
            "type": "warning",
            "id": uuid4().hex,
            "timestamp": now(),
            "data": {
                "message": (
                    "Received response with mismatched request_id. "
                    f"Expected: {expected_id}"
                ),
                "details": {
                    "expected_id": expected_id,
                    "received": str(response)[:100]
                    + ("..." if len(str(response)) > 100 else ""),
                },
            },
        }
        # Print to stderr to avoid interfering with stdout communication
        print(json.dumps(log_payload), file=sys.stderr)

    def _format_multimedia_response(
        self,
        data: dict[str, Any],
        request_id: str | None = None,
    ) -> str:
        """Format a multimedia response dict into a string with image tags.

        Parameters
        ----------
        data : dict[str, Any]
            The data dictionary containing "image" and "text" keys.
        request_id : str | None
            The input request ID, if available.

        Returns
        -------
        str
            The formatted string with image tags and text.
        """
        result: list[str] = []
        if "content" in data and isinstance(data["content"], dict):
            return self._format_multimedia_response(
                data=data["content"],  # pyright: ignore
                request_id=request_id,
            )

        # Handle image if present
        if "image" in data and data["image"]:
            image_data = data["image"]
            image = get_image(self.uploads_root, image_data, request_id)
            img_tag = f"<img {image}>"
            result.append(img_tag)

        # Handle text if present
        if "text" in data and data["text"]:
            result.append(str(data["text"]))

        # If neither image nor text, return empty string
        if not result:
            return ""
        # Join with a space
        return " ".join(result)


def try_parse_maybe_serialized(value: str) -> Any:
    """Parse a string that may be JSON or Python serialized.

    Returns the parsed object if successful, or the original string otherwise.

    Parameters
    ----------
    value : str
        The string to parse.

    Returns
    -------
    Any
        The parsed object or the original string if parsing fails.
    """
    for parser in (json.loads, ast.literal_eval):
        # pylint: disable=broad-exception-caught, too-many-try-statements
        try:
            parsed: dict[str, Any] | list[Any] | str = parser(value)
            # Normalize: if it's a single-item list of a string
            # return the string
            if (
                isinstance(parsed, list)
                and len(parsed) == 1
                and isinstance(parsed[0], str)
            ):
                return parsed[0]
            return parsed
        except Exception:
            pass  # Try next parser
    return value  # Return original if all parsing fails
