# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc
# pyright: reportPrivateUsage=false

"""Test waldiez.running.post_run.*."""

import json
import sqlite3
from pathlib import Path

import pytest

from waldiez.running.post_run import (
    _ensure_db_outputs,
    _ensure_error_json,
    _make_mermaid_diagram,
    _make_timeline_json,
    a_after_run,
    after_run,
    copy_results,
    get_sqlite_out,
)


def test_after_run_with_output_file(tmp_path: Path) -> None:
    """Test after_run with output file specified."""
    flow_name = "test_flow"
    tmp_dir = tmp_path / "temp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    output_file = tmp_path / "output" / "flow.py"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.touch()
    waldiez_file = tmp_path / "flow.waldiez"
    waldiez_file.touch()

    result = after_run(
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


def test_after_run_without_output_file(tmp_path: Path) -> None:
    """Test after_run without output file."""
    flow_name = "test_flow"
    tmp_dir = tmp_path / "temp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    waldiez_file = tmp_path / "flow.waldiez"
    waldiez_file.touch()

    result = after_run(
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


def test_after_run_with_error(tmp_path: Path) -> None:
    """Test after_run with an error."""
    flow_name = "test_flow"
    tmp_dir = tmp_path / "temp"
    output_file = tmp_path / "output" / "output.py"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    waldiez_file = tmp_path / "flow.waldiez"
    waldiez_file.touch()
    error = RuntimeError("Test error")

    output_dir = after_run(
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
async def test_a_after_run(tmp_path: Path) -> None:
    """Test async after_run."""
    flow_name = "test_flow"
    tmp_dir = tmp_path / "temp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    waldiez_file = tmp_path / "flow.waldiez"
    waldiez_file.touch()

    result = await a_after_run(
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

    # Create some test files and directories
    test_file = temp_dir / "test.txt"
    test_file.write_text("test content")

    test_dir = temp_dir / "subdir"
    test_dir.mkdir()
    (test_dir / "nested.txt").write_text("nested content")

    # Create files that should be skipped
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

    copy_results(temp_dir, output_file, destination_dir)

    # Check that valid files were copied
    assert (destination_dir / "test.txt").exists()
    assert (destination_dir / "subdir" / "nested.txt").exists()

    # Check that invalid files were not copied
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

    copy_results(temp_dir, output_file, destination_dir)

    # Check that special files were copied to output directory
    assert (output_file.parent / "tree_of_thoughts.png").exists()
    assert (output_file.parent / "reasoning_tree.json").exists()

    # And also to destination
    assert (destination_dir / "tree_of_thoughts.png").exists()
    assert (destination_dir / "reasoning_tree.json").exists()


def test_copy_results_with_waldiez_file(tmp_path: Path) -> None:
    """Test copy_results with .waldiez output file."""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)

    # Create a Python file in temp dir
    py_file = temp_dir / "flow.py"
    py_file.write_text("print('hello')")

    output_file = tmp_path / "output" / "flow.waldiez"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.touch()

    destination_dir = tmp_path / "destination"
    destination_dir.mkdir(parents=True, exist_ok=True)

    copy_results(temp_dir, output_file, destination_dir)

    # Should copy to output directory with .py extension
    expected = output_file.parent / "flow.py"
    assert expected.exists()


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

    get_sqlite_out(str(db_path), "test_table", str(csv_path))

    # Check CSV was created
    assert csv_path.exists()
    with open(csv_path, "r", encoding="utf-8") as f:
        content = f.read()
        assert "id,name" in content
        assert "1,Alice" in content
        assert "2,Bob" in content

    # Check JSON was created
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

    # Create an empty database
    conn = sqlite3.connect(db_path)
    conn.close()

    # Should not raise an error
    get_sqlite_out(str(db_path), "nonexistent_table", str(csv_path))

    # CSV should not be created
    assert not csv_path.exists()


def test_ensure_db_outputs(tmp_path: Path) -> None:
    """Test _ensure_db_outputs function."""
    output_dir = tmp_path
    db_path = output_dir / "flow.db"

    # Create database with test tables
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

    _ensure_db_outputs(output_dir)

    # Check that CSV and JSON files were created
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

    # Should not raise an error
    _ensure_db_outputs(output_dir)

    # Logs directory should not be created
    logs_dir = output_dir / "logs"
    assert not logs_dir.exists()


def test_ensure_db_outputs_existing_files(tmp_path: Path) -> None:
    """Test _ensure_db_outputs with existing CSV/JSON files."""
    output_dir = tmp_path
    db_path = output_dir / "flow.db"
    logs_dir = output_dir / "logs"
    logs_dir.mkdir()

    # Create database
    conn = sqlite3.connect(db_path)
    conn.execute("CREATE TABLE agents (id INTEGER)")
    conn.execute("INSERT INTO agents VALUES (1)")
    conn.commit()
    conn.close()

    # Create existing files
    (logs_dir / "agents.csv").write_text("existing csv")
    (logs_dir / "agents.json").write_text("existing json")

    _ensure_db_outputs(output_dir)

    # Files should still be there (not regenerated)
    assert (logs_dir / "agents.csv").read_text() == "existing csv"
    assert (logs_dir / "agents.json").read_text() == "existing json"


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

    # Create existing error file
    with open(error_file, "w", encoding="utf-8") as f:
        json.dump({"error": "Original error"}, f)

    error = ValueError("New error")
    _ensure_error_json(output_dir, error)

    # Should not overwrite
    with open(error_file, "r", encoding="utf-8") as f:
        error_data = json.load(f)

    assert error_data["error"] == "Original error"


def test_make_mermaid_diagram(tmp_path: Path) -> None:
    """Test _make_mermaid_diagram function."""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir()
    logs_dir = temp_dir / "logs"
    logs_dir.mkdir()

    # Create events.csv
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

    # Check mermaid file was created
    mmd_file = temp_dir / f"{flow_name}.mmd"
    assert mmd_file.exists()


def test_make_mermaid_diagram_no_events(tmp_path: Path) -> None:
    """Test _make_mermaid_diagram when events.csv doesn't exist."""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir()

    output_file = tmp_path / "output.py"
    flow_name = "test_flow"
    mmd_dir = tmp_path

    # Should not raise an error
    _make_mermaid_diagram(temp_dir, output_file, flow_name, mmd_dir)

    mmd_file = temp_dir / f"{flow_name}.mmd"
    assert not mmd_file.exists()


def test_make_timeline_json_no_events(tmp_path: Path) -> None:
    """Test _make_timeline_json when events.csv doesn't exist."""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir()

    # Should not raise an error
    _make_timeline_json(temp_dir)

    timeline_file = temp_dir / "timeline.json"
    assert not timeline_file.exists()


def test_after_run_string_output_file(tmp_path: Path) -> None:
    """Test after_run with string output file path."""
    flow_name = "test_flow"
    tmp_dir = tmp_path / "temp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    output_file = str(tmp_path / "output" / "flow.py")
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    Path(output_file).touch()
    waldiez_file = tmp_path / "flow.waldiez"
    waldiez_file.touch()

    result = after_run(
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
