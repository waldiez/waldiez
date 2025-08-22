# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long,missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=protected-access,too-few-public-methods,unused-argument
# flake8: noqa: E501
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false, reportPrivateUsage=false, reportArgumentType=false

"""Test waldiez.running.step_by_step.breakpoints_mixin.*."""

from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from waldiez.running.step_by_step.breakpoints_mixin import (
    BreakpointsMixin,
    handle_breakpoint_errors,
)
from waldiez.running.step_by_step.step_by_step_models import (
    WaldiezBreakpoint,
    WaldiezDebugError,
)


class TestBreakpointsMixin(BreakpointsMixin):
    """Test class for BreakpointsMixin."""

    def __init__(self) -> None:
        """Initialize test class."""
        super().__init__()
        self.emitted_messages: list[Any] = []

    def emit(self, message: Any) -> None:
        """Store emitted messages for testing."""
        self.emitted_messages.append(message)


@pytest.fixture(name="mixin")
def mixin_fixture() -> TestBreakpointsMixin:
    """Fixture for TestBreakpointsMixin."""
    return TestBreakpointsMixin()


def test_handle_breakpoint_errors_decorator() -> None:
    """Test the handle_breakpoint_errors decorator."""
    mixin = TestBreakpointsMixin()

    @handle_breakpoint_errors
    def test_function(self: BreakpointsMixin, value: str) -> bool:
        """Test function that raises ValueError."""
        if value == "error":
            raise ValueError("Test error")
        if value == "exception":
            raise RuntimeError("Runtime error")
        return True

    # Normal operation
    result = test_function(mixin, "normal")
    assert result is True
    assert not mixin.emitted_messages

    # ValueError handling
    result = test_function(mixin, "error")
    assert result is False
    assert len(mixin.emitted_messages) == 1
    assert isinstance(mixin.emitted_messages[0], WaldiezDebugError)
    assert "Breakpoint error: Test error" in mixin.emitted_messages[0].error

    # Exception handling
    mixin.emitted_messages.clear()
    with patch("logging.exception") as mock_log:
        result = test_function(mixin, "exception")
        assert result is False
        assert len(mixin.emitted_messages) == 1
        assert isinstance(mixin.emitted_messages[0], WaldiezDebugError)
        assert (
            "Unexpected error in test_function: Runtime error"
            in mixin.emitted_messages[0].error
        )
        mock_log.assert_called_once_with("Error in %s", "test_function")


def test_add_breakpoint_success(mixin: TestBreakpointsMixin) -> None:
    """Test successful breakpoint addition."""
    assert mixin.add_breakpoint("event:message")
    assert len(mixin._breakpoints) == 1
    assert any(bp.event_type == "message" for bp in mixin._breakpoints)
    assert len(mixin.emitted_messages) == 1
    assert mixin.emitted_messages[0].breakpoint == "event:message"


def test_add_breakpoint_invalid_spec(mixin: TestBreakpointsMixin) -> None:
    """Test adding breakpoint with invalid specification."""
    assert not mixin.add_breakpoint("")
    assert not mixin.add_breakpoint(None)
    assert len(mixin._breakpoints) == 0
    assert len(mixin.emitted_messages) >= 1
    assert isinstance(mixin.emitted_messages[-1], WaldiezDebugError)


def test_add_breakpoint_already_exists(mixin: TestBreakpointsMixin) -> None:
    """Test adding duplicate breakpoint."""
    assert mixin.add_breakpoint("event:message")
    mixin.emitted_messages.clear()

    assert not mixin.add_breakpoint("event:message")
    assert len(mixin._breakpoints) == 1
    assert len(mixin.emitted_messages) == 1
    assert "already exists" in mixin.emitted_messages[0].error


def test_remove_breakpoint_success(mixin: TestBreakpointsMixin) -> None:
    """Test successful breakpoint removal."""
    mixin.add_breakpoint("event:message")
    mixin.emitted_messages.clear()

    assert mixin.remove_breakpoint("event:message")
    assert len(mixin._breakpoints) == 0
    assert len(mixin.emitted_messages) == 1
    assert mixin.emitted_messages[0].breakpoint == "event:message"


def test_remove_breakpoint_not_exists(mixin: TestBreakpointsMixin) -> None:
    """Test removing non-existent breakpoint."""
    assert not mixin.remove_breakpoint("event:nonexistent")
    assert len(mixin.emitted_messages) == 1
    assert "does not exist" in mixin.emitted_messages[0].error


def test_remove_breakpoint_object(mixin: TestBreakpointsMixin) -> None:
    """Test removing breakpoint using WaldiezBreakpoint object."""
    bp = WaldiezBreakpoint.from_string("event:message")
    mixin._breakpoints.add(bp)

    assert mixin.remove_breakpoint(bp)
    assert len(mixin._breakpoints) == 0


def test_remove_breakpoint_invalid_spec(mixin: TestBreakpointsMixin) -> None:
    """Test removing breakpoint with invalid specification."""
    assert not mixin.remove_breakpoint("")
    assert not mixin.remove_breakpoint(None)
    assert len(mixin.emitted_messages) >= 1
    assert isinstance(mixin.emitted_messages[-1], WaldiezDebugError)


def test_list_breakpoints(mixin: TestBreakpointsMixin) -> None:
    """Test listing breakpoints."""
    mixin.add_breakpoint("event:message")
    mixin.add_breakpoint("agent:user")
    mixin.emitted_messages.clear()

    mixin.list_breakpoints()
    assert len(mixin.emitted_messages) == 1
    assert len(mixin.emitted_messages[0].breakpoints) == 2


def test_clear_breakpoints_with_breakpoints(
    mixin: TestBreakpointsMixin,
) -> None:
    """Test clearing breakpoints when some exist."""
    mixin.add_breakpoint("event:message")
    mixin.add_breakpoint("agent:user")
    mixin.emitted_messages.clear()

    mixin.clear_breakpoints()
    assert len(mixin._breakpoints) == 0
    assert len(mixin.emitted_messages) == 1
    assert "Cleared 2 breakpoint(s)" in mixin.emitted_messages[0].message


def test_clear_breakpoints_empty(mixin: TestBreakpointsMixin) -> None:
    """Test clearing breakpoints when none exist."""
    mixin.clear_breakpoints()
    assert len(mixin._breakpoints) == 0
    assert len(mixin.emitted_messages) == 1
    assert "No breakpoints to clear" in mixin.emitted_messages[0].message


def test_set_breakpoints_success(mixin: TestBreakpointsMixin) -> None:
    """Test setting breakpoints successfully."""
    specs = ["event:message", "agent:user"]
    assert mixin.set_breakpoints(specs)
    assert len(mixin._breakpoints) == 2
    assert any(bp.event_type == "message" for bp in mixin._breakpoints)
    assert any(bp.agent_name == "user" for bp in mixin._breakpoints)


def test_set_breakpoints_with_objects(mixin: TestBreakpointsMixin) -> None:
    """Test setting breakpoints with WaldiezBreakpoint objects."""
    bp1 = WaldiezBreakpoint.from_string("event:message")
    bp2 = WaldiezBreakpoint.from_string("agent:user")

    assert mixin.set_breakpoints([bp1, bp2])
    assert len(mixin._breakpoints) == 2


def test_set_breakpoints_with_errors(mixin: TestBreakpointsMixin) -> None:
    """Test setting breakpoints with some invalid specs."""
    specs = ["event:message", "invalid:format:spec"]
    assert not mixin.set_breakpoints(specs)
    assert len(mixin.emitted_messages) >= 1
    assert any(
        isinstance(msg, WaldiezDebugError) for msg in mixin.emitted_messages
    )


def test_get_breakpoints(mixin: TestBreakpointsMixin) -> None:
    """Test getting breakpoints."""
    mixin.add_breakpoint("event:message")
    breakpoints = mixin.get_breakpoints()

    assert len(breakpoints) == 1
    assert isinstance(breakpoints, set)
    # Ensure it's a copy
    breakpoints.clear()
    assert len(mixin._breakpoints) == 1


def test_has_breakpoint_string(mixin: TestBreakpointsMixin) -> None:
    """Test checking if breakpoint exists using string."""
    mixin.add_breakpoint("event:message")

    assert mixin.has_breakpoint("event:message")
    assert not mixin.has_breakpoint("event:other")
    assert not mixin.has_breakpoint("invalid:format:spec")


def test_has_breakpoint_object(mixin: TestBreakpointsMixin) -> None:
    """Test checking if breakpoint exists using WaldiezBreakpoint object."""
    bp = WaldiezBreakpoint.from_string("event:message")
    mixin._breakpoints.add(bp)

    assert mixin.has_breakpoint(bp)
    assert not mixin.has_breakpoint(
        WaldiezBreakpoint.from_string("event:other")
    )


def test_should_break_on_event_input_request(
    mixin: TestBreakpointsMixin,
) -> None:
    """Test should_break_on_event with input_request event."""
    event = MagicMock()
    event.type = "input_request"
    event.model_dump.return_value = {"type": "input_request"}

    assert not mixin.should_break_on_event(event, step_mode=True)


def test_should_break_on_event_no_breakpoints_no_step_mode(
    mixin: TestBreakpointsMixin,
) -> None:
    """Test should_break_on_event with no breakpoints and no step mode."""
    event = MagicMock()
    event.type = "message"
    event.model_dump.return_value = {"type": "message"}

    assert not mixin.should_break_on_event(event, step_mode=False)


def test_should_break_on_event_step_mode_no_breakpoints(
    mixin: TestBreakpointsMixin,
) -> None:
    """Test should_break_on_event with step mode but no breakpoints."""
    event = MagicMock()
    event.type = "message"
    event.model_dump.return_value = {"type": "message"}

    assert mixin.should_break_on_event(event, step_mode=True)


def test_should_break_on_event_matching_breakpoint(
    mixin: TestBreakpointsMixin,
) -> None:
    """Test should_break_on_event with matching breakpoint."""
    mixin.add_breakpoint("event:message")

    event = MagicMock()
    event.type = "message"
    event.model_dump.return_value = {"type": "message", "sender": "user"}

    assert mixin.should_break_on_event(event, step_mode=False)


def test_should_break_on_event_non_matching_breakpoint(
    mixin: TestBreakpointsMixin,
) -> None:
    """Test should_break_on_event with non-matching breakpoint."""
    mixin.add_breakpoint("event:other")

    event = MagicMock()
    event.type = "message"
    event.model_dump.return_value = {"type": "message", "sender": "user"}

    # Should break because step_mode=True overrides
    assert mixin.should_break_on_event(event, step_mode=True)
    # Should not break with step_mode=False and non-matching breakpoint
    assert not mixin.should_break_on_event(event, step_mode=False)


def test_should_break_on_event_caching(mixin: TestBreakpointsMixin) -> None:
    """Test should_break_on_event caching mechanism."""
    mixin.add_breakpoint("event:message")

    event = MagicMock()
    event.type = "message"
    event.model_dump.return_value = {"type": "message", "sender": "user"}

    # First call - cache miss
    result1 = mixin.should_break_on_event(event, step_mode=False)

    # Second call with same event - cache hit
    result2 = mixin.should_break_on_event(event, step_mode=False)
    cache_hits_after_second = mixin._breakpoint_stats["cache_hits"]

    assert result1 == result2
    assert cache_hits_after_second > 0


def test_should_break_on_event_exception_handling(
    mixin: TestBreakpointsMixin,
) -> None:
    """Test should_break_on_event handles exceptions gracefully."""
    event = MagicMock()
    event.type = "message"
    event.model_dump.side_effect = Exception("Test exception")

    result = mixin.should_break_on_event(event, step_mode=True)
    assert result is True  # Falls back to step_mode


def test_get_breakpoint_stats(mixin: TestBreakpointsMixin) -> None:
    """Test get_breakpoint_stats method."""
    mixin.add_breakpoint("event:message")
    mixin.add_breakpoint("agent:user")

    # Trigger some cache activity
    event = MagicMock()
    event.type = "message"
    event.model_dump.return_value = {"type": "message"}
    mixin.should_break_on_event(event, step_mode=False)

    stats = mixin.get_breakpoint_stats()

    assert stats["total_breakpoints"] == 2
    assert stats["has_breakpoints"] is True
    assert len(stats["breakpoints"]) == 2
    assert "cache_stats" in stats
    assert "performance" in stats


def test_export_breakpoints(mixin: TestBreakpointsMixin) -> None:
    """Test export_breakpoints method."""
    mixin.add_breakpoint("event:message")
    mixin.add_breakpoint("agent:user")

    exported = mixin.export_breakpoints()

    assert len(exported) == 2
    assert "agent:user" in exported
    assert "event:message" in exported
    assert all(isinstance(bp, str) for bp in exported)


def test_import_breakpoints_success(mixin: TestBreakpointsMixin) -> None:
    """Test import_breakpoints with successful imports."""
    specs = ["event:message", "agent:user"]

    successful, errors = mixin.import_breakpoints(specs)

    assert successful == 2
    assert len(errors) == 0
    assert len(mixin._breakpoints) == 2


def test_import_breakpoints_with_errors(mixin: TestBreakpointsMixin) -> None:
    """Test import_breakpoints with some errors."""
    specs = ["event:message", "invalid:format:spec", "agent:user"]

    successful, errors = mixin.import_breakpoints(specs)

    assert successful == 2
    assert len(errors) == 1
    assert "invalid:format:spec" in errors[0]


def test_import_breakpoints_duplicates(mixin: TestBreakpointsMixin) -> None:
    """Test import_breakpoints with duplicate breakpoints."""
    mixin.add_breakpoint("event:message")
    specs = ["event:message", "agent:user"]

    successful, errors = mixin.import_breakpoints(specs)

    assert successful == 1  # Only agent:user was new
    assert len(errors) == 1
    assert "already exists" in errors[0]


def test_agent_breakpoint_matching(mixin: TestBreakpointsMixin) -> None:
    """Test agent breakpoint matching for both sender and recipient."""
    mixin.add_breakpoint("agent:user")

    # Test event where user is sender
    event1 = MagicMock()
    event1.type = "message"
    event1.model_dump.return_value = {
        "type": "message",
        "sender": "user",
        "recipient": "assistant",
    }

    assert mixin.should_break_on_event(event1, step_mode=False)

    # Test event where user is recipient
    event2 = MagicMock()
    event2.type = "message"
    event2.model_dump.return_value = {
        "type": "message",
        "sender": "assistant",
        "recipient": "user",
    }

    assert mixin.should_break_on_event(event2, step_mode=False)


def test_agent_event_breakpoint_matching(mixin: TestBreakpointsMixin) -> None:
    """Test agent-specific event breakpoint matching."""
    mixin.add_breakpoint("user:message")

    # Test matching event
    event1 = MagicMock()
    event1.type = "message"
    event1.model_dump.return_value = {
        "type": "message",
        "sender": "user",
        "recipient": "assistant",
    }

    assert mixin.should_break_on_event(event1, step_mode=False)

    # Test non-matching event type
    event2 = MagicMock()
    event2.type = "tool_call"
    event2.model_dump.return_value = {
        "type": "tool_call",
        "sender": "user",
        "recipient": "assistant",
    }

    assert not mixin.should_break_on_event(event2, step_mode=False)

    # Test non-matching agent
    event3 = MagicMock()
    event3.type = "message"
    event3.model_dump.return_value = {
        "type": "message",
        "sender": "assistant",
        "recipient": "other",
    }

    assert not mixin.should_break_on_event(event3, step_mode=False)
