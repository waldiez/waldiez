# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=missing-module-docstring,missing-class-docstring,line-too-long
# pylint: disable=missing-function-docstring,missing-param-doc,missing-return-doc
# pylint: disable=no-self-use
"""Test waldiez.exporting.core.utils.naming.*."""

from unittest.mock import Mock

from waldiez.exporting.core.utils.naming import (
    MAX_VARIABLE_LENGTH,
    ensure_unique_names,
    get_valid_instance_name,
    get_valid_python_variable_name,
)
from waldiez.models import (
    Waldiez,
    WaldiezAgent,
    WaldiezChat,
    WaldiezModel,
    WaldiezTool,
)


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


def create_mock_tool(tool_id: str, name: str) -> WaldiezTool:
    """Create a mock tool for testing."""
    tool = Mock(spec=WaldiezTool)
    tool.id = tool_id
    tool.name = name
    return tool


def create_mock_chat(chat_id: str, name: str) -> WaldiezChat:
    """Create a mock chat for testing."""
    chat = Mock(spec=WaldiezChat)
    chat.id = chat_id
    chat.name = name
    return chat


def create_mock_waldiez(
    agents: list[WaldiezAgent] | None = None,
    models: list[WaldiezModel] | None = None,
    tools: list[WaldiezTool] | None = None,
    chats: list[WaldiezChat] | None = None,
    flow_id: str = "flow1",
    flow_name: str = "Test Flow",
) -> Waldiez:
    """Create a mock Waldiez instance for testing."""
    waldiez = Mock(spec=Waldiez)
    waldiez.agents = agents or []
    waldiez.models = models or []
    waldiez.tools = tools or []

    # Mock flow with nested data structure
    waldiez.flow = Mock()
    waldiez.flow.id = flow_id
    waldiez.flow.name = flow_name
    waldiez.flow.data = Mock()
    waldiez.flow.data.chats = chats or []

    return waldiez


class TestGetValidPythonVariableName:
    """Test the get_valid_python_variable_name function."""

    def test_simple_valid_name(self) -> None:
        """Test with already valid Python variable names."""
        assert get_valid_python_variable_name("hello") == "hello"
        assert get_valid_python_variable_name("agent_1") == "agent_1"
        assert get_valid_python_variable_name("myVariable") == "myvariable"

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
        assert get_valid_python_variable_name("agent->model") == "agenttomodel"
        assert get_valid_python_variable_name("model=>agent") == "modeltoagent"
        assert (
            get_valid_python_variable_name("agent<-model") == "agentfrommodel"
        )
        assert (
            get_valid_python_variable_name("model<=agent") == "modelfromagent"
        )

    def test_name_starting_with_digit(self) -> None:
        """Test names starting with digits."""
        assert get_valid_python_variable_name("123agent") == "w_123agent"
        assert get_valid_python_variable_name("456test") == "w_456test"

    def test_name_starting_with_underscore(self) -> None:
        """Test names starting with underscore get prefix."""
        assert get_valid_python_variable_name("_private") == "w_private"
        assert get_valid_python_variable_name("__dunder") == "w__dunder"

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
            == "my_private"
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

    def test_case_conversion(self) -> None:
        """Test that names are converted to lowercase."""
        assert get_valid_python_variable_name("HelloWorld") == "helloworld"
        assert get_valid_python_variable_name("AGENT_NAME") == "agent_name"
        assert get_valid_python_variable_name("CamelCase") == "camelcase"

    def test_complex_combinations(self) -> None:
        """Test complex combinations of transformations."""
        assert (
            get_valid_python_variable_name("Agent->Model@123")
            == "agenttomodel_123"
        )
        assert (
            get_valid_python_variable_name("123_Agent=>Test")
            == "w_123_agenttotest"
        )
        assert (
            get_valid_python_variable_name("  Special@Name#123  ")
            == "w__special_name_123"
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


class TestEnsureUniqueNames:
    """Test the ensure_unique_names function."""

    def test_empty_waldiez(self) -> None:
        """Test with empty Waldiez instance."""
        waldiez = create_mock_waldiez()

        result = ensure_unique_names(waldiez)

        assert not result["agent_names"]
        assert not result["model_names"]
        assert not result["tool_names"]
        assert not result["chat_names"]
        assert not result["agents"]
        assert not result["models"]
        assert not result["tools"]
        assert not result["chats"]
        assert result["flow_name"] == "test_flow"

    def test_single_agent(self) -> None:
        """Test with single agent."""
        agent = create_mock_agent("agent1", "Test Agent")
        waldiez = create_mock_waldiez(agents=[agent])

        result = ensure_unique_names(waldiez)

        assert result["agent_names"] == {"agent1": "test_agent"}
        assert result["agents"] == [agent]
        assert result["flow_name"] == "test_flow"

    def test_single_model(self) -> None:
        """Test with single model."""
        model = create_mock_model("model1", "GPT-4")
        waldiez = create_mock_waldiez(models=[model])

        result = ensure_unique_names(waldiez)

        assert result["model_names"] == {"model1": "gpt_4"}
        assert result["models"] == [model]

    def test_single_tool(self) -> None:
        """Test with single tool."""
        tool = create_mock_tool("tool1", "Calculator")
        waldiez = create_mock_waldiez(tools=[tool])

        result = ensure_unique_names(waldiez)

        assert result["tool_names"] == {"tool1": "calculator"}
        assert result["tools"] == [tool]

    def test_single_chat(self) -> None:
        """Test with single chat."""
        chat = create_mock_chat("chat1", "Main Chat")
        waldiez = create_mock_waldiez(chats=[chat])

        result = ensure_unique_names(waldiez)

        assert result["chat_names"] == {"chat1": "main_chat"}
        assert result["chats"] == [chat]

    def test_name_conflicts_across_types(self) -> None:
        """Test name conflicts across different types get proper prefixes."""
        agent = create_mock_agent("agent1", "test")
        model = create_mock_model("model1", "test")
        tool = create_mock_tool("tool1", "test")
        chat = create_mock_chat("chat1", "test")

        waldiez = create_mock_waldiez(
            agents=[agent],
            models=[model],
            tools=[tool],
            chats=[chat],
            flow_name="test",
        )

        result = ensure_unique_names(waldiez)

        # Each should get its type prefix since names conflict
        assert result["agent_names"]["agent1"] == "test"  # First gets the name
        assert (
            result["model_names"]["model1"] == "wm_test"
        )  # Second gets prefix
        assert result["tool_names"]["tool1"] == "ws_test"  # Third gets prefix
        assert result["chat_names"]["chat1"] == "wc_test"  # Fourth gets prefix
        assert result["flow_name"] == "wf_test"  # Flow gets prefix

    def test_multiple_agents_same_name(self) -> None:
        """Test multiple agents with same name get indexed."""
        agent1 = create_mock_agent("agent1", "Assistant")
        agent2 = create_mock_agent("agent2", "Assistant")
        agent3 = create_mock_agent("agent3", "Assistant")

        waldiez = create_mock_waldiez(agents=[agent1, agent2, agent3])

        result = ensure_unique_names(waldiez)

        assert result["agent_names"]["agent1"] == "assistant"
        assert result["agent_names"]["agent2"] == "wa_assistant"
        assert result["agent_names"]["agent3"] == "wa_assistant_1"

    def test_complex_scenario_all_types(self) -> None:
        """Test complex scenario with all types and conflicts."""
        agents = [
            create_mock_agent("a1", "Main Agent"),
            create_mock_agent("a2", "Helper Agent"),
        ]
        models = [
            create_mock_model("m1", "GPT-4"),
            create_mock_model("m2", "Claude"),
        ]
        tools = [
            create_mock_tool("t1", "Calculator"),
            create_mock_tool("t2", "Web Search"),
        ]
        chats = [
            create_mock_chat("c1", "Primary Chat"),
            create_mock_chat("c2", "Secondary Chat"),
        ]

        waldiez = create_mock_waldiez(
            agents=agents,
            models=models,
            tools=tools,
            chats=chats,
            flow_name="Complex Flow",
        )

        result = ensure_unique_names(waldiez)

        # Check all components are present
        assert len(result["agent_names"]) == 2
        assert len(result["model_names"]) == 2
        assert len(result["tool_names"]) == 2
        assert len(result["chat_names"]) == 2
        assert result["flow_name"] == "complex_flow"

        # Check specific mappings
        assert result["agent_names"]["a1"] == "main_agent"
        assert result["agent_names"]["a2"] == "helper_agent"
        assert result["model_names"]["m1"] == "gpt_4"
        assert result["model_names"]["m2"] == "claude"
        assert result["tool_names"]["t1"] == "calculator"
        assert result["tool_names"]["t2"] == "web_search"
        assert result["chat_names"]["c1"] == "primary_chat"
        assert result["chat_names"]["c2"] == "secondary_chat"

    def test_custom_max_length(self) -> None:
        """Test custom max_length parameter."""
        agent = create_mock_agent(
            "agent1", "Very Long Agent Name That Exceeds Limit"
        )
        waldiez = create_mock_waldiez(agents=[agent])

        result = ensure_unique_names(waldiez, max_length=10)

        # Name should be truncated to 10 characters
        assert len(result["agent_names"]["agent1"]) == 9
        assert result["agent_names"]["agent1"] == "very_long"

    def test_custom_flow_name_max_length(self) -> None:
        """Test custom flow_name_max_length parameter."""
        waldiez = create_mock_waldiez(
            flow_name="Very Long Flow Name That Exceeds Limit"
        )

        result = ensure_unique_names(waldiez, flow_name_max_length=8)

        # Flow name should be truncated to 8 characters
        assert len(result["flow_name"]) == 8
        assert result["flow_name"] == "very_lon"

    def test_invalid_python_names_get_cleaned(self) -> None:
        """Test that invalid Python names get properly cleaned."""
        agent = create_mock_agent("agent1", "123-Invalid@Name#")
        model = create_mock_model("model1", "Model->Agent")

        waldiez = create_mock_waldiez(agents=[agent], models=[model])

        result = ensure_unique_names(waldiez)

        assert result["agent_names"]["agent1"] == "wa_123_invalid_name"
        assert result["model_names"]["model1"] == "modeltoagent"

    def test_result_type_structure(self) -> None:
        """Test that result has correct structure and types."""
        agent = create_mock_agent("a1", "Agent")
        model = create_mock_model("m1", "Model")

        waldiez = create_mock_waldiez(agents=[agent], models=[model])

        result = ensure_unique_names(waldiez)

        # Check all required keys exist
        required_keys = [
            "agent_names",
            "model_names",
            "tool_names",
            "chat_names",
            "agents",
            "models",
            "tools",
            "chats",
            "flow_name",
        ]
        for key in required_keys:
            assert key in result

        # Check types
        assert isinstance(result["agent_names"], dict)
        assert isinstance(result["model_names"], dict)
        assert isinstance(result["tool_names"], dict)
        assert isinstance(result["chat_names"], dict)
        assert isinstance(result["agents"], list)
        assert isinstance(result["models"], list)
        assert isinstance(result["tools"], list)
        assert isinstance(result["chats"], list)
        assert isinstance(result["flow_name"], str)


class TestEdgeCases:
    """Test edge cases and unusual scenarios."""

    def test_empty_names(self) -> None:
        """Test with empty names."""
        agent = create_mock_agent("agent1", "")
        model = create_mock_model("model1", "   ")  # Only spaces

        waldiez = create_mock_waldiez(agents=[agent], models=[model])

        result = ensure_unique_names(waldiez)

        assert result["agent_names"]["agent1"] == "wa_"
        assert result["model_names"]["model1"] == "wm_"

    def test_very_long_names(self) -> None:
        """Test with very long names."""
        long_name = "a" * 200
        agent = create_mock_agent("agent1", long_name)

        waldiez = create_mock_waldiez(agents=[agent])

        result = ensure_unique_names(waldiez)

        # Should be truncated to default max length
        assert len(result["agent_names"]["agent1"]) == MAX_VARIABLE_LENGTH

    def test_unicode_characters(self) -> None:
        """Test with unicode characters."""
        agent = create_mock_agent("agent1", "Agënt Tést 🤖")
        waldiez = create_mock_waldiez(agents=[agent])

        result = ensure_unique_names(waldiez)

        # Unicode should be replaced with underscores
        assert result["agent_names"]["agent1"] == "ag_nt_t_st"

    def test_all_special_characters(self) -> None:
        """Test name with only special characters."""
        agent = create_mock_agent("agent1", "@#$%^&*()")
        waldiez = create_mock_waldiez(agents=[agent])

        result = ensure_unique_names(waldiez)

        # Should get default prefix since all chars are invalid
        assert result["agent_names"]["agent1"] == "wa_"

    def test_numbers_only_name(self) -> None:
        """Test name with only numbers."""
        agent = create_mock_agent("agent1", "123456")
        waldiez = create_mock_waldiez(agents=[agent])

        result = ensure_unique_names(waldiez)

        # Should get prefix since starts with number
        assert result["agent_names"]["agent1"] == "wa_123456"


class TestIntegration:
    """Integration tests for realistic scenarios."""

    def test_realistic_ai_workflow(self) -> None:
        """Test realistic AI workflow with typical names."""
        agents = [
            create_mock_agent("user_proxy_1", "User Proxy"),
            create_mock_agent("assistant_1", "AI Assistant"),
            create_mock_agent("code_reviewer", "Code Reviewer"),
        ]
        models = [
            create_mock_model("gpt4_model", "GPT-4"),
            create_mock_model("claude_model", "Claude-3"),
        ]
        tools = [
            create_mock_tool("python_tool", "Python Executor"),
            create_mock_tool("web_tool", "Web Search"),
        ]
        chats = [
            create_mock_chat("main_chat", "Main Discussion"),
            create_mock_chat("review_chat", "Code Review"),
        ]

        waldiez = create_mock_waldiez(
            agents=agents,
            models=models,
            tools=tools,
            chats=chats,
            flow_name="AI Coding Assistant",
        )

        result = ensure_unique_names(waldiez)

        # Verify realistic output
        assert result["agent_names"]["user_proxy_1"] == "user_proxy"
        assert result["agent_names"]["assistant_1"] == "ai_assistant"
        assert result["agent_names"]["code_reviewer"] == "code_reviewer"

        assert result["model_names"]["gpt4_model"] == "gpt_4"
        assert result["model_names"]["claude_model"] == "claude_3"

        assert result["tool_names"]["python_tool"] == "python_executor"
        assert result["tool_names"]["web_tool"] == "web_search"

        assert result["chat_names"]["main_chat"] == "main_discussion"
        assert result["chat_names"]["review_chat"] == "code_review"

        assert result["flow_name"] == "ai_coding_assistant"

    def test_massive_name_conflicts(self) -> None:
        """Test scenario with many identical names."""
        # Create 10 agents all named "Agent"
        agents = [create_mock_agent(f"agent_{i}", "Agent") for i in range(10)]
        waldiez = create_mock_waldiez(agents=agents)

        result = ensure_unique_names(waldiez)

        # First should get the base name, others should get prefixes/indices
        assert result["agent_names"]["agent_0"] == "agent"
        assert result["agent_names"]["agent_1"] == "wa_agent"
        assert result["agent_names"]["agent_2"] == "wa_agent_1"
        assert result["agent_names"]["agent_3"] == "wa_agent_2"
        # ... and so on

        # All names should be unique
        names = list(result["agent_names"].values())
        assert len(names) == len(set(names))  # No duplicates
