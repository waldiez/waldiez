# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,no-self-use
# pylint: disable=too-few-public-methods,too-many-public-methods
# pylint: disable=protected-access

"""Tests for results_mixin module."""

import json
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, Mock, patch

import pytest

from waldiez.running.results_mixin import ResultsMixin, WaldiezRunResults


class TestResultsMixin:
    """Tests for ResultsMixin class."""

    def test_waldiez_run_results_type(self) -> None:
        """Test WaldiezRunResults TypedDict structure."""
        results: WaldiezRunResults = {
            "results": [{"test": "data"}],
            "exception": None,
            "completed": True,
        }

        assert "results" in results
        assert "exception" in results
        assert "completed" in results

    def test_ensure_db_outputs(self, tmp_path: Path) -> None:
        """Test ensure_db_outputs method."""
        # Create test database
        flow_db = tmp_path / "flow.db"
        conn = sqlite3.connect(flow_db)

        # Create test tables
        tables = ["chat_completions", "agents", "events", "function_calls"]
        for table in tables:
            q = (
                f"CREATE TABLE {table}"  # nosemgrep # nosec
                "(id INTEGER, data TEXT)"
            )
            conn.execute(q)
            q = f"INSERT INTO {table} VALUES (1, 'test')"  # nosemgrep # nosec
            conn.execute(q)
        conn.commit()
        conn.close()

        # Run ensure_db_outputs
        ResultsMixin.ensure_db_outputs(tmp_path)

        # Check files were created
        logs_dir = tmp_path / "logs"
        assert logs_dir.exists()

        for table in tables:
            csv_file = logs_dir / f"{table}.csv"
            json_file = logs_dir / f"{table}.json"
            assert csv_file.exists()
            assert json_file.exists()

    def test_ensure_db_outputs_no_db(self, tmp_path: Path) -> None:
        """Test ensure_db_outputs when no database exists."""
        ResultsMixin.ensure_db_outputs(tmp_path)

        # Should not create logs directory
        assert not (tmp_path / "logs").exists()

    def test_ensure_results_json(self, tmp_path: Path) -> None:
        """Test ensure_results_json method."""
        results: list[dict[str, Any]] = [{"test": "data", "value": 123}]

        ResultsMixin.ensure_results_json(tmp_path, results)

        results_file = tmp_path / "results.json"
        assert results_file.exists()

        with open(results_file, encoding="utf-8") as f:
            data = json.load(f)

        assert "results" in data
        assert data["results"][0]["test"] == results[0]["test"]

    @patch("waldiez.running.results_mixin.get_results_from_json")
    @patch("waldiez.running.results_mixin.store_full_results")
    def test_ensure_results_json_existing(
        self, mock_store: MagicMock, mock_get: MagicMock, tmp_path: Path
    ) -> None:
        """Test ensure_results_json with existing results."""
        mock_get.return_value = [{"existing": "data"}]

        ResultsMixin.ensure_results_json(tmp_path, [])

        mock_get.assert_called_once_with(tmp_path)
        mock_store.assert_called_once_with(tmp_path)

    def test_ensure_error_json(self, tmp_path: Path) -> None:
        """Test ensure_error_json method."""
        error = ValueError("Test error")

        ResultsMixin.ensure_error_json(tmp_path, error)

        error_file = tmp_path / "error.json"
        assert error_file.exists()

        with open(error_file, encoding="utf-8") as f:
            data = json.load(f)

        assert data["error"] == "Test error"

    def test_read_results_error(self, tmp_path: Path) -> None:
        """Test read_results_error method."""
        # Test with dict error
        error_file = tmp_path / "error.json"
        error_file.write_text('{"error": "Test error"}')

        results = ResultsMixin.read_results_error(error_file)
        assert results == [{"error": "Test error"}]

        # Test with list error
        error_file.write_text('[{"error": "Error 1"}, {"error": "Error 2"}]')

        results = ResultsMixin.read_results_error(error_file)
        assert len(results) == 2
        assert results[0]["error"] == "Error 1"

        # Test with invalid JSON
        error_file.write_text("invalid json")

        results = ResultsMixin.read_results_error(error_file)
        assert len(results) == 1
        assert "error" in results[0]

    def test_read_results_error_no_file(self, tmp_path: Path) -> None:
        """Test read_results_error when file doesn't exist."""
        error_file = tmp_path / "missing.json"

        results = ResultsMixin.read_results_error(error_file)
        assert results == [{"error": "No results generated"}]

    def test_read_from_output_results(self, tmp_path: Path) -> None:
        """Test read_from_output with results.json."""
        results_file = tmp_path / "results.json"
        results_file.write_text('{"results": [{"data": "test"}]}')

        results = ResultsMixin.read_from_output(tmp_path)
        assert results == [{"data": "test"}]

    def test_read_from_output_error(self, tmp_path: Path) -> None:
        """Test read_from_output with error.json."""
        error_file = tmp_path / "error.json"
        error_file.write_text('{"error": "Flow failed"}')

        results = ResultsMixin.read_from_output(tmp_path)
        assert results == [{"error": "Flow failed"}]

    def test_read_from_output_no_files(self, tmp_path: Path) -> None:
        """Test read_from_output with no files."""
        results = ResultsMixin.read_from_output(tmp_path)
        assert results == [{"error": "Could not gather result details."}]

    def test_read_from_output_exception(self, tmp_path: Path) -> None:
        """Test read_from_output with exception."""
        results_file = tmp_path / "results.json"
        results_file.write_text("invalid json")

        results = ResultsMixin.read_from_output(tmp_path)
        assert len(results) == 1
        assert "error" in results[0]

    def test_get_results_with_results_json(self, tmp_path: Path) -> None:
        """Test get_results when results.json exists."""
        results_file = tmp_path / "results.json"
        results_file.write_text('{"results": [{"from": "file"}]}')

        results = ResultsMixin.get_results([{"from": "parameter"}], tmp_path)

        assert results == [{"from": "file"}]

    def test_get_results_with_error_json(self, tmp_path: Path) -> None:
        """Test get_results when error.json exists."""
        error_file = tmp_path / "error.json"
        error_file.write_text('{"error": "Failed"}')

        results = ResultsMixin.get_results([{"from": "parameter"}], tmp_path)

        assert results == [{"error": "Failed"}]

    def test_get_results_no_files(self, tmp_path: Path) -> None:
        """Test get_results with no files."""
        input_results = [{"from": "parameter"}]

        results = ResultsMixin.get_results(input_results, tmp_path)

        assert results == input_results

    def test_make_timeline_json(self, tmp_path: Path) -> None:
        """Test make_timeline_json method."""
        # Create test CSV
        logs_dir = tmp_path / "logs"
        logs_dir.mkdir()
        events_csv = logs_dir / "events.csv"
        events_csv.write_text("timestamp,event\n2024-01-01,test")

        with patch(
            "waldiez.running.results_mixin.TimelineProcessor"
        ) as mock_processor:
            mock_instance = Mock()
            mock_processor.return_value = mock_instance
            mock_processor.get_files.return_value = {
                "agents": Path("agents.csv"),
                "chat": Path("chat.csv"),
                "events": events_csv,
                "functions": Path("functions.csv"),
            }
            mock_instance.process_timeline.return_value = {"timeline": "data"}
            mock_processor.get_short_results.return_value = {"short": "data"}

            ResultsMixin.make_timeline_json(tmp_path)

            # Verify timeline.json was created
            assert (tmp_path / "timeline.json").exists()
            mock_instance.load_csv_files.assert_called_once()
            mock_instance.process_timeline.assert_called_once()

    def test_make_timeline_json_no_events(self, tmp_path: Path) -> None:
        """Test make_timeline_json when no events.csv exists."""
        ResultsMixin.make_timeline_json(tmp_path)

        # Should not create timeline.json
        assert not (tmp_path / "timeline.json").exists()

    @patch("waldiez.running.results_mixin.generate_sequence_diagram")
    def test_make_mermaid_diagram(
        self, mock_generate: MagicMock, tmp_path: Path
    ) -> None:
        """Test make_mermaid_diagram method."""
        # Create test events.csv
        logs_dir = tmp_path / "logs"
        logs_dir.mkdir()
        events_csv = logs_dir / "events.csv"
        events_csv.write_text("test,data")

        output_file = tmp_path / "output.py"

        ResultsMixin.make_mermaid_diagram(
            tmp_path, output_file, "test_flow", tmp_path
        )

        mock_generate.assert_called_once()
        args = mock_generate.call_args[0]
        assert args[0] == events_csv
        assert args[1] == tmp_path / "test_flow.mmd"

    def test_make_mermaid_diagram_no_output(self, tmp_path: Path) -> None:
        """Test make_mermaid_diagram without output file."""
        logs_dir = tmp_path / "logs"
        logs_dir.mkdir()
        events_csv = logs_dir / "events.csv"
        events_csv.write_text("test")

        mmd_dir = tmp_path / "mermaid"
        mmd_dir.mkdir()

        with patch("waldiez.running.results_mixin.generate_sequence_diagram"):
            # Create the mmd file that would be generated
            mmd_file = tmp_path / "test_flow.mmd"
            mmd_file.write_text("graph TD")

            ResultsMixin.make_mermaid_diagram(
                tmp_path, None, "test_flow", mmd_dir
            )

            # Should copy to mmd_dir
            assert (mmd_dir / "test_flow.mmd").exists()

    @patch("waldiez.running.results_mixin.StorageManager")
    def test_post_run_success(
        self, mock_storage_class: MagicMock, tmp_path: Path
    ) -> None:
        """Test post_run with successful results."""
        # Setup mock storage
        mock_storage = Mock()
        mock_storage_class.return_value = mock_storage
        mock_storage.finalize.return_value = (
            tmp_path / "checkpoint",
            tmp_path / "link",
        )

        # Create test data
        results = [{"test": "result"}]
        waldiez_file = tmp_path / "test.waldiez"
        waldiez_file.write_text("content")
        output_file = tmp_path / "output.py"

        # Run post_run
        dest = ResultsMixin.post_run(
            results=results,
            error=None,
            temp_dir=tmp_path,
            output_file=output_file,
            flow_name="test_flow",
            waldiez_file=waldiez_file,
            skip_mmd=True,
            skip_timeline=True,
        )

        assert dest == tmp_path / "link"
        mock_storage.finalize.assert_called_once()

    @patch("waldiez.running.results_mixin.StorageManager")
    def test_post_run_with_error(
        self, mock_storage_class: MagicMock, tmp_path: Path
    ) -> None:
        """Test post_run with error."""
        mock_storage = Mock()
        mock_storage_class.return_value = mock_storage
        temp_dir = tmp_path / "tmp"
        temp_dir.mkdir(parents=True, exist_ok=True)
        run_dir = tmp_path / "run"
        run_dir.mkdir(parents=True, exist_ok=True)
        mock_storage.finalize.return_value = (
            run_dir / "checkpoint",
            run_dir / "link",
        )

        error = RuntimeError("Test error")
        waldiez_file = run_dir / "test.waldiez"
        waldiez_file.write_text("content")

        ResultsMixin.post_run(
            results=[],
            error=error,
            temp_dir=temp_dir,
            output_file=run_dir / "test.py",
            flow_name="test_flow",
            waldiez_file=waldiez_file,
            skip_mmd=True,
            skip_timeline=True,
            keep_tmp=True,
        )

        # Should create error.json
        assert (temp_dir / "error.json").exists()
        shutil.rmtree(tmp_path)

    def test_post_run_copy_waldiez_file(self, tmp_path: Path) -> None:
        """Test post_run copies waldiez file."""
        with patch(
            "waldiez.running.results_mixin.StorageManager"
        ) as mock_storage_class:
            mock_storage = Mock()
            mock_storage_class.return_value = mock_storage
            run_path = tmp_path / "run"
            link_path = run_path / "link"
            temp_dir = tmp_path / "tmp"
            temp_dir.mkdir(parents=True, exist_ok=True)
            link_path.mkdir(exist_ok=True, parents=True)
            mock_storage.finalize.return_value = (
                run_path / "checkpoint",
                link_path,
            )

            waldiez_file = run_path / "test_post_run_copy_waldiez_file.waldiez"
            waldiez_file.write_text("waldiez content")

            ResultsMixin.post_run(
                results=[],
                error=None,
                temp_dir=temp_dir,
                output_file=temp_dir / "out.py",
                flow_name="test_post_run_copy_waldiez_file",
                waldiez_file=waldiez_file,
                skip_mmd=True,
                skip_timeline=True,
            )

            # Should copy waldiez file to link directory
            assert (
                link_path / "test_post_run_copy_waldiez_file.waldiez"
            ).exists()
            assert (
                link_path / "test_post_run_copy_waldiez_file.waldiez"
            ).read_text() == "waldiez content"
        shutil.rmtree(tmp_path)


class TestAsyncMethods:
    """Tests for async methods in ResultsMixin."""

    async def test_a_ensure_db_outputs(self, tmp_path: Path) -> None:
        """Test async ensure_db_outputs."""
        # Create test database
        flow_db = tmp_path / "flow.db"
        conn = sqlite3.connect(flow_db)
        conn.execute("CREATE TABLE agents (id INTEGER, name TEXT)")
        conn.execute("INSERT INTO agents VALUES (1, 'agent1')")
        conn.commit()
        conn.close()

        await ResultsMixin.a_ensure_db_outputs(tmp_path)

        # Check files were created
        logs_dir = tmp_path / "logs"
        assert logs_dir.exists()
        assert (logs_dir / "agents.csv").exists()
        assert (logs_dir / "agents.json").exists()

    async def test_a_ensure_results_json(self, tmp_path: Path) -> None:
        """Test async ensure_results_json."""
        results = [{"async": "test"}]

        await ResultsMixin.a_ensure_results_json(tmp_path, results)

        results_file = tmp_path / "results.json"
        assert results_file.exists()

        with open(results_file, encoding="utf-8") as f:
            data = json.load(f)

        assert data["results"][0]["async"] == "test"

    async def test_a_read_results_error(self, tmp_path: Path) -> None:
        """Test async read_results_error."""
        error_file = tmp_path / "error.json"
        error_file.write_text('{"error": "Async error"}')

        results = await ResultsMixin.a_read_results_error(error_file)
        assert results == [{"error": "Async error"}]

    async def test_a_read_from_output(self, tmp_path: Path) -> None:
        """Test async read_from_output."""
        results_file = tmp_path / "results.json"
        results_file.write_text('{"results": [{"async": "data"}]}')

        results = await ResultsMixin.a_read_from_output(tmp_path)
        assert results == [{"async": "data"}]

    async def test_a_get_results(self, tmp_path: Path) -> None:
        """Test async get_results."""
        input_results = [{"input": "data"}]

        # Test with no files
        results = await ResultsMixin.a_get_results(input_results, tmp_path)
        assert results == input_results

        # Test with results.json
        results_file = tmp_path / "results.json"
        results_file.write_text('{"results": [{"file": "data"}]}')

        results = await ResultsMixin.a_get_results(input_results, tmp_path)
        assert results == [{"file": "data"}]

    async def test_a_post_run(self, tmp_path: Path) -> None:
        """Test async post_run."""
        with patch(
            "waldiez.running.results_mixin.anyio.to_thread.run_sync"
        ) as mock_run_sync:
            mock_run_sync.return_value = tmp_path / "result"

            waldiez_file = tmp_path / "test.waldiez"
            waldiez_file.touch()

            result = await ResultsMixin.a_post_run(
                results=[],
                error=None,
                temp_dir=tmp_path,
                output_file=None,
                flow_name="test",
                waldiez_file=waldiez_file,
            )

            assert result == tmp_path / "result"
            mock_run_sync.assert_called_once()


class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_post_run_exception_handling(self, tmp_path: Path) -> None:
        """Test exception handling in post_run."""
        with patch(
            "waldiez.running.results_mixin.StorageManager"
        ) as mock_storage_class:
            mock_storage = Mock()
            mock_storage_class.return_value = mock_storage
            mock_storage.finalize.side_effect = Exception("Storage error")

            waldiez_file = tmp_path / "test.waldiez"

            # Should not raise
            with pytest.raises(Exception) as exc_info:
                ResultsMixin.post_run(
                    results=[],
                    error=None,
                    temp_dir=tmp_path,
                    output_file=None,
                    flow_name="test",
                    waldiez_file=waldiez_file,
                )

            assert "Storage error" in str(exc_info.value)

    def test_make_timeline_json_exception(self, tmp_path: Path) -> None:
        """Test exception handling in make_timeline_json."""
        logs_dir = tmp_path / "logs"
        logs_dir.mkdir()
        events_csv = logs_dir / "events.csv"
        events_csv.write_text("test")

        with patch(
            "waldiez.running.results_mixin.TimelineProcessor"
        ) as mock_processor:
            mock_processor.side_effect = Exception("Timeline error")

            # Should not raise
            ResultsMixin.make_timeline_json(tmp_path)

    def test_ensure_results_json_write_error(self, tmp_path: Path) -> None:
        """Test ensure_results_json with write error."""
        # Make directory read-only
        tmp_path.chmod(0o555)

        try:
            ResultsMixin.ensure_results_json(tmp_path, [{"test": "data"}])
        finally:
            # Restore permissions
            tmp_path.chmod(0o755)

    def test_read_from_output_malformed_json(self, tmp_path: Path) -> None:
        """Test read_from_output with malformed JSON."""
        results_file = tmp_path / "results.json"
        results_file.write_text('{"results": }')  # Invalid JSON

        results = ResultsMixin.read_from_output(tmp_path)
        assert len(results) == 1
        assert "error" in results[0]

    def test_special_metadata_handling(self, tmp_path: Path) -> None:
        """Test post_run with special metadata."""
        with patch(
            "waldiez.running.results_mixin.StorageManager"
        ) as mock_storage_class:
            mock_storage = Mock()
            mock_storage_class.return_value = mock_storage
            mock_storage.finalize.return_value = (
                tmp_path / "checkpoint",
                tmp_path / "link",
            )

            waldiez_file = tmp_path / "test.waldiez"
            waldiez_file.touch()

            # Test with complex metadata
            metadata = {
                "timestamp": datetime.now(timezone.utc),
                "nested": {"data": [1, 2, 3], "more": {"deep": "value"}},
                "unicode": "你好世界🌍",
            }

            ResultsMixin.post_run(
                results=[],
                error=None,
                temp_dir=tmp_path,
                output_file=None,
                flow_name="test",
                waldiez_file=waldiez_file,
                metadata=metadata,
                skip_mmd=True,
                skip_timeline=True,
            )

            # Verify metadata was passed to storage
            call_args = mock_storage.finalize.call_args
            assert call_args[1]["metadata"] == metadata
