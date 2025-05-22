# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use
"""Test waldiez.models.agents.agent.handoff.*."""

import uuid
from typing import Any, Literal

import pytest
from pydantic import ValidationError

from waldiez.models.agents.agent.handoff import (
    WaldiezAgentHandoff,
    WaldiezAgentTarget,
    WaldiezContextStrLLMCondition,
    WaldiezExpressionContextCondition,
    WaldiezGroupOrNestedTarget,
    WaldiezOnCondition,
    WaldiezOnContextCondition,
    WaldiezRandomAgentTarget,
    WaldiezSimpleTarget,
    WaldiezStringContextCondition,
    WaldiezStringLLMCondition,
)


class TestWaldiezAgentTarget:
    """Test WaldiezAgentTarget class."""

    def test_valid_agent_target(self) -> None:
        """Test creating a valid agent target."""
        target = WaldiezAgentTarget(
            target_type="AgentTarget", target="agent123", order=1
        )
        assert target.target_type == "AgentTarget"
        assert target.target == "agent123"
        assert target.order == 1

    def test_agent_target_default_order(self) -> None:
        """Test default order value."""
        target = WaldiezAgentTarget(
            target_type="AgentTarget", target="agent123"
        )
        assert target.order == -1

    def test_agent_target_validation_error(self) -> None:
        """Test validation errors for agent target."""
        with pytest.raises(ValidationError):  # Wrong type
            WaldiezAgentTarget(
                target_type="InvalidType",  # type: ignore
                target="agent123",
            )

    def test_agent_target_missing_required_field(self) -> None:
        """Test missing required field."""
        with pytest.raises(ValidationError):  # Missing target
            WaldiezAgentTarget(target_type="AgentTarget")  # pyright: ignore


class TestWaldiezRandomAgentTarget:
    """Test WaldiezRandomAgentTarget class."""

    def test_valid_random_agent_target(self) -> None:
        """Test creating a valid random agent target."""
        target = WaldiezRandomAgentTarget(
            target_type="RandomAgentTarget",
            target=["agent1", "agent2", "agent3"],
            order=2,
        )
        assert target.target_type == "RandomAgentTarget"
        assert target.target == ["agent1", "agent2", "agent3"]
        assert target.order == 2

    def test_random_agent_target_minimum_agents(self) -> None:
        """Test minimum of 2 agents required."""
        target = WaldiezRandomAgentTarget(
            target_type="RandomAgentTarget", target=["agent1", "agent2"]
        )
        assert len(target.target) == 2

    def test_random_agent_target_too_few_agents(self) -> None:
        """Test validation error with too few agents."""
        with pytest.raises(ValidationError):
            WaldiezRandomAgentTarget(
                target_type="RandomAgentTarget",
                target=["agent1"],  # Only 1 agent, need at least 2
            )

    def test_random_agent_target_empty_list(self) -> None:
        """Test validation error with empty list."""
        with pytest.raises(ValidationError):
            WaldiezRandomAgentTarget(target_type="RandomAgentTarget", target=[])


class TestWaldiezSimpleTarget:
    """Test WaldiezSimpleTarget class."""

    @pytest.mark.parametrize(
        "target_type",
        [
            "AskUserTarget",
            "GroupManagerTarget",
            "RevertToUserTarget",
            "StayTarget",
            "TerminateTarget",
        ],
    )
    def test_valid_simple_targets(
        self,
        target_type: Literal[
            "AskUserTarget",
            "GroupManagerTarget",
            "RevertToUserTarget",
            "StayTarget",
            "TerminateTarget",
        ],
    ) -> None:
        """Test all valid simple target types.

        Parameters
        ----------
        target_type : Literal[
            "AskUserTarget",
            "GroupManagerTarget",
            "RevertToUserTarget",
            "StayTarget",
            "TerminateTarget"
        ]
            The type of the target.
        """
        target = WaldiezSimpleTarget(target_type=target_type, order=1)
        assert target.target_type == target_type
        assert target.order == 1

    def test_simple_target_default_values(self) -> None:
        """Test default values for simple target."""
        target = WaldiezSimpleTarget()
        assert target.target_type == "TerminateTarget"
        assert target.order == -1

    def test_simple_target_invalid_type(self) -> None:
        """Test validation error with invalid target type."""
        with pytest.raises(ValidationError):  # Invalid target type
            WaldiezSimpleTarget(target_type="InvalidTarget")  # type: ignore


class TestWaldiezGroupOrNestedTarget:
    """Test WaldiezGroupOrNestedTarget class."""

    @pytest.mark.parametrize(
        "target_type", ["GroupChatTarget", "NestedChatTarget"]
    )
    def test_valid_group_or_nested_target(
        self, target_type: Literal["GroupChatTarget", "NestedChatTarget"]
    ) -> None:
        """Test valid group or nested targets.

        Parameters
        ----------
        target_type : Literal["GroupChatTarget", "NestedChatTarget"]
            The type of the target.
        """
        target = WaldiezGroupOrNestedTarget(
            target_type=target_type, target="group123", order=3
        )
        assert target.target_type == target_type
        assert target.target == "group123"
        assert target.order == 3

    def test_group_or_nested_target_missing_target(self) -> None:
        """Test validation error when target is missing."""
        with pytest.raises(ValidationError):  # Missing target
            WaldiezGroupOrNestedTarget(
                target_type="GroupChatTarget",  # pyright: ignore
            )

    def test_group_or_nested_target_invalid_type(self) -> None:
        """Test validation error with invalid target type."""
        with pytest.raises(ValidationError):  # Invalid target type
            WaldiezGroupOrNestedTarget(
                target_type="InvalidChatTarget",  # type: ignore
                target="group123",
            )


class TestWaldiezStringLLMCondition:
    """Test WaldiezStringLLMCondition class."""

    def test_valid_string_llm_condition(self) -> None:
        """Test creating valid string LLM condition."""
        condition = WaldiezStringLLMCondition(
            condition_type="string_llm",
            prompt="Is the user satisfied?",
            data={"temperature": 0.7},
        )
        assert condition.condition_type == "string_llm"
        assert condition.prompt == "Is the user satisfied?"
        assert condition.data == {"temperature": 0.7}

    def test_string_llm_condition_default_data(self) -> None:
        """Test default empty data dict."""
        condition = WaldiezStringLLMCondition(
            condition_type="string_llm", prompt="Test prompt"
        )
        assert condition.data == {}

    def test_string_llm_condition_missing_prompt(self) -> None:
        """Test validation error when prompt is missing."""
        with pytest.raises(ValidationError):  # Missing prompt
            WaldiezStringLLMCondition(
                condition_type="string_llm",  # pyright: ignore
            )


class TestWaldiezContextStrLLMCondition:
    """Test WaldiezContextStrLLMCondition class."""

    def test_valid_context_str_llm_condition(self) -> None:
        """Test creating valid context string LLM condition."""
        condition = WaldiezContextStrLLMCondition(
            condition_type="context_str_llm",
            context_str="user_feedback",
            data={"model": "gpt-4"},
        )
        assert condition.condition_type == "context_str_llm"
        assert condition.context_str == "user_feedback"
        assert condition.data == {"model": "gpt-4"}

    def test_context_str_llm_condition_default_data(self) -> None:
        """Test default empty data dict."""
        condition = WaldiezContextStrLLMCondition(
            condition_type="context_str_llm", context_str="test_context"
        )
        assert condition.data == {}


class TestWaldiezStringContextCondition:
    """Test WaldiezStringContextCondition class."""

    def test_valid_string_context_condition(self) -> None:
        """Test creating valid string context condition."""
        condition = WaldiezStringContextCondition(
            condition_type="string_context", variable_name="user_input"
        )
        assert condition.condition_type == "string_context"
        assert condition.variable_name == "user_input"

    def test_string_context_condition_missing_variable(self) -> None:
        """Test validation error when variable_name is missing."""
        with pytest.raises(ValidationError):  # Missing variable_name
            WaldiezStringContextCondition(
                condition_type="string_context",  # pyright: ignore
            )


class TestWaldiezExpressionContextCondition:
    """Test WaldiezExpressionContextCondition class."""

    def test_valid_expression_context_condition(self) -> None:
        """Test creating valid expression context condition."""
        condition = WaldiezExpressionContextCondition(
            condition_type="expression_context",
            expression="len(messages) > 5",
            data={"timeout": 30},
        )
        assert condition.condition_type == "expression_context"
        assert condition.expression == "len(messages) > 5"
        assert condition.data == {"timeout": 30}

    def test_expression_context_condition_default_data(self) -> None:
        """Test default empty data dict."""
        condition = WaldiezExpressionContextCondition(
            condition_type="expression_context", expression="True"
        )
        assert condition.data == {}


class TestWaldiezOnCondition:
    """Test WaldiezOnCondition class."""

    def test_valid_on_condition_with_string_llm(self) -> None:
        """Test creating valid on condition with string LLM condition."""
        target = WaldiezAgentTarget(
            target_type="AgentTarget", target="agent123"
        )
        llm_condition = WaldiezStringLLMCondition(
            condition_type="string_llm",
            prompt="Should we continue?",
        )
        on_condition = WaldiezOnCondition(
            target=target, condition=llm_condition
        )
        assert on_condition.target == target
        assert on_condition.condition == llm_condition

    def test_valid_on_condition_with_context_str_llm(self) -> None:
        """Test creating valid on condition with ctx string LLM condition."""
        target = WaldiezSimpleTarget(target_type="TerminateTarget")
        llm_condition = WaldiezContextStrLLMCondition(
            condition_type="context_str_llm", context_str="conversation_state"
        )
        on_condition = WaldiezOnCondition(
            target=target, condition=llm_condition
        )
        assert on_condition.target == target
        assert on_condition.condition == llm_condition


class TestWaldiezOnContextCondition:
    """Test WaldiezOnContextCondition class."""

    def test_valid_on_context_condition_with_string(self) -> None:
        """Test creating valid on context condition with string condition."""
        target = WaldiezRandomAgentTarget(
            target_type="RandomAgentTarget", target=["agent1", "agent2"]
        )
        context_condition = WaldiezStringContextCondition(
            condition_type="string_context", variable_name="should_escalate"
        )
        on_context_condition = WaldiezOnContextCondition(
            target=target, condition=context_condition
        )
        assert on_context_condition.target == target
        assert on_context_condition.condition == context_condition

    def test_valid_on_context_condition_with_expression(self) -> None:
        """Test creating valid on context condition with expr condition."""
        target = WaldiezGroupOrNestedTarget(
            target_type="GroupChatTarget", target="support_group"
        )
        context_condition = WaldiezExpressionContextCondition(
            condition_type="expression_context",
            expression="priority == 'high'",
        )
        on_context_condition = WaldiezOnContextCondition(
            target=target, condition=context_condition
        )
        assert on_context_condition.target == target
        assert on_context_condition.condition == context_condition


class TestWaldiezAgentHandoff:
    """Test WaldiezAgentHandoff class."""

    def test_minimal_agent_handoff(self) -> None:
        """Test creating minimal agent handoff."""
        handoff = WaldiezAgentHandoff(id=uuid.uuid4().hex)

        # Should have auto-generated UUID
        assert handoff.id is not None
        assert len(handoff.id) == 32  # hex UUID length

        # Optional fields should be None
        assert handoff.llm_conditions is None
        assert handoff.context_conditions is None
        assert handoff.after_work is None
        assert handoff.explicit_tool_handoff_info is None

    def test_agent_handoff_with_custom_id(self) -> None:
        """Test creating agent handoff with custom ID."""
        custom_id = "custom_handoff_123"
        handoff = WaldiezAgentHandoff(id=custom_id)
        assert handoff.id == custom_id

    def test_agent_handoff_with_llm_conditions(self) -> None:
        """Test agent handoff with LLM conditions."""
        target = WaldiezAgentTarget(
            target_type="AgentTarget", target="escalation_agent"
        )
        llm_condition = WaldiezStringLLMCondition(
            condition_type="string_llm", prompt="Should we escalate this issue?"
        )
        on_condition = WaldiezOnCondition(
            target=target,
            condition=llm_condition,
        )

        handoff = WaldiezAgentHandoff(
            id=uuid.uuid4().hex,
            llm_conditions=[on_condition],
        )
        assert handoff.llm_conditions is not None
        assert len(handoff.llm_conditions) == 1
        # pylint: disable=unsubscriptable-object
        first_condition = handoff.llm_conditions[0]
        assert isinstance(first_condition, WaldiezOnCondition)
        assert first_condition.target == target
        assert first_condition.condition == llm_condition

    def test_agent_handoff_with_context_conditions(self) -> None:
        """Test agent handoff with context conditions."""
        target = WaldiezSimpleTarget(target_type="TerminateTarget")
        context_condition = WaldiezStringContextCondition(
            condition_type="string_context", variable_name="is_complete"
        )
        on_context_condition = WaldiezOnContextCondition(
            target=target, condition=context_condition
        )

        handoff = WaldiezAgentHandoff(
            id=uuid.uuid4().hex,
            context_conditions=[on_context_condition],
        )
        assert handoff.context_conditions is not None
        assert len(handoff.context_conditions) == 1
        # pylint: disable=unsubscriptable-object
        first_condition = handoff.context_conditions[0]
        assert isinstance(first_condition, WaldiezOnContextCondition)
        assert first_condition.target == target
        assert first_condition.condition == context_condition

    def test_agent_handoff_with_after_work_target(self) -> None:
        """Test agent handoff with after_work target."""
        after_work_target = WaldiezGroupOrNestedTarget(
            target_type="NestedChatTarget", target="cleanup_chat"
        )

        handoff = WaldiezAgentHandoff(
            id=uuid.uuid4().hex, after_work=after_work_target
        )

        assert handoff.after_work == after_work_target

    def test_agent_handoff_with_explicit_tool_info(self) -> None:
        """Test agent handoff with explicit tool handoff info."""
        tool_info: dict[str, Any] = {
            "tool_name": "database_query",
            "parameters": {"table": "users", "limit": 100},
        }

        handoff = WaldiezAgentHandoff(
            id=uuid.uuid4().hex,
            explicit_tool_handoff_info=tool_info,
        )

        assert handoff.explicit_tool_handoff_info == tool_info

    def test_complex_agent_handoff(self) -> None:
        """Test complex agent handoff with all components."""
        # Create targets
        agent_target = WaldiezAgentTarget(
            target_type="AgentTarget", target="specialist_agent", order=1
        )

        random_target = WaldiezRandomAgentTarget(
            target_type="RandomAgentTarget",
            target=["agent1", "agent2", "agent3"],
            order=2,
        )

        # Create conditions
        llm_condition = WaldiezContextStrLLMCondition(
            condition_type="context_str_llm",
            context_str="conversation_complexity",
            data={"temperature": 0.3},
        )

        context_condition = WaldiezExpressionContextCondition(
            condition_type="expression_context",
            expression="urgency_level > 3",
            data={"threshold": 3},
        )

        # Create condition wrappers
        on_llm_condition = WaldiezOnCondition(
            target=agent_target, condition=llm_condition
        )

        on_context_condition = WaldiezOnContextCondition(
            target=random_target, condition=context_condition
        )

        # Create after work target
        after_work = WaldiezSimpleTarget(
            target_type="TerminateTarget", order=99
        )

        # Create handoff
        handoff = WaldiezAgentHandoff(
            id=uuid.uuid4().hex,
            llm_conditions=[on_llm_condition],
            context_conditions=[on_context_condition],
            after_work=after_work,
            explicit_tool_handoff_info={"cleanup": True},
        )

        # Verify all components
        assert handoff.llm_conditions is not None
        assert len(handoff.llm_conditions) == 1
        assert handoff.context_conditions is not None
        assert len(handoff.context_conditions) == 1
        assert handoff.after_work == after_work
        assert handoff.explicit_tool_handoff_info == {"cleanup": True}

        # Verify nested structure
        # pylint: disable=unsubscriptable-object
        first_llm_condition = handoff.llm_conditions[0]
        assert isinstance(first_llm_condition, WaldiezOnCondition)
        assert first_llm_condition.target == agent_target
        assert first_llm_condition.condition == llm_condition
        assert isinstance(
            first_llm_condition.condition, WaldiezContextStrLLMCondition
        )
        assert (
            first_llm_condition.condition.context_str
            == "conversation_complexity"
        )
        assert first_llm_condition.condition.data == {"temperature": 0.3}
        assert isinstance(first_llm_condition.target, WaldiezAgentTarget)
        assert first_llm_condition.target.target == "specialist_agent"
        assert first_llm_condition.target.target_type == "AgentTarget"
        assert first_llm_condition.target.order == 1
        # pylint: disable=unsubscriptable-object
        first_context_condition = handoff.context_conditions[0]
        assert isinstance(first_context_condition, WaldiezOnContextCondition)
        assert first_context_condition.target == random_target
        assert first_context_condition.condition == context_condition
        assert isinstance(
            first_context_condition.condition, WaldiezExpressionContextCondition
        )
        assert (
            first_context_condition.condition.expression == "urgency_level > 3"
        )
        assert first_context_condition.condition.data == {"threshold": 3}
        assert isinstance(
            first_context_condition.target, WaldiezRandomAgentTarget
        )
        assert first_context_condition.target.target == [
            "agent1",
            "agent2",
            "agent3",
        ]
        assert first_context_condition.target.target_type == "RandomAgentTarget"
        assert first_context_condition.target.order == 2


class TestTransitionTargetDiscrimination:
    """Test WaldiezTransitionTarget discriminated union."""

    def test_transition_target_agent_discrimination(self) -> None:
        """Test that agent targets are properly discriminated."""
        data: dict[str, Any] = {
            "target_type": "AgentTarget",
            "target": "agent123",
            "order": 1,
        }

        # This should work with the discriminated union
        target = WaldiezAgentTarget(**data)
        assert isinstance(target, WaldiezAgentTarget)

    def test_transition_target_random_agent_discrimination(self) -> None:
        """Test that random agent targets are properly discriminated."""
        data: dict[str, Any] = {
            "target_type": "RandomAgentTarget",
            "target": ["agent1", "agent2"],
            "order": 1,
        }

        target = WaldiezRandomAgentTarget(**data)
        assert isinstance(target, WaldiezRandomAgentTarget)

    def test_transition_target_simple_discrimination(self) -> None:
        """Test that simple targets are properly discriminated."""
        data: dict[str, Any] = {"target_type": "TerminateTarget", "order": 1}

        target = WaldiezSimpleTarget(**data)
        assert isinstance(target, WaldiezSimpleTarget)

    def test_transition_target_group_discrimination(self) -> None:
        """Test that group targets are properly discriminated."""
        data: dict[str, Any] = {
            "target_type": "GroupChatTarget",
            "target": "group123",
            "order": 1,
        }

        target = WaldiezGroupOrNestedTarget(**data)
        assert isinstance(target, WaldiezGroupOrNestedTarget)


class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_uuid_generation_uniqueness(self) -> None:
        """Test that UUIDs are unique across handoff instances."""
        handoff1 = WaldiezAgentHandoff(id=uuid.uuid4().hex)
        handoff2 = WaldiezAgentHandoff(id=uuid.uuid4().hex)

        assert handoff1.id != handoff2.id
        assert len(handoff1.id) == 32
        assert len(handoff2.id) == 32

    def test_empty_lists_in_handoff(self) -> None:
        """Test handoff with empty condition lists."""
        handoff = WaldiezAgentHandoff(
            id=uuid.uuid4().hex, llm_conditions=[], context_conditions=[]
        )

        assert not handoff.llm_conditions
        assert not handoff.context_conditions

    def test_large_data_dictionaries(self) -> None:
        """Test handling of large data dictionaries."""
        large_data = {f"key_{i}": f"value_{i}" for i in range(100)}

        condition = WaldiezStringLLMCondition(
            condition_type="string_llm", prompt="Test", data=large_data
        )

        assert len(condition.data) == 100
        assert condition.data["key_50"] == "value_50"

    def test_special_characters_in_strings(self) -> None:
        """Test handling of special characters in string fields."""
        special_chars = "Hello! @#$%^&*()_+-=[]{}|;:,.<>?"

        target = WaldiezAgentTarget(
            target_type="AgentTarget", target=special_chars
        )

        assert target.target == special_chars

    def test_unicode_characters(self) -> None:
        """Test handling of unicode characters."""
        unicode_text = "Hello 世界 🌍 café naïve résumé"

        condition = WaldiezStringLLMCondition(
            condition_type="string_llm", prompt=unicode_text
        )

        assert condition.prompt == unicode_text
