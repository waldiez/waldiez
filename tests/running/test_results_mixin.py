# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc
# pyright: reportPrivateUsage=false

"""Test waldiez.running.run_results.*."""

import json
import sqlite3
from pathlib import Path
from typing import Any

import pytest

from waldiez.running.results_mixin import (
    ResultsMixin,
    _calculate_total_cost,
    _copy_results,
    _ensure_error_json,
    _extract_last_context_variables,
    _extract_last_speaker,
    _extract_messages_from_events,
    _extract_summary_from_events,
    _fill_results_from_logs,
    _get_results_from_json,
    _get_sqlite_out,
    _make_mermaid_diagram,
    _make_timeline_json,
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

    completions = [{"cost": 0.001}]
    completions_file = logs_dir / "chat_completions.json"
    with open(completions_file, "w", encoding="utf-8") as f:
        json.dump(completions, f)

    filled = _fill_results_from_logs(tmp_path)
    result = filled["results"][0]
    assert len(result["messages"]) == 1
    assert result["messages"][0]["content"] == "Hello"
    assert result["summary"] == "Hello"
    assert result["cost"] == 0.001


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
    _store_full_results(tmp_path)
    with open(results_file, "r", encoding="utf-8") as f:
        stored = json.load(f)
    result = stored["results"][0]
    assert len(result["messages"]) == 1
    assert result["summary"] == "Test"
    assert result["cost"] == 0.5


def test_ensure_error_json(tmp_path: Path) -> None:
    """Test _ensure_error_json function."""
    output_dir = tmp_path
    error = ValueError("Test error message")
    _ensure_error_json(output_dir, error)
    error_file = output_dir / "error.json"
    assert error_file.exists()
    with open(error_file, "r", encoding="utf-8") as f:
        error_data = json.load(f)
    assert error_data["error"] == "Test error message"


def test_ensure_error_json_not_overwrite(tmp_path: Path) -> None:
    """Test _ensure_error_json doesn't overwrite existing file."""
    output_dir = tmp_path
    error_file = output_dir / "error.json"
    with open(error_file, "w", encoding="utf-8") as f:
        json.dump({"error": "Original error"}, f)
    error = ValueError("New error")
    _ensure_error_json(output_dir, error)
    with open(error_file, "r", encoding="utf-8") as f:
        error_data = json.load(f)
    assert error_data["error"] == "Original error"


def test_get_sqlite_out(tmp_path: Path) -> None:
    """Test get_sqlite_out function."""
    db_path = tmp_path / "test.db"
    csv_path = tmp_path / "output.csv"
    # Create a test database and table
    conn = sqlite3.connect(db_path)
    conn.execute("CREATE TABLE test_table (id INTEGER, name TEXT)")
    conn.execute("INSERT INTO test_table VALUES (1, 'Alice')")
    conn.execute("INSERT INTO test_table VALUES (2, 'Bob')")
    conn.commit()
    conn.close()
    _get_sqlite_out(str(db_path), "test_table", str(csv_path))
    assert csv_path.exists()
    with open(csv_path, "r", encoding="utf-8") as f:
        content = f.read()
        assert "id,name" in content
        assert "1,Alice" in content
        assert "2,Bob" in content
    json_path = tmp_path / "output.json"
    assert json_path.exists()
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        assert len(data) == 2
        assert data[0]["id"] == 1
        assert data[0]["name"] == "Alice"


def test_get_sqlite_out_with_invalid_table(tmp_path: Path) -> None:
    """Test get_sqlite_out with invalid table name."""
    db_path = tmp_path / "test.db"
    csv_path = tmp_path / "output.csv"
    conn = sqlite3.connect(db_path)
    conn.close()
    _get_sqlite_out(str(db_path), "nonexistent_table", str(csv_path))
    assert not csv_path.exists()


def test_ensure_db_outputs(tmp_path: Path) -> None:
    """Test _ensure_db_outputs function."""
    output_dir = tmp_path
    db_path = output_dir / "flow.db"
    conn = sqlite3.connect(db_path)
    tables = [
        "chat_completions",
        "agents",
        "oai_wrappers",
        "oai_clients",
        "version",
        "events",
        "function_calls",
    ]
    for table in tables:
        conn.execute(
            f"CREATE TABLE {table} (id INTEGER, data TEXT)"  # nosemgrep # nosec
        )
        conn.execute(
            f"INSERT INTO {table} VALUES (1, 'test')"  # nosemgrep # nosec
        )
    conn.commit()
    conn.close()
    ResultsMixin.ensure_db_outputs(output_dir)
    logs_dir = output_dir / "logs"
    assert logs_dir.exists()

    for table in tables:
        csv_file = logs_dir / f"{table}.csv"
        json_file = logs_dir / f"{table}.json"
        assert csv_file.exists()
        assert json_file.exists()


def test_ensure_db_outputs_no_database(tmp_path: Path) -> None:
    """Test _ensure_db_outputs when no database exists."""
    output_dir = tmp_path
    ResultsMixin.ensure_db_outputs(output_dir)
    logs_dir = output_dir / "logs"
    assert not logs_dir.exists()


def test_ensure_db_outputs_existing_files(tmp_path: Path) -> None:
    """Test _ensure_db_outputs with existing CSV/JSON files."""
    output_dir = tmp_path
    db_path = output_dir / "flow.db"
    logs_dir = output_dir / "logs"
    logs_dir.mkdir()
    conn = sqlite3.connect(db_path)
    conn.execute("CREATE TABLE agents (id INTEGER)")
    conn.execute("INSERT INTO agents VALUES (1)")
    conn.commit()
    conn.close()
    (logs_dir / "agents.csv").write_text("existing csv")
    (logs_dir / "agents.json").write_text("existing json")
    ResultsMixin.ensure_db_outputs(output_dir)
    assert (logs_dir / "agents.csv").read_text() == "existing csv"
    assert (logs_dir / "agents.json").read_text() == "existing json"


def test_post_run_with_output_file(tmp_path: Path) -> None:
    """Test post_run with output file specified."""
    flow_name = "test_flow"
    tmp_dir = tmp_path / "temp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    output_file = tmp_path / "output" / "flow.py"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.touch()
    waldiez_file = tmp_path / "flow.waldiez"
    waldiez_file.touch()
    result = ResultsMixin.post_run(
        results=[{"index": 0, "messages": []}],
        error=None,
        temp_dir=tmp_dir,
        output_file=output_file,
        flow_name=flow_name,
        waldiez_file=waldiez_file,
        uploads_root=None,
        skip_mmd=True,
        skip_timeline=True,
    )
    assert result is not None
    assert result.exists()
    assert result.name.startswith("2025")  # timestamp directory


def test_post_run_without_output_file(tmp_path: Path) -> None:
    """Test post_run without output file."""
    flow_name = "test_flow"
    tmp_dir = tmp_path / "temp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    waldiez_file = tmp_path / "flow.waldiez"
    waldiez_file.touch()
    result = ResultsMixin.post_run(
        results=[{"index": 0, "messages": []}],
        error=None,
        temp_dir=tmp_dir,
        output_file=None,
        flow_name=flow_name,
        waldiez_file=waldiez_file,
        skip_mmd=True,
        skip_timeline=True,
    )
    assert result is None
    assert not tmp_dir.exists()  # temp dir should be removed


def test_post_run_with_error(tmp_path: Path) -> None:
    """Test post_run with an error."""
    flow_name = "test_flow"
    tmp_dir = tmp_path / "temp"
    output_file = tmp_path / "output" / "output.py"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    waldiez_file = tmp_path / "flow.waldiez"
    waldiez_file.touch()
    error = RuntimeError("Test error")
    output_dir = ResultsMixin.post_run(
        results=[],
        error=error,
        temp_dir=tmp_dir,
        output_file=output_file,
        flow_name=flow_name,
        waldiez_file=waldiez_file,
        skip_mmd=True,
        skip_timeline=True,
    )
    assert output_dir
    error_file = output_dir / "error.json"
    assert error_file.exists()
    with open(error_file, "r", encoding="utf-8") as f:
        error_data = json.load(f)
    assert error_data["error"] == "Test error"


@pytest.mark.asyncio
async def test_a_post_run(tmp_path: Path) -> None:
    """Test async post_run."""
    flow_name = "test_flow"
    tmp_dir = tmp_path / "temp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    waldiez_file = tmp_path / "flow.waldiez"
    waldiez_file.touch()
    result = await ResultsMixin.a_post_run(
        results=[{"index": 0, "messages": []}],
        error=None,
        temp_dir=tmp_dir,
        output_file=None,
        flow_name=flow_name,
        waldiez_file=waldiez_file,
        skip_mmd=True,
        skip_timeline=True,
    )
    assert result is None


def test_copy_results(tmp_path: Path) -> None:
    """Test copy_results function."""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    test_file = temp_dir / "test.txt"
    test_file.write_text("test content")
    test_dir = temp_dir / "subdir"
    test_dir.mkdir()
    (test_dir / "nested.txt").write_text("nested content")
    # should be skipped
    pycache_dir = temp_dir / "__pycache__"
    pycache_dir.mkdir()
    (pycache_dir / "test.pyc").touch()
    (temp_dir / ".cache").touch()
    (temp_dir / ".env").touch()
    (temp_dir / "test.pyc").touch()
    output_file = tmp_path / "output.py"
    output_file.touch()
    destination_dir = tmp_path / "destination"
    destination_dir.mkdir(parents=True, exist_ok=True)
    _copy_results(temp_dir, output_file, destination_dir)
    assert (destination_dir / "test.txt").exists()
    assert (destination_dir / "subdir" / "nested.txt").exists()
    assert not (destination_dir / "__pycache__").exists()
    assert not (destination_dir / ".cache").exists()
    assert not (destination_dir / ".env").exists()
    assert not (destination_dir / "test.pyc").exists()


def test_copy_results_with_special_files(tmp_path: Path) -> None:
    """Test copy_results with tree of thoughts and reasoning tree files."""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    # Create special files
    tot_file = temp_dir / "tree_of_thoughts.png"
    tot_file.write_bytes(b"fake image data")
    reasoning_file = temp_dir / "reasoning_tree.json"
    reasoning_file.write_text('{"tree": "data"}')
    output_file = tmp_path / "output" / "output.py"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.touch()
    destination_dir = tmp_path / "destination"
    destination_dir.mkdir(parents=True, exist_ok=True)
    _copy_results(temp_dir, output_file, destination_dir)
    assert (output_file.parent / "tree_of_thoughts.png").exists()
    assert (output_file.parent / "reasoning_tree.json").exists()
    assert (destination_dir / "tree_of_thoughts.png").exists()
    assert (destination_dir / "reasoning_tree.json").exists()


def test_copy_results_with_waldiez_file(tmp_path: Path) -> None:
    """Test copy_results with .waldiez output file."""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    py_file = temp_dir / "flow.py"
    py_file.write_text("print('hello')")
    output_file = tmp_path / "output" / "flow.waldiez"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.touch()
    destination_dir = tmp_path / "destination"
    destination_dir.mkdir(parents=True, exist_ok=True)
    _copy_results(temp_dir, output_file, destination_dir)
    expected = output_file.parent / "flow.py"
    assert expected.exists()


def test_make_mermaid_diagram(tmp_path: Path) -> None:
    """Test _make_mermaid_diagram function."""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir()
    logs_dir = temp_dir / "logs"
    logs_dir.mkdir()
    events_csv = logs_dir / "events.csv"
    with open(events_csv, "w", encoding="utf-8", newline="\n") as f:
        f.write(
            "event_name,source_id,source_name,agent_module,"
            "agent_class_name,id,json_state,timestamp\n"
            "start,1,agent1,module,class,1,{},2025-01-01 00:00:00\n"
        )
    output_file = tmp_path / "output.py"
    flow_name = "test_flow"
    mmd_dir = tmp_path
    _make_mermaid_diagram(temp_dir, output_file, flow_name, mmd_dir)
    mmd_file = temp_dir / f"{flow_name}.mmd"
    assert mmd_file.exists()


def test_make_mermaid_diagram_no_events(tmp_path: Path) -> None:
    """Test _make_mermaid_diagram when events.csv doesn't exist."""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir()
    output_file = tmp_path / "output.py"
    flow_name = "test_flow"
    mmd_dir = tmp_path
    _make_mermaid_diagram(temp_dir, output_file, flow_name, mmd_dir)
    mmd_file = temp_dir / f"{flow_name}.mmd"
    assert not mmd_file.exists()


def test_make_timeline_json_no_events(tmp_path: Path) -> None:
    """Test _make_timeline_json when events.csv doesn't exist."""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir()
    _make_timeline_json(temp_dir)
    timeline_file = temp_dir / "timeline.json"
    assert not timeline_file.exists()


def test_post_run_string_output_file(tmp_path: Path) -> None:
    """Test after_run with string output file path."""
    flow_name = "test_flow"
    tmp_dir = tmp_path / "temp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    output_file = str(tmp_path / "output" / "flow.py")
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    Path(output_file).touch()
    waldiez_file = tmp_path / "flow.waldiez"
    waldiez_file.touch()
    result = ResultsMixin.post_run(
        results=[{"index": 0, "messages": []}],
        error=None,
        temp_dir=tmp_dir,
        output_file=output_file,  # Pass as string
        flow_name=flow_name,
        waldiez_file=waldiez_file,
        skip_mmd=True,
        skip_timeline=True,
    )
    assert result is not None
    assert result.exists()
