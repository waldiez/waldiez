# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false

"""Test waldiez.running.step_by_step_models.*."""

import pytest
from pydantic import ValidationError

from waldiez.running.step_by_step.step_by_step_models import (
    HELP_MESSAGE,
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
