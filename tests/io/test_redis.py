# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportPrivateUsage=false
# pylint: disable=missing-param-doc,missing-type-doc,missing-return-doc
# pylint: disable=missing-yield-doc, protected-access

"""Tests for RedisIOStream task class."""

import io
import json
import threading
import time
import uuid
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import fakeredis
import pytest
import redis
from autogen.messages import BaseMessage  # type: ignore

from waldiez.io import (
    RedisIOStream,
    TextMediaContent,
    UserInputData,
    UserResponse,
)


@pytest.fixture(name="fake_redis")
def fake_redis_fixture() -> fakeredis.FakeRedis:
    """Fake Redis client fixture."""
    return fakeredis.FakeRedis(decode_responses=True)


@pytest.fixture(name="a_fake_redis")
def a_fake_redis_fixture() -> fakeredis.aioredis.FakeRedis:
    """Fake async Redis client fixture."""
    return fakeredis.aioredis.FakeRedis(decode_responses=True)


def test_print(fake_redis: fakeredis.FakeRedis) -> None:
    """Test print() publishes message to Redis."""
    task_id = "test_task_print"
    stream = RedisIOStream("redis://localhost", task_id)
    stream.redis = fake_redis

    stream.print("Hello", "World")

    entries = fake_redis.xrange(f"task:{task_id}:output")  # pyright: ignore
    assert len(entries) == 1  # pyright: ignore
    call_data = entries[0][1]  # pyright: ignore
    assert call_data["type"] == "print"
    assert call_data["data"] == "Hello World\n"


def test_print_with_file_invalid(fake_redis: fakeredis.FakeRedis) -> None:
    """Test print() with file argument publishes message to Redis."""
    task_id = "test_print_with_file_invalid"
    stream = RedisIOStream("redis://localhost", task_id)
    stream.redis = fake_redis

    stream.print("Hello", "World", file="output.txt")

    entries = fake_redis.xrange(f"task:{task_id}:output")  # pyright: ignore
    assert len(entries) == 1  # pyright: ignore
    call_data = entries[0][1]  # pyright: ignore
    assert call_data["type"] == "print"
    assert call_data["data"] == "Hello World\n"


def test_print_with_file_string_io(fake_redis: fakeredis.FakeRedis) -> None:
    """Test print() with file object publishes message to Redis."""
    task_id = "test_print_with_file_string_io"
    stream = RedisIOStream("redis://localhost", task_id)
    stream.redis = fake_redis

    output = io.StringIO()
    output.write(" Hello, World!")
    stream.print("Hello", "World", file=output)
    # also check this is published to Redis
    entries = fake_redis.xrange(  # pyright: ignore
        f"task:{task_id}:output",
    )
    assert len(entries) == 1  # pyright: ignore
    call_data = entries[0][1]  # pyright: ignore
    assert call_data["type"] == "print"
    assert call_data["data"] == "Hello World Hello, World!\n"


def test_print_with_file_bytes_io(fake_redis: fakeredis.FakeRedis) -> None:
    """Test print() with file object publishes message to Redis."""
    task_id = "test_print_with_file_bytes_io"
    stream = RedisIOStream("redis://localhost", task_id)
    stream.redis = fake_redis

    output = io.BytesIO()
    output.write(b" Hello, World!")
    stream.print("Hello", "World", file=output)
    # also check this is published to Redis
    entries = fake_redis.xrange(  # pyright: ignore
        f"task:{task_id}:output",
    )
    assert len(entries) == 1  # pyright: ignore
    call_data = entries[0][1]  # pyright: ignore
    assert call_data["type"] == "print"
    assert call_data["data"] == "Hello World Hello, World!\n"


def test_send(fake_redis: fakeredis.FakeRedis) -> None:
    """Test send() publishes structured message to Redis."""
    task_id = "test_task_send"
    stream = RedisIOStream("redis://localhost", task_id)
    stream.redis = fake_redis

    class Message(BaseMessage):
        """Test message class."""

        type: str = "text"
        text: str

    message = Message(
        uuid=uuid.uuid4(),
        text="Hello, World!",
    )
    stream.send(message)

    entries = fake_redis.xrange(  # pyright: ignore
        f"task:{task_id}:output",
    )
    assert len(entries) == 1  # pyright: ignore
    call_data = entries[0][1]  # pyright: ignore
    assert call_data["type"] == "text"
    message_data = json.loads(call_data["data"])  # pyright: ignore
    assert message_data["text"] == "Hello, World!"


def test_input(fake_redis: fakeredis.FakeRedis) -> None:
    """Test input() waits for user input via Redis Pub/Sub."""
    task_id = "test_task_input"
    stream = RedisIOStream("redis://localhost", task_id, input_timeout=2)
    stream.redis = fake_redis

    def delayed_publish() -> None:
        """Publish a mock user response after a delay."""
        time.sleep(0.5)  # Give input() time to subscribe
        user_response = json.dumps(
            {
                "id": "req-q",
                "timestamp": "now",
                "request_id": "req-1",
                "data": json.dumps(
                    {"content": {"type": "text", "text": "mock-response"}}
                ),
                "task_id": task_id,
                "type": "input_response",
            }
        )
        fake_redis.publish(f"task:{task_id}:input_response", user_response)

    thread = threading.Thread(target=delayed_publish, daemon=True)
    thread.start()
    result = stream.input("Enter something:", request_id="req-1")
    assert result == "mock-response"

    thread.join(timeout=0.1)


def test_input_timeout(fake_redis: fakeredis.FakeRedis) -> None:
    """Test input() times out when no response is received."""
    task_id = "test_task_input_timeout"
    stream = RedisIOStream("redis://localhost", task_id, input_timeout=1)
    stream.redis = fake_redis

    result = stream.input("Enter something:")
    assert result == ""


def test_parse_pubsub_input() -> None:
    """Test parsing of Pub/Sub input response."""


def test_locking_mechanism(fake_redis: fakeredis.FakeRedis) -> None:
    """Test that a lock prevents multiple tasks processing the same input."""
    task_id = "test_task_locking"
    lock_key = f"lock:{task_id}"

    stream = RedisIOStream("redis://localhost", task_id, input_timeout=1)
    stream.redis = fake_redis
    # pylint: disable=protected-access
    assert stream._acquire_lock(lock_key) is True  # pyright: ignore
    assert stream._acquire_lock(lock_key) is False  # pyright: ignore
    stream._release_lock(lock_key)  # pyright: ignore
    assert stream._acquire_lock(lock_key) is True  # pyright: ignore


def test_context_manager(fake_redis: fakeredis.FakeRedis) -> None:
    """Test context manager cleanup and lock release."""
    task_id = "test_task_context_manager"
    lock_key = f"lock:{task_id}"

    stream = RedisIOStream("redis://localhost", task_id, input_timeout=1)
    stream.redis = fake_redis

    with stream as io_stream:
        assert io_stream._acquire_lock(lock_key) is True  # pyright: ignore

    assert io_stream._acquire_lock(lock_key) is False  # pyright: ignore


def test_cleanup_processed_task_requests(
    fake_redis: fakeredis.FakeRedis,
) -> None:
    """Test cleanup of processed requests for a task."""
    task_id = "test_task_cleanup"
    request_ids = ["request_1", "request_2", "request_3"]

    old_timestamp = int(time.time()) - (2 * 86400)  # 2 days ago
    for request_id in request_ids:
        fake_redis.zadd(
            f"processed_requests:{task_id}", {request_id: old_timestamp}
        )

    RedisIOStream.cleanup_processed_task_requests(fake_redis, task_id)
    # pylint: disable=protected-access
    for request_id in request_ids:
        assert (
            RedisIOStream.is_request_processed(
                fake_redis,
                task_id,
                request_id,
            )
            is False
        )


def test_cleanup_processed_requests(
    fake_redis: fakeredis.FakeRedis,
) -> None:
    """Test stale processed requests are cleaned up after retention period."""
    task_id = "test_task_stale_cleanup"
    old_timestamp = int(time.time()) - (2 * 86400)  # 2 days ago
    fake_redis.zadd(
        f"processed_requests:{task_id}", {"old_request_1": old_timestamp}
    )
    fake_redis.zadd(
        f"processed_requests:{task_id}", {"old_request_2": old_timestamp}
    )
    fake_redis.zadd(
        f"processed_requests:{task_id}", {"recent_request": int(time.time())}
    )

    RedisIOStream.cleanup_processed_requests(fake_redis)

    assert (
        RedisIOStream.is_request_processed(fake_redis, task_id, "old_request_1")
        is False
    )
    assert (
        RedisIOStream.is_request_processed(fake_redis, task_id, "old_request_1")
        is False
    )
    assert (
        RedisIOStream.is_request_processed(
            fake_redis, task_id, "recent_request"
        )
        is True
    )


def test_trim_task_output_streams(fake_redis: fakeredis.FakeRedis) -> None:
    """Test trimming of task output streams."""
    task_id = "test_trim"
    stream_key = f"task:{task_id}:output"

    for i in range(20):
        fake_redis.xadd(stream_key, {"data": f"msg-{i}"})  # pyright: ignore

    assert fake_redis.xlen(stream_key) == 20

    RedisIOStream.trim_task_output_streams(fake_redis, maxlen=10)

    assert fake_redis.xlen(stream_key) <= 10


@pytest.mark.anyio
async def test_a_cleanup_processed_task_requests(
    a_fake_redis: fakeredis.aioredis.FakeRedis,
) -> None:
    """Test cleanup of processed requests for a task."""
    task_id = "test_task_cleanup"
    request_ids = ["request_1", "request_2", "request_3"]
    old_timestamp = int(time.time()) - (2 * 86400)  # 2 days ago
    # pylint: disable=protected-access
    for request_id in request_ids:
        await a_fake_redis.zadd(
            f"processed_requests:{task_id}", {request_id: old_timestamp}
        )

    await RedisIOStream.a_cleanup_processed_task_requests(a_fake_redis, task_id)

    for request_id in request_ids:
        assert (
            await RedisIOStream.a_is_request_processed(
                a_fake_redis, task_id, request_id
            )
            is False
        )


@pytest.mark.anyio
async def test_a_cleanup_processed_requests(
    a_fake_redis: fakeredis.aioredis.FakeRedis,
) -> None:
    """Test stale processed requests are cleaned up after retention period."""
    task_id = "test_task_stale_cleanup"

    old_timestamp = int(time.time()) - (2 * 86400)  # 2 days ago
    await a_fake_redis.zadd(
        f"processed_requests:{task_id}", {"old_request_1": old_timestamp}
    )
    await a_fake_redis.zadd(
        f"processed_requests:{task_id}", {"old_request_2": old_timestamp}
    )
    await a_fake_redis.zadd(
        f"processed_requests:{task_id}", {"recent_request": int(time.time())}
    )

    await RedisIOStream.a_cleanup_processed_requests(
        a_fake_redis, retention_period=86400
    )
    assert (
        await RedisIOStream.a_is_request_processed(
            a_fake_redis, task_id, "old_request_1"
        )
        is False
    )
    assert (
        await RedisIOStream.a_is_request_processed(
            a_fake_redis, task_id, "old_request_2"
        )
        is False
    )
    assert (
        await RedisIOStream.a_is_request_processed(
            a_fake_redis, task_id, "recent_request"
        )
        is True
    )


@pytest.mark.anyio
async def test_a_trim_task_output_streams(
    a_fake_redis: fakeredis.aioredis.FakeRedis,
) -> None:
    """Test trimming of task output streams."""
    task_id = "test_trim"
    stream_key = f"task:{task_id}:output"

    for i in range(20):
        await a_fake_redis.xadd(  # pyright: ignore
            stream_key,
            {"data": f"msg-{i}"},
        )

    assert await a_fake_redis.xlen(stream_key) == 20

    await RedisIOStream.a_trim_task_output_streams(a_fake_redis, maxlen=10)

    assert await a_fake_redis.xlen(stream_key) <= 10


def test_init_with_uploads_root_creation(tmp_path: Path) -> None:
    """Test initialization creates uploads_root directory."""
    non_existent_path = tmp_path / "new_uploads" / "nested"

    # Ensure the path doesn't exist initially
    assert not non_existent_path.exists()

    # Create stream with non-existent uploads path
    with patch("redis.Redis.from_url") as mock_redis:
        mock_redis.return_value = MagicMock()
        stream = RedisIOStream(
            redis_url="redis://localhost", uploads_root=non_existent_path
        )

        # Verify the directory was created
        assert stream.uploads_root == non_existent_path.resolve()
        assert non_existent_path.exists()


def test_send_message_without_type(fake_redis: fakeredis.FakeRedis) -> None:
    """Test send() with message that has no type field."""
    task_id = "test_send_no_type"
    stream = RedisIOStream("redis://localhost", task_id)
    stream.redis = fake_redis

    class MessageWithoutType(BaseMessage):
        """Test message without explicit type."""

        content: str

    message = MessageWithoutType(uuid=uuid.uuid4(), content="test content")

    # Remove type if it exists in model_dump
    with patch.object(MessageWithoutType, "model_dump") as mock_dump:
        mock_dump.return_value = {"content": "test content"}
        stream.send(message)

    entries = fake_redis.xrange(f"task:{task_id}:output")  # pyright: ignore
    assert len(entries) == 1  # pyright: ignore
    call_data = entries[0][1]  # pyright: ignore
    # Should use class name as type
    assert call_data["type"] == "MessageWithoutType"


def test_input_with_callbacks(fake_redis: fakeredis.FakeRedis) -> None:
    """Test input() with callback functions."""
    task_id = "test_callbacks"

    # Mock callbacks
    input_request_callback = MagicMock()
    input_response_callback = MagicMock()

    stream = RedisIOStream(
        "redis://localhost",
        task_id,
        input_timeout=2,
        on_input_request=input_request_callback,
        on_input_response=input_response_callback,
    )
    stream.redis = fake_redis

    def delayed_publish() -> None:
        """Publish a mock user response after a delay."""
        time.sleep(0.5)
        user_response = json.dumps(
            {
                "request_id": "callback-test",
                "data": json.dumps(
                    {"content": {"type": "text", "text": "callback-response"}}
                ),
                "task_id": task_id,
                "type": "input_response",
            }
        )
        fake_redis.publish(f"task:{task_id}:input_response", user_response)

    thread = threading.Thread(target=delayed_publish, daemon=True)
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

    thread.join(timeout=0.1)


def test_wait_for_input_mismatched_request_id(
    fake_redis: fakeredis.FakeRedis,
) -> None:
    """Test _wait_for_input ignores messages with wrong request_id."""
    task_id = "test_mismatch"
    stream = RedisIOStream("redis://localhost", task_id, input_timeout=2)
    stream.redis = fake_redis

    def delayed_publish() -> None:
        """Publish responses with wrong and correct request IDs."""
        time.sleep(0.5)

        # First, publish with wrong request_id
        wrong_response = json.dumps(
            {
                "request_id": "wrong-id",
                "data": json.dumps(
                    {"content": {"type": "text", "text": "wrong-response"}}
                ),
                "task_id": task_id,
            }
        )
        fake_redis.publish(f"task:{task_id}:input_response", wrong_response)

        time.sleep(0.2)

        # Then publish with correct request_id
        correct_response = json.dumps(
            {
                "request_id": "correct-id",
                "data": json.dumps(
                    {"content": {"type": "text", "text": "correct-response"}}
                ),
                "task_id": task_id,
            }
        )
        fake_redis.publish(f"task:{task_id}:input_response", correct_response)

    thread = threading.Thread(target=delayed_publish, daemon=True)
    thread.start()

    result = stream._wait_for_input("correct-id")
    assert result == "correct-response"

    thread.join(timeout=0.1)


def test_wait_for_input_already_processed(
    fake_redis: fakeredis.FakeRedis,
) -> None:
    """Test _wait_for_input skips already processed requests."""
    task_id = "test_processed"
    stream = RedisIOStream("redis://localhost", task_id, input_timeout=2)
    stream.redis = fake_redis

    # Mark request as already processed
    stream._mark_request_processed("processed-id")

    def delayed_publish() -> None:
        """Publish a response for an already processed request."""
        time.sleep(0.5)
        response = json.dumps(
            {
                "request_id": "processed-id",
                "data": json.dumps(
                    {"content": {"type": "text", "text": "processed-response"}}
                ),
                "task_id": task_id,
            }
        )
        fake_redis.publish(f"task:{task_id}:input_response", response)

    thread = threading.Thread(target=delayed_publish, daemon=True)
    thread.start()

    # Should timeout since the request is already processed
    result = stream._wait_for_input("processed-id")
    assert result == ""

    thread.join(timeout=0.1)


def test_init_with_redis_connection_kwargs() -> None:
    """Test initialization with redis_connection_kwargs."""
    with patch("redis.Redis.from_url") as mock_from_url:
        mock_redis = MagicMock()
        mock_from_url.return_value = mock_redis

        kwargs: dict[str, Any] = {
            "socket_timeout": 30,
            "socket_connect_timeout": 30,
            "retry_on_timeout": True,
        }

        RedisIOStream(
            redis_url="redis://localhost", redis_connection_kwargs=kwargs
        )

        # Verify Redis.from_url was called with the kwargs
        mock_from_url.assert_called_once_with("redis://localhost", **kwargs)


def test_print_with_bytes_file_encoding_issues(
    fake_redis: fakeredis.FakeRedis,
) -> None:
    """Test print with file object that has encoding issues."""
    task_id = "test_encoding"
    stream = RedisIOStream("redis://localhost", task_id)
    stream.redis = fake_redis

    # Test with object that has getvalue()
    # but returns bytes with encoding issues
    # pylint: disable=too-few-public-methods,invalid-name,no-self-use
    class MockFileWithBytes:
        """Mock file-like object with getvalue() returning bytes."""

        def getvalue(self) -> bytes:
            """Return bytes with invalid UTF-8 encoding."""
            return b"\xff\xfe Invalid UTF-8"

    mock_file = MockFileWithBytes()
    stream.print("Test", file=mock_file)

    entries = fake_redis.xrange(f"task:{task_id}:output")  # pyright: ignore
    assert len(entries) == 1  # pyright: ignore
    call_data = entries[0][1]  # pyright: ignore
    assert "Test" in call_data["data"]


def test_parse_pubsub_input_complete_flow() -> None:
    """Test complete parse_pubsub_input flow with valid nested data."""
    stream = RedisIOStream("redis://localhost", "test_task")

    # Test with valid JSON that has nested data
    valid_message = {
        "data": json.dumps(
            {
                "request_id": "test",
                "data": json.dumps(
                    {"content": {"type": "text", "text": "nested"}}
                ),
            }
        )
    }
    result = stream.parse_pubsub_input(valid_message)
    assert result is not None
    assert result.request_id == "test"


def test_get_user_input_string_data() -> None:
    """Test _get_user_input with string data."""
    stream = RedisIOStream("redis://localhost", "test_task")
    response = UserResponse(request_id="test", data="simple string")
    result = stream._get_user_input(response)
    assert result == "simple string"

    # Test with empty/None data
    response = UserResponse(request_id="test", data=None)  # type: ignore
    result = stream._get_user_input(response)
    assert result == ""


def test_get_user_input_list_content() -> None:
    """Test _get_user_input with list content."""
    stream = RedisIOStream("redis://localhost", "test_task")
    text1 = TextMediaContent(text="First part")
    text2 = TextMediaContent(text="Second part")
    user_input = UserInputData(
        content=[text1, text2],
    )

    response = UserResponse(
        request_id="test",
        data=user_input,
    )
    result = stream._get_user_input(response)
    assert result == "First part Second part"


def test_acquire_lock_redis_error() -> None:
    """Test _acquire_lock with Redis error."""
    with patch("redis.Redis.from_url") as mock_redis_class:
        mock_redis = MagicMock()
        mock_redis.set.side_effect = redis.RedisError("Connection failed")
        mock_redis_class.return_value = mock_redis

        stream = RedisIOStream("redis://localhost", "test_task")

        # Should return False on Redis error
        result = stream._acquire_lock("test_lock")
        assert result is False


def test_acquire_lock_general_exception() -> None:
    """Test _acquire_lock with general exception."""
    with patch("redis.Redis.from_url") as mock_redis_class:
        mock_redis = MagicMock()
        mock_redis.set.side_effect = Exception("Unexpected error")
        mock_redis_class.return_value = mock_redis

        stream = RedisIOStream("redis://localhost", "test_task")

        # Should return False on general exception
        result = stream._acquire_lock("test_lock")
        assert result is False


def test_extract_message_data_invalid_json() -> None:
    """Test _extract_message_data with invalid JSON."""
    # Test with invalid JSON string
    result = RedisIOStream._extract_message_data("invalid json string")
    assert result is None


def test_extract_message_data_invalid_type() -> None:
    """Test _extract_message_data with invalid data type."""
    # Test with non-dict data after JSON parsing
    result = RedisIOStream._extract_message_data(
        "123"
    )  # Valid JSON but not dict
    assert result is None

    # Test with list
    result = RedisIOStream._extract_message_data('["item1", "item2"]')
    assert result is None

    # Test with boolean
    result = RedisIOStream._extract_message_data("true")
    assert result is None


def test_message_has_required_fields_missing_request_id() -> None:
    """Test _message_has_required_fields with missing request_id."""
    # Test with missing request_id
    message_data = {"data": "some data", "type": "test"}
    result = RedisIOStream._message_has_required_fields(message_data)
    assert result is False


def test_process_nested_data_invalid_json() -> None:
    """Test _process_nested_data with invalid nested JSON."""
    # Test with invalid JSON in data field
    message_data = {"request_id": "test", "data": "invalid json string"}
    result = RedisIOStream._process_nested_data(message_data)
    assert result is None


def test_create_user_response_validation_error() -> None:
    """Test _create_user_response with validation error."""
    # Test with invalid data that causes validation error
    invalid_data = {"request_id": "test", "invalid_field": "invalid_value"}
    result = RedisIOStream._create_user_response(invalid_data)
    assert result is None


def test_parse_pubsub_input_invalid_formats() -> None:
    """Test parse_pubsub_input with various invalid format."""
    stream = RedisIOStream("redis://localhost", "test_task")

    # Test with None message
    result = stream.parse_pubsub_input(None)
    assert result is None

    # Test with non-dict message
    result = stream.parse_pubsub_input("not a dict")  # type: ignore
    assert result is None

    # Test with dict missing 'data' key
    result = stream.parse_pubsub_input({"type": "test"})
    assert result is None
