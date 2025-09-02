# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long,missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=protected-access,too-few-public-methods,unused-argument
# flake8: noqa: E501
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false, reportPrivateUsage=false, reportArgumentType=false

"""Test waldiez.running.step_by_step.events_processor.*."""

from collections import deque
from unittest.mock import MagicMock

import pytest

from waldiez.running.step_by_step.events_processor import EventProcessor


@pytest.fixture(name="runner")
def runner_fixture() -> MagicMock:
    """Fixture for mock runner."""
    runner = MagicMock()
    runner.event_count = 0
    runner.current_event = None
    runner.last_sender = "initial_sender"
    runner.last_recipient = "initial_recipient"
    runner.event_history = deque()
    runner.max_event_history = 1000
    runner.step_mode = True
    runner.is_stop_requested = MagicMock(return_value=False)
    runner.event_plus_one = MagicMock()
    runner.add_to_history = MagicMock()
    runner.pop_event = MagicMock()
    runner.should_break_on_event = MagicMock(return_value=True)
    return runner


@pytest.fixture(name="processor")
def processor_fixture(runner: MagicMock) -> EventProcessor:
    """Fixture for EventProcessor."""
    return EventProcessor(runner)


@pytest.fixture(name="mock_event")
def mock_event_fixture() -> MagicMock:
    """Fixture for mock event."""
    event = MagicMock()
    event.model_dump.return_value = {
        "type": "message",
        "content": "test message",
        "sender": "user",
        "recipient": "assistant",
    }
    event.sender = "user"
    event.recipient = "assistant"
    return event


def test_process_event_basic_flow(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test basic flow of process_event."""
    runner.event_count = 5

    result = processor.process_event(mock_event)

    # Verify event counter was incremented
    runner.event_plus_one.assert_called_once()

    # Verify current event was set
    assert runner.current_event == mock_event

    # Verify model_dump was called
    mock_event.model_dump.assert_called_once_with(
        mode="json", exclude_none=True, fallback=str
    )

    # Verify result structure
    assert result["action"] == "continue"
    assert "should_break" in result
    assert "event_info" in result

    # Check event_info was enriched with count and participants
    event_info = result["event_info"]
    assert event_info["count"] == 5
    assert event_info["sender"] == "user"
    assert event_info["recipient"] == "assistant"


def test_process_event_stop_requested(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test process_event when stop is requested."""
    runner.is_stop_requested.return_value = True

    result = processor.process_event(mock_event)

    assert result["action"] == "stop"
    assert result["reason"] == "stop_requested"

    # Should still increment event counter and set current event
    runner.event_plus_one.assert_called_once()
    assert runner.current_event == mock_event


def test_process_event_event_info_enrichment(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test that event info is properly enriched."""
    runner.event_count = 10
    runner.last_sender = "previous_sender"
    runner.last_recipient = "previous_recipient"

    # Mock event without sender/recipient attributes
    mock_event.sender = None
    mock_event.recipient = None
    # Remove sender/recipient from hasattr checks
    del mock_event.sender
    del mock_event.recipient

    result = processor.process_event(mock_event)

    event_info = result["event_info"]
    assert event_info["count"] == 10
    # Should use last known participants when event doesn't have them
    assert event_info["sender"] == "previous_sender"
    assert event_info["recipient"] == "previous_recipient"


def test_process_event_updates_last_participants(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test that last_sender and last_recipient are updated."""
    processor.process_event(mock_event)

    assert runner.last_sender == "user"
    assert runner.last_recipient == "assistant"


def test_process_event_adds_to_history(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test that event is added to history."""
    processor.process_event(mock_event)

    runner.add_to_history.assert_called_once()
    # Verify the event_info passed to add_to_history
    call_args = runner.add_to_history.call_args[0][0]
    assert call_args["type"] == "message"
    assert call_args["sender"] == "user"
    assert call_args["recipient"] == "assistant"


def test_process_event_history_size_limit(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test that history size is limited and old events are removed."""
    # Mock event_history as a list with length > max_event_history
    runner.event_history = [
        f"event_{i}" for i in range(1100)
    ]  # Exceeds max of 1000
    runner.max_event_history = 1000

    processor.process_event(mock_event)

    # Should call pop_event 100 times to remove excess events
    assert runner.pop_event.call_count == 100


def test_process_event_should_break_called(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test that should_break_on_event is called correctly."""
    runner.should_break_on_event.return_value = True

    result = processor.process_event(mock_event)

    runner.should_break_on_event.assert_called_once_with(
        mock_event, runner.step_mode
    )
    assert result["should_break"] is True


def test_process_event_should_not_break(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test when should_break_on_event returns False."""
    runner.should_break_on_event.return_value = False

    result = processor.process_event(mock_event)

    assert result["should_break"] is False


def test_process_event_history_exactly_at_limit(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test behavior when history is exactly at the limit."""
    runner.event_history = [f"event_{i}" for i in range(1000)]  # Exactly at max
    runner.max_event_history = 1000

    processor.process_event(mock_event)

    # Should not call pop_event since we're at exactly the limit
    runner.pop_event.assert_not_called()


def test_process_event_history_under_limit(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test behavior when history is under the limit."""
    runner.event_history = [
        f"event_{i}" for i in range(500)
    ]  # Under max of 1000
    runner.max_event_history = 1000

    processor.process_event(mock_event)

    # Should not call pop_event since we're under the limit
    runner.pop_event.assert_not_called()


def test_processor_initialization(runner: MagicMock) -> None:
    """Test EventProcessor initialization."""
    processor = EventProcessor(runner)

    assert processor.runner is runner


def test_process_event_return_structure(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test that process_event returns correct structure."""
    runner.should_break_on_event.return_value = True

    result = processor.process_event(mock_event)

    # Verify all required keys are present
    required_keys = ["action", "should_break", "event_info"]
    for key in required_keys:
        assert key in result

    # Verify values
    assert result["action"] == "continue"
    assert isinstance(result["should_break"], bool)
    assert isinstance(result["event_info"], dict)


def test_process_event_event_count_increment(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test that event count is properly used and incremented."""
    runner.event_count = 42

    result = processor.process_event(mock_event)

    # Should increment count
    runner.event_plus_one.assert_called_once()

    # Event info should contain the current count (before increment)
    event_info = result["event_info"]
    assert event_info["count"] == 42


def test_process_event_model_dump_called_correctly(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test that model_dump is called with correct parameters."""
    processor.process_event(mock_event)

    mock_event.model_dump.assert_called_once_with(
        mode="json", exclude_none=True, fallback=str
    )


def test_process_event_multiple_calls_update_participants(
    processor: EventProcessor, runner: MagicMock
) -> None:
    """Test that multiple event processing calls update participants correctly."""
    # First event
    event1 = MagicMock()
    event1.model_dump.return_value = {"type": "message1"}
    event1.sender = "sender1"
    event1.recipient = "recipient1"

    # Second event
    event2 = MagicMock()
    event2.model_dump.return_value = {"type": "message2"}
    event2.sender = "sender2"
    event2.recipient = "recipient2"

    # Process first event
    processor.process_event(event1)
    assert runner.last_sender == "sender1"
    assert runner.last_recipient == "recipient1"

    # Process second event
    processor.process_event(event2)
    assert runner.last_sender == "sender2"
    assert runner.last_recipient == "recipient2"


def test_process_event_empty_event_history(
    processor: EventProcessor, runner: MagicMock, mock_event: MagicMock
) -> None:
    """Test processing with empty event history."""
    runner.event_history = []
    runner.max_event_history = 1000

    processor.process_event(mock_event)

    # Should not call pop_event with empty history
    runner.pop_event.assert_not_called()
    # Should still add to history
    runner.add_to_history.assert_called_once()
