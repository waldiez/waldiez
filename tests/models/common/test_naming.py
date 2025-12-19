# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=missing-module-docstring,missing-class-docstring,line-too-long
# pylint: disable=missing-function-docstring,missing-param-doc,missing-return-doc
# pylint: disable=no-self-use
# cspell: disable
"""Test waldiez.models.common.naming.*."""

from unittest.mock import Mock

from waldiez.models import (
    WaldiezAgent,
    WaldiezChat,
    WaldiezModel,
    WaldiezTool,
)
from waldiez.models.common.naming import (
    MAX_VARIABLE_LENGTH,
    get_valid_instance_name,
    get_valid_python_variable_name,
)


# noinspection DuplicatedCode
def create_mock_agent(agent_id: str, name: str) -> WaldiezAgent:
    """Create a mock agent for testing."""
    agent = Mock(spec=WaldiezAgent)
    agent.id = agent_id
    agent.name = name
    return agent


def create_mock_model(model_id: str, name: str) -> WaldiezModel:
    """Create a mock model for testing."""
    model = Mock(spec=WaldiezModel)
    model.id = model_id
    model.name = name
    return model


# noinspection DuplicatedCode
def create_mock_tool(tool_id: str, name: str) -> WaldiezTool:
    """Create a mock tool for testing."""
    tool = Mock(spec=WaldiezTool)
    tool.id = tool_id
    tool.name = name
    tool.data = Mock(
        kwargs={"name": name, "description": f"Description of {name}"}
    )
    tool.get_name = Mock(return_value=name)
    return tool


def create_mock_chat(chat_id: str, name: str) -> WaldiezChat:
    """Create a mock chat for testing."""
    chat = Mock(spec=WaldiezChat)
    chat.id = chat_id
    chat.name = name
    return chat


class TestGetValidPythonVariableName:
    """Test the get_valid_python_variable_name function."""

    def test_simple_valid_name(self) -> None:
        """Test with already valid Python variable names."""
        assert get_valid_python_variable_name("hello") == "hello"
        assert get_valid_python_variable_name("agent_1") == "agent_1"
        assert get_valid_python_variable_name("myVariable") == "myVariable"

    def test_name_with_spaces(self) -> None:
        """Test names with spaces are converted to underscores."""
        assert get_valid_python_variable_name("hello world") == "hello_world"
        assert (
            get_valid_python_variable_name("my agent name") == "my_agent_name"
        )

    def test_name_with_special_characters(self) -> None:
        """Test names with special characters."""
        assert get_valid_python_variable_name("hello-world") == "hello_world"
        assert get_valid_python_variable_name("agent@123") == "agent_123"
        assert get_valid_python_variable_name("test.name") == "test_name"
        assert get_valid_python_variable_name("agent#1") == "agent_1"

    def test_arrow_operators(self) -> None:
        """Test arrow operators are converted to meaningful words."""
        assert get_valid_python_variable_name("agent->model") == "agentTomodel"
        assert get_valid_python_variable_name("model=>agent") == "modelToagent"
        assert (
            get_valid_python_variable_name("agent<-model") == "agentFrommodel"
        )
        assert (
            get_valid_python_variable_name("model<=agent") == "modelFromagent"
        )

    def test_name_starting_with_digit(self) -> None:
        """Test names starting with digits."""
        assert get_valid_python_variable_name("123agent") == "w_123agent"
        assert get_valid_python_variable_name("456test") == "w_456test"

    def test_empty_name(self) -> None:
        """Test empty names get default prefix."""
        assert get_valid_python_variable_name("") == "w_"
        assert get_valid_python_variable_name("   ") == "w_"  # All spaces

    def test_custom_prefix(self) -> None:
        """Test custom prefix parameter."""
        assert (
            get_valid_python_variable_name("123test", prefix="custom")
            == "custom_123test"
        )
        assert (
            get_valid_python_variable_name("_private", prefix="my")
            == "_private"
        )
        assert get_valid_python_variable_name("", prefix="empty") == "empty_"

    def test_max_length_truncation(self) -> None:
        """Test maximum length truncation."""
        long_name = "a" * 100
        result = get_valid_python_variable_name(long_name, max_length=10)
        assert len(result) == 10
        assert result == "a" * 10

    def test_max_length_with_special_chars(self) -> None:
        """Test max length with special character replacement."""
        long_name = "hello world this is a very long name"
        result = get_valid_python_variable_name(long_name, max_length=15)
        assert len(result) == 15
        assert result == "hello_world_thi"

    def test_default_max_length(self) -> None:
        """Test default max length is applied."""
        long_name = "a" * 100
        result = get_valid_python_variable_name(long_name)
        assert len(result) == MAX_VARIABLE_LENGTH

    def test_complex_combinations(self) -> None:
        """Test complex combinations of transformations."""
        assert (
            get_valid_python_variable_name("Agent->Model@123")
            == "AgentToModel_123"
        )
        assert (
            get_valid_python_variable_name("123_Agent=>Test")
            == "w_123_AgentToTest"
        )
        assert (
            get_valid_python_variable_name("  Special@Name#123  ")
            == "__Special_Name_123"
        )


class TestGetValidInstanceName:
    """Test the get_valid_instance_name function."""

    def test_new_instance_simple_name(self) -> None:
        """Test adding a new instance with simple name."""
        current_names = {"existing_id": "existing_name"}
        instance = ("new_id", "simple_name")

        result = get_valid_instance_name(instance, current_names)

        expected = {"existing_id": "existing_name", "new_id": "simple_name"}
        assert result == expected

    def test_existing_instance_id_no_change(self) -> None:
        """Test that existing instance IDs are not modified."""
        current_names = {"existing_id": "existing_name"}
        instance = ("existing_id", "different_name")

        result = get_valid_instance_name(instance, current_names)

        # Should return unchanged since ID already exists
        assert result == current_names

    def test_name_conflict_gets_prefix(self) -> None:
        """Test that name conflicts get resolved with prefix."""
        current_names = {"id1": "test_name"}
        instance = ("new_id", "test_name")  # Same name

        result = get_valid_instance_name(instance, current_names, prefix="w")

        expected = {"id1": "test_name", "new_id": "w_test_name"}
        assert result == expected

    def test_name_conflict_with_prefix_gets_index(self) -> None:
        """Test that prefix conflicts get resolved with index."""
        current_names = {"id1": "test_name", "id2": "w_test_name"}
        instance = ("new_id", "test_name")

        result = get_valid_instance_name(instance, current_names, prefix="w")

        expected = {
            "id1": "test_name",
            "id2": "w_test_name",
            "new_id": "w_test_name_1",
        }
        assert result == expected

    def test_multiple_index_conflicts(self) -> None:
        """Test multiple index conflicts are resolved correctly."""
        current_names = {
            "id1": "test_name",
            "id2": "w_test_name",
            "id3": "w_test_name_1",
            "id4": "w_test_name_2",
        }
        instance = ("new_id", "test_name")

        result = get_valid_instance_name(instance, current_names, prefix="w")

        expected = current_names.copy()
        expected["new_id"] = "w_test_name_3"
        assert result == expected

    def test_invalid_python_name_gets_cleaned(self) -> None:
        """Test that invalid Python names get cleaned."""
        current_names: dict[str, str] = {}
        instance = ("new_id", "123invalid-name@test")

        result = get_valid_instance_name(instance, current_names, prefix="w")

        expected = {"new_id": "w_123invalid_name_test"}
        assert result == expected

    def test_custom_prefix(self) -> None:
        """Test custom prefix parameter."""
        current_names: dict[str, str] = {"id1": "test_name"}
        instance = ("new_id", "test_name")

        result = get_valid_instance_name(
            instance, current_names, prefix="custom"
        )

        expected = {"id1": "test_name", "new_id": "custom_test_name"}
        assert result == expected

    def test_max_length_parameter(self) -> None:
        """Test max_length parameter is applied."""
        current_names: dict[str, str] = {}
        long_name = "a" * 100
        instance = ("new_id", long_name)

        result = get_valid_instance_name(instance, current_names, max_length=10)

        # Name should be truncated before processing
        expected_name = "a" * 10
        assert result == {"new_id": expected_name}

    def test_empty_current_names(self) -> None:
        """Test with empty current_names dictionary."""
        current_names: dict[str, str] = {}
        instance = ("new_id", "test_name")

        result = get_valid_instance_name(instance, current_names)

        assert result == {"new_id": "test_name"}

    def test_original_dict_not_modified(self) -> None:
        """Test that original current_names dict is not modified."""
        original_names: dict[str, str] = {"id1": "name1"}
        current_names = original_names.copy()
        instance = ("new_id", "test_name")

        result = get_valid_instance_name(instance, current_names)

        # Original should be unchanged
        assert original_names == {"id1": "name1"}
        # Result should be different
        assert result == {"id1": "name1", "new_id": "test_name"}
