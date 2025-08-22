# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long,no-self-use
# flake8: noqa: E501
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false

"""Test waldiez.running.step_by_step_models.*."""

from typing import Any

import pytest
from pydantic import ValidationError

from waldiez.running.step_by_step.step_by_step_models import (
    HELP_MESSAGE,
    WaldiezBreakpoint,
    WaldiezBreakpointType,
    WaldiezDebugBreakpointAdded,
    WaldiezDebugBreakpointRemoved,
    WaldiezDebugBreakpointsList,
    WaldiezDebugConfig,
    WaldiezDebugError,
    WaldiezDebugEventInfo,
    WaldiezDebugHelp,
    WaldiezDebugHelpCommand,
    WaldiezDebugHelpCommandGroup,
    WaldiezDebugInputRequest,
    WaldiezDebugInputResponse,
    WaldiezDebugMessageWrapper,
    WaldiezDebugPrint,
    WaldiezDebugStats,
    WaldiezDebugStepAction,
)


def test_enum_values() -> None:
    """Test enum values."""
    assert WaldiezDebugStepAction.CONTINUE.value == "c"
    assert WaldiezDebugStepAction.QUIT.name == "QUIT"


def test_help_command_model() -> None:
    """Test help command model."""
    cmd = WaldiezDebugHelpCommand(cmds=["c", "continue"], desc="Continue")
    assert cmd.desc == "Continue"
    assert "c" in cmd.cmds

    # cmds default to empty list
    cmd2 = WaldiezDebugHelpCommand(desc="No cmds")
    assert not cmd2.cmds


def test_help_command_group_model() -> None:
    """Test help command group model."""
    group = WaldiezDebugHelpCommandGroup(
        title="Test Group",
        commands=[
            WaldiezDebugHelpCommand(cmds=["h"], desc="Help command"),
            WaldiezDebugHelpCommand(cmds=["q"], desc="Quit command"),
        ],
    )
    assert group.title == "Test Group"
    assert len(group.commands) == 2
    assert group.commands[0].desc == "Help command"


def test_debug_print_model() -> None:
    """Test debug print model."""
    msg = WaldiezDebugPrint(content="Test message")
    assert msg.type == "debug_print"
    assert msg.content == "Test message"


def test_debug_input_request_and_response() -> None:
    """Test debug input request and response."""
    req = WaldiezDebugInputRequest(prompt="Enter input:", request_id="1234")
    assert req.type == "debug_input_request"
    assert req.prompt == "Enter input:"
    assert req.request_id == "1234"

    resp = WaldiezDebugInputResponse(request_id="1234", data="c")
    assert resp.type == "debug_input_response"
    assert resp.data == "c"


def test_debug_event_info() -> None:
    """Test debug event info."""
    event_data = {"foo": "bar"}
    event = WaldiezDebugEventInfo(event=event_data)
    assert event.type == "debug_event_info"
    assert event.event == event_data


def test_debug_stats() -> None:
    """Test debug stats."""
    stats = {"processed": 10, "total": 20}
    msg = WaldiezDebugStats(stats=stats)
    assert msg.type == "debug_stats"
    assert msg.stats["processed"] == 10


def test_debug_help_message() -> None:
    """Test debug help message."""
    help_msg = HELP_MESSAGE
    assert isinstance(help_msg, WaldiezDebugHelp)
    assert any(group.title == "Basic Commands" for group in help_msg.help)
    assert any(group.title == "Tips" for group in help_msg.help)


def test_debug_error() -> None:
    """Test debug error."""
    err = WaldiezDebugError(error="Something went wrong")
    assert err.type == "debug_error"
    assert "wrong" in err.error


def test_waldiez_debug_message_union() -> None:
    """Test waldiez debug message union."""
    # Test discriminated union parsing from dicts

    d_print = {"type": "debug_print", "content": "abc"}
    d_req = {
        "type": "debug_input_request",
        "prompt": "input?",
        "request_id": "id1",
    }
    d_resp = {
        "type": "debug_input_response",
        "request_id": "id1",
        "data": "c",
    }
    d_error = {"type": "debug_error", "error": "fail"}

    # Should parse correctly
    for d in (d_print, d_req, d_resp, d_error):
        msg = WaldiezDebugMessageWrapper.model_validate({"message": d})
        assert msg.message.type == d["type"]

    # Invalid type should raise
    with pytest.raises(ValidationError):
        WaldiezDebugMessageWrapper.model_validate(
            {"message": {"type": "unknown_type"}}
        )


def test_help_command_cmds_default_factory() -> None:
    """Test help command cmds default factory."""
    # Should not share list instances
    c1 = WaldiezDebugHelpCommand(desc="C1")
    c2 = WaldiezDebugHelpCommand(desc="C2")
    assert not c1.cmds
    assert not c2.cmds
    c1.cmds.append("x")  # pylint: disable=no-member
    assert not c2.cmds


class TestWaldiezBreakpoint:
    """Test WaldiezBreakpoint class comprehensively."""

    def test_breakpoint_validation_event_type_patterns(self) -> None:
        """Test event_type validation with various patterns."""
        # Valid patterns
        valid_event_types = [
            "message",
            "tool_call",
            "user_input",
            "event123",
            "my_event_type",
            "EventType",
            "a",  # single letter
            "a1_B2_c3",
        ]

        for event_type in valid_event_types:
            bp = WaldiezBreakpoint(
                type=WaldiezBreakpointType.EVENT, event_type=event_type
            )
            assert bp.event_type == event_type

        # Invalid patterns
        invalid_event_types = [
            "123invalid",  # starts with number
            "",  # empty
            "event-dash",  # contains dash
            "event with space",  # contains space
            "event.dot",  # contains dot
            "event@symbol",  # contains special char
            "_underscore_start",  # starts with underscore
        ]

        for event_type in invalid_event_types:
            with pytest.raises(ValidationError) as exc_info:
                WaldiezBreakpoint(
                    type=WaldiezBreakpointType.EVENT, event_type=event_type
                )
            assert "Event type must start with a letter" in str(exc_info.value)

    def test_breakpoint_validation_agent_name_whitespace(self) -> None:
        """Test agent_name validation with whitespace handling."""
        # Valid names with whitespace (should be stripped)
        bp = WaldiezBreakpoint(
            type=WaldiezBreakpointType.AGENT, agent_name="  user  "
        )
        assert bp.agent_name == "user"

        # Invalid names (empty after strip)
        invalid_names = ["", "   ", "\t\n\r", "\t   \n"]
        for agent_name in invalid_names:
            with pytest.raises(ValidationError) as exc_info:
                WaldiezBreakpoint(
                    type=WaldiezBreakpointType.AGENT, agent_name=agent_name
                )
            assert "Agent name cannot be empty or just whitespace" in str(
                exc_info.value
            )

    def test_from_string_comprehensive(self) -> None:
        """Test from_string with comprehensive cases."""
        # Test "all" type
        bp = WaldiezBreakpoint.from_string("all")
        assert bp.type == WaldiezBreakpointType.ALL

        # Test event: prefix
        bp = WaldiezBreakpoint.from_string("event:message")
        assert bp.type == WaldiezBreakpointType.EVENT
        assert bp.event_type == "message"

        # Test agent: prefix
        bp = WaldiezBreakpoint.from_string("agent:user")
        assert bp.type == WaldiezBreakpointType.AGENT
        assert bp.agent_name == "user"

        # Test agent:event format
        bp = WaldiezBreakpoint.from_string("assistant:tool_call")
        assert bp.type == WaldiezBreakpointType.AGENT_EVENT
        assert bp.agent_name == "assistant"
        assert bp.event_type == "tool_call"

        # Test default to event type
        bp = WaldiezBreakpoint.from_string("simple_event")
        assert bp.type == WaldiezBreakpointType.EVENT
        assert bp.event_type == "simple_event"

    def test_from_string_error_cases(self) -> None:
        """Test from_string error cases."""
        # Empty/None input
        with pytest.raises(
            ValueError, match="Breakpoint specification cannot be empty"
        ):
            WaldiezBreakpoint.from_string("")

        with pytest.raises(
            ValueError, match="Breakpoint specification cannot be empty"
        ):
            WaldiezBreakpoint.from_string(None)  # type: ignore

        # Whitespace only
        with pytest.raises(
            ValueError,
            match="Breakpoint specification cannot be just whitespace",
        ):
            WaldiezBreakpoint.from_string("   \t\n   ")

        # Empty after prefix
        with pytest.raises(
            ValueError, match="Event type cannot be empty after 'event:'"
        ):
            WaldiezBreakpoint.from_string("event:")

        with pytest.raises(
            ValueError, match="Agent name cannot be empty after 'agent:'"
        ):
            WaldiezBreakpoint.from_string("agent:")

        # Invalid agent:event format
        with pytest.raises(
            ValueError, match="Both agent name and event type must be specified"
        ):
            WaldiezBreakpoint.from_string(":")

        # Too many colons in invalid format
        with pytest.raises(ValueError, match="Invalid breakpoint format"):
            WaldiezBreakpoint.from_string("invalid:format:spec")

    def test_breakpoint_matches_method(self) -> None:
        """Test the matches method for all breakpoint types."""
        event = {
            "type": "message",
            "sender": "user",
            "recipient": "assistant",
            "content": "Hello",
        }

        # ALL type always matches
        bp_all = WaldiezBreakpoint(type=WaldiezBreakpointType.ALL)
        assert bp_all.matches(event) is True
        assert bp_all.matches({}) is True  # Even empty event

        # EVENT type matches on event type
        bp_event = WaldiezBreakpoint(
            type=WaldiezBreakpointType.EVENT, event_type="message"
        )
        assert bp_event.matches(event) is True

        bp_event_no_match = WaldiezBreakpoint(
            type=WaldiezBreakpointType.EVENT, event_type="tool_call"
        )
        assert bp_event_no_match.matches(event) is False

        # AGENT type matches on sender OR recipient
        bp_agent_sender = WaldiezBreakpoint(
            type=WaldiezBreakpointType.AGENT, agent_name="user"
        )
        assert bp_agent_sender.matches(event) is True

        bp_agent_recipient = WaldiezBreakpoint(
            type=WaldiezBreakpointType.AGENT, agent_name="assistant"
        )
        assert bp_agent_recipient.matches(event) is True

        bp_agent_no_match = WaldiezBreakpoint(
            type=WaldiezBreakpointType.AGENT, agent_name="other"
        )
        assert bp_agent_no_match.matches(event) is False

        # AGENT_EVENT type matches on both event type AND (sender OR recipient)
        bp_agent_event = WaldiezBreakpoint(
            type=WaldiezBreakpointType.AGENT_EVENT,
            agent_name="user",
            event_type="message",
        )
        assert bp_agent_event.matches(event) is True

        # Wrong event type
        bp_agent_event_wrong_type = WaldiezBreakpoint(
            type=WaldiezBreakpointType.AGENT_EVENT,
            agent_name="user",
            event_type="tool_call",
        )
        assert bp_agent_event_wrong_type.matches(event) is False

        # Wrong agent
        bp_agent_event_wrong_agent = WaldiezBreakpoint(
            type=WaldiezBreakpointType.AGENT_EVENT,
            agent_name="other",
            event_type="message",
        )
        assert bp_agent_event_wrong_agent.matches(event) is False

    def test_breakpoint_string_representation(self) -> None:
        """Test __str__ method for all breakpoint types."""
        # EVENT type
        bp_event = WaldiezBreakpoint(
            type=WaldiezBreakpointType.EVENT, event_type="message"
        )
        assert str(bp_event) == "event:message"

        # AGENT type
        bp_agent = WaldiezBreakpoint(
            type=WaldiezBreakpointType.AGENT, agent_name="user"
        )
        assert str(bp_agent) == "agent:user"

        # AGENT_EVENT type
        bp_agent_event = WaldiezBreakpoint(
            type=WaldiezBreakpointType.AGENT_EVENT,
            agent_name="assistant",
            event_type="tool_call",
        )
        assert str(bp_agent_event) == "assistant:tool_call"

        # ALL type
        bp_all = WaldiezBreakpoint(type=WaldiezBreakpointType.ALL)
        assert str(bp_all) == "all"

    def test_breakpoint_hash_and_equality(self) -> None:
        """Test breakpoint hashing and equality."""
        bp1 = WaldiezBreakpoint(
            type=WaldiezBreakpointType.EVENT, event_type="message"
        )
        bp2 = WaldiezBreakpoint(
            type=WaldiezBreakpointType.EVENT, event_type="message"
        )
        bp3 = WaldiezBreakpoint(
            type=WaldiezBreakpointType.EVENT, event_type="tool_call"
        )

        # Same breakpoints should be equal and have same hash
        assert bp1 == bp2
        assert hash(bp1) == hash(bp2)

        # Different breakpoints should not be equal
        assert bp1 != bp3

        # Should work in sets
        breakpoint_set = {bp1, bp2, bp3}
        assert len(breakpoint_set) == 2  # bp1 and bp2 are the same


class TestWaldiezDebugConfig:
    """Test WaldiezDebugConfig validation."""

    def test_config_defaults(self) -> None:
        """Test config default values."""
        config = WaldiezDebugConfig()
        assert config.max_event_history == 1000
        assert config.auto_continue is False
        assert config.step_mode is True
        assert config.enable_stats_collection is True
        assert config.command_timeout_seconds == 300.0

    def test_config_validation_ranges(self) -> None:
        """Test config field validation."""
        # Valid ranges
        config = WaldiezDebugConfig(
            max_event_history=5000, command_timeout_seconds=60.0
        )
        assert config.max_event_history == 5000
        assert config.command_timeout_seconds == 60.0

        # Invalid max_event_history (below minimum)
        with pytest.raises(ValidationError):
            WaldiezDebugConfig(max_event_history=0)

        # Invalid max_event_history (above maximum)
        with pytest.raises(ValidationError):
            WaldiezDebugConfig(max_event_history=20000)

        # Invalid command_timeout_seconds (not positive)
        with pytest.raises(ValidationError):
            WaldiezDebugConfig(command_timeout_seconds=0.0)

        with pytest.raises(ValidationError):
            WaldiezDebugConfig(command_timeout_seconds=-5.0)


class TestBreakpointMessageClasses:
    """Test breakpoint-related message classes."""

    def test_breakpoints_list_property(self) -> None:
        """Test WaldiezDebugBreakpointsList.breakpoint_objects property."""
        # Mix of strings and objects
        bp_obj = WaldiezBreakpoint(
            type=WaldiezBreakpointType.EVENT, event_type="message"
        )
        breakpoints = ["event:tool_call", bp_obj, "invalid:format:spec"]
        msg = WaldiezDebugBreakpointsList(breakpoints=breakpoints)  # type: ignore

        objects = msg.breakpoint_objects
        assert len(objects) == 2  # Invalid one should be skipped
        assert any(str(bp) == "event:tool_call" for bp in objects)
        assert any(str(bp) == "event:message" for bp in objects)

    def test_breakpoint_added_property(self) -> None:
        """Test WaldiezDebugBreakpointAdded.breakpoint_object property."""
        # String breakpoint
        msg_str = WaldiezDebugBreakpointAdded(breakpoint="event:message")
        bp_obj = msg_str.breakpoint_object
        assert bp_obj.type == WaldiezBreakpointType.EVENT
        assert bp_obj.event_type == "message"

        # Object breakpoint
        bp_original = WaldiezBreakpoint(
            type=WaldiezBreakpointType.AGENT, agent_name="user"
        )
        msg_obj = WaldiezDebugBreakpointAdded(breakpoint=bp_original)
        bp_returned = msg_obj.breakpoint_object
        assert bp_returned is bp_original

    def test_breakpoint_removed_property(self) -> None:
        """Test WaldiezDebugBreakpointRemoved.breakpoint_object property."""
        # String breakpoint
        msg_str = WaldiezDebugBreakpointRemoved(breakpoint="agent:assistant")
        bp_obj = msg_str.breakpoint_object
        assert bp_obj.type == WaldiezBreakpointType.AGENT
        assert bp_obj.agent_name == "assistant"

        # Object breakpoint
        bp_original = WaldiezBreakpoint(type=WaldiezBreakpointType.ALL)
        msg_obj = WaldiezDebugBreakpointRemoved(breakpoint=bp_original)
        bp_returned = msg_obj.breakpoint_object
        assert bp_returned is bp_original


def test_breakpoint_types_enum() -> None:
    """Test WaldiezBreakpointType enum values."""
    assert WaldiezBreakpointType.EVENT.value == "event"
    assert WaldiezBreakpointType.AGENT.value == "agent"
    assert WaldiezBreakpointType.AGENT_EVENT.value == "agent_event"
    assert WaldiezBreakpointType.ALL.value == "all"


def test_breakpoint_with_description() -> None:
    """Test breakpoint with description field."""
    bp = WaldiezBreakpoint(
        type=WaldiezBreakpointType.EVENT,
        event_type="message",
        description="Break on all message events",
    )
    assert bp.description == "Break on all message events"

    # Description is optional
    bp_no_desc = WaldiezBreakpoint(
        type=WaldiezBreakpointType.EVENT, event_type="message"
    )
    assert bp_no_desc.description is None


def test_breakpoint_edge_cases_matches() -> None:
    """Test edge cases for breakpoint matching."""
    # Test with missing event fields
    incomplete_event = {"type": "message"}  # No sender/recipient

    # EVENT type should still work
    bp_event = WaldiezBreakpoint(
        type=WaldiezBreakpointType.EVENT, event_type="message"
    )
    assert bp_event.matches(incomplete_event) is True

    # AGENT type should not match (no sender/recipient)
    bp_agent = WaldiezBreakpoint(
        type=WaldiezBreakpointType.AGENT, agent_name="user"
    )
    assert bp_agent.matches(incomplete_event) is False

    # Test with None values in event
    event_with_nones: dict[str, Any] = {
        "type": "message",
        "sender": None,
        "recipient": None,
    }

    bp_agent = WaldiezBreakpoint(
        type=WaldiezBreakpointType.AGENT, agent_name="user"
    )
    assert bp_agent.matches(event_with_nones) is False
