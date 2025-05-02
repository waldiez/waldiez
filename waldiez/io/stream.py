"""Structured I/O stream for JSON-based communication over stdin/stdout."""

import json
import queue
import sys
import threading
from datetime import datetime, timezone
from getpass import getpass
from pathlib import Path
from typing import Any
from uuid import uuid4

from autogen.agentchat.contrib.img_utils import get_pil_image  # type: ignore
from autogen.events import BaseEvent  # type: ignore
from autogen.io import IOStream  # type: ignore


def now() -> str:
    """Get the current time in ISO format.

    Returns
    -------
    str
        The current time in ISO format.
    """
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


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

        payload = {
            "type": "print",
            "id": uuid4().hex,
            "timestamp": now(),
            "data": message,
        }
        flush = kwargs.get("flush", False)
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
        return self._handle_user_input(user_input_raw, request_id)

    def send(self, message: BaseEvent) -> None:
        """Structured sending of a BaseEvent.

        Parameters
        ----------
        message : BaseEvent
            The message to send.
        """
        message_dump = message.model_dump(mode="json")
        payload = {
            "type": message_dump.get("type", "event"),
            "id": uuid4().hex,
            "timestamp": now(),
            "data": message_dump,
        }
        print(json.dumps(payload), flush=True)

    # pylint: disable=no-self-use
    def _send_input_request(
        self,
        prompt: str,
        request_id: str,
        password: bool,
    ) -> None:
        payload = {
            "type": "input_request",
            "request_id": request_id,
            "timestamp": now(),
            "prompt": prompt,
            "password": password,
        }
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
                input_queue.put("\n")

        input_thread = threading.Thread(target=read_input, daemon=True)
        input_thread.start()

        try:
            return input_queue.get(timeout=self.timeout)
        except queue.Empty:
            self._send_timeout_message(request_id)
            return "\n"

    def _send_timeout_message(self, request_id: str) -> None:
        timeout_payload = {
            "type": "timeout",
            "request_id": request_id,
            "timestamp": now(),
            "data": f"No input received after {self.timeout} seconds.",
        }
        print(json.dumps(timeout_payload), flush=True)

    def _handle_user_input(self, user_input_raw: str, request_id: str) -> str:
        """Handle user input and return the appropriate response.

        Parameters
        ----------
        user_input_raw : str
            The raw user input string.
        request_id : str
            The request ID to match against.

        Returns
        -------
        str
            The parsed user input, or an empty string if not valid.
        """
        user_input = self._load_user_input(user_input_raw)
        if isinstance(user_input, str):
            return user_input
        return self._parse_user_input(user_input, request_id)

    def _load_user_input(self, user_input_raw: str) -> str | dict[str, Any]:
        """Load user input from a raw string.

        Parameters
        ----------
        user_input_raw : str
            The raw user input string.

        Returns
        -------
        str | Dict[str, Any]
            The loaded user input, either as a string or a dictionary.
        """
        try:
            # Attempt to parse the input as JSON
            response = json.loads(user_input_raw)
        except json.JSONDecodeError:
            # If it's not valid JSON, return as is
            # This allows for backwards compatibility with raw text input
            return user_input_raw
        if not isinstance(response, dict):
            return str(response)
        return response

    def _parse_user_input(
        self, user_input: dict[str, Any], request_id: str
    ) -> str:
        """Parse user input and return the appropriate response.

        Parameters
        ----------
        user_input_raw : str
            The raw user input string.
        request_id : str
            The request ID to match against.

        Returns
        -------
        str
            The parsed user input, or an empty string if not valid.
        """
        # pylint: disable=too-many-try-statements
        # Load the user input
        # response = self._load_user_input(user_input_raw)
        if user_input.get("request_id") == request_id:
            # We have a valid response to our request
            data = user_input.get("data")
            if not data:
                # let's check if text|image keys are sent (outside data)
                if "image" in user_input or "text" in user_input:
                    return self._format_multimedia_response(
                        request_id=request_id, data=user_input
                    )
            if not data or not isinstance(data, (str, dict)):
                # No / invalid data provided in the response
                return "\n"
            # Process different data types
            if isinstance(data, str):
                # double inner dumped?
                data = self._load_user_input(data)
            if isinstance(data, dict):
                return self._format_multimedia_response(
                    request_id=request_id, data=data
                )
            # For other types (lists, numbers, booleans), convert to string
            return str(data)  # pragma: no cover
        # This response doesn't match our request_id, log and return empty
        self._log_mismatched_response(request_id, user_input)
        return "\n"

    def _log_mismatched_response(self, expected_id: str, response: Any) -> None:
        """Log information about mismatched response IDs.

        Parameters
        ----------
        expected_id : str
            The request ID we were expecting
        response : Any
            The response received
        """
        # Create a log message
        log_payload = {
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

        # Handle image if present
        if "image" in data and data["image"]:
            image_data = data["image"]
            image = self.get_image(self.uploads_root, image_data, request_id)
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

    @staticmethod
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
            try:
                pil_image = get_pil_image(image_data)
            except BaseException:  # pylint: disable=broad-exception-caught
                return image_data
            if not base_name:
                base_name = uuid4().hex
            file_name = f"{base_name}.png"
            file_path = uploads_root / file_name
            pil_image.save(file_path, format="PNG")
            return str(file_path)
        return image_data
