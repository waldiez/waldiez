# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long,missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=protected-access,too-few-public-methods,unused-argument
# flake8: noqa: E501
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false, reportPrivateUsage=false, reportArgumentType=false

"""Test waldiez.running.step_by_step.command_handler.*."""

from unittest.mock import MagicMock

import pytest

from waldiez.running.step_by_step.command_handler import CommandHandler
from waldiez.running.step_by_step.step_by_step_models import (
    HELP_MESSAGE,
    WaldiezDebugError,
    WaldiezDebugStepAction,
)


@pytest.fixture(name="runner")
def runner_fixture() -> MagicMock:
    """Fixture for mock runner."""
    runner = MagicMock()
    runner.step_mode = True
    runner.current_event = None
    runner.emit = MagicMock()
    runner.show_event_info = MagicMock()
    runner.show_stats = MagicMock()
    runner.add_breakpoint = MagicMock()
    runner.remove_breakpoint = MagicMock()
    runner.list_breakpoints = MagicMock()
    runner.clear_breakpoints = MagicMock()
    runner.set_stop_requested = MagicMock()
    return runner


@pytest.fixture(name="handler")
def handler_fixture(runner: MagicMock) -> CommandHandler:
    """Fixture for CommandHandler."""
    return CommandHandler(runner)


def test_handle_command_empty(handler: CommandHandler) -> None:
    """Test handling empty command."""
    result = handler.handle_command("")
    assert result == WaldiezDebugStepAction.STEP


def test_handle_command_whitespace_only(handler: CommandHandler) -> None:
    """Test handling whitespace-only command."""
    result = handler.handle_command("   \t\n   ")
    assert result == WaldiezDebugStepAction.STEP


def test_handle_command_continue(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling continue command."""
    result = handler.handle_command("c")
    assert result == WaldiezDebugStepAction.CONTINUE
    assert runner.step_mode is True


def test_handle_command_step(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling step command."""
    result = handler.handle_command("s")
    assert result == WaldiezDebugStepAction.STEP
    assert runner.step_mode is True


def test_handle_command_run(handler: CommandHandler, runner: MagicMock) -> None:
    """Test handling run command."""
    result = handler.handle_command("r")
    assert result == WaldiezDebugStepAction.RUN
    assert runner.step_mode is False


def test_handle_command_quit(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling quit command."""
    result = handler.handle_command("q")
    assert result == WaldiezDebugStepAction.QUIT
    runner.set_stop_requested.assert_called_once()


def test_handle_command_info(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling info command."""
    result = handler.handle_command("i")
    assert result == WaldiezDebugStepAction.INFO
    runner.show_event_info.assert_called_once()


def test_handle_command_help(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling help command."""
    result = handler.handle_command("h")
    assert result == WaldiezDebugStepAction.HELP
    runner.emit.assert_called_once_with(HELP_MESSAGE)


def test_handle_command_stats(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling stats command."""
    result = handler.handle_command("st")
    assert result == WaldiezDebugStepAction.STATS
    runner.show_stats.assert_called_once()


def test_handle_command_add_breakpoint_with_args(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling add breakpoint command with arguments."""
    result = handler.handle_command("ab event:message")
    assert result == WaldiezDebugStepAction.ADD_BREAKPOINT
    runner.add_breakpoint.assert_called_once_with("event:message")


def test_handle_command_add_breakpoint_no_args_with_current_event(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling add breakpoint command without args but with current event."""
    runner.current_event = MagicMock()
    runner.current_event.type = "message"

    result = handler.handle_command("ab")
    assert result == WaldiezDebugStepAction.ADD_BREAKPOINT
    runner.add_breakpoint.assert_called_once_with("message")


def test_handle_command_add_breakpoint_no_args_no_current_event(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling add breakpoint command without args and no current event."""
    runner.current_event = None

    result = handler.handle_command("ab")
    assert result == WaldiezDebugStepAction.ADD_BREAKPOINT
    runner.emit.assert_called_once()
    error_msg = runner.emit.call_args[0][0]
    assert isinstance(error_msg, WaldiezDebugError)
    assert "No breakpoint specification provided" in error_msg.error


def test_handle_command_remove_breakpoint_with_args(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling remove breakpoint command with arguments."""
    result = handler.handle_command("rb event:message")
    assert result == WaldiezDebugStepAction.REMOVE_BREAKPOINT
    runner.remove_breakpoint.assert_called_once_with("event:message")


def test_handle_command_remove_breakpoint_no_args_with_current_event(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling remove breakpoint command without args but with current event."""
    runner.current_event = MagicMock()
    runner.current_event.type = "message"

    result = handler.handle_command("rb")
    assert result == WaldiezDebugStepAction.REMOVE_BREAKPOINT
    runner.remove_breakpoint.assert_called_once_with("message")


def test_handle_command_remove_breakpoint_no_args_no_current_event(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling remove breakpoint command without args and no current event."""
    runner.current_event = None

    result = handler.handle_command("rb")
    assert result == WaldiezDebugStepAction.REMOVE_BREAKPOINT
    runner.emit.assert_called_once()
    error_msg = runner.emit.call_args[0][0]
    assert isinstance(error_msg, WaldiezDebugError)
    assert "No breakpoint specification provided" in error_msg.error


def test_handle_command_list_breakpoints(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling list breakpoints command."""
    result = handler.handle_command("lb")
    assert result == WaldiezDebugStepAction.LIST_BREAKPOINTS
    runner.list_breakpoints.assert_called_once()


def test_handle_command_clear_breakpoints(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling clear breakpoints command."""
    result = handler.handle_command("cb")
    assert result == WaldiezDebugStepAction.CLEAR_BREAKPOINTS
    runner.clear_breakpoints.assert_called_once()


def test_handle_command_unknown(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling unknown command."""
    result = handler.handle_command("unknown")
    assert result == WaldiezDebugStepAction.UNKNOWN
    runner.emit.assert_called_once()
    error_msg = runner.emit.call_args[0][0]
    assert isinstance(error_msg, WaldiezDebugError)
    assert "Unknown command" in error_msg.error


def test_handle_command_case_insensitive(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test that commands are case insensitive."""
    result = handler.handle_command("C")
    assert result == WaldiezDebugStepAction.CONTINUE

    result = handler.handle_command("S")
    assert result == WaldiezDebugStepAction.STEP

    result = handler.handle_command("Q")
    assert result == WaldiezDebugStepAction.QUIT


def test_handle_command_with_extra_whitespace(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling commands with extra whitespace."""
    result = handler.handle_command("  c  ")
    assert result == WaldiezDebugStepAction.CONTINUE

    result = handler.handle_command("\tc\n")
    assert result == WaldiezDebugStepAction.CONTINUE


def test_handle_command_with_arguments(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling commands with arguments."""
    result = handler.handle_command("ab event:message extra args")
    assert result == WaldiezDebugStepAction.ADD_BREAKPOINT
    runner.add_breakpoint.assert_called_once_with("event:message extra args")


def test_handle_command_empty_parts(handler: CommandHandler) -> None:
    """Test handling command with empty parts."""
    # This should trigger the unknown command handler
    result = handler.handle_command(" ")
    assert (
        result == WaldiezDebugStepAction.STEP
    )  # Empty command defaults to step


def test_command_map_completeness(handler: CommandHandler) -> None:
    """Test that all expected commands are in the command map."""
    expected_commands = {
        "c",
        "s",
        "r",
        "q",
        "i",
        "h",
        "st",
        "ab",
        "rb",
        "lb",
        "cb",
    }

    assert set(handler._command_map.keys()) == expected_commands


def test_handler_initialization(runner: MagicMock) -> None:
    """Test that CommandHandler initializes correctly."""
    handler = CommandHandler(runner)

    assert handler.runner is runner
    assert isinstance(handler._command_map, dict)
    assert len(handler._command_map) > 0


def test_handle_command_multiple_spaces_in_args(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling command with multiple spaces in arguments."""
    result = handler.handle_command("ab   event:message   with   spaces")
    assert result == WaldiezDebugStepAction.ADD_BREAKPOINT
    runner.add_breakpoint.assert_called_once_with(
        "event:message   with   spaces"
    )


def test_handle_command_tabs_in_args(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test handling command with tabs in arguments."""
    result = handler.handle_command("ab\tevent:message\twith\ttabs")
    assert result == WaldiezDebugStepAction.ADD_BREAKPOINT
    runner.add_breakpoint.assert_called_once_with("event:message\twith\ttabs")


def test_private_methods_exist(handler: CommandHandler) -> None:
    """Test that all private handler methods exist."""
    private_methods = [
        "_handle_continue",
        "_handle_step",
        "_handle_run",
        "_handle_quit",
        "_handle_info",
        "_handle_help",
        "_handle_stats",
        "_handle_add_breakpoint",
        "_handle_remove_breakpoint",
        "_handle_list_breakpoints",
        "_handle_clear_breakpoints",
        "_handle_unknown",
    ]

    for method_name in private_methods:
        assert hasattr(handler, method_name)
        assert callable(getattr(handler, method_name))


def test_all_handler_methods_set_step_mode_correctly(
    handler: CommandHandler, runner: MagicMock
) -> None:
    """Test that continue and step handlers set step_mode correctly."""
    # Continue should set step_mode to True
    runner.step_mode = False
    handler._handle_continue(None)
    assert runner.step_mode is True

    # Step should set step_mode to True
    runner.step_mode = False
    handler._handle_step(None)
    assert runner.step_mode is True

    # Run should set step_mode to False
    runner.step_mode = True
    handler._handle_run(None)
    assert runner.step_mode is False
