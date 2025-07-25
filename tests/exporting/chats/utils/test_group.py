# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-module-docstring,missing-param-doc,missing-return-doc
# pylint: disable=missing-function-docstring,missing-class-docstring
# pylint: disable=no-self-use
"""Test waldiez.exporting.chats.utils.group."""

import json
from unittest.mock import Mock

import pytest

from waldiez.exporting.chats.utils.common import get_event_handler_string
from waldiez.exporting.chats.utils.group import export_group_chats
from waldiez.models import WaldiezGroupManager, WaldiezGroupManagerData


def create_test_manager(
    manager_id: str = "manager1", max_round: int = 10
) -> WaldiezGroupManager:
    """Create a test manager for testing."""
    return WaldiezGroupManager(  # pyright: ignore
        id=manager_id,
        name=f"{manager_id}_name",
        description=f"{manager_id} description",
        data=WaldiezGroupManagerData(  # pyright: ignore
            max_round=max_round,
            initial_agent_id="assistant1",
        ),
    )


class TestExportGroupChats:
    """Test the export_group_chats function."""

    def test_basic_sync_group_chat_no_initial_chat(self) -> None:
        """Test basic synchronous group chat without initial chat."""
        agent_names = {"manager1": "chat_manager"}
        manager = create_test_manager("manager1", max_round=10)

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=1,
            is_async=False,
        )

        expected_lines = [
            "    results = run_group_chat(",
            "        pattern=chat_manager_pattern,",
            '        messages="",',
            "        max_rounds=10,",
            "    )",
        ]

        for line in expected_lines:
            assert line in result

        # Should not contain async function name
        assert "a_run_group_chat" not in result
        assert "run_group_chat(" in result

    def test_basic_async_group_chat_no_initial_chat(self) -> None:
        """Test basic asynchronous group chat without initial chat."""
        agent_names = {"manager1": "chat_manager"}
        manager = create_test_manager("manager1", max_round=5)

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=1,
            is_async=True,
        )

        expected_lines = [
            "    results = a_run_group_chat(",
            "        pattern=chat_manager_pattern,",
            '        messages="",',
            "        max_rounds=5,",
            "    )",
        ]

        for line in expected_lines:
            assert line in result

        # Should contain async function name
        assert "a_run_group_chat(" in result
        assert " run_group_chat(" not in result

    def test_sync_group_chat_with_initial_chat(self) -> None:
        """Test synchronous group chat with initial chat message."""
        agent_names = {"manager1": "group_manager"}
        manager = create_test_manager("manager1", max_round=15)
        initial_chat = "Hello, let's start the discussion!"

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=initial_chat,
            tabs=1,
            is_async=False,
        )

        expected_lines = [
            "    results = run_group_chat(",
            "        pattern=group_manager_pattern,",
            f"        messages={json.dumps(initial_chat)},",
            "        max_rounds=15,",
            "    )",
        ]

        for line in expected_lines:
            assert line in result

    def test_async_group_chat_with_initial_chat(self) -> None:
        """Test asynchronous group chat with initial chat message."""
        agent_names = {"manager1": "async_manager"}
        manager = create_test_manager("manager1", max_round=20)
        initial_chat = "Welcome to the async chat!"

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=initial_chat,
            tabs=1,
            is_async=True,
        )

        expected_lines = [
            "    results = a_run_group_chat(",
            "        pattern=async_manager_pattern,",
            f"        messages={json.dumps(initial_chat)},",
            "        max_rounds=20,",
            "    )",
        ]

        for line in expected_lines:
            assert line in result

    def test_different_tab_levels(self) -> None:
        """Test with different indentation levels."""
        agent_names = {"manager1": "test_manager"}
        manager = create_test_manager("manager1")

        # Test with 0 tabs
        result_0_tabs = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=0,
            is_async=False,
        )

        # Should start with no indentation
        assert result_0_tabs.startswith("results = run_group_chat(")

        # Test with 2 tabs
        result_2_tabs = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=2,
            is_async=False,
        )

        # Should start with 8 spaces (2 tabs * 4 spaces)
        assert result_2_tabs.startswith("        results = run_group_chat(")

        # Test with 3 tabs
        result_3_tabs = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=3,
            is_async=False,
        )

        # Should start with 12 spaces (3 tabs * 4 spaces)
        assert result_3_tabs.startswith("            results = run_group_chat(")

    def test_different_max_rounds(self) -> None:
        """Test with different max_rounds values."""
        agent_names = {"manager1": "round_manager"}

        # Test with max_rounds = 1
        manager_1 = create_test_manager("manager1", max_round=1)
        result_1 = export_group_chats(
            agent_names=agent_names,
            manager=manager_1,
            initial_chat=None,
            tabs=1,
            is_async=False,
        )
        assert "max_rounds=1," in result_1

        # Test with max_rounds = 100
        manager_100 = create_test_manager("manager1", max_round=100)
        result_100 = export_group_chats(
            agent_names=agent_names,
            manager=manager_100,
            initial_chat=None,
            tabs=1,
            is_async=False,
        )
        assert "max_rounds=100," in result_100

        # Test with max_rounds = 0
        manager_0 = create_test_manager("manager1", max_round=0)
        result_0 = export_group_chats(
            agent_names=agent_names,
            manager=manager_0,
            initial_chat=None,
            tabs=1,
            is_async=False,
        )
        assert "max_rounds=0," in result_0

    def test_different_manager_names(self) -> None:
        """Test with different manager names in agent_names."""
        manager = create_test_manager("mgr123")

        # Test with simple name
        agent_names_simple = {"mgr123": "simple_manager"}
        result_simple = export_group_chats(
            agent_names=agent_names_simple,
            manager=manager,
            initial_chat=None,
            tabs=1,
            is_async=False,
        )
        assert "pattern=simple_manager_pattern," in result_simple

        # Test with complex name
        agent_names_complex = {"mgr123": "complex_manager_with_underscores"}
        result_complex = export_group_chats(
            agent_names=agent_names_complex,
            manager=manager,
            initial_chat=None,
            tabs=1,
            is_async=False,
        )
        assert (
            "pattern=complex_manager_with_underscores_pattern,"
            in result_complex
        )

        # Test with numeric name
        agent_names_numeric = {"mgr123": "manager_42"}
        result_numeric = export_group_chats(
            agent_names=agent_names_numeric,
            manager=manager,
            initial_chat=None,
            tabs=1,
            is_async=False,
        )
        assert "pattern=manager_42_pattern," in result_numeric

    def test_initial_chat_json_serialization(self) -> None:
        """Test that initial chat is properly JSON serialized."""
        agent_names = {"manager1": "json_manager"}
        manager = create_test_manager("manager1")

        # Test with string containing quotes
        initial_chat_quotes = "Hello \"world\" and 'friends'!"
        result_quotes = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=initial_chat_quotes,
            tabs=1,
            is_async=False,
        )

        # Should be properly JSON encoded
        expected_json = json.dumps(initial_chat_quotes)
        assert f"messages={expected_json}," in result_quotes

        # Test with multiline string
        initial_chat_multiline = "Line 1\nLine 2\nLine 3"
        result_multiline = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=initial_chat_multiline,
            tabs=1,
            is_async=False,
        )

        expected_json_multiline = json.dumps(initial_chat_multiline)
        assert f"messages={expected_json_multiline}," in result_multiline

    def test_empty_initial_chat_string(self) -> None:
        """Test with empty string as initial chat."""
        agent_names = {"manager1": "empty_manager"}
        manager = create_test_manager("manager1")

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat="",
            tabs=1,
            is_async=False,
        )

        # Empty string should be JSON serialized as '""'
        assert 'messages="",' in result

    def test_return_type_is_string(self) -> None:
        """Test that function returns a string."""
        agent_names = {"manager1": "type_manager"}
        manager = create_test_manager("manager1")

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=1,
            is_async=False,
        )

        assert isinstance(result, str)
        assert len(result) > 0

    def test_proper_line_endings(self) -> None:
        """Test that the output has proper line endings."""
        agent_names = {"manager1": "line_manager"}
        manager = create_test_manager("manager1")

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=1,
            is_async=False,
        )

        # Should end with newline
        assert result.endswith("\n")

        # Should have multiple lines
        lines = result.split("\n")
        assert len(lines) > 1

        # Each non-empty line should have proper indentation
        non_empty_lines = [line for line in lines if line.strip()]
        for line in non_empty_lines:
            assert line.startswith("    ")  # Should start with at least one tab


class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_manager_id_not_in_agent_names(self) -> None:
        """Test when manager ID is not in agent_names dictionary."""
        agent_names = {"other_agent": "other_name"}
        manager = create_test_manager("missing_manager")

        # Should raise KeyError when trying to access agent_names[manager.id]
        with pytest.raises(KeyError):
            export_group_chats(
                agent_names=agent_names,
                manager=manager,
                initial_chat=None,
                tabs=1,
                is_async=False,
            )

    def test_none_max_round(self) -> None:
        """Test with None or missing max_round."""
        agent_names = {"manager1": "none_manager"}

        # Create manager with None max_round
        manager = Mock()
        manager.id = "manager1"
        manager.data = Mock()
        manager.data.max_round = None

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=1,
            is_async=False,
        )

        assert "max_rounds=None," in result

    def test_negative_tabs(self) -> None:
        """Test with negative tabs value."""
        agent_names = {"manager1": "neg_manager"}
        manager = create_test_manager("manager1")

        # Negative tabs should result in no indentation (empty string)
        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=-1,
            is_async=False,
        )

        # Should start with no indentation
        assert result.startswith("results = run_group_chat(")

    def test_special_characters_in_initial_chat(self) -> None:
        """Test with special characters in initial chat."""
        agent_names = {"manager1": "special_manager"}
        manager = create_test_manager("manager1")

        # Test with various special characters
        special_chat = "Special chars: @#$%^&*()[]{}|\\:;\"'<>,.?/~`"
        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=special_chat,
            tabs=1,
            is_async=False,
        )

        # Should be properly JSON escaped
        expected_json = json.dumps(special_chat)
        assert f"messages={expected_json}," in result


class TestOutputFormat:
    """Test the exact format of the generated code."""

    def test_exact_output_format_sync(self) -> None:
        """Test the exact format of synchronous output."""
        agent_names = {"manager1": "test_mgr"}
        manager = create_test_manager("manager1", max_round=5)

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat="Hello",
            tabs=2,
            is_async=False,
        )
        tab = "        "
        expected = (
            "        results = run_group_chat(\n"
            "            pattern=test_mgr_pattern,\n"
            '            messages="Hello",\n'
            "            max_rounds=5,\n"
            "        )\n"
        ) + get_event_handler_string(tab=tab, is_async=False)

        assert result == expected

    def test_exact_output_format_async(self) -> None:
        """Test the exact format of asynchronous output."""
        agent_names = {"manager1": "async_mgr"}
        manager = create_test_manager("manager1", max_round=3)

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=1,
            is_async=True,
        )
        tab = "    "
        expected = (
            "    results = a_run_group_chat(\n"
            "        pattern=async_mgr_pattern,\n"
            '        messages="",\n'
            "        max_rounds=3,\n"
            "    )\n"
        ) + get_event_handler_string(tab=tab, is_async=True)

        assert result == expected

    def test_exact_output_format_no_tabs(self) -> None:
        """Test the exact format with no indentation."""
        agent_names = {"manager1": "no_tab_mgr"}
        manager = create_test_manager("manager1", max_round=1)

        result = export_group_chats(
            agent_names=agent_names,
            manager=manager,
            initial_chat=None,
            tabs=0,
            is_async=False,
        )
        tab = ""
        expected = (
            "results = run_group_chat(\n"
            "    pattern=no_tab_mgr_pattern,\n"
            '    messages="",\n'
            "    max_rounds=1,\n"
            ")\n"
        ) + get_event_handler_string(tab=tab, is_async=False)

        assert result == expected
