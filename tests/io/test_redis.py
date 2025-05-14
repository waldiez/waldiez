# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-type-doc,missing-return-doc
# pylint: disable=missing-yield-doc, protected-access

"""Tests for RedisIOStream task class."""

import io
import json
import threading
import time

import fakeredis
import pytest

from waldiez.io import RedisIOStream


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

    entries = fake_redis.xrange(f"task:{task_id}:output")
    assert len(entries) == 1
    call_data = entries[0][1]
    assert call_data["type"] == "print"
    assert call_data["data"] == "Hello World\n"


def test_print_with_file_invalid(fake_redis: fakeredis.FakeRedis) -> None:
    """Test print() with file argument publishes message to Redis."""
    task_id = "test_print_with_file_invalid"
    stream = RedisIOStream("redis://localhost", task_id)
    stream.redis = fake_redis

    stream.print("Hello", "World", file="output.txt")

    entries = fake_redis.xrange(f"task:{task_id}:output")
    assert len(entries) == 1
    call_data = entries[0][1]
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
    entries = fake_redis.xrange(f"task:{task_id}:output")
    assert len(entries) == 1
    call_data = entries[0][1]
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
    entries = fake_redis.xrange(f"task:{task_id}:output")
    assert len(entries) == 1
    call_data = entries[0][1]
    assert call_data["type"] == "print"
    assert call_data["data"] == "Hello World Hello, World!\n"


def test_send(fake_redis: fakeredis.FakeRedis) -> None:
    """Test send() publishes structured message to Redis."""
    task_id = "test_task_send"
    stream = RedisIOStream("redis://localhost", task_id)
    stream.redis = fake_redis

    # pylint: disable=too-few-public-methods,no-self-use
    class Message:
        """Mock message object."""

        def model_dump_json(self) -> str:
            """Mock model dump."""
            return json.dumps({"message": "Hello, World!"})

    message = Message()
    stream.send(message)

    entries = fake_redis.xrange(f"task:{task_id}:output")
    assert len(entries) == 1
    call_data = entries[0][1]
    assert call_data["type"] == "print"
    message_data = json.loads(call_data["data"])
    assert message_data["message"] == "Hello, World!"


def test_input(fake_redis: fakeredis.FakeRedis) -> None:
    """Test input() waits for user input via Redis Pub/Sub."""
    task_id = "test_task_input"
    stream = RedisIOStream("redis://localhost", task_id, input_timeout=2)
    stream.redis = fake_redis

    def delayed_publish() -> None:
        """Publish a mock user response after a delay."""
        time.sleep(0.5)  # Give input() time to subscribe
        user_response = json.dumps(
            {"request_id": "req-1", "data": "mock-response"}
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
    message = {
        "type": "input_response",
        "data": '{"request_id": "req-1", "data": "mock-response"}',
    }
    request_id, data = RedisIOStream.parse_pubsub_input(message)
    assert request_id == "req-1"
    assert data == "mock-response"

    invalid_message1 = {"type": "input_response", "data": "invalid"}
    request_id, data = RedisIOStream.parse_pubsub_input(invalid_message1)
    assert request_id is None
    assert data is None

    invalid_message2 = {"type": "invalid", "data": "invalid"}
    request_id, data = RedisIOStream.parse_pubsub_input(invalid_message2)
    assert request_id is None
    assert data is None

    invalid_message3 = {"type": "input_response", "data": {}}
    request_id, data = RedisIOStream.parse_pubsub_input(invalid_message3)
    assert request_id is None
    assert data is None

    invalid_message4 = {
        "type": "input_response",
        "data": '{"request_id": "req-1"}',
    }
    request_id, data = RedisIOStream.parse_pubsub_input(invalid_message4)
    assert request_id is None
    assert data is None

    invalid_message5 = {
        "type": "input_response",
        "data": '{"data": "mock-response"}',
    }
    request_id, data = RedisIOStream.parse_pubsub_input(invalid_message5)
    assert request_id is None
    assert data is None


def test_locking_mechanism(fake_redis: fakeredis.FakeRedis) -> None:
    """Test that a lock prevents multiple tasks processing the same input."""
    task_id = "test_task_locking"
    lock_key = f"lock:{task_id}"

    stream = RedisIOStream("redis://localhost", task_id, input_timeout=1)
    stream.redis = fake_redis
    # pylint: disable=protected-access
    assert stream._acquire_lock(lock_key) is True
    assert stream._acquire_lock(lock_key) is False
    stream._release_lock(lock_key)
    assert stream._acquire_lock(lock_key) is True


def test_context_manager(fake_redis: fakeredis.FakeRedis) -> None:
    """Test context manager cleanup and lock release."""
    task_id = "test_task_context_manager"
    lock_key = f"lock:{task_id}"

    stream = RedisIOStream("redis://localhost", task_id, input_timeout=1)
    stream.redis = fake_redis

    with stream as io_stream:
        assert io_stream._acquire_lock(lock_key) is True

    assert io_stream._acquire_lock(lock_key) is False


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
        fake_redis.xadd(stream_key, {"data": f"msg-{i}"})

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
        await a_fake_redis.xadd(stream_key, {"data": f"msg-{i}"})

    assert await a_fake_redis.xlen(stream_key) == 20

    await RedisIOStream.a_trim_task_output_streams(a_fake_redis, maxlen=10)

    assert await a_fake_redis.xlen(stream_key) <= 10
