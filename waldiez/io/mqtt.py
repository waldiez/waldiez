# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# flake8: noqa: E501
# pylint: disable=too-many-try-statements,broad-exception-caught,
# pylint: disable=line-too-long,unused-argument,too-many-instance-attributes
# pylint: disable=too-many-arguments,too-many-positional-arguments,too-many-locals

"""An MQTT I/O stream for handling print and input messages."""

import json
import logging
import time
import traceback as tb
import uuid
from pathlib import Path
from threading import Event, Lock
from types import TracebackType
from typing import (
    Any,
    Callable,
    Optional,
    Type,
)

try:
    from paho.mqtt import client as mqtt
    from paho.mqtt.enums import CallbackAPIVersion
    from paho.mqtt.reasoncodes import ReasonCode
except ImportError as error:  # pragma: no cover
    raise ImportError(
        "MQTT client not installed. Please install paho-mqtt with `pip install paho-mqtt`."
    ) from error

from autogen.io import IOStream  # type: ignore
from autogen.messages import BaseMessage  # type: ignore

from .models import (
    PrintMessage,
    TextMediaContent,
    UserInputData,
    UserInputRequest,
    UserResponse,
)
from .utils import gen_id, now

LOG = logging.getLogger(__name__)


MQTT_FIRST_RECONNECT_DELAY = 1
MQTT_RECONNECT_RATE = 2
MQTT_MAX_RECONNECT_COUNT = 12
MQTT_MAX_RECONNECT_DELAY = 60


class MqttIOStream(IOStream):
    """MQTT I/O stream."""

    client: mqtt.Client
    task_id: str
    input_timeout: int
    on_input_request: Optional[Callable[[str, str, str], None]]
    on_input_received: Optional[Callable[[str, str], None]]
    max_retain_messages: int
    output_topic: str
    input_request_topic: str
    input_response_topic: str
    common_output_topic: str
    broker_host: str
    broker_port: int

    # Thread safety and input handling
    _input_responses: dict[str, str]
    _input_lock: Lock
    _input_events: dict[str, Event]
    _processed_requests: set[str]
    _connected: bool

    def __init__(
        self,
        broker_host: str = "localhost",
        broker_port: int = 1883,
        task_id: str | None = None,
        input_timeout: int = 120,
        connect_timeout: int = 10,
        max_retain_messages: int = 1000,
        on_input_request: Optional[Callable[[str, str, str], None]] = None,
        on_input_response: Optional[Callable[[str, str], None]] = None,
        mqtt_client_kwargs: dict[str, Any] | None = None,
        uploads_root: Path | str | None = None,
        username: str | None = None,
        password: str | None = None,
        use_tls: bool = False,
        ca_cert_path: str | None = None,
    ) -> None:
        """Initialize the MQTT I/O stream.

        Parameters
        ----------
        broker_host : str, optional
            The MQTT broker host, by default "localhost".
        broker_port : int, optional
            The MQTT broker port, by default 1883.
        task_id : str, optional
            An ID to use for the topics. If not provided, a random UUID will be generated.
        input_timeout : int, optional
            The time to wait for user input in seconds, by default 120.
        connect_timeout : int, optional
            The time to wait for MQTT connection in seconds, by default 10.
        on_input_request : Optional[Callable[[str, str, str], None]], optional
            Callback for input request, by default None
            parameters: prompt, request_id, task_id
        on_input_response : Optional[Callable[[str, str], None]], optional
            Callback for input response, by default None.
            parameters: user_input, task_id
        mqtt_client_kwargs : dict[str, Any] | None, optional
            Additional MQTT client kwargs, by default None.
        max_retain_messages : int, optional
            Maximum number of retained messages per topic, by default 1000.
        uploads_root : Path | str | None, optional
            The root directory for uploads, by default None.
        username : str | None, optional
            MQTT broker username, by default None.
        password : str | None, optional
            MQTT broker password, by default None.
        use_tls : bool, optional
            Whether to use TLS connection, by default False.
        ca_cert_path : str | None, optional
            Path to CA certificate file for TLS, by default None.
        """
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.task_id = task_id or uuid.uuid4().hex
        self.input_timeout = input_timeout
        self.connect_timeout = connect_timeout
        self.on_input_request = on_input_request
        self.on_input_response = on_input_response
        self.max_retain_messages = max_retain_messages

        # Topic structure
        self.output_topic = f"task/{self.task_id}/output"
        self.input_request_topic = f"task/{self.task_id}/input_request"
        self.input_response_topic = f"task/{self.task_id}/input_response"
        self.common_output_topic = "task/output"

        # Thread safety
        self._input_responses = {}
        self._input_lock = Lock()
        self._input_events = {}
        self._processed_requests = set()
        self._connected = False

        # Uploads
        self.uploads_root = (
            Path(uploads_root).resolve() if uploads_root else None
        )
        if self.uploads_root and not self.uploads_root.exists():
            self.uploads_root.mkdir(parents=True, exist_ok=True)

        # Initialize MQTT client
        client_kwargs = mqtt_client_kwargs or {}
        if "callback_api_version" not in client_kwargs:  # pragma: no branch
            client_kwargs["callback_api_version"] = CallbackAPIVersion.VERSION2
        self.client = mqtt.Client(**client_kwargs)

        # Set up authentication
        if username and password:
            self.client.username_pw_set(username, password)

        # Set up TLS
        if use_tls:
            if ca_cert_path:
                self.client.tls_set(ca_cert_path)  # pyright: ignore
            else:  # pragma: no cover
                self.client.tls_set()  # pyright: ignore

        # Set up callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        self.client.on_log = self._on_log

        # Connect to broker
        self._connect()

    def _connect(self) -> None:
        """Connect to MQTT broker."""
        try:
            LOG.debug(
                "Connecting to MQTT broker at %s:%d",
                self.broker_host,
                self.broker_port,
            )
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()

            # Wait for connection
            timeout = self.connect_timeout  # seconds
            start_time = time.time()
            while (
                not self.client.is_connected()
                and (time.time() - start_time) < timeout
            ):
                time.sleep(0.1)

            if not self.client.is_connected():
                raise ConnectionError(
                    "Failed to connect to MQTT broker within timeout"
                )

        except Exception as e:
            LOG.error("Failed to connect to MQTT broker: %s", e)
            raise

    def _on_connect(
        self,
        client: mqtt.Client,
        userdata: Any,
        flags: dict[str, Any],
        reason_code: ReasonCode | int,
    ) -> None:
        """Handle MQTT connection event.

        Parameters
        ----------
        client : mqtt.Client
            The MQTT client instance.
        userdata : Any
            User-defined data of any type (not used here).
        flags : dict[str, Any]
            Response flags from the broker.
        reason_code : ReasonCode | int
            The connection reason code.
        """
        if isinstance(reason_code, ReasonCode):  # pragma: no cover
            failed = reason_code.is_failure
        else:
            failed = reason_code != mqtt.MQTT_ERR_SUCCESS
        if not failed and client.is_connected():
            LOG.debug("Connected to MQTT broker successfully")
            self._connected = True

            # Subscribe to input response topic
            client.subscribe(self.input_response_topic, qos=1)
            LOG.debug(
                "Subscribed to input response topic: %s",
                self.input_response_topic,
            )
        else:
            LOG.error(
                "Failed to connect to MQTT broker: %s (code %s)",
                userdata,
                reason_code,
            )
            self._connected = False
            raise ConnectionError(
                f"MQTT connection failed with reason code {reason_code}"
            )

    def _on_disconnect(
        self, client: mqtt.Client, userdata: Any, reason_code: ReasonCode | int
    ) -> None:
        """Handle MQTT disconnection event.

        Parameters
        ----------
        client : mqtt.Client
            The MQTT client instance.
        userdata : Any
            User-defined data of any type (not used here).
        reason_code : ReasonCode | int
            The disconnection reason code.
        """
        self._connected = False
        if isinstance(reason_code, ReasonCode):  # pragma: no cover
            is_normal_disconnect = reason_code.value == mqtt.MQTT_ERR_SUCCESS
        else:
            is_normal_disconnect = reason_code == mqtt.MQTT_ERR_SUCCESS
        if is_normal_disconnect:  # pragma: no cover
            LOG.debug("Disconnected from MQTT broker normally")
        else:
            LOG.warning("Disconnected with reason: %s", str(reason_code))
            reconnect_count, reconnect_delay = 0, MQTT_FIRST_RECONNECT_DELAY
            while reconnect_count < MQTT_MAX_RECONNECT_COUNT:
                LOG.info("Reconnecting in %d seconds...", reconnect_delay)
                time.sleep(reconnect_delay)
                # pylint: disable=broad-exception-caught
                try:
                    client.reconnect()
                except Exception as err:
                    LOG.error("%s. Reconnect failed. Retrying...", err)
                else:  # pragma: no cover
                    LOG.info("Reconnected successfully!")
                    return

                reconnect_delay *= MQTT_RECONNECT_RATE
                reconnect_delay = min(reconnect_delay, MQTT_MAX_RECONNECT_DELAY)
                reconnect_count += 1
            LOG.info("Reconnect failed after %s attempts.", reconnect_count)

    def _on_message(
        self, client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage
    ) -> None:
        """Handle incoming MQTT messages.

        Parameters
        ----------
        client : mqtt.Client
            The MQTT client instance.
        userdata : Any
            User-defined data of any type (not used here).
        msg : mqtt.MQTTMessage
            The received MQTT message.
        """
        try:
            LOG.debug(
                "Received message on topic %s: %s",
                msg.topic,
                msg.payload.decode(),
            )

            if msg.topic == self.input_response_topic:  # pragma: no branch
                self._handle_input_response(msg.payload.decode())

        except Exception as e:  # pragma: no cover
            LOG.error("Error handling message: %s", e)

    def _on_log(
        self,
        client: mqtt.Client,
        userdata: Any,
        level: int,
        buf: str,
    ) -> None:  # pragma: no cover
        """Handle MQTT log messages.

        Parameters
        ----------
        client : mqtt.Client
            The MQTT client instance.
        userdata : Any
            User-defined data of any type (not used here).
        level : int
            The log level.
        buf : str
            The log message.
        """
        payload: dict[str, Any] = {
            "level": level,
            "message": buf,
        }
        LOG.debug("MQTT log: %s", payload)
        print_message = PrintMessage(data=buf)
        try:
            payload = print_message.model_dump(mode="json")
        except Exception:
            payload = print_message.model_dump(
                serialize_as_any=True, mode="json", fallback=str
            )
        self._print_to_common_output(payload=payload)

    def _handle_input_response(self, payload: str) -> None:
        """Handle input response message."""
        try:
            message_data = json.loads(payload)
            response = self._create_user_response(message_data)

            if not response or not response.request_id:
                return

            # Check if already processed
            if response.request_id in self._processed_requests:
                return

            with self._input_lock:
                self._processed_requests.add(response.request_id)
                user_input = self._get_user_input(response)
                self._input_responses[response.request_id] = user_input

                # Signal waiting thread
                if (
                    response.request_id in self._input_events
                ):  # pragma: no branch
                    self._input_events[response.request_id].set()

        except Exception as e:
            LOG.error("Error handling input response: %s", e)

    def __enter__(self) -> "MqttIOStream":
        """Enable context manager usage."""
        return self

    def __exit__(
        self,
        exc_type: Type[Exception] | None,
        exc_value: Exception | None,
        traceback: TracebackType | None,
    ) -> None:
        """Exit the context manager."""
        self.close()

    def close(self) -> None:
        """Close the MQTT client."""
        if hasattr(self, "client"):  # pragma: no branch
            try:
                self.client.loop_stop()
                self.client.disconnect()
            except Exception as e:
                LOG.error("Error closing MQTT client: %s", e)

    def _publish_message(
        self, topic: str, payload: dict[str, Any], retain: bool = False
    ) -> None:
        """Publish message to MQTT topic.

        Parameters
        ----------
        topic : str
            The MQTT topic.
        payload : dict[str, Any]
            The message payload.
        retain : bool, optional
            Whether to retain the message, by default False.
        """
        try:
            json_payload = json.dumps(payload)
            LOG.debug("Publishing to %s: %s", topic, json_payload)

            result = self.client.publish(
                topic, json_payload, qos=1, retain=retain
            )

            if result.rc != mqtt.MQTT_ERR_SUCCESS:
                LOG.error(
                    "Failed to publish message to %s: %s", topic, result.rc
                )
        except Exception as e:
            LOG.error("Error publishing message: %s", e)

    def _print_to_task_output(self, payload: dict[str, Any]) -> None:
        """Print message to the task output topic."""
        self._publish_message(self.output_topic, payload, retain=True)

    def _print_to_common_output(self, payload: dict[str, Any]) -> None:
        """Print message to the common output topic."""
        self._publish_message(self.common_output_topic, payload, retain=False)

    def _print(self, payload: dict[str, Any]) -> None:
        """Print message to MQTT topics."""
        if "id" not in payload:
            payload["id"] = gen_id()
        payload["task_id"] = self.task_id
        if "timestamp" not in payload:
            payload["timestamp"] = now()

        self._print_to_task_output(payload)
        self._print_to_common_output(payload)

    def print(self, *args: Any, **kwargs: Any) -> None:
        """Print message to MQTT topics.

        Parameters
        ----------
        args : Any
            The message to print.
        kwargs : Any
            Additional keyword arguments.
        """
        print_message = PrintMessage.create(*args, **kwargs)
        try:
            payload = print_message.model_dump(mode="json")
        except Exception:
            payload = print_message.model_dump(
                serialize_as_any=True, mode="json", fallback=str
            )
        self._print(payload)

    def send(self, message: BaseMessage) -> None:
        """Send a structured message to MQTT.

        Parameters
        ----------
        message : BaseMessage
            The message to send.
        """
        try:
            message_dump = message.model_dump(mode="json")
        except Exception:
            try:
                message_dump = message.model_dump(
                    serialize_as_any=True, mode="json", fallback=str
                )
            except Exception as e:
                message_dump = {
                    "error": str(e),
                    "type": message.__class__.__name__,
                }

        message_type = message_dump.get("type", None)
        if not message_type:  # pragma: no cover
            message_type = message.__class__.__name__

        self._print(
            {
                "type": message_type,
                "data": json.dumps(message_dump),
            }
        )

    def input(
        self,
        prompt: str = "",
        *,
        password: bool = False,
        request_id: str | None = None,
    ) -> str:
        """Request input via MQTT and wait for response.

        Parameters
        ----------
        prompt : str, optional
            The prompt message, by default "".
        password : bool, optional
            Whether input is masked, by default False.
        request_id : str, optional
            The request ID (for testing), by default None.

        Returns
        -------
        str
            The received user input, or empty string if timeout occurs.
        """
        request_id = request_id or gen_id()

        input_request = UserInputRequest(
            request_id=request_id,
            prompt=prompt,
            password=password,
        )
        try:
            payload = input_request.model_dump(mode="json")
        except Exception:  # pragma: no cover
            payload = input_request.model_dump(
                serialize_as_any=True, mode="json", fallback=str
            )
        payload["task_id"] = self.task_id
        payload["password"] = str(password).lower()

        LOG.debug("Requesting input via MQTT: %s", payload)

        # Create event for this request
        with self._input_lock:
            self._input_events[request_id] = Event()

        # Publish input request
        self._print(payload)
        self._publish_message(self.input_request_topic, payload)

        if self.on_input_request:
            self.on_input_request(prompt, request_id, self.task_id)

        user_input = self._wait_for_input(request_id)

        if self.on_input_response:
            self.on_input_response(user_input, self.task_id)

        # Send response confirmation
        text_response = UserInputData(
            content=TextMediaContent(text=user_input),
        )
        user_response = UserResponse(
            request_id=request_id,
            type="input_response",
            data=text_response,
        )

        payload = user_response.model_dump(mode="json")
        payload["task_id"] = self.task_id
        payload["data"] = json.dumps(payload["data"])

        LOG.debug("Sending input response: %s", payload)
        self._print(payload)

        return user_input

    def _wait_for_input(self, request_id: str) -> str:
        """Wait for user input.

        Parameters
        ----------
        request_id : str
            The request ID.

        Returns
        -------
        str
            The user input.
        """
        try:
            # Wait for response
            event = self._input_events.get(request_id)
            if not event:
                LOG.error("No event found for request %s", request_id)
                return ""

            if event.wait(timeout=self.input_timeout):
                # Got response
                with self._input_lock:
                    user_input = self._input_responses.pop(request_id, "")
                    self._input_events.pop(request_id, None)
                return user_input
            # Timeout
            LOG.warning(
                "No input received for %ds on task %s, assuming empty string",
                self.input_timeout,
                self.task_id,
            )
            with self._input_lock:
                self._input_events.pop(request_id, None)
            return ""

        except Exception as e:
            LOG.error("Error in _wait_for_input: %s", e)
            return ""

    def _get_user_input(self, response: UserResponse) -> str:
        """Get user input from the response.

        Parameters
        ----------
        response : UserResponse
            The user response.

        Returns
        -------
        str
            The user input.
        """
        if not response.data:
            return ""
        if isinstance(response.data, str):  # pragma: no cover
            return response.data
        return response.to_string(
            uploads_root=self.uploads_root,
            base_name=response.request_id,
        )

    @staticmethod
    def _create_user_response(
        message_data: dict[str, Any],
    ) -> Optional["UserResponse"]:
        """Create UserResponse object from validated data."""
        try:
            # Handle nested JSON in 'data' field
            if "data" in message_data and isinstance(message_data["data"], str):
                try:
                    message_data["data"] = json.loads(message_data["data"])
                except json.JSONDecodeError:
                    LOG.error(
                        "Invalid JSON in nested data field: %s", message_data
                    )
                    return None

            return UserResponse.model_validate(message_data)
        except Exception as e:
            LOG.error(
                "Error parsing user input response: %s - %s",
                message_data,
                str(e),
            )
            return None

    @staticmethod
    def try_do(func: Callable[..., Any], *args: Any, **kwargs: Any) -> None:
        """Try to execute a function without raising exceptions.

        Parameters
        ----------
        func : Callable[..., Any]
            The function to call.
        args : Any
            The function's positional arguments.
        kwargs : Any
            The function's keyword arguments.
        """
        try:
            func(*args, **kwargs)
        except BaseException:  # pragma: no cover
            LOG.error("Error on try_do:")
            LOG.error(tb.format_exc())

    def cleanup_task_data(self) -> None:
        """Clean up task-specific data.

        Note: MQTT doesn't have built-in cleanup like Redis streams.
        This method clears local state and can be extended for broker-specific cleanup.
        """
        with self._input_lock:
            self._input_responses.clear()
            self._input_events.clear()
            self._processed_requests.clear()

        LOG.debug("Cleaned up task data for %s", self.task_id)
