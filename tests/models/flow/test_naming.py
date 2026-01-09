# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=missing-module-docstring,missing-class-docstring,line-too-long
# pylint: disable=missing-function-docstring,missing-param-doc,missing-return-doc
# pylint: disable=no-self-use
"""Test waldiez.models.flow.naming.*."""

from unittest.mock import Mock

from waldiez.models import (
    MAX_VARIABLE_LENGTH,
    Waldiez,
    WaldiezAgent,
    WaldiezChat,
    WaldiezFlow,
    WaldiezModel,
    WaldiezTool,
    WaldiezUniqueNames,
    ensure_unique_names,
)

from ..common.test_naming import (
    create_mock_agent,
    create_mock_chat,
    create_mock_model,
    create_mock_tool,
)


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
    # waldiez.agents = agents or []
    # waldiez.models = models or []
    # waldiez.tools = tools or []

    # Mock flow with nested data structure
    waldiez.flow = Mock(spec=WaldiezFlow)
    waldiez.flow.id = flow_id
    waldiez.flow.name = flow_name
    waldiez.flow.data = Mock()
    waldiez.flow.data.agents.members = agents or []
    waldiez.flow.data.models = models or []
    waldiez.flow.data.tools = tools or []
    waldiez.flow.data.chats = chats or []

    return waldiez


def _get_unique_names(
    waldiez: Waldiez,
    max_length: int = MAX_VARIABLE_LENGTH,
    flow_name_max_length: int = 20,
) -> WaldiezUniqueNames:
    """Extract unique names from a Waldiez instance."""
    result = ensure_unique_names(
        flow_name=waldiez.flow.name,
        flow_id=waldiez.flow.id,
        flow_agents=waldiez.flow.data.agents.members,
        flow_models=waldiez.flow.data.models,
        flow_tools=waldiez.flow.data.tools,
        flow_chats=waldiez.flow.data.chats,
        max_length=max_length,
        flow_name_max_length=flow_name_max_length,
    )
    return result


class TestEnsureWaldiezUniqueNames:
    """Test the ensure_unique_names function."""

    def test_empty_waldiez(self) -> None:
        """Test with empty Waldiez instance."""
        waldiez = create_mock_waldiez()
        result = _get_unique_names(waldiez)

        assert not result["agent_names"]
        assert not result["model_names"]
        assert not result["tool_names"]
        assert not result["chat_names"]
        assert not result["agents"]
        assert not result["models"]
        assert not result["tools"]
        assert not result["chats"]
        assert result["flow_name"] == "Test_Flow"

    def test_single_agent(self) -> None:
        """Test with single agent."""
        agent = create_mock_agent("agent1", "Test Agent")
        waldiez = create_mock_waldiez(agents=[agent])

        result = _get_unique_names(waldiez)

        assert result["agent_names"] == {"agent1": "Test_Agent"}
        assert result["agents"] == [agent]
        assert result["flow_name"] == "Test_Flow"

    def test_single_model(self) -> None:
        """Test with single model."""
        model = create_mock_model("model1", "GPT-4")
        waldiez = create_mock_waldiez(models=[model])

        result = _get_unique_names(waldiez)

        assert result["model_names"] == {"model1": "GPT_4"}
        assert result["models"] == [model]

    def test_single_tool(self) -> None:
        """Test with single tool."""
        tool = create_mock_tool("tool1", "Calculator")
        waldiez = create_mock_waldiez(tools=[tool])

        result = _get_unique_names(waldiez)

        assert result["tool_names"] == {"tool1": "Calculator"}
        assert result["tools"] == [tool]

    def test_single_chat(self) -> None:
        """Test with single chat."""
        chat = create_mock_chat("chat1", "Main Chat")
        waldiez = create_mock_waldiez(chats=[chat])

        result = _get_unique_names(waldiez)

        assert result["chat_names"] == {"chat1": "Main_Chat"}
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

        result = _get_unique_names(waldiez)

        # Each should get its type prefix since names conflict
        assert result["agent_names"]["agent1"] == "test"  # First gets the name
        assert (
            result["model_names"]["model1"] == "wm_test"
        )  # Second gets prefix
        assert result["tool_names"]["tool1"] == "wt_test"  # Third gets prefix
        assert result["chat_names"]["chat1"] == "wc_test"  # Fourth gets prefix
        assert result["flow_name"] == "wf_test"  # Flow gets prefix

    def test_multiple_agents_same_name(self) -> None:
        """Test multiple agents with same name get indexed."""
        agent1 = create_mock_agent("agent1", "Assistant")
        agent2 = create_mock_agent("agent2", "Assistant")
        agent3 = create_mock_agent("agent3", "Assistant")

        waldiez = create_mock_waldiez(agents=[agent1, agent2, agent3])

        result = _get_unique_names(waldiez)

        assert result["agent_names"]["agent1"] == "Assistant"
        assert result["agent_names"]["agent2"] == "wa_Assistant"
        assert result["agent_names"]["agent3"] == "wa_Assistant_1"

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

        result = _get_unique_names(waldiez)

        # Check all components are present
        assert len(result["agent_names"]) == 2
        assert len(result["model_names"]) == 2
        assert len(result["tool_names"]) == 2
        assert len(result["chat_names"]) == 2
        assert result["flow_name"] == "Complex_Flow"

        # Check specific mappings
        assert result["agent_names"]["a1"] == "Main_Agent"
        assert result["agent_names"]["a2"] == "Helper_Agent"
        assert result["model_names"]["m1"] == "GPT_4"
        assert result["model_names"]["m2"] == "Claude"
        assert result["tool_names"]["t1"] == "Calculator"
        assert result["tool_names"]["t2"] == "Web_Search"
        assert result["chat_names"]["c1"] == "Primary_Chat"
        assert result["chat_names"]["c2"] == "Secondary_Chat"

    def test_custom_max_length(self) -> None:
        """Test custom max_length parameter."""
        agent = create_mock_agent(
            "agent1", "Very Long Agent Name That Exceeds Limit"
        )
        waldiez = create_mock_waldiez(agents=[agent])

        result = _get_unique_names(waldiez, max_length=10)

        # Name should be truncated to 10 characters
        assert len(result["agent_names"]["agent1"]) == 9
        assert result["agent_names"]["agent1"] == "Very_Long"

    def test_custom_flow_name_max_length(self) -> None:
        """Test custom flow_name_max_length parameter."""
        waldiez = create_mock_waldiez(
            flow_name="Very Long Flow Name That Exceeds Limit"
        )

        result = _get_unique_names(waldiez, flow_name_max_length=8)

        # Flow name should be truncated to 8 characters
        assert len(result["flow_name"]) == 8
        assert result["flow_name"] == "Very_Lon"

    def test_invalid_python_names_get_cleaned(self) -> None:
        """Test that invalid Python names get properly cleaned."""
        agent = create_mock_agent("agent1", "123-Invalid@Name#")
        model = create_mock_model("model1", "Model->Agent")

        waldiez = create_mock_waldiez(agents=[agent], models=[model])

        result = _get_unique_names(waldiez)

        assert result["agent_names"]["agent1"] == "wa_123_Invalid_Name"
        assert result["model_names"]["model1"] == "ModelToAgent"

    def test_result_type_structure(self) -> None:
        """Test that result has correct structure and types."""
        agent = create_mock_agent("a1", "Agent")
        model = create_mock_model("m1", "Model")

        waldiez = create_mock_waldiez(agents=[agent], models=[model])

        result = _get_unique_names(waldiez)

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

        result = _get_unique_names(waldiez)

        assert result["agent_names"]["agent1"] == "wa_"
        assert result["model_names"]["model1"] == "wm_"

    def test_very_long_names(self) -> None:
        """Test with very long names."""
        long_name = "a" * 200
        agent = create_mock_agent("agent1", long_name)

        waldiez = create_mock_waldiez(agents=[agent])

        result = _get_unique_names(waldiez)

        # Should be truncated to default max length
        assert len(result["agent_names"]["agent1"]) == MAX_VARIABLE_LENGTH

    def test_unicode_characters(self) -> None:
        """Test with unicode characters."""
        # cspell: disable-next-line
        agent = create_mock_agent("agent1", "Agënt Tést 🤖")
        waldiez = create_mock_waldiez(agents=[agent])

        result = _get_unique_names(waldiez)

        # Unicode should be replaced with underscores
        assert result["agent_names"]["agent1"] == "Ag_nt_T_st"

    def test_all_special_characters(self) -> None:
        """Test name with only special characters."""
        agent = create_mock_agent("agent1", "@#$%^&*()")
        waldiez = create_mock_waldiez(agents=[agent])

        result = _get_unique_names(waldiez)

        # Should get default prefix since all chars are invalid
        assert result["agent_names"]["agent1"] == "wa_"

    def test_numbers_only_name(self) -> None:
        """Test name with only numbers."""
        agent = create_mock_agent("agent1", "123456")
        waldiez = create_mock_waldiez(agents=[agent])

        result = _get_unique_names(waldiez)

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

        result = _get_unique_names(waldiez)

        # Verify realistic output
        assert result["agent_names"]["user_proxy_1"] == "User_Proxy"
        assert result["agent_names"]["assistant_1"] == "AI_Assistant"
        assert result["agent_names"]["code_reviewer"] == "Code_Reviewer"

        assert result["model_names"]["gpt4_model"] == "GPT_4"
        assert result["model_names"]["claude_model"] == "Claude_3"

        assert result["tool_names"]["python_tool"] == "Python_Executor"
        assert result["tool_names"]["web_tool"] == "Web_Search"

        assert result["chat_names"]["main_chat"] == "Main_Discussion"
        assert result["chat_names"]["review_chat"] == "Code_Review"

        assert result["flow_name"] == "AI_Coding_Assistant"

    def test_massive_name_conflicts(self) -> None:
        """Test scenario with many identical names."""
        # Create 10 agents all named "Agent"
        agents = [create_mock_agent(f"agent_{i}", "Agent") for i in range(10)]
        waldiez = create_mock_waldiez(agents=agents)

        result = _get_unique_names(waldiez)

        # First should get the base name, others should get prefixes/indices
        assert result["agent_names"]["agent_0"] == "Agent"
        assert result["agent_names"]["agent_1"] == "wa_Agent"
        assert result["agent_names"]["agent_2"] == "wa_Agent_1"
        assert result["agent_names"]["agent_3"] == "wa_Agent_2"
        # ... and so on

        # All names should be unique
        names = list(result["agent_names"].values())
        assert len(names) == len(set(names))  # No duplicates
