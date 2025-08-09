# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long,missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=protected-access,too-few-public-methods,unused-argument
# flake8: noqa: E501
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false, reportPrivateUsage=false, reportArgumentType=false

"""Test waldiez.running.step_by_step_runner.*."""

import threading
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from autogen.events.agent_events import (  # type: ignore
    RunCompletionEvent,
    TextEvent,
)

from waldiez.models.flow.info import WaldiezFlowInfo
from waldiez.running.exceptions import StopRunningException
from waldiez.running.step_by_step_models import (
    HELP_MESSAGE,
    WaldiezDebugStats,
    WaldiezDebugStepAction,
)
from waldiez.running.step_by_step_runner import WaldiezStepByStepRunner

BASE_RUNNER = "waldiez.running.base_runner.WaldiezBaseRunner"


@pytest.fixture(name="runner")
def runner_fixture() -> WaldiezStepByStepRunner:
    """Fixture for WaldiezStepByStepRunner."""
    waldiez = MagicMock()
    waldiez.info = WaldiezFlowInfo(participants=[])
    runner = WaldiezStepByStepRunner(waldiez=waldiez)
    runner._stop_requested.clear()
    runner._execution_complete_event.clear()
    return runner


@pytest.fixture(name="text_event")
def text_event_fixture() -> TextEvent:
    """Fixture for TextEvent."""
    return TextEvent(
        content="some_event", sender="test_sender", recipient="test_recipient"
    )


@pytest.fixture(name="run_completion_event")
def run_completion_event_fixture() -> RunCompletionEvent:
    """Fixture for RunCompletionEvent."""
    return RunCompletionEvent(
        summary="some_summary",
        history=[],
        cost={},
        last_speaker=None,
        context_variables=None,
    )


def test_parse_user_action_known_and_unknown(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test parsing of user actions."""
    action = runner._parse_user_action("c", input_id="id1")
    assert action == WaldiezDebugStepAction.CONTINUE

    action = runner._parse_user_action("unknowncmd", input_id="id1")
    assert action == WaldiezDebugStepAction.UNKNOWN


@patch(f"{BASE_RUNNER}.get_user_input", return_value="c")
def test_handle_step_interaction_continue(
    mock_input: Any, runner: WaldiezStepByStepRunner
) -> None:
    """Test handling of step interaction for continue command."""
    result = runner._handle_step_interaction()
    assert result is True


@patch(
    f"{BASE_RUNNER}.get_user_input",
    side_effect=KeyboardInterrupt,
)
def test_handle_step_interaction_quit_on_interrupt(
    mock_input: Any, runner: WaldiezStepByStepRunner
) -> None:
    """Test handling of step interaction for quit command."""
    result = runner._handle_step_interaction()
    assert result is False
    assert runner._stop_requested.is_set()


@pytest.mark.asyncio
@patch(f"{BASE_RUNNER}.a_get_user_input", new_callable=AsyncMock)
async def test_async_handle_step_interaction_continue(
    mock_async_input: AsyncMock, runner: WaldiezStepByStepRunner
) -> None:
    """Test handling of step interaction for continue command."""
    mock_async_input.return_value = "c"
    result = await runner._a_handle_step_interaction()
    assert result is True


@pytest.mark.asyncio
@patch(f"{BASE_RUNNER}.a_get_user_input", new_callable=AsyncMock)
async def test_async_handle_step_interaction_quit_on_interrupt(
    mock_async_input: AsyncMock, runner: WaldiezStepByStepRunner
) -> None:
    """Test handling of step interaction for quit command."""
    mock_async_input.side_effect = KeyboardInterrupt
    result = await runner._a_handle_step_interaction()
    assert result is False


def test_should_break_on_event_basic(
    runner: WaldiezStepByStepRunner, text_event: TextEvent
) -> None:
    """Test basic event breaking behavior."""
    runner._step_mode = True
    runner._break_on_events = []
    assert runner._should_break_on_event(text_event) is True

    runner._break_on_events = ["text"]
    assert runner._should_break_on_event(text_event) is True

    runner._break_on_events = ["other_event"]
    assert runner._should_break_on_event(text_event) is False

    runner._step_mode = False
    assert runner._should_break_on_event(text_event) is False


def test_on_event_breaks_and_continues(
    runner: WaldiezStepByStepRunner,
    text_event: TextEvent,
) -> None:
    """Test event breaking and continuing behavior."""
    runner._step_mode = True
    runner._break_on_events = []

    # Patch _handle_step_interaction to return True so it continues
    with patch.object(runner, "_handle_step_interaction", return_value=True):
        # Patch WaldiezBaseRunner.process_event to do nothing
        with patch(f"{BASE_RUNNER}.process_event") as mock_process:
            result = runner._on_event(text_event)
            assert result is True
            mock_process.assert_called_once_with(text_event)

    # Patch _handle_step_interaction to return False (stop)
    with patch.object(runner, "_handle_step_interaction", return_value=False):
        with patch(f"{BASE_RUNNER}.process_event") as mock_process:
            with pytest.raises(StopRunningException):
                runner._on_event(text_event)
            mock_process.assert_not_called()


@pytest.mark.asyncio
async def test_async_on_event_continues_and_stops(
    runner: WaldiezStepByStepRunner, text_event: TextEvent
) -> None:
    """Test event breaking and continuing behavior."""
    runner._step_mode = True
    runner._break_on_events = []

    # Patch _a_handle_step_interaction to return True
    with patch.object(
        runner, "_a_handle_step_interaction", AsyncMock(return_value=True)
    ):
        with patch(
            f"{BASE_RUNNER}.a_process_event", AsyncMock()
        ) as mock_process:
            result = await runner._a_on_event(text_event)
            assert result is True
            mock_process.assert_called_once_with(text_event)

    # Patch _a_handle_step_interaction to return False (stop)
    with patch.object(
        runner, "_a_handle_step_interaction", AsyncMock(return_value=False)
    ):
        with patch(
            f"{BASE_RUNNER}.a_process_event", AsyncMock()
        ) as mock_process:
            with pytest.raises(StopRunningException):
                await runner._a_on_event(text_event)
            mock_process.assert_not_called()


def test_enable_disable_flags(runner: WaldiezStepByStepRunner) -> None:
    """Test enabling and disabling flags."""
    runner.enable_auto_continue(True)
    assert runner._auto_continue is True

    runner.enable_auto_continue(False)
    assert runner._auto_continue is False

    runner.enable_step_mode(True)
    assert runner._step_mode is True

    runner.enable_step_mode(False)
    assert runner._step_mode is False


def test_set_break_on_events(runner: WaldiezStepByStepRunner) -> None:
    """Test setting break on events."""
    runner.set_break_on_events(["a", "b"])
    assert runner._break_on_events == ["a", "b"]


def test_get_user_response_invalid_json_emits_error(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test getting user response with invalid JSON."""
    invalid_json = '{"not": "valid"'
    input_id = "some-id"
    with patch.object(runner, "emit") as mock_emit:
        response, valid = runner._get_user_response(invalid_json, input_id)
        # For invalid JSON, fallback to raw input
        assert not valid or response in ("", "c", "r", "s", "h", "q", "st")
        if not valid:
            mock_emit.assert_called_once()


def test_get_user_response_from_raw_string(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test getting user response from raw string."""
    raw_input = "c"
    input_id = "some-id"
    response, valid = runner._get_user_response(raw_input, input_id)
    assert response == raw_input
    assert valid


def test_get_user_response_from_empty_string(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test getting user response from empty string."""
    empty_input = ""
    input_id = "some-id"
    response, valid = runner._get_user_response(empty_input, input_id)
    assert response == empty_input
    assert valid


def test_get_event_history_returns_copy(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test that get_event_history returns a copy of the event history."""
    # Initially empty
    history = runner.get_event_history()
    assert isinstance(history, list)
    assert history == []

    # Add some events to internal history
    sample_event = {"type": "test_event", "count": 1}
    runner._event_history.append(sample_event)  # pyright: ignore

    # Call get_event_history and check contents
    history = runner.get_event_history()
    assert history == [sample_event]

    # Mutate returned list and check internal list not affected
    history.append({"type": "other_event", "count": 2})
    assert len(history) == 2
    assert len(runner._event_history) == 1  # internal list unchanged


def test_get_execution_stats_returns_correct_data(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test get_execution_stats returns correct statistics dictionary."""
    # Setup internal state
    runner._event_count = 10
    runner._processed_events = 5
    runner._step_mode = True
    runner._auto_continue = False
    runner._break_on_events = ["event1", "event2"]
    runner._event_history = [{"type": "event1"}, {"type": "event2"}]

    stats = runner.get_execution_stats()

    assert stats["total_events"] == 10
    assert stats["processed_events"] == 5
    assert stats["step_mode"] is True
    assert stats["auto_continue"] is False
    assert stats["break_on_events"] == ["event1", "event2"]
    assert stats["event_history_count"] == 2
    assert stats["event_processing_rate"] == 0.5  # 5 / 10

    # Edge case: no events processed
    runner._event_count = 0
    runner._processed_events = 0
    stats = runner.get_execution_stats()
    assert stats["event_processing_rate"] == 0


def test_get_user_action_handles_keyboard_interrupt(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test get_user_action handles keyboard interrupt."""
    with patch(
        f"{BASE_RUNNER}.get_user_input",
        side_effect=KeyboardInterrupt,
    ):
        with patch.object(runner, "_signal_completion") as mock_signal:
            action = runner._get_user_action()
            assert runner._stop_requested.is_set()
            mock_signal.assert_called_once()
            assert action == WaldiezDebugStepAction.QUIT


def test_get_user_action_handles_eof_error(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test get_user_action handles EOF error."""
    with patch(
        f"{BASE_RUNNER}.get_user_input",
        side_effect=EOFError,
    ):
        with patch.object(runner, "_signal_completion") as mock_signal:
            action = runner._get_user_action()
            assert runner._stop_requested.is_set()
            mock_signal.assert_called_once()
            assert action == WaldiezDebugStepAction.QUIT


@pytest.mark.asyncio
async def test_a_get_user_action_handles_keyboard_interrupt(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test get_user_action handles keyboard interrupt."""
    async_mock = AsyncMock(side_effect=KeyboardInterrupt)
    with patch(
        f"{BASE_RUNNER}.a_get_user_input",
        async_mock,
    ):
        action = await runner._a_get_user_action()
        assert action == WaldiezDebugStepAction.QUIT


@pytest.mark.asyncio
async def test_a_get_user_action_handles_eof_error(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test get_user_action handles EOF error."""
    async_mock = AsyncMock(side_effect=EOFError)
    with patch(
        f"{BASE_RUNNER}.a_get_user_input",
        async_mock,
    ):
        action = await runner._a_get_user_action()
        assert action == WaldiezDebugStepAction.QUIT


def test_on_event_raises_runtime_error_on_generic_exception(
    runner: WaldiezStepByStepRunner,
    text_event: TextEvent,
) -> None:
    """_on_event should raise RuntimeError when process_event raises generic exception."""
    runner._step_mode = False  # to skip break logic
    with patch(f"{BASE_RUNNER}.process_event", side_effect=ValueError("fail")):
        with pytest.raises(RuntimeError) as excinfo:
            runner._on_event(text_event)
        assert "fail" in str(excinfo.value)


def test_on_event_propagates_stop_running_exception(
    runner: WaldiezStepByStepRunner,
    text_event: TextEvent,
) -> None:
    """_on_event should propagate StopRunningException without wrapping."""
    runner._step_mode = False
    with patch(
        f"{BASE_RUNNER}.process_event", side_effect=StopRunningException("stop")
    ):
        with pytest.raises(StopRunningException):
            runner._on_event(text_event)


@pytest.mark.asyncio
async def test_async_on_event_raises_runtime_error_on_generic_exception(
    runner: WaldiezStepByStepRunner,
    text_event: TextEvent,
) -> None:
    """_a_on_event should raise RuntimeError when a_process_event raises generic exception."""
    runner._step_mode = False
    with patch(
        f"{BASE_RUNNER}.a_process_event", side_effect=ValueError("fail")
    ):
        with pytest.raises(RuntimeError) as excinfo:
            await runner._a_on_event(text_event)
        assert "fail" in str(excinfo.value)


@pytest.mark.asyncio
async def test_async_on_event_propagates_stop_running_exception(
    runner: WaldiezStepByStepRunner,
    text_event: TextEvent,
) -> None:
    """_a_on_event should propagate StopRunningException without wrapping."""
    runner._step_mode = False
    with patch(
        f"{BASE_RUNNER}.a_process_event",
        side_effect=StopRunningException("stop"),
    ):
        with pytest.raises(StopRunningException):
            await runner._a_on_event(text_event)


def test_run_handles_stop_running_exception(
    monkeypatch: pytest.MonkeyPatch,
    runner: WaldiezStepByStepRunner,
    tmp_path: Path,
) -> None:
    """_run should raise StopRunningException if caught during execution."""

    def raise_stop(*args: Any, **kwargs: Any) -> None:
        """Raise a StopRunningException."""
        raise StopRunningException(StopRunningException.reason)

    monkeypatch.setattr(
        runner,
        "_load_module",
        lambda *a, **k: MagicMock(main=raise_stop),  # pyright: ignore
    )
    with pytest.raises(StopRunningException):
        runner._run(tmp_path, tmp_path / "out.py", None, False, False)


def test_run_handles_generic_exception(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    runner: WaldiezStepByStepRunner,
    tmp_path: Path,
) -> None:
    """_run should catch generic exceptions and print error message."""

    def raise_exc(*args: Any, **kwargs: Any) -> None:
        """Raise a generic exception."""
        raise ValueError("generic error")

    monkeypatch.setattr(
        runner,
        "_load_module",
        lambda *a, **k: MagicMock(main=raise_exc),  # pyright: ignore
    )
    results = runner._run(tmp_path, tmp_path / "out.py", None, False, False)
    captured = capsys.readouterr()
    assert results == []
    assert (
        "<Waldiez> - Workflow execution failed: generic error" in captured.out
    )


@pytest.mark.asyncio
async def test_async_run_handles_stop_running_exception(
    monkeypatch: pytest.MonkeyPatch,
    runner: WaldiezStepByStepRunner,
    tmp_path: Path,
) -> None:
    """_a_run should raise StopRunningException if caught during execution."""

    async def raise_stop(*args: Any, **kwargs: Any) -> None:
        """Raise a StopRunningException."""
        raise StopRunningException(StopRunningException.reason)

    monkeypatch.setattr(
        runner,
        "_load_module",
        lambda *a, **k: MagicMock(main=raise_stop),  # pyright: ignore
    )
    with pytest.raises(StopRunningException):
        await runner._a_run(tmp_path, tmp_path / "out.py", None)


@pytest.mark.asyncio
async def test_async_run_handles_generic_exception(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    runner: WaldiezStepByStepRunner,
    tmp_path: Path,
) -> None:
    """_a_run should catch generic exceptions and print error message."""

    async def raise_exc(*args: Any, **kwargs: Any) -> None:
        """Raise a generic exception."""
        raise ValueError("generic async error")

    monkeypatch.setattr(
        runner,
        "_load_module",
        lambda *a, **k: MagicMock(main=raise_exc),  # pyright: ignore
    )
    results = await runner._a_run(
        tmp_path, tmp_path / "out.py", None
    )  # nosemgrep # nosec
    captured = capsys.readouterr()
    assert results == []
    assert (
        "<Waldiez> - Async workflow execution failed: generic async error"
        in captured.out
    )


def test_should_break_on_event_no_type_attribute(
    runner: WaldiezStepByStepRunner,
) -> None:
    """_should_break_on_event should handle event without 'type' attribute."""

    class DummyEvent:
        """A dummy event class for testing."""

    event = DummyEvent()
    runner._step_mode = True
    runner._break_on_events = []
    assert runner._should_break_on_event(event) is True
    runner._break_on_events = ["unknown"]
    assert runner._should_break_on_event(event) is True
    runner._break_on_events = ["something_else"]
    assert runner._should_break_on_event(event) is False


def test_get_user_response_invalid_json_not_allowed(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Invalid JSON with disallowed raw input triggers error emit."""
    invalid_json = '{"invalid": true'  # malformed JSON
    input_id = "some-id"
    with patch.object(runner, "emit") as mock_emit:
        response, valid = runner._get_user_response(invalid_json, input_id)
        assert response is None
        assert valid is False
        mock_emit.assert_called_once()
        assert "Invalid input" in mock_emit.call_args[0][0].error


def test_get_user_response_stale_input_id(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Valid JSON with stale input ID emits error."""
    valid_but_stale_json = '{"type": "debug_input_response", "input_id":"different-id","response":"c"}'
    input_id = "some-id"  # different from in JSON
    with patch.object(runner, "emit") as mock_emit:
        response, valid = runner._get_user_response(
            valid_but_stale_json, input_id
        )
        assert response is None
        assert valid is False
        mock_emit.assert_called_once()
        assert "Stale input received" in mock_emit.call_args[0][0].error


def test_get_user_response_valid_json_correct_input_id(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Valid JSON with matching input ID returns response and True."""
    valid_json = (
        '{"input_id":"some-id","response":"r","type":"debug_input_response"}'
    )
    input_id = "some-id"
    response, valid = runner._get_user_response(valid_json, input_id)
    assert response == "r"
    assert valid is True


def test_auto_continue_getter_setter(runner: WaldiezStepByStepRunner) -> None:
    """Test the auto_continue property getter and setter."""
    # Initial value should match constructor default (False)
    assert runner.auto_continue is False

    # Set new value
    runner.auto_continue = True
    assert runner._auto_continue is True
    assert runner.auto_continue is True

    # Set back
    runner.auto_continue = False
    assert runner._auto_continue is False
    assert runner.auto_continue is False


def test_stop_requested_property(runner: WaldiezStepByStepRunner) -> None:
    """Test stop_requested property returns threading.Event."""
    stop_event = runner.stop_requested

    assert isinstance(stop_event, threading.Event)
    # The event should be the same as internal _stop_requested
    assert stop_event is runner._stop_requested


def test_set_auto_continue_updates_flag_and_logs(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test set_auto_continue updates _auto_continue and logs the change."""
    with patch.object(runner.log, "info") as mock_log_info:
        runner.set_auto_continue(True)
        assert runner._auto_continue is True
        mock_log_info.assert_called_with("Auto-continue mode set to: %s", True)

        runner.set_auto_continue(False)
        assert runner._auto_continue is False
        mock_log_info.assert_called_with("Auto-continue mode set to: %s", False)


def test_show_stats_emits_correct_stats(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test that _show_stats emits the correct statistics message."""
    # Setup runner internal state
    runner._processed_events = 5
    runner._event_count = 10
    runner._step_mode = True
    runner._auto_continue = False
    runner._break_on_events = ["eventA", "eventB"]
    runner._event_history = [{"type": "eventA"}, {"type": "eventB"}]

    with patch.object(runner, "emit") as mock_emit:
        runner._show_stats()

        # Assert emit was called once
        mock_emit.assert_called_once()

        # Extract the emitted message
        emitted_msg = mock_emit.call_args[0][0]
        assert isinstance(emitted_msg, WaldiezDebugStats)
        stats = emitted_msg.stats

        # Check stats values
        assert stats["events_processed"] == 5
        assert stats["total_events"] == 10
        assert stats["step_mode"] is True
        assert stats["auto_continue"] is False
        assert stats["break_on_events"] == ["eventA", "eventB"]
        assert stats["event_history_count"] == 2


def test_show_stats_with_empty_break_on_events(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test _show_stats with empty _break_on_events emits empty list for break_on_events."""
    runner._processed_events = 3
    runner._event_count = 7
    runner._step_mode = False
    runner._auto_continue = True
    runner._break_on_events = []
    runner._event_history = [{}]

    with patch.object(runner, "emit") as mock_emit:
        runner._show_stats()

        emitted_msg = mock_emit.call_args[0][0]
        assert isinstance(emitted_msg, WaldiezDebugStats)
        stats = emitted_msg.stats

        assert stats["break_on_events"] == []


def test_on_event_returns_false_if_stop_requested(
    runner: WaldiezStepByStepRunner, text_event: TextEvent
) -> None:
    """Test that _on_event returns False immediately if stop is requested."""
    runner._stop_requested.set()
    result = runner._on_event(text_event)
    assert result is False


@pytest.mark.asyncio
async def test_async_on_event_returns_false_if_stop_requested(
    runner: WaldiezStepByStepRunner, text_event: TextEvent
) -> None:
    """Test that async _a_on_event returns False immediately if stop is requested."""
    runner._stop_requested.set()
    result = await runner._a_on_event(text_event)
    assert result is False


def test_on_event_signals_completion_on_run_completion(
    runner: WaldiezStepByStepRunner,
    run_completion_event: RunCompletionEvent,
) -> None:
    """Test that _on_event signals completion on run_completion."""
    runner._signal_completion = MagicMock()  # type: ignore[method-assign]
    runner.set_auto_continue(True)

    # Call _on_event with the event
    runner._on_event(run_completion_event)

    runner._signal_completion.assert_called_once()


@pytest.mark.asyncio
async def test_async_on_event_signals_completion_on_run_completion(
    runner: WaldiezStepByStepRunner,
    run_completion_event: RunCompletionEvent,
) -> None:
    """Test that async _a_on_event signals completion on run_completion."""
    runner._signal_completion = MagicMock()  # type: ignore[method-assign]
    runner.set_auto_continue(True)

    await runner._a_on_event(run_completion_event)

    runner._signal_completion.assert_called_once()


def test_parse_user_action_cases(runner: WaldiezStepByStepRunner) -> None:
    """Test _parse_user_action method."""
    # "s" returns STEP
    assert runner._parse_user_action("s", "id") == WaldiezDebugStepAction.STEP

    # "" (no message) means CONTINUE
    assert (
        runner._parse_user_action("", "id") == WaldiezDebugStepAction.CONTINUE
    )

    # "r" disables step mode and returns RUN
    runner._step_mode = True
    result = runner._parse_user_action("r", "id")
    assert result == WaldiezDebugStepAction.RUN
    assert runner._step_mode is False

    # "q" sets stop requested and calls _signal_completion, returns QUIT
    runner._stop_requested.clear()
    runner._signal_completion = MagicMock()  # type: ignore[method-assign]
    result = runner._parse_user_action("q", "id")
    assert result == WaldiezDebugStepAction.QUIT
    assert runner._stop_requested.is_set()
    runner._signal_completion.assert_called_once()

    # "i" returns INFO
    assert runner._parse_user_action("i", "id") == WaldiezDebugStepAction.INFO

    # "h" emits HELP_MESSAGE and returns HELP
    runner.emit = MagicMock()  # type: ignore[method-assign]
    result = runner._parse_user_action("h", "id")
    runner.emit.assert_called_once_with(HELP_MESSAGE)
    assert result == WaldiezDebugStepAction.HELP

    # "st" calls _show_stats and returns STATS
    runner._show_stats = MagicMock()  # type: ignore[method-assign]
    result = runner._parse_user_action("st", "id")
    runner._show_stats.assert_called_once()
    assert result == WaldiezDebugStepAction.STATS

    # unknown command emits error and returns UNKNOWN
    runner.emit.reset_mock()
    result = runner._parse_user_action("foobar", "id")
    assert result == WaldiezDebugStepAction.UNKNOWN
    assert runner.emit.call_count == 1
    assert "Invalid input" in runner.emit.call_args[0][0].error

    # structured unknown command emits error and returns UNKNOWN
    runner.emit.reset_mock()
    result = runner._parse_user_action(
        '{"type": "debug_input_response", "input_id": "id", "response": "foobar"}',
        "id",
    )
    assert result == WaldiezDebugStepAction.UNKNOWN
    assert runner.emit.call_count == 1


def test_should_break_on_event_input_request(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test _should_break_on_event method."""
    event = MagicMock()
    event.type = "input_request"
    result = runner._should_break_on_event(event)
    assert result is False


def test_handle_step_interaction_run_action(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test _handle_step_interaction method."""
    with patch.object(
        runner, "_get_user_action", return_value=WaldiezDebugStepAction.RUN
    ):
        result = runner._handle_step_interaction()
        assert result is True


@pytest.mark.asyncio
async def test_async_handle_step_interaction_run_action(
    runner: WaldiezStepByStepRunner,
) -> None:
    """Test _a_handle_step_interaction method."""
    with patch.object(
        runner,
        "_a_get_user_action",
        AsyncMock(return_value=WaldiezDebugStepAction.RUN),
    ):
        result = await runner._a_handle_step_interaction()
        assert result is True
