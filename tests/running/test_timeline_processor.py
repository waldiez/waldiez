# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=missing-return-doc,missing-param-doc
# pylint: disable=line-too-long,no-self-use
# flake8: noqa: E501
"""Test waldiez.running.timeline_processor.*."""

from pathlib import Path
from typing import Any

import pandas as pd
import pytest

from waldiez.running.timeline_processor import (
    ACTIVITY_COLORS,
    AGENT_COLORS,
    DEFAULT_AGENT_COLOR,
    TimelineProcessor,
    recursive_search,
)


@pytest.fixture(name="sample_agents_data")
def sample_agents_data_fixture() -> pd.DataFrame:
    """Create sample agents data for testing."""
    return pd.DataFrame(
        {
            "name": ["agent1", "agent2", "agent3"],
            "class": ["ConversableAgent", "UserProxyAgent", "AssistantAgent"],
            "init_args": [
                '{"llm_config": {"model": "gpt-4"}}',
                '{"llm_config": {"model": "gpt-3.5-turbo"}}',
                '{"llm_config": {"_model": {"config_list": [{"model": "claude-3"}]}}}',
            ],
        }
    )


@pytest.fixture(name="sample_chat_data")
def sample_chat_data_fixture() -> pd.DataFrame:
    """Create sample chat data for testing."""
    return pd.DataFrame(
        {
            "source_name": ["agent1", "agent2", "agent1"],
            "start_time": [
                "2024-01-01 10:00:00.000",
                "2024-01-01 10:00:05.000",
                "2024-01-01 10:00:15.000",
            ],
            "end_time": [
                "2024-01-01 10:00:03.000",
                "2024-01-01 10:00:10.000",
                "2024-01-01 10:00:20.000",
            ],
            "cost": [0.01, 0.02, 0.015],
            "is_cached": [False, True, False],
            "request": [
                '{"model": "gpt-4", "messages": [{"content": "Hello"}]}',
                '{"model": "gpt-3.5-turbo", "usage": {"prompt_tokens": 10, "completion_tokens": 5}}',
                '{"model": "gpt-4", "messages": [{"content": "How are you?"}]}',
            ],
            "response": [
                '{"usage": {"prompt_tokens": 5, "completion_tokens": 10, "total_tokens": 15}}',
                '{"usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}}',
                '{"usage": {"prompt_tokens": 8, "completion_tokens": 12, "total_tokens": 20}}',
            ],
            "session_id": ["session_1", "session_2", "session_3"],
        }
    )


@pytest.fixture(name="sample_events_data")
def sample_events_data_fixture() -> pd.DataFrame:
    """Create sample events data for testing."""
    return pd.DataFrame(
        {
            "event_name": [
                "received_message",
                "sent_message",
                "received_message",
            ],
            "timestamp": [
                "2024-01-01 10:00:04.000",
                "2024-01-01 10:00:06.000",
                "2024-01-01 10:00:14.000",
            ],
            "json_state": [
                '{"message": {"role": "user", "content": "Hello"}}',
                '{"message": {"role": "assistant", "content": "Hi there"}}',
                '{"message": {"role": "user", "content": "How are you?"}, "sender": "customer"}',
            ],
        }
    )


@pytest.fixture(name="sample_functions_data")
def sample_functions_data_fixture() -> pd.DataFrame:
    """Create sample functions data for testing."""
    return pd.DataFrame(
        {
            "function_name": ["transfer_to_agent", "search_tool", "calculator"],
            "timestamp": [
                "2024-01-01 10:00:04.500",
                "2024-01-01 10:00:12.000",
                "2024-01-01 10:00:16.000",
            ],
        }
    )


@pytest.fixture(name="processor_with_data")
def processor_with_data_fixture(
    sample_agents_data: pd.DataFrame,
    sample_chat_data: pd.DataFrame,
    sample_events_data: pd.DataFrame,
    sample_functions_data: pd.DataFrame,
) -> TimelineProcessor:
    """Create a TimelineProcessor with sample data."""
    processor = TimelineProcessor()
    processor.agents_data = sample_agents_data
    processor.chat_data = sample_chat_data
    processor.events_data = sample_events_data
    processor.functions_data = sample_functions_data
    return processor


class TestTimelineProcessor:
    """Test TimelineProcessor class."""

    def test_init(self) -> None:
        """Test TimelineProcessor initialization."""
        processor = TimelineProcessor()
        assert processor.agents_data is None
        assert processor.chat_data is None
        assert processor.events_data is None
        assert processor.functions_data is None

    def test_is_missing_or_nan(self) -> None:
        """Test is_missing_or_nan method."""
        processor = TimelineProcessor()

        # Test various missing values
        assert processor.is_missing_or_nan(None)
        assert processor.is_missing_or_nan(pd.NA)
        assert processor.is_missing_or_nan("")
        assert processor.is_missing_or_nan("   ")
        assert processor.is_missing_or_nan("nan")
        assert processor.is_missing_or_nan("NaN")
        assert processor.is_missing_or_nan("NAN")

        # Test valid values
        assert not processor.is_missing_or_nan("agent1")
        assert not processor.is_missing_or_nan("0")
        assert not processor.is_missing_or_nan(0)
        assert not processor.is_missing_or_nan(False)

    def test_fill_missing_agent_names(self) -> None:
        """Test fill_missing_agent_names method."""
        processor = TimelineProcessor()

        # Test with None data
        result = processor.fill_missing_agent_names(None)
        assert result is None

        # Test with empty data
        empty_df = pd.DataFrame()
        result = processor.fill_missing_agent_names(empty_df)
        assert result is not None
        assert result.empty

        # Test with valid data
        data = pd.DataFrame(
            {"source_name": ["agent1", None, "agent2", "", "agent3"]}
        )
        result = processor.fill_missing_agent_names(data, "source_name")
        assert result is not None
        assert result.iloc[0]["source_name"] == "agent1"
        assert result.iloc[1]["source_name"] == "agent1"  # Filled with previous
        assert result.iloc[2]["source_name"] == "agent2"
        assert result.iloc[3]["source_name"] == "agent2"  # Filled with previous
        assert result.iloc[4]["source_name"] == "agent3"

    def test_load_csv_files(self, tmp_path: Path) -> None:
        """Test load_csv_files method."""
        processor = TimelineProcessor()

        # Create test CSV files
        agents_file = tmp_path / "agents.csv"
        chat_file = tmp_path / "chat.csv"

        # Create sample data
        agents_data = pd.DataFrame({"name": ["agent1", "agent2"]})
        chat_data = pd.DataFrame(
            {
                "source_name": ["agent1", "agent2"],
                "start_time": [
                    "2024-01-01 10:00:00.000",
                    "2024-01-01 10:00:05.000",
                ],
                "end_time": [
                    "2024-01-01 10:00:03.000",
                    "2024-01-01 10:00:10.000",
                ],
            }
        )

        # Write CSV files
        agents_data.to_csv(agents_file, index=False)
        chat_data.to_csv(chat_file, index=False)

        # Test loading
        processor.load_csv_files(
            agents_file=str(agents_file),
            chat_file=str(chat_file),
        )

        assert processor.agents_data is not None
        assert len(processor.agents_data) == 2
        assert processor.chat_data is not None
        assert len(processor.chat_data) == 2

    def test_extract_token_info(self) -> None:
        """Test extract_token_info method."""
        processor = TimelineProcessor()

        # Test with valid JSON
        request = '{"usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}}'
        response = '{"usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}}'

        result = processor.extract_token_info(request, response)
        assert result["prompt_tokens"] == 10
        assert result["completion_tokens"] == 5
        assert result["total_tokens"] == 15

        # Test with invalid JSON
        result = processor.extract_token_info("invalid", "invalid")
        assert result["prompt_tokens"] == 0
        assert result["completion_tokens"] == 0
        assert result["total_tokens"] == 0

    def test_extract_llm_model(
        self, processor_with_data: TimelineProcessor
    ) -> None:
        """Test extract_llm_model method."""
        # Test with valid agent and request
        result = processor_with_data.extract_llm_model(
            "agent1", '{"model": "gpt-4"}'
        )
        assert result == "gpt-4"

        # Test with agent data lookup
        result = processor_with_data.extract_llm_model("agent1")
        assert result == "gpt-4"

        # Test with unknown agent
        result = processor_with_data.extract_llm_model("unknown_agent")
        assert result == "Unknown"

    def test_compress_timeline(
        self, processor_with_data: TimelineProcessor
    ) -> None:
        """Test compress_timeline method."""
        timeline, cost_timeline, total_time, total_cost = (
            processor_with_data.compress_timeline()
        )

        # Check timeline structure
        assert isinstance(timeline, list)
        assert len(timeline) > 0

        # Check session items
        sessions = [item for item in timeline if item["type"] == "session"]
        assert len(sessions) == 3  # We have 3 sessions in sample data

        # Check cost timeline
        assert isinstance(cost_timeline, list)
        assert len(cost_timeline) == 3

        # Check totals
        assert isinstance(total_time, float)
        assert isinstance(total_cost, float)
        assert total_cost > 0

    def test_process_timeline(
        self, processor_with_data: TimelineProcessor
    ) -> None:
        """Test process_timeline method."""
        result = processor_with_data.process_timeline()

        # Check main structure
        assert "timeline" in result
        assert "cost_timeline" in result
        assert "summary" in result
        assert "metadata" in result
        assert "agents" in result

        # Check summary
        summary = result["summary"]
        assert "total_sessions" in summary
        assert "total_time" in summary
        assert "total_cost" in summary
        assert "total_agents" in summary
        assert "model_stats" in summary

    def test_process_timeline_without_chat_data(self) -> None:
        """Test process_timeline without chat data."""
        processor = TimelineProcessor()

        with pytest.raises(ValueError, match="Chat data is required"):
            processor.process_timeline()

    def test_get_short_results(self) -> None:
        """Test get_short_results static method."""
        results: dict[str, Any] = {
            "timeline": [
                {
                    "id": "session_1",
                    "type": "session",
                    "request": "long request data",
                    "response": "long response data",
                    "other_field": "value",
                }
            ],
            "other_data": "value",
        }

        short_results = TimelineProcessor.get_short_results(results)

        assert "timeline" in short_results
        session = short_results["timeline"][0]
        assert "request" not in session
        assert "response" not in session
        assert "other_field" in session
        assert session["other_field"] == "value"

    def test_get_files(self, tmp_path: Path) -> None:
        """Test get_files static method."""
        # Create some test files
        (tmp_path / "agents.csv").touch()
        (tmp_path / "chat_completions.csv").touch()

        files = TimelineProcessor.get_files(tmp_path)

        assert "agents" in files
        assert "chat" in files
        assert "events" in files
        assert "functions" in files

        assert files["agents"] is not None
        assert files["chat"] is not None
        assert files["events"] is None  # Doesn't exist
        assert files["functions"] is None  # Doesn't exist


class TestRecursiveSearch:
    """Test recursive_search function."""

    def test_recursive_search_dict(self) -> None:
        """Test recursive_search with dictionary."""
        obj = {"model": "gpt-4", "other": "value"}
        result = recursive_search(obj, ["model"])
        assert result == "gpt-4"

        result = recursive_search(obj, ["nonexistent"])
        assert result == "Unknown"

    def test_recursive_search_nested_dict(self) -> None:
        """Test recursive_search with nested dictionary."""
        obj = {"config": {"llm": {"model": "claude-3"}}}
        result = recursive_search(obj, ["model"])
        assert result == "claude-3"

    def test_recursive_search_list(self) -> None:
        """Test recursive_search with list."""
        obj = [{"model": "gpt-4"}, {"other": "value"}]
        result = recursive_search(obj, ["model"])
        assert result == "gpt-4"


class TestConstants:
    """Test module constants."""

    def test_agent_colors(self) -> None:
        """Test AGENT_COLORS constant."""
        assert isinstance(AGENT_COLORS, list)
        assert len(AGENT_COLORS) == 20
        assert all(color.startswith("#") for color in AGENT_COLORS)

    def test_activity_colors(self) -> None:
        """Test ACTIVITY_COLORS constant."""
        assert isinstance(ACTIVITY_COLORS, dict)
        assert "human_input_waiting" in ACTIVITY_COLORS
        assert "processing" in ACTIVITY_COLORS
        assert "agent_transition" in ACTIVITY_COLORS
        assert all(color.startswith("#") for color in ACTIVITY_COLORS.values())

    def test_default_agent_color(self) -> None:
        """Test DEFAULT_AGENT_COLOR constant."""
        assert isinstance(DEFAULT_AGENT_COLOR, str)
        assert DEFAULT_AGENT_COLOR.startswith("#")
