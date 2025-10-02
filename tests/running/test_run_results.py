# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc
# pyright: reportPrivateUsage=false

"""Test waldiez.running.run_results.*."""

import json
from pathlib import Path
from typing import Any

import pytest

from waldiez.running.run_results import (
    ResultsMixin,
    _calculate_total_cost,
    _extract_last_context_variables,
    _extract_last_speaker,
    _extract_messages_from_events,
    _extract_summary_from_events,
    _fill_results_from_logs,
    _get_results_from_json,
    _remove_results_json,
    _results_are_empty,
    _store_full_results,
)


# Test _results_are_empty
def test_results_are_empty_with_empty_list() -> None:
    """Test that empty list is detected as empty."""
    assert _results_are_empty([])


def test_results_are_empty_with_empty_dict() -> None:
    """Test that dict without events/messages is empty."""
    assert _results_are_empty({"index": 0})


def test_results_are_empty_with_events() -> None:
    """Test that dict with events is not empty."""
    assert not _results_are_empty(
        {"events": [{"type": "text", "content": {"content": "test"}}]}
    )


def test_results_are_empty_with_messages() -> None:
    """Test that dict with messages is not empty."""
    assert not _results_are_empty(
        {"messages": [{"content": "test", "role": "user", "name": "user"}]}
    )


# Test _extract_messages_from_events
def test_extract_messages_from_text_events() -> None:
    """Test extracting messages from text type events."""
    events: list[dict[str, Any]] = [
        {
            "type": "text",
            "content": {
                "content": "Hello",
                "sender": "user",
                "recipient": "assistant",
            },
        },
        {
            "type": "text",
            "content": {
                "content": "Hi there",
                "sender": "assistant",
                "recipient": "user",
            },
        },
    ]

    messages = _extract_messages_from_events(events)

    assert len(messages) == 2
    assert messages[0]["content"] == "Hello"
    assert messages[0]["role"] == "user"
    assert messages[0]["name"] == "user"
    assert messages[1]["content"] == "Hi there"
    assert messages[1]["role"] == "assistant"
    assert messages[1]["name"] == "assistant"


def test_extract_messages_filters_handoffs() -> None:
    """Test that handoff messages are filtered out."""
    events: list[dict[str, Any]] = [
        {
            "type": "text",
            "content": {
                "content": "[Handing off to agent]",
                "sender": "manager",
            },
        },
        {
            "type": "text",
            "content": {"content": "Actual message", "sender": "user"},
        },
    ]

    messages = _extract_messages_from_events(events)

    assert len(messages) == 1
    assert messages[0]["content"] == "Actual message"


def test_extract_messages_filters_none_content() -> None:
    """Test that None content is filtered out."""
    events: list[dict[str, Any]] = [
        {"type": "text", "content": {"content": "None", "sender": "user"}},
        {"type": "text", "content": {"content": "", "sender": "user"}},
        {
            "type": "text",
            "content": {"content": "Valid message", "sender": "user"},
        },
    ]

    messages = _extract_messages_from_events(events)

    assert len(messages) == 1
    assert messages[0]["content"] == "Valid message"


def test_extract_messages_avoids_duplicates() -> None:
    """Test that duplicate messages are avoided."""
    events: list[dict[str, Any]] = [
        {
            "type": "text",
            "content": {"content": "Same message", "sender": "user"},
        },
        {
            "type": "text",
            "content": {"content": "Same message", "sender": "user"},
        },
    ]

    messages = _extract_messages_from_events(events)

    assert len(messages) == 1


# Test _extract_summary_from_events
def test_extract_summary_from_run_completion() -> None:
    """Test extracting summary from run_completion event."""
    events: list[dict[str, Any]] = [
        {
            "type": "run_completion",
            "content": {"summary": "This is the summary"},
        }
    ]

    summary = _extract_summary_from_events(events)

    assert summary == "This is the summary"


def test_extract_summary_from_history() -> None:
    """Test extracting summary from history in run_completion."""
    events: list[dict[str, Any]] = [
        {
            "type": "run_completion",
            "content": {"history": [{"content": "Last message in history"}]},
        }
    ]

    summary = _extract_summary_from_events(events)

    assert summary == "Last message in history"


def test_extract_summary_fallback_to_text() -> None:
    """Test fallback to last text message for summary."""
    events: list[dict[str, Any]] = [
        {"type": "text", "content": {"content": "Regular message"}},
        {"type": "text", "content": {"content": "Last message"}},
    ]

    summary = _extract_summary_from_events(events)

    assert summary == "Last message"


def test_extract_summary_skips_handoffs() -> None:
    """Test that summary extraction skips handoff messages."""
    events: list[dict[str, Any]] = [
        {"type": "text", "content": {"content": "Valid summary"}},
        {"type": "text", "content": {"content": "[Handing off to agent]"}},
    ]

    summary = _extract_summary_from_events(events)

    assert summary == "Valid summary"


# Test _calculate_total_cost
def test_calculate_total_cost() -> None:
    """Test calculating total cost from completions."""
    completions = [{"cost": 0.001}, {"cost": 0.002}, {"cost": 0.003}]

    cost = _calculate_total_cost(completions)

    assert cost == 0.006


def test_calculate_total_cost_with_none_values() -> None:
    """Test cost calculation handles None values."""
    completions: list[dict[str, Any]] = [
        {"cost": 0.001},
        {"cost": None},
        {"cost": 0.002},
    ]

    cost = _calculate_total_cost(completions)

    assert cost == 0.003


def test_calculate_total_cost_returns_none_for_zero() -> None:
    """Test that zero cost returns None."""
    completions: list[dict[str, Any]] = [{"cost": 0.0}, {"cost": None}]

    cost = _calculate_total_cost(completions)

    assert cost is None


# Test _extract_last_context_variables
def test_extract_context_from_executed_function() -> None:
    """Test extracting context variables from executed_function."""
    events: list[dict[str, Any]] = [
        {
            "type": "executed_function",
            "content": {
                "content": {"context_variables": {"data": {"key": "value"}}}
            },
        }
    ]

    context = _extract_last_context_variables(events)

    assert context == {"key": "value"}


def test_extract_context_from_run_completion() -> None:
    """Test extracting context from run_completion event."""
    events: list[dict[str, Any]] = [
        {
            "type": "run_completion",
            "content": {"context_variables": {"key": "value"}},
        }
    ]

    context = _extract_last_context_variables(events)

    assert context == {"key": "value"}


def test_extract_last_context_variables_returns_last() -> None:
    """Test that the last context variables are returned."""
    events: list[dict[str, Any]] = [
        {
            "type": "executed_function",
            "content": {
                "content": {"context_variables": {"data": {"first": 1}}}
            },
        },
        {
            "type": "executed_function",
            "content": {
                "content": {"context_variables": {"data": {"last": 2}}}
            },
        },
    ]

    context = _extract_last_context_variables(events)

    assert context == {"last": 2}


# Test _extract_last_speaker
def test_extract_last_speaker_from_run_completion() -> None:
    """Test extracting last speaker from run_completion."""
    events: list[dict[str, Any]] = [
        {
            "type": "run_completion",
            "content": {"last_speaker": "agent_name"},
        }
    ]

    speaker = _extract_last_speaker(events)

    assert speaker == "agent_name"


def test_extract_last_speaker_from_history() -> None:
    """Test extracting last speaker from history."""
    events: list[dict[str, Any]] = [
        {
            "type": "run_completion",
            "content": {"history": [{"name": "agent_from_history"}]},
        }
    ]

    speaker = _extract_last_speaker(events)

    assert speaker == "agent_from_history"


def test_extract_last_speaker_fallback_to_text() -> None:
    """Test fallback to last text event sender."""
    events: list[dict[str, Any]] = [
        {"type": "text", "content": {"sender": "first_agent"}},
        {"type": "text", "content": {"sender": "last_agent"}},
    ]

    speaker = _extract_last_speaker(events)

    assert speaker == "last_agent"


def test_extract_last_speaker_skips_manager() -> None:
    """Test that manager sender is skipped."""
    events: list[dict[str, Any]] = [
        {"type": "text", "content": {"sender": "real_agent"}},
        {"type": "text", "content": {"sender": "manager"}},
    ]

    speaker = _extract_last_speaker(events)

    assert speaker == "real_agent"


# Test file operations
def test_get_results_from_json_with_valid_file(tmp_path: Path) -> None:
    """Test reading results from valid results.json."""
    results_file = tmp_path / "results.json"
    results_data: dict[str, Any] = {
        "results": [
            {
                "index": 0,
                "messages": [{"content": "test", "role": "user"}],
            }
        ]
    }

    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results_data, f)

    results = _get_results_from_json(tmp_path)

    assert len(results) == 1
    assert results[0]["index"] == 0


def test_get_results_from_json_with_empty_results(tmp_path: Path) -> None:
    """Test reading empty results returns empty list."""
    results_file = tmp_path / "results.json"
    results_data: dict[str, Any] = {"results": []}

    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results_data, f)

    results = _get_results_from_json(tmp_path)

    assert not results


def test_get_results_from_json_nonexistent_file(tmp_path: Path) -> None:
    """Test reading from nonexistent file returns empty list."""
    results = _get_results_from_json(tmp_path)

    assert not results


def test_remove_results_json(tmp_path: Path) -> None:
    """Test removing results.json file."""
    results_file = tmp_path / "results.json"
    results_file.write_text("{}")

    _remove_results_json(tmp_path)

    assert not results_file.exists()


def test_remove_results_json_nonexistent(tmp_path: Path) -> None:
    """Test removing nonexistent file doesn't raise error."""
    _remove_results_json(tmp_path)  # Should not raise


# Test _fill_results_from_logs
def test_fill_results_from_logs(tmp_path: Path) -> None:
    """Test filling results from log files."""
    # Setup directory structure
    logs_dir = tmp_path / "logs"
    logs_dir.mkdir()

    # Create results.json with empty fields
    results_data: dict[str, Any] = {
        "results": [
            {
                "index": 0,
                "uuid": "test-uuid",
                "events": [
                    {
                        "type": "text",
                        "content": {"content": "Hello", "sender": "user"},
                    }
                ],
                "messages": [],
                "summary": None,
                "cost": None,
                "context_variables": None,
                "last_speaker": None,
            }
        ]
    }

    results_file = tmp_path / "results.json"
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results_data, f)

    # Create chat_completions.json
    completions = [{"cost": 0.001}]
    completions_file = logs_dir / "chat_completions.json"
    with open(completions_file, "w", encoding="utf-8") as f:
        json.dump(completions, f)

    # Fill results
    filled = _fill_results_from_logs(tmp_path)

    result = filled["results"][0]
    assert len(result["messages"]) == 1
    assert result["messages"][0]["content"] == "Hello"
    assert result["summary"] == "Hello"
    assert result["cost"] == 0.001


# Test ResultsMixin methods
def test_ensure_results_json_creates_file(tmp_path: Path) -> None:
    """Test ensure_results_json creates file if not exists."""
    results: list[dict[str, Any]] = [{"index": 0, "messages": []}]

    ResultsMixin.ensure_results_json(tmp_path, results)

    results_file = tmp_path / "results.json"
    assert results_file.exists()


def test_get_results_returns_from_file(tmp_path: Path) -> None:
    """Test get_results returns from file if exists."""
    results_file = tmp_path / "results.json"
    file_results: dict[str, Any] = {
        "results": [{"index": 0, "messages": [{"content": "from file"}]}]
    }

    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(file_results, f)

    results = ResultsMixin.get_results([], tmp_path)

    assert len(results) == 1
    assert results[0]["messages"][0]["content"] == "from file"


def test_get_results_returns_passed_results(tmp_path: Path) -> None:
    """Test get_results returns passed results if no file."""
    passed_results: list[dict[str, Any]] = [{"index": 0, "messages": []}]

    results = ResultsMixin.get_results(passed_results, tmp_path)

    assert results == passed_results


@pytest.mark.asyncio
async def test_a_get_results_returns_from_file(tmp_path: Path) -> None:
    """Test async get_results returns from file if exists."""
    results_file = tmp_path / "results.json"
    file_results: dict[str, Any] = {
        "results": [{"index": 0, "messages": [{"content": "from file"}]}]
    }

    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(file_results, f)

    results = await ResultsMixin.a_get_results([], tmp_path)

    assert len(results) == 1
    assert results[0]["messages"][0]["content"] == "from file"


def test_read_from_output_with_results(tmp_path: Path) -> None:
    """Test reading from output with results.json."""
    results_file = tmp_path / "results.json"
    results_data = {"results": [{"index": 0}]}

    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results_data, f)

    results = ResultsMixin.read_from_output(tmp_path)

    assert len(results) == 1
    assert results[0]["index"] == 0


def test_read_from_output_with_error(tmp_path: Path) -> None:
    """Test reading from output with error.json."""
    error_file = tmp_path / "error.json"
    error_data = {"error": "Something went wrong"}

    with open(error_file, "w", encoding="utf-8") as f:
        json.dump(error_data, f)

    results = ResultsMixin.read_from_output(tmp_path)

    assert len(results) == 1
    assert results[0]["error"] == "Something went wrong"


def test_read_from_output_no_files(tmp_path: Path) -> None:
    """Test reading from output with no files."""
    results = ResultsMixin.read_from_output(tmp_path)

    assert len(results) == 1
    assert "error" in results[0]


@pytest.mark.asyncio
async def test_a_read_from_output_with_results(tmp_path: Path) -> None:
    """Test async reading from output with results.json."""
    results_file = tmp_path / "results.json"
    results_data = {"results": [{"index": 0}]}

    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results_data, f)

    results = await ResultsMixin.a_read_from_output(tmp_path)

    assert len(results) == 1
    assert results[0]["index"] == 0


@pytest.mark.asyncio
async def test_a_read_from_output_with_error(tmp_path: Path) -> None:
    """Test async reading from output with error.json."""
    error_file = tmp_path / "error.json"
    error_data = {"error": "Something went wrong"}

    with open(error_file, "w", encoding="utf-8") as f:
        json.dump(error_data, f)

    results = await ResultsMixin.a_read_from_output(tmp_path)

    assert len(results) == 1
    assert results[0]["error"] == "Something went wrong"


# Test _store_full_results
def test_store_full_results(tmp_path: Path) -> None:
    """Test storing full results with filled data."""
    # Setup
    logs_dir = tmp_path / "logs"
    logs_dir.mkdir()

    results_data: dict[str, Any] = {
        "results": [
            {
                "index": 0,
                "events": [
                    {
                        "type": "text",
                        "content": {"content": "Test", "sender": "user"},
                    }
                ],
                "messages": [],
                "summary": None,
                "cost": None,
                "context_variables": None,
                "last_speaker": None,
            }
        ]
    }

    results_file = tmp_path / "results.json"
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results_data, f)

    completions_file = logs_dir / "chat_completions.json"
    with open(completions_file, "w", encoding="utf-8") as f:
        json.dump([{"cost": 0.5}], f)

    # Execute
    _store_full_results(tmp_path)

    # Verify
    with open(results_file, "r", encoding="utf-8") as f:
        stored = json.load(f)

    result = stored["results"][0]
    assert len(result["messages"]) == 1
    assert result["summary"] == "Test"
    assert result["cost"] == 0.5
