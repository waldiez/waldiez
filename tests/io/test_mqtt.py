# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportPrivateUsage=false,reportUnusedVariable=false
# pyright: reportMissingTypeStubs=false
# pylint: disable=missing-param-doc,missing-type-doc,missing-return-doc
# pylint: disable=missing-yield-doc, protected-access,unused-variable
# pylint: disable=unused-argument,too-few-public-methods,missing-raises-doc

"""Tests for MqttIOStream task class."""

import io
import json
import threading
import time
import uuid
from collections.abc import Generator
from pathlib import Path
from threading import Event
from typing import Any
from unittest.mock import MagicMock, Mock, patch

import pytest
from autogen.messages import BaseMessage  # type: ignore
from paho.mqtt import client as mqtt

from waldiez.io import (
    MqttIOStream,
    TextMediaContent,
    UserInputData,
    UserResponse,
)


def create_mock_mqtt_client() -> Mock:
    """Create a properly configured mock MQTT client."""
    mock_client = Mock()
    mock_client.is_connected.return_value = True
    mock_client.publish.return_value = Mock(rc=mqtt.MQTT_ERR_SUCCESS)
    mock_client.subscribe.return_value = (mqtt.MQTT_ERR_SUCCESS, 1)
    mock_client.connect.return_value = mqtt.MQTT_ERR_SUCCESS
    mock_client.loop_start.return_value = None
    mock_client.loop_stop.return_value = None
    mock_client.disconnect.return_value = None
    mock_client.username_pw_set.return_value = None
    mock_client.tls_set.return_value = None
    return mock_client


@pytest.fixture(autouse=True, name="mock_mqtt")
def mock_mqtt_fixture() -> Generator[Mock, None, None]:
    """Auto-mock MQTT client for all tests."""
    mock_client = create_mock_mqtt_client()
    with patch("paho.mqtt.client.Client", return_value=mock_client):
        yield mock_client


def test_print(mock_mqtt: Mock) -> None:
    """Test print() publishes message to MQTT."""
    task_id = "test_task_print"

    stream = MqttIOStream(broker_host="localhost", task_id=task_id)
    stream.print("Hello", "World")

    # Verify publish was called twice (task output + common output)
    assert mock_mqtt.publish.call_count == 2

    # Check the first call (task output)
    first_call = mock_mqtt.publish.call_args_list[0]
    topic, payload = first_call[0][:2]
    assert topic == f"task/{task_id}/output"

    message_data = json.loads(payload)
    assert message_data["type"] == "print"
    assert message_data["data"] == "Hello World\n"
    assert message_data["task_id"] == task_id


def test_print_with_file_string_io(mock_mqtt: Mock) -> None:
    """Test print() with file object publishes message to MQTT."""
    task_id = "test_print_with_file_string_io"

    stream = MqttIOStream(broker_host="localhost", task_id=task_id)

    # noinspection PyUnresolvedReferences
    output = io.StringIO()
    output.write(" Hello, World!")
    stream.print("Hello", "World", file=output)

    # Check published message
    first_call = mock_mqtt.publish.call_args_list[0]
    topic, payload = first_call[0][:2]

    message_data = json.loads(payload)
    assert message_data["type"] == "print"
    assert message_data["data"] == "Hello World Hello, World!\n"


def test_print_with_file_bytes_io(mock_mqtt: Mock) -> None:
    """Test print() with bytes file object publishes message to MQTT."""
    task_id = "test_print_with_file_bytes_io"

    stream = MqttIOStream(broker_host="localhost", task_id=task_id)

    # noinspection PyUnresolvedReferences
    output = io.BytesIO()
    output.write(b" Hello, World!")
    stream.print("Hello", "World", file=output)

    # Check published message
    first_call = mock_mqtt.publish.call_args_list[0]
    topic, payload = first_call[0][:2]

    message_data = json.loads(payload)
    assert message_data["type"] == "print"
    assert message_data["data"] == "Hello World Hello, World!\n"


def test_send(mock_mqtt: Mock) -> None:
    """Test send() publishes structured message to MQTT."""
    task_id = "test_task_send"

    stream = MqttIOStream(broker_host="localhost", task_id=task_id)

    class Message(BaseMessage):
        """Test message class."""

        type: str = "text"
        text: str

    # noinspection PyArgumentList
    message = Message(
        uuid=uuid.uuid4(),
        text="Hello, World!",
    )
    stream.send(message)

    # Check published message
    first_call = mock_mqtt.publish.call_args_list[0]
    topic, payload = first_call[0][:2]

    message_data = json.loads(payload)
    assert message_data["type"] == "text"
    inner_data = json.loads(message_data["data"])
    assert inner_data["text"] == "Hello, World!"


def test_input(mock_mqtt: Mock) -> None:
    """Test input() waits for user input via MQTT."""
    task_id = "test_task_input"

    stream = MqttIOStream(
        broker_host="localhost", task_id=task_id, input_timeout=2
    )

    def delayed_response() -> None:
        """Simulate receiving user response."""
        time.sleep(0.5)
        # Simulate message reception
        mock_msg = Mock()
        mock_msg.topic = f"task/{task_id}/input_response"
        mock_msg.payload.decode.return_value = json.dumps(
            {
                "request_id": "req-1",
                "data": json.dumps(
                    {"content": {"type": "text", "text": "mock-response"}}
                ),
                "task_id": task_id,
                "type": "input_response",
            }
        )
        stream._on_message(mock_mqtt, None, mock_msg)

    thread = threading.Thread(target=delayed_response, daemon=True)
    thread.start()

    result = stream.input("Enter something:", request_id="req-1")
    assert result == "mock-response"

    thread.join(timeout=1.0)


def test_input_timeout(mock_mqtt: Mock) -> None:
    """Test input() times out when no response is received."""
    task_id = "test_task_input_timeout"

    stream = MqttIOStream(
        broker_host="localhost", task_id=task_id, input_timeout=1
    )
    result = stream.input("Enter something:")
    assert result == ""


def test_connection_failure() -> None:
    """Test MQTT connection failure."""
    mock_client = create_mock_mqtt_client()
    mock_client.is_connected.return_value = False

    with patch("paho.mqtt.client.Client", return_value=mock_client):
        with pytest.raises(
            ConnectionError,
            match="Failed to connect to MQTT broker within timeout",
        ):
            MqttIOStream(broker_host="localhost", connect_timeout=1)


def test_context_manager(mock_mqtt: Mock) -> None:
    """Test context manager cleanup."""
    task_id = "test_task_context_manager"

    with MqttIOStream(broker_host="localhost", task_id=task_id) as stream:
        assert isinstance(stream, MqttIOStream)

    # Should call cleanup methods
    mock_mqtt.loop_stop.assert_called()
    mock_mqtt.disconnect.assert_called()


def test_cleanup_task_data(mock_mqtt: Mock) -> None:
    """Test cleanup of task-specific data."""
    task_id = "test_task_cleanup"

    stream = MqttIOStream(broker_host="localhost", task_id=task_id)

    # Add some test data
    stream._input_responses["test"] = "response"
    stream._processed_requests.add("req1")

    stream.cleanup_task_data()

    assert len(stream._input_responses) == 0
    assert len(stream._processed_requests) == 0
    assert len(stream._input_events) == 0


def test_init_with_uploads_root_creation(
    tmp_path: Path,
    mock_mqtt: Mock,
) -> None:
    """Test initialization creates uploads_root directory."""
    non_existent_path = tmp_path / "new_uploads" / "nested"

    # Ensure the path doesn't exist initially
    assert not non_existent_path.exists()

    stream = MqttIOStream(
        broker_host="localhost", uploads_root=non_existent_path
    )

    # Verify the directory was created
    assert stream.uploads_root == non_existent_path.resolve()
    assert non_existent_path.exists()


def test_init_with_authentication(mock_mqtt: Mock) -> None:
    """Test initialization with username/password authentication."""
    MqttIOStream(
        broker_host="localhost",
        username="testuser",
        password="testpass",  # nosemgrep # nosec
    )

    mock_mqtt.username_pw_set.assert_called_once_with("testuser", "testpass")


def test_init_with_tls(mock_mqtt: Mock) -> None:
    """Test initialization with TLS."""
    # Test with CA cert path
    MqttIOStream(
        broker_host="localhost", use_tls=True, ca_cert_path="/path/to/ca.crt"
    )

    mock_mqtt.tls_set.assert_called_with("/path/to/ca.crt")


def test_input_with_callbacks(mock_mqtt: Mock) -> None:
    """Test input() with callback functions."""
    task_id = "test_callbacks"

    # Mock callbacks
    input_request_callback = MagicMock()
    input_response_callback = MagicMock()

    stream = MqttIOStream(
        broker_host="localhost",
        task_id=task_id,
        input_timeout=2,
        on_input_request=input_request_callback,
        on_input_response=input_response_callback,
    )

    def delayed_response() -> None:
        """Simulate receiving user response."""
        time.sleep(0.5)
        mock_msg = Mock()
        mock_msg.topic = f"task/{task_id}/input_response"
        mock_msg.payload.decode.return_value = json.dumps(
            {
                "request_id": "callback-test",
                "data": json.dumps(
                    {"content": {"type": "text", "text": "callback-response"}}
                ),
                "task_id": task_id,
                "type": "input_response",
            }
        )
        stream._on_message(mock_mqtt, None, mock_msg)

    thread = threading.Thread(target=delayed_response, daemon=True)
    thread.start()

    result = stream.input("Test prompt:", request_id="callback-test")

    # Verify callbacks were called
    input_request_callback.assert_called_once_with(
        "Test prompt:", "callback-test", task_id
    )
    input_response_callback.assert_called_once_with(
        "callback-response", task_id
    )
    assert result == "callback-response"

    thread.join(timeout=1.0)


def test_wait_for_input_already_processed(mock_mqtt: Mock) -> None:
    """Test _wait_for_input skips already processed requests."""
    task_id = "test_processed"

    stream = MqttIOStream(
        broker_host="localhost", task_id=task_id, input_timeout=2
    )

    # Mark request as already processed
    stream._processed_requests.add("processed-id")

    def delayed_response() -> None:
        """Send a response for an already processed request."""
        time.sleep(0.5)
        mock_msg = Mock()
        mock_msg.topic = f"task/{task_id}/input_response"
        mock_msg.payload.decode.return_value = json.dumps(
            {
                "request_id": "processed-id",
                "data": json.dumps(
                    {"content": {"type": "text", "text": "processed-response"}}
                ),
                "task_id": task_id,
            }
        )
        stream._on_message(mock_mqtt, None, mock_msg)

    thread = threading.Thread(target=delayed_response, daemon=True)
    thread.start()

    # Should timeout since the request is already processed
    result = stream._wait_for_input("processed-id")
    assert result == ""

    thread.join(timeout=1.0)


def test_on_message_error_handling(mock_mqtt: Mock) -> None:
    """Test _on_message with malformed payload."""
    stream = MqttIOStream(broker_host="localhost")

    # Test with invalid JSON payload
    mock_msg = Mock()
    mock_msg.topic = stream.input_response_topic
    mock_msg.payload.decode.return_value = "invalid json"

    # Should not raise exception
    stream._on_message(mock_mqtt, None, mock_msg)


def test_publish_message_error_handling() -> None:
    """Test _publish_message with MQTT publish error."""
    mock_client = create_mock_mqtt_client()
    mock_client.publish.return_value = Mock(rc=mqtt.MQTT_ERR_NO_CONN)

    with patch("paho.mqtt.client.Client", return_value=mock_client):
        stream = MqttIOStream(broker_host="localhost")

        # Should not raise exception
        stream._publish_message("test/topic", {"data": "test"})

        mock_client.publish.assert_called()


def test_wait_for_input_no_event(mock_mqtt: Mock) -> None:
    """Test _wait_for_input when no event exists for request_id."""
    stream = MqttIOStream(broker_host="localhost", input_timeout=1)

    # Call _wait_for_input without creating an event
    result = stream._wait_for_input("nonexistent-id")
    assert result == ""


def test_close_error_handling() -> None:
    """Test close() method error handling."""
    mock_client = create_mock_mqtt_client()
    mock_client.loop_stop.side_effect = Exception("Stop error")
    mock_client.disconnect.side_effect = Exception("Disconnect error")

    with patch("paho.mqtt.client.Client", return_value=mock_client):
        stream = MqttIOStream(broker_host="localhost")

        # Should not raise exception even if client methods fail
        stream.close()


def test_try_do_method() -> None:
    """Test try_do static method."""
    # Test successful execution
    mock_func = Mock()
    MqttIOStream.try_do(mock_func, "arg1", kwarg1="value1")
    mock_func.assert_called_once_with("arg1", kwarg1="value1")

    # Test exception handling
    mock_func.side_effect = Exception("Test error")
    # Should not raise exception
    MqttIOStream.try_do(mock_func, "arg2")


def test_handle_input_response_errors(mock_mqtt: Mock) -> None:
    """Test _handle_input_response with various error conditions."""
    stream = MqttIOStream(broker_host="localhost")

    # Test with invalid JSON
    stream._handle_input_response("invalid json")

    # Test with valid JSON but invalid response structure
    stream._handle_input_response(json.dumps({"invalid": "structure"}))

    # Test with response missing request_id
    stream._handle_input_response(json.dumps({"data": "test"}))

    # Should not crash with any of these inputs


def test_create_user_response_validation_error() -> None:
    """Test _create_user_response with validation error."""
    # Test with invalid data that causes validation error
    invalid_data = {"request_id": "test", "invalid_field": "invalid_value"}
    result = MqttIOStream._create_user_response(invalid_data)
    assert result is None


def test_create_user_response_invalid_nested_json() -> None:
    """Test _create_user_response with invalid nested JSON."""
    # Test with invalid JSON in data field
    invalid_data = {"request_id": "test", "data": "invalid json string"}
    result = MqttIOStream._create_user_response(invalid_data)
    assert result is None


def test_get_user_input_string_data(mock_mqtt: Mock) -> None:
    """Test _get_user_input with string data."""
    stream = MqttIOStream(broker_host="localhost", task_id="test_task")

    response = UserResponse(request_id="test", data="simple string")
    result = stream._get_user_input(response)
    assert result == "simple string"

    # Test with empty/None data
    response = UserResponse(request_id="test", data=None)  # type: ignore
    result = stream._get_user_input(response)
    assert result == ""


def test_print_with_bytes_file_encoding_issues(mock_mqtt: Mock) -> None:
    """Test print with file object that has encoding issues."""
    task_id = "test_encoding"

    stream = MqttIOStream(broker_host="localhost", task_id=task_id)

    # Test with object that has getvalue()
    # but returns bytes with encoding issues
    class MockFileWithBytes:
        """Mock file-like object with getvalue() returning bytes."""

        # pylint: disable=no-self-use
        # noinspection PyMethodMayBeStatic
        def getvalue(self) -> bytes:
            """Return bytes with invalid UTF-8 encoding."""
            return b"\xff\xfe Invalid UTF-8"

    mock_file = MockFileWithBytes()
    stream.print("Test", file=mock_file)

    # Check that message was published despite encoding issues
    assert mock_mqtt.publish.call_count == 2
    first_call = mock_mqtt.publish.call_args_list[0]
    topic, payload = first_call[0][:2]

    message_data = json.loads(payload)
    assert "Test" in message_data["data"]


def test_connection_exception_handling() -> None:
    """Test connection with client.connect() raising an exception."""
    mock_client = create_mock_mqtt_client()
    mock_client.connect.side_effect = Exception("Connection failed")

    with patch("paho.mqtt.client.Client", return_value=mock_client):
        with pytest.raises(Exception, match="Connection failed"):
            MqttIOStream(broker_host="localhost")


def test_on_connect_with_legacy_reason_code(mock_mqtt: Mock) -> None:
    """Test _on_connect with legacy integer reason codes."""
    stream = MqttIOStream(broker_host="localhost")

    # Test successful connection with integer code
    mock_mqtt.is_connected.return_value = True
    stream._on_connect(mock_mqtt, None, {}, 0)  # 0 = success
    assert stream._connected is True

    # Test failed connection with integer code
    mock_mqtt.is_connected.return_value = False
    with pytest.raises(ConnectionError):
        stream._on_connect(mock_mqtt, None, {}, 1)  # 1 = failure


def test_on_disconnect_max_reconnect_attempts() -> None:
    """Test _on_disconnect reaching max reconnection attempts."""
    mock_client = create_mock_mqtt_client()

    with (
        patch("paho.mqtt.client.Client", return_value=mock_client),
        patch("time.sleep"),
    ):
        stream = MqttIOStream(broker_host="localhost")
        stream._connected = True

        # Make reconnect always fail
        mock_client.reconnect.side_effect = Exception("Always fail")

        # Test abnormal disconnect
        stream._on_disconnect(mock_client, None, 1)  # 1 = abnormal

        # Should have attempted max reconnections
        assert (
            mock_client.reconnect.call_count == 12
        )  # MQTT_MAX_RECONNECT_COUNT


def test_send_with_model_dump_exception(mock_mqtt: Mock) -> None:
    """Test send() when message.model_dump() raises an exception."""
    stream = MqttIOStream(broker_host="localhost")

    class FaultyMessage(BaseMessage):
        """Message that fails to serialize."""

        def model_dump(self, *args: Any, **kwargs: Any) -> Any:
            """Override model_dump to raise an exception."""
            raise ValueError("Serialization failed")

    # noinspection PyArgumentList
    message = FaultyMessage(uuid=uuid.uuid4())
    stream.send(message)

    # Should still publish a message with error info
    assert mock_mqtt.publish.call_count == 2  # task + common output
    first_call = mock_mqtt.publish.call_args_list[0]
    topic, payload = first_call[0][:2]

    message_data = json.loads(payload)
    assert message_data["type"] == "FaultyMessage"
    inner_data = json.loads(message_data["data"])
    assert "error" in inner_data


def test_publish_message_with_exception(mock_mqtt: Mock) -> None:
    """Test _publish_message we have any exception."""
    stream = MqttIOStream(broker_host="localhost")

    # Test with unpublishable data (circular reference)
    circular_dict: dict[str, Any] = {}
    circular_dict["self"] = circular_dict

    # Should not raise exception
    stream._publish_message("test/topic", circular_dict)


def test_input_response_without_request_id(mock_mqtt: Mock) -> None:
    """Test _handle_input_response with response missing request_id."""
    stream = MqttIOStream(broker_host="localhost")

    # Response without request_id
    payload = json.dumps({"data": "some data"})
    stream._handle_input_response(payload)

    # Should not crash


def test_input_response_with_none_response(mock_mqtt: Mock) -> None:
    """Test _handle_input_response when _create_user_response returns None."""
    stream = MqttIOStream(broker_host="localhost")

    # Invalid response structure that will return None
    payload = json.dumps({"invalid": "structure"})
    stream._handle_input_response(payload)

    # Should not crash


def test_wait_for_input_with_exception(mock_mqtt: Mock) -> None:
    """Test _wait_for_input when event.wait() raises an exception."""
    stream = MqttIOStream(broker_host="localhost", input_timeout=1)

    mock_event = Mock(spec=Event)
    mock_event.wait.side_effect = Exception("Wait failed")

    with stream._input_lock:
        stream._input_events["test-id"] = mock_event

    result = stream._wait_for_input("test-id")
    assert result == ""  # Should return empty string on exception


def test_create_user_response_with_valid_nested_data() -> None:
    """Test _create_user_response with valid nested JSON data."""
    message_data = {
        "request_id": "test",
        "data": json.dumps({"content": {"type": "text", "text": "nested"}}),
        "type": "input_response",
    }

    result = MqttIOStream._create_user_response(message_data)
    assert result is not None
    assert result.request_id == "test"


def test_get_user_input_with_complex_data(mock_mqtt: Mock) -> None:
    """Test _get_user_input with complex UserInputData."""
    stream = MqttIOStream(broker_host="localhost", task_id="test_task")

    # Create complex user input data
    text_content = TextMediaContent(text="Complex response")
    user_input_data = UserInputData(content=text_content)

    response = UserResponse(request_id="test", data=user_input_data)
    result = stream._get_user_input(response)

    # Should call to_string() method
    assert isinstance(result, str)


def test_try_do_with_base_exception() -> None:
    """Test try_do with BaseException (not just Exception)."""
    mock_func = Mock()
    mock_func.side_effect = KeyboardInterrupt("User interrupted")

    # Should not raise exception, even for BaseException
    MqttIOStream.try_do(mock_func, "arg")


def test_print_with_custom_end_parameter(mock_mqtt: Mock) -> None:
    """Test print() with custom end parameter."""
    stream = MqttIOStream(broker_host="localhost")

    stream.print("Hello", "World", end="!!!")

    first_call = mock_mqtt.publish.call_args_list[0]
    topic, payload = first_call[0][:2]

    message_data = json.loads(payload)
    assert message_data["data"] == "Hello World!!!"


def test_print_without_file_getvalue(mock_mqtt: Mock) -> None:
    """Test print() with file object that doesn't have getvalue method."""
    stream = MqttIOStream(broker_host="localhost")

    # File-like object without getvalue
    class MockFileNoGetValue:
        """Mock file get no value."""

        def write(self, *wargs: Any) -> None:
            """Write."""

    mock_file = MockFileNoGetValue()
    stream.print("Hello", "World", file=mock_file)

    # Should work normally
    first_call = mock_mqtt.publish.call_args_list[0]
    topic, payload = first_call[0][:2]

    message_data = json.loads(payload)
    assert message_data["data"] == "Hello World\n"
