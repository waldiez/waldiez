# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc,no-self-use

"""Tests for post_run module."""

import json
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

from waldiez.running.post_run import (
    a_ensure_error_json,
    a_get_results_from_json,
    a_store_full_results,
    ensure_error_json,
    fill_results_from_logs,
    get_results_from_json,
    remove_results_json,
    store_full_results,
)


class TestGetResultsFromJson:
    """Tests for get_results_from_json function."""

    def test_successful_load_dict_format(self, tmp_path: Path) -> None:
        """Test loading results from dict format JSON."""
        results_file = tmp_path / "results.json"
        test_data = {
            "results": [
                {
                    "events": [
                        {"id": 1, "status": "success"},
                        {"id": 2, "status": "complete"},
                    ]
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(test_data, f)

        results = get_results_from_json(tmp_path)
        events = results[0]["events"]
        assert len(events) == 2
        assert events[0]["id"] == 1
        assert events[1]["status"] == "complete"

    def test_successful_load_list_format(self, tmp_path: Path) -> None:
        """Test loading results from list format JSON."""
        results_file = tmp_path / "results.json"
        test_data = [
            {
                "events": [
                    {"id": 1, "status": "success"},
                    {"id": 2, "status": "complete"},
                ]
            }
        ]

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(test_data, f)

        results = get_results_from_json(tmp_path)
        events = results[0]["events"]
        assert len(events) == 2
        assert events[0]["id"] == 1
        assert events[1]["status"] == "complete"

    def test_no_results_file(self, tmp_path: Path) -> None:
        """Test when results.json doesn't exist."""
        results = get_results_from_json(tmp_path)
        assert results == []

    def test_invalid_json(self, tmp_path: Path) -> None:
        """Test handling of invalid JSON."""
        results_file = tmp_path / "results.json"
        results_file.write_text("invalid json{")

        results = get_results_from_json(tmp_path)
        assert results == []

    def test_empty_results(self, tmp_path: Path) -> None:
        """Test handling of empty results."""
        results_file = tmp_path / "results.json"

        # Empty dict with results key
        results_file.write_text('{"results": []}')
        assert get_results_from_json(tmp_path) == []

        # Empty list
        results_file.write_text("[]")
        assert get_results_from_json(tmp_path) == []

    def test_results_with_empty_events_and_messages(
        self, tmp_path: Path
    ) -> None:
        """Test results with empty events and messages are considered empty."""
        results_file = tmp_path / "results.json"
        test_data: dict[str, Any] = {
            "results": [
                {"events": [], "messages": []},
                {"events": [], "messages": []},
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(test_data, f)

        results = get_results_from_json(tmp_path)
        assert results == []

    def test_results_with_events(self, tmp_path: Path) -> None:
        """Test results with events are not considered empty."""
        results_file = tmp_path / "results.json"
        test_data = {
            "results": [
                {
                    "events": [{"type": "text", "content": "test"}],
                    "messages": [],
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(test_data, f)

        results = get_results_from_json(tmp_path)
        assert len(results) == 1

    def test_invalid_data_format(self, tmp_path: Path) -> None:
        """Test handling of invalid data format."""
        results_file = tmp_path / "results.json"

        # String instead of dict/list
        results_file.write_text('"just a string"')
        assert get_results_from_json(tmp_path) == []

        # Number
        results_file.write_text("42")
        assert get_results_from_json(tmp_path) == []


class TestAsyncGetResultsFromJson:
    """Tests for a_get_results_from_json function."""

    async def test_async_successful_load(self, tmp_path: Path) -> None:
        """Test async loading of results."""
        results_file = tmp_path / "results.json"
        test_data = {"results": [{"events": [{"id": 1, "data": "async test"}]}]}

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(test_data, f)

        results = await a_get_results_from_json(tmp_path)

        assert len(results) == 1
        assert results[0]["events"][0]["data"] == "async test"

    async def test_async_no_file(self, tmp_path: Path) -> None:
        """Test async when no results file exists."""
        results = await a_get_results_from_json(tmp_path)
        assert results == []

    async def test_async_invalid_json(self, tmp_path: Path) -> None:
        """Test async handling of invalid JSON."""
        results_file = tmp_path / "results.json"
        results_file.write_text("not valid json")

        results = await a_get_results_from_json(tmp_path)
        assert results == []


class TestRemoveResultsJson:
    """Tests for remove_results_json function."""

    def test_remove_existing_file(self, tmp_path: Path) -> None:
        """Test removing existing results.json."""
        results_file = tmp_path / "results.json"
        results_file.write_text("{}")

        assert results_file.exists()
        remove_results_json(tmp_path)
        assert not results_file.exists()

    def test_remove_non_existent_file(self, tmp_path: Path) -> None:
        """Test removing non-existent results.json doesn't raise."""
        # Should not raise
        remove_results_json(tmp_path)

    @patch("pathlib.Path.unlink")
    def test_remove_with_exception(
        self, mock_unlink: MagicMock, tmp_path: Path
    ) -> None:
        """Test exception handling during removal."""
        results_file = tmp_path / "results.json"
        results_file.write_text("{}")

        mock_unlink.side_effect = PermissionError("Cannot delete")

        # Should not raise
        remove_results_json(tmp_path)


class TestFillResultsFromLogs:
    """Tests for fill_results_from_logs function."""

    def test_fill_missing_messages(self, tmp_path: Path) -> None:
        """Test filling missing messages from events."""
        results_file = tmp_path / "results.json"
        results_data = {
            "results": [
                {
                    "messages": [],
                    "events": [
                        {
                            "type": "text",
                            "content": {
                                "content": "Hello from user",
                                "sender": "user",
                            },
                        },
                        {
                            "type": "text",
                            "content": {
                                "content": "Response from assistant",
                                "sender": "assistant",
                            },
                        },
                    ],
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        filled = fill_results_from_logs(tmp_path)

        messages = filled["results"][0]["messages"]
        assert len(messages) == 2
        assert messages[0]["content"] == "Hello from user"
        assert messages[0]["role"] == "user"
        assert messages[1]["content"] == "Response from assistant"
        assert messages[1]["role"] == "assistant"

    def test_fill_missing_summary(self, tmp_path: Path) -> None:
        """Test filling missing summary from events."""
        results_file = tmp_path / "results.json"
        results_data = {
            "results": [
                {
                    "summary": None,
                    "events": [
                        {
                            "type": "run_completion",
                            "content": {
                                "summary": "Task completed successfully"
                            },
                        }
                    ],
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        filled = fill_results_from_logs(tmp_path)

        assert filled["results"][0]["summary"] == "Task completed successfully"

    def test_fill_cost_from_chat_completions(self, tmp_path: Path) -> None:
        """Test filling cost from chat_completions.json."""
        results_file = tmp_path / "results.json"
        results_data: dict[str, Any] = {
            "results": [{"cost": None, "events": []}]
        }

        logs_dir = tmp_path / "logs"
        logs_dir.mkdir()

        chat_completions_file = logs_dir / "chat_completions.json"
        chat_completions_data = [{"cost": 0.05}, {"cost": 0.03}, {"cost": 0.02}]

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        with open(chat_completions_file, "w", encoding="utf-8") as f:
            json.dump(chat_completions_data, f)

        filled = fill_results_from_logs(tmp_path)

        assert filled["results"][0]["cost"] == 0.10  # Sum of costs

    def test_fill_context_variables(self, tmp_path: Path) -> None:
        """Test filling context variables from events."""
        results_file = tmp_path / "results.json"
        results_data = {
            "results": [
                {
                    "context_variables": None,
                    "events": [
                        {
                            "type": "executed_function",
                            "content": {
                                "content": {
                                    "context_variables": {
                                        "data": {"key": "value"}
                                    }
                                }
                            },
                        }
                    ],
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        filled = fill_results_from_logs(tmp_path)

        assert filled["results"][0]["context_variables"] == {"key": "value"}

    def test_fill_last_speaker(self, tmp_path: Path) -> None:
        """Test filling last speaker from events."""
        results_file = tmp_path / "results.json"
        results_data = {
            "results": [
                {
                    "last_speaker": None,
                    "events": [
                        {
                            "type": "text",
                            "content": {
                                "sender": "user",
                                "content": "First message",
                            },
                        },
                        {
                            "type": "text",
                            "content": {
                                "sender": "assistant",
                                "content": "Last message",
                            },
                        },
                    ],
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        filled = fill_results_from_logs(tmp_path)

        assert filled["results"][0]["last_speaker"] == "assistant"

    def test_skip_handoff_messages(self, tmp_path: Path) -> None:
        """Test that handoff messages are skipped."""
        results_file = tmp_path / "results.json"
        results_data = {
            "results": [
                {
                    "messages": [],
                    "events": [
                        {
                            "type": "text",
                            "content": {
                                "content": "[Handing off to another agent]",
                                "sender": "manager",
                            },
                        },
                        {
                            "type": "text",
                            "content": {
                                "content": "Actual message",
                                "sender": "user",
                            },
                        },
                    ],
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        filled = fill_results_from_logs(tmp_path)

        messages = filled["results"][0]["messages"]
        assert len(messages) == 1
        assert messages[0]["content"] == "Actual message"

    def test_no_duplicate_messages(self, tmp_path: Path) -> None:
        """Test that duplicate messages are not added."""
        results_file = tmp_path / "results.json"
        results_data = {
            "results": [
                {
                    "messages": [],
                    "events": [
                        {
                            "type": "text",
                            "content": {
                                "content": "Same message",
                                "sender": "user",
                            },
                        },
                        {
                            "type": "text",
                            "content": {
                                "content": "Same message",
                                "sender": "user",
                            },
                        },
                    ],
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        filled = fill_results_from_logs(tmp_path)

        messages = filled["results"][0]["messages"]
        assert len(messages) == 1


class TestEnsureErrorJson:
    """Tests for ensure_error_json function."""

    def test_create_error_json(self, tmp_path: Path) -> None:
        """Test creating error.json when it doesn't exist."""
        error = ValueError("Test error message")

        ensure_error_json(tmp_path, error)

        error_file = tmp_path / "error.json"
        assert error_file.exists()

        with open(error_file, "r", encoding="utf-8") as f:
            error_data = json.load(f)

        assert error_data["error"] == "Test error message"

    def test_existing_error_json(self, tmp_path: Path) -> None:
        """Test that existing error.json is not overwritten."""
        error_file = tmp_path / "error.json"
        error_file.write_text('{"error": "Existing error"}')

        ensure_error_json(tmp_path, ValueError("New error"))

        with open(error_file, "r", encoding="utf-8") as f:
            error_data = json.load(f)

        assert error_data["error"] == "Existing error"

    def test_remove_results_json_on_error(self, tmp_path: Path) -> None:
        """Test that results.json is removed when creating error.json."""
        results_file = tmp_path / "results.json"
        results_file.write_text("{}")

        ensure_error_json(tmp_path, RuntimeError("Error"))

        assert not results_file.exists()
        assert (tmp_path / "error.json").exists()


class TestAsyncEnsureErrorJson:
    """Tests for a_ensure_error_json function."""

    async def test_async_create_error_json(self, tmp_path: Path) -> None:
        """Test async creating error.json."""
        error = RuntimeError("Async error")

        await a_ensure_error_json(tmp_path, error)

        error_file = tmp_path / "error.json"
        assert error_file.exists()

        with open(error_file, "r", encoding="utf-8") as f:
            error_data = json.load(f)

        assert error_data["error"] == "Async error"

    async def test_async_existing_error_json(self, tmp_path: Path) -> None:
        """Test async with existing error.json."""
        error_file = tmp_path / "error.json"
        error_file.write_text('{"error": "Already exists"}')

        await a_ensure_error_json(tmp_path, ValueError("New"))

        with open(error_file, "r", encoding="utf-8") as f:
            error_data = json.load(f)

        assert error_data["error"] == "Already exists"


class TestStoreFullResults:
    """Tests for store_full_results function."""

    def test_successful_store(self, tmp_path: Path) -> None:
        """Test successful storing of results."""
        results_file = tmp_path / "results.json"
        results_data = {
            "results": [
                {
                    "messages": [],
                    "summary": None,
                    "cost": None,
                    "events": [
                        {
                            "type": "text",
                            "content": {
                                "content": "Test message",
                                "sender": "user",
                            },
                        }
                    ],
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        store_full_results(tmp_path)

        # Verify results were filled
        with open(results_file, "r", encoding="utf-8") as f:
            updated_data = json.load(f)

        assert len(updated_data["results"][0]["messages"]) > 0

    def test_no_results_file(self, tmp_path: Path) -> None:
        """Test when results.json doesn't exist."""
        # Should not raise
        store_full_results(tmp_path)

    def test_invalid_json_creates_error(self, tmp_path: Path) -> None:
        """Test that invalid JSON creates error.json."""
        results_file = tmp_path / "results.json"
        results_file.write_text("invalid json")

        store_full_results(tmp_path)

        assert (tmp_path / "error.json").exists()
        assert not results_file.exists()

    def test_empty_results_creates_error(self, tmp_path: Path) -> None:
        """Test that empty results creates error.json."""
        results_file = tmp_path / "results.json"
        results_file.write_text('{"results": []}')

        store_full_results(tmp_path)

        assert (tmp_path / "error.json").exists()

        with open(tmp_path / "error.json", "r", encoding="utf-8") as f:
            error_data = json.load(f)

        assert "No results generated" in error_data["error"]

    def test_fill_exception_handling(self, tmp_path: Path) -> None:
        """Test exception handling during fill operation."""
        results_file = tmp_path / "results.json"
        results_data: dict[str, Any] = {"results": [{"events": []}]}

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        with patch(
            "waldiez.running.post_run.fill_results_from_logs"
        ) as mock_fill:
            mock_fill.side_effect = Exception("Fill error")

            # Should not raise
            store_full_results(tmp_path)


class TestAsyncStoreFullResults:
    """Tests for a_store_full_results function."""

    async def test_async_successful_store(self, tmp_path: Path) -> None:
        """Test async successful storing of results."""
        results_file = tmp_path / "results.json"
        results_data = {
            "results": [
                {
                    "messages": [],
                    "events": [
                        {
                            "type": "text",
                            "content": {
                                "content": "Async test",
                                "sender": "user",
                            },
                        }
                    ],
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        await a_store_full_results(tmp_path)

        # Verify results were filled
        with open(results_file, "r", encoding="utf-8") as f:
            updated_data = json.load(f)

        assert len(updated_data["results"][0]["messages"]) > 0

    async def test_async_no_results_file(self, tmp_path: Path) -> None:
        """Test async when results.json doesn't exist."""
        # Should not raise
        await a_store_full_results(tmp_path)

    async def test_async_invalid_json_creates_error(
        self, tmp_path: Path
    ) -> None:
        """Test async that invalid JSON creates error.json."""
        results_file = tmp_path / "results.json"
        results_file.write_text("not json")

        await a_store_full_results(tmp_path)

        assert (tmp_path / "error.json").exists()
        assert not results_file.exists()


class TestEdgeCases:
    """Test edge cases and complex scenarios."""

    def test_complex_event_extraction(self, tmp_path: Path) -> None:
        """Test extraction from complex event structures."""
        results_file = tmp_path / "results.json"
        results_data = {
            "results": [
                {
                    "messages": [],
                    "summary": None,
                    "cost": None,
                    "context_variables": None,
                    "last_speaker": None,
                    "events": [
                        {
                            "type": "text",
                            "content": {"content": "None", "sender": "user"},
                        },
                        {
                            "type": "other",
                            "content": {
                                "content": "Manager message",
                                "sender": "manager",
                            },
                        },
                        {
                            "type": "text",
                            "content": {
                                "content": "Valid message",
                                "sender": "assistant",
                            },
                        },
                        {
                            "type": "run_completion",
                            "content": {
                                "history": [
                                    {
                                        "name": "final_speaker",
                                        "content": "Final message",
                                    }
                                ]
                            },
                        },
                    ],
                }
            ]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        filled = fill_results_from_logs(tmp_path)

        result = filled["results"][0]

        # Check messages
        assert len(result["messages"]) == 1
        assert result["messages"][0]["content"] == "Valid message"

        # Check last speaker from history
        assert result["last_speaker"] == "final_speaker"

        # Check summary from history content
        assert result["summary"] == "Final message"

    def test_cost_calculation_with_none_values(self, tmp_path: Path) -> None:
        """Test cost calculation when some completions have None cost."""
        results_file = tmp_path / "results.json"
        results_data: dict[str, Any] = {
            "results": [{"cost": None, "events": []}]
        }

        logs_dir = tmp_path / "logs"
        logs_dir.mkdir()

        chat_completions_file = logs_dir / "chat_completions.json"
        chat_completions_data = [
            {"cost": 0.05},
            {"cost": None},  # None cost
            {"cost": 0.03},
            {},  # Missing cost key
        ]

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        with open(chat_completions_file, "w", encoding="utf-8") as f:
            json.dump(chat_completions_data, f)

        filled = fill_results_from_logs(tmp_path)

        # Should sum only valid costs
        assert filled["results"][0]["cost"] == 0.08

    def test_no_chat_completions_file(self, tmp_path: Path) -> None:
        """Test when chat_completions.json doesn't exist."""
        results_file = tmp_path / "results.json"
        results_data: dict[str, Any] = {
            "results": [{"cost": None, "events": []}]
        }

        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f)

        filled = fill_results_from_logs(tmp_path)

        # Cost should remain None
        assert filled["results"][0]["cost"] is None
