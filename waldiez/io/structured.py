# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportMissingTypeStubs=false,reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false,reportArgumentType=false
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportPrivateImportUsage=false

"""Structured I/O stream for JSON-based communication over stdin/stdout."""

import json
import sys
from getpass import getpass
from pathlib import Path
from typing import Any

from autogen.events import BaseEvent  # type: ignore
from autogen.io import IOStream  # type: ignore
from autogen.messages import BaseMessage  # type: ignore

from .models import (
    PrintMessage,
    UserInputData,
    UserInputRequest,
    UserResponse,
)
from .utils import (
    DEBUG_INPUT_PROMPT,
    START_CHAT_PROMPT,
    MessageType,
    gen_id,
    get_image,
    get_message_dump,
    is_json_dumped,
    now,
    try_parse_maybe_serialized,
)


class StructuredIOStream(IOStream):
    """Structured I/O stream using stdin and stdout."""

    uploads_root: Path | None = None

    def __init__(
        self,
        timeout: float = 120,
        uploads_root: Path | str | None = None,
        is_async: bool = False,
    ) -> None:
        self.timeout = timeout
        self.is_async = is_async
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
        flush = kwargs.get("flush", True)
        payload_type = str(kwargs.get("type", "print"))
        message = sep.join(map(str, args))
        if len(args) == 1 and isinstance(args[0], dict):
            message = args[0]
            payload_type = message.get("type", payload_type)
            is_dumped = True
        else:
            is_dumped, message = is_json_dumped(message)
        if is_dumped:
            # If the message is already JSON-dumped,
            # let's try not to double dump it
            payload: dict[str, Any] = {
                "id": gen_id(),
                "timestamp": now(),
                # "data": message,
            }
            if isinstance(message, dict):
                payload.update(message)
            else:
                payload["data"] = message
            if "type" not in payload:
                payload["type"] = payload_type
            end = ""
        else:
            print_message = PrintMessage(data=message)
            payload = print_message.model_dump(mode="json", fallback=str)
            payload["type"] = payload_type
        dumped = json.dumps(payload, default=str, ensure_ascii=False) + end
        if kwargs.get("file") and kwargs["file"] in [
            sys.stderr,
            sys.__stderr__,
            sys.stdout,
            sys.__stdout__,
        ]:
            print(dumped, file=kwargs["file"], flush=flush)
        else:
            print(dumped, flush=flush)

    def input(
        self,
        prompt: str = "",
        *,
        password: bool = False,
        request_id: str | None = None,
    ) -> str:
        """Structured input from stdin.

        Parameters
        ----------
        prompt : str, optional
            The prompt to display. Defaults to "".
        password : bool, optional
            Whether to read a password. Defaults to False.
        request_id : str, optional
            The request id. If not provided, a new will be generated.

        Returns
        -------
        str
            The line read from the input stream.
        """
        input_request_id = request_id or gen_id()
        prompt = prompt or ">"
        if not prompt or prompt in [">", "> "]:  # pragma: no cover
            # if the prompt is just ">" or "> ",
            # let's use a more descriptive one
            prompt = START_CHAT_PROMPT
        input_type = "chat"
        if prompt.strip() == DEBUG_INPUT_PROMPT.strip():
            input_type = "debug"
        self._send_input_request(
            prompt,
            input_request_id,
            password,
            input_type=input_type,
        )
        user_input_raw = self._read_user_input(
            prompt, password, input_request_id
        )
        response = self._handle_user_input(user_input_raw, input_request_id)
        user_response = response.to_string(
            uploads_root=self.uploads_root,
            base_name=input_request_id,
        )
        return user_response

    # noinspection PyMethodMayBeStatic
    # pylint: disable=no-self-use,broad-exception-caught
    def send(self, message: BaseEvent | BaseMessage) -> None:
        """Structured sending of a BaseEvent or BaseMessage.

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
        message_dump["timestamp"] = now()
        print(json.dumps(message_dump, default=str), flush=True)

    # noinspection PyMethodMayBeStatic
    # pylint: disable=no-self-use
    def _send_input_request(
        self,
        prompt: str,
        request_id: str,
        password: bool = False,
        input_type: str = "chat",
    ) -> None:
        if input_type not in ("chat", "debug"):
            input_type = "chat"
        request_type = (
            "debug_input_request" if input_type == "debug" else "input_request"
        )
        payload = UserInputRequest(
            type=request_type,  # type: ignore
            request_id=request_id,
            prompt=prompt,
            password=password,
        ).model_dump(mode="json")
        print(json.dumps(payload, default=str), flush=True)

    def _read_user_input(
        self,
        prompt: str,
        password: bool,
        request_id: str,
    ) -> str:
        try:
            return (
                getpass(prompt).strip() if password else input(prompt).strip()
            )
        except EOFError:
            return ""
        except BaseException as e:
            self._send_error_message(request_id, str(e))
            return ""

    def _send_timeout_message(self, request_id: str) -> None:
        timeout_payload = {
            "id": gen_id(),
            "type": "timeout",
            "request_id": request_id,
            "timestamp": now(),
            "data": f"No input received after {self.timeout} seconds.",
        }
        print(json.dumps(timeout_payload), flush=True, file=sys.stderr)

    # noinspection PyMethodMayBeStatic
    def _send_error_message(self, request_id: str, error_message: str) -> None:
        error_payload = {
            "id": gen_id(),
            "type": "error",
            "request_id": request_id,
            "timestamp": now(),
            "data": error_message,
        }
        print(json.dumps(error_payload), flush=True, file=sys.stderr)

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
        response: str | dict[str, Any]
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
        user_input : dict[str, Any]
            The user input dictionary containing the response data.
        request_id : str
            The request ID to match against.

        Returns
        -------
        UserResponse
            The structured user response.
        """
        response_type: MessageType
        _response_type = user_input.get("type", "input_response")
        if _response_type not in ("input_response", "debug_input_response"):
            response_type = "input_response"
        else:
            response_type = _response_type
        if (
            user_input.get("request_id") == request_id
            or response_type == "debug_input_response"
        ):
            # We have a valid response to our request
            data = user_input.get("data")
            if not data:
                # let's check if text|image keys are sent (outside data)
                if "image" in user_input or "text" in user_input:
                    return UserResponse(
                        type=response_type,
                        request_id=request_id,
                        data=self._format_multimedia_response(
                            request_id=request_id, data=user_input
                        ),
                    )
            if isinstance(data, list):
                return self._handle_list_response(
                    data,
                    request_id=request_id,
                    response_type=response_type,
                )
            if not data or not isinstance(data, (str, dict)):
                # No / invalid data provided in the response
                return UserResponse(
                    type=response_type,
                    request_id=request_id,
                    data="",
                )
            # Process different data types
            if isinstance(data, str):
                # double inner dumped?
                data = self._load_user_input(data)
            if isinstance(data, dict):
                return UserResponse(
                    type=response_type,
                    data=self._format_multimedia_response(
                        request_id=request_id,
                        data=data,
                    ),
                    request_id=request_id,
                )
            # For other types (numbers, bools ,...),
            #  let's just convert to string
            return UserResponse(
                type=response_type,
                data=str(data),
                request_id=request_id,
            )  # pragma: no cover
        # This response doesn't match our request_id, log and return empty
        self._log_mismatched_response(request_id, user_input)
        return UserResponse(
            type=response_type,
            request_id=request_id,
            data="",
        )

    # noinspection PyMethodMayBeStatic
    def _handle_list_response(
        self,
        data: list[dict[str, Any]],
        request_id: str,
        response_type: MessageType,
    ) -> UserResponse:
        if len(data) == 0:
            # Empty list, return empty response
            return UserResponse(
                type=response_type,
                request_id=request_id,
                data="",
            )

        input_data: list[UserInputData] = []
        for entry in data:
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
                type=response_type,
                request_id=request_id,
                data="",
            )
        return UserResponse(
            type=response_type,
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
        got_id: str | None = None
        if isinstance(response, dict):
            got_id = response.get("request_id")
        response_str = str(response)
        message = response_str[:100] + (
            "..." if len(response_str) > 100 else ""
        )
        log_payload: dict[str, Any] = {
            "type": "warning",
            "id": gen_id(),
            "timestamp": now(),
            "data": {
                "message": (
                    "Received response with mismatched request_id. "
                    f"Expected: {expected_id}"
                ),
                "details": {
                    "expected_id": expected_id,
                    "received_id": got_id,
                    "message": message,
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
                data=data["content"],
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
