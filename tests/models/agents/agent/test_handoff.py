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
    WaldiezContextBasedTransition,
    WaldiezContextStrLLMCondition,
    WaldiezExpressionContextCondition,
    WaldiezGroupOrNestedTarget,
    WaldiezLLMBasedTransition,
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
            target_type="AgentTarget", value="agent123", order=1
        )
        assert target.target_type == "AgentTarget"
        assert target.value == "agent123"
        assert target.order == 1

    def test_agent_target_default_order(self) -> None:
        """Test default order value."""
        target = WaldiezAgentTarget(target_type="AgentTarget", value="agent123")
        assert target.order == -1

    def test_agent_target_validation_error(self) -> None:
        """Test validation errors for agent target."""
        with pytest.raises(ValidationError):  # Wrong type
            WaldiezAgentTarget(
                target_type="InvalidType",  # type: ignore
                value="agent123",
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
            value=["agent1", "agent2", "agent3"],
            order=2,
        )
        assert target.target_type == "RandomAgentTarget"
        assert target.value == ["agent1", "agent2", "agent3"]
        assert target.order == 2

    def test_random_agent_target_minimum_agents(self) -> None:
        """Test minimum of 2 agents required."""
        target = WaldiezRandomAgentTarget(
            target_type="RandomAgentTarget", value=["agent1", "agent2"]
        )
        assert len(target.value) == 2

    def test_random_agent_target_too_few_agents(self) -> None:
        """Test validation error with too few agents."""
        with pytest.raises(ValidationError):
            WaldiezRandomAgentTarget(
                target_type="RandomAgentTarget",
                value=["agent1"],  # Only 1 agent, need at least 2
            )

    def test_random_agent_target_empty_list(self) -> None:
        """Test validation error with empty list."""
        with pytest.raises(ValidationError):
            WaldiezRandomAgentTarget(target_type="RandomAgentTarget", value=[])


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
            target_type=target_type, value="group123", order=3
        )
        assert target.target_type == target_type
        assert target.value == "group123"
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
                value="group123",
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


class TestWaldiezLLMBasedTransition:
    """Test WaldiezLLMBasedTransition class."""

    def test_valid_llm_transition_with_string_llm(self) -> None:
        """Test creating valid llm transition with string LLM condition."""
        target = WaldiezAgentTarget(target_type="AgentTarget", value="agent123")
        llm_condition = WaldiezStringLLMCondition(
            condition_type="string_llm",
            prompt="Should we continue?",
        )
        llm_transition = WaldiezLLMBasedTransition(
            target=target, condition=llm_condition
        )
        assert llm_transition.target == target
        assert llm_transition.condition == llm_condition

    def test_valid_llm_stransition_with_context_str_llm(self) -> None:
        """Test creating valid llm transition with ctx string LLM condition."""
        target = WaldiezSimpleTarget(target_type="TerminateTarget")
        llm_condition = WaldiezContextStrLLMCondition(
            condition_type="context_str_llm", context_str="conversation_state"
        )
        llm_transition = WaldiezLLMBasedTransition(
            target=target, condition=llm_condition
        )
        assert llm_transition.target == target
        assert llm_transition.condition == llm_condition


class TestWaldiezContextBasedTransition:
    """Test WaldiezContextBasedTransition class."""

    def test_valid_context_transition_with_string(self) -> None:
        """Test creating valid context transition with string condition."""
        target = WaldiezRandomAgentTarget(
            target_type="RandomAgentTarget", value=["agent1", "agent2"]
        )
        context_condition = WaldiezStringContextCondition(
            condition_type="string_context", variable_name="should_escalate"
        )
        context_transition = WaldiezContextBasedTransition(
            target=target, condition=context_condition
        )
        assert context_transition.target == target
        assert context_transition.condition == context_condition

    def test_valid_context_transition_with_expression(self) -> None:
        """Test creating valid context transition with expr condition."""
        target = WaldiezGroupOrNestedTarget(
            target_type="GroupChatTarget", value="support_group"
        )
        context_condition = WaldiezExpressionContextCondition(
            condition_type="expression_context",
            expression="priority == 'high'",
        )
        context_transition = WaldiezContextBasedTransition(
            target=target, condition=context_condition
        )
        assert context_transition.target == target
        assert context_transition.condition == context_condition


class TestWaldiezAgentHandoff:
    """Test WaldiezAgentHandoff class."""

    def test_minimal_agent_handoff(self) -> None:
        """Test creating minimal agent handoff."""
        handoff = WaldiezAgentHandoff(id=uuid.uuid4().hex)

        # Should have auto-generated UUID
        assert handoff.id is not None
        assert len(handoff.id) == 32  # hex UUID length

        # Optional fields should be None
        assert handoff.llm_transitions is None
        assert handoff.context_transitions is None
        assert handoff.after_work is None

    def test_agent_handoff_with_custom_id(self) -> None:
        """Test creating agent handoff with custom ID."""
        custom_id = "custom_handoff_123"
        handoff = WaldiezAgentHandoff(id=custom_id)
        assert handoff.id == custom_id

    def test_agent_handoff_with_llm_transitions(self) -> None:
        """Test agent handoff with LLM transitions."""
        target = WaldiezAgentTarget(
            target_type="AgentTarget", value="escalation_agent"
        )
        llm_condition = WaldiezStringLLMCondition(
            condition_type="string_llm", prompt="Should we escalate this issue?"
        )
        transition = WaldiezLLMBasedTransition(
            target=target,
            condition=llm_condition,
        )

        handoff = WaldiezAgentHandoff(
            id=uuid.uuid4().hex,
            llm_transitions=[transition],
        )
        assert handoff.llm_transitions is not None
        assert len(handoff.llm_transitions) == 1
        # pylint: disable=unsubscriptable-object
        first_transition = handoff.llm_transitions[0]
        assert isinstance(first_transition, WaldiezLLMBasedTransition)
        assert first_transition.target == target
        assert first_transition.condition == llm_condition

    def test_agent_handoff_with_context_transitions(self) -> None:
        """Test agent handoff with context transitions."""
        target = WaldiezSimpleTarget(target_type="TerminateTarget")
        context_condition = WaldiezStringContextCondition(
            condition_type="string_context", variable_name="is_complete"
        )
        context_transition = WaldiezContextBasedTransition(
            target=target, condition=context_condition
        )

        handoff = WaldiezAgentHandoff(
            id=uuid.uuid4().hex,
            context_transitions=[context_transition],
        )
        assert handoff.context_transitions is not None
        assert len(handoff.context_transitions) == 1
        # pylint: disable=unsubscriptable-object
        first_transition = handoff.context_transitions[0]
        assert isinstance(first_transition, WaldiezContextBasedTransition)
        assert first_transition.target == target
        assert first_transition.condition == context_condition

    def test_agent_handoff_with_after_work_target(self) -> None:
        """Test agent handoff with after_work target."""
        after_work_target = WaldiezGroupOrNestedTarget(
            target_type="NestedChatTarget", value="cleanup_chat"
        )

        handoff = WaldiezAgentHandoff(
            id=uuid.uuid4().hex, after_work=after_work_target
        )

        assert handoff.after_work == after_work_target

    def test_complex_agent_handoff(self) -> None:
        """Test complex agent handoff with all components."""
        # Create targets
        agent_target = WaldiezAgentTarget(
            target_type="AgentTarget", value="specialist_agent", order=1
        )

        random_target = WaldiezRandomAgentTarget(
            target_type="RandomAgentTarget",
            value=["agent1", "agent2", "agent3"],
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

        # Create transitions
        llm_transition = WaldiezLLMBasedTransition(
            target=agent_target, condition=llm_condition
        )

        context_transition = WaldiezContextBasedTransition(
            target=random_target,
            condition=context_condition,
        )

        # Create after work target
        after_work = WaldiezSimpleTarget(
            target_type="TerminateTarget", order=99
        )

        # Create handoff
        handoff = WaldiezAgentHandoff(
            id=uuid.uuid4().hex,
            llm_transitions=[llm_transition],
            context_transitions=[context_transition],
            after_work=after_work,
        )

        # Verify all components
        assert handoff.llm_transitions is not None
        assert len(handoff.llm_transitions) == 1
        assert handoff.context_transitions is not None
        assert len(handoff.context_transitions) == 1
        assert handoff.after_work == after_work

        # Verify nested structure
        # pylint: disable=unsubscriptable-object
        first_llm_transition = handoff.llm_transitions[0]
        assert isinstance(first_llm_transition, WaldiezLLMBasedTransition)
        assert first_llm_transition.target == agent_target
        assert first_llm_transition.condition == llm_condition
        assert isinstance(
            first_llm_transition.condition, WaldiezContextStrLLMCondition
        )
        assert (
            first_llm_transition.condition.context_str
            == "conversation_complexity"
        )
        assert first_llm_transition.condition.data == {"temperature": 0.3}
        assert isinstance(first_llm_transition.target, WaldiezAgentTarget)
        assert first_llm_transition.target.value == "specialist_agent"
        assert first_llm_transition.target.target_type == "AgentTarget"
        assert first_llm_transition.target.order == 1
        # pylint: disable=unsubscriptable-object
        first_context_transition = handoff.context_transitions[0]
        assert isinstance(
            first_context_transition, WaldiezContextBasedTransition
        )
        assert first_context_transition.target == random_target
        assert first_context_transition.condition == context_condition
        assert isinstance(
            first_context_transition.condition,
            WaldiezExpressionContextCondition,
        )
        assert (
            first_context_transition.condition.expression == "urgency_level > 3"
        )
        assert first_context_transition.condition.data == {"threshold": 3}
        assert isinstance(
            first_context_transition.target, WaldiezRandomAgentTarget
        )
        assert first_context_transition.target.value == [
            "agent1",
            "agent2",
            "agent3",
        ]
        assert (
            first_context_transition.target.target_type == "RandomAgentTarget"
        )
        assert first_context_transition.target.order == 2


class TestTransitionTargetDiscrimination:
    """Test WaldiezTransitionTarget discriminated union."""

    def test_transition_target_agent_discrimination(self) -> None:
        """Test that agent targets are properly discriminated."""
        data: dict[str, Any] = {
            "target_type": "AgentTarget",
            "value": "agent123",
            "order": 1,
        }

        # This should work with the discriminated union
        target = WaldiezAgentTarget(**data)
        assert isinstance(target, WaldiezAgentTarget)

    def test_transition_target_random_agent_discrimination(self) -> None:
        """Test that random agent targets are properly discriminated."""
        data: dict[str, Any] = {
            "target_type": "RandomAgentTarget",
            "value": ["agent1", "agent2"],
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
            "value": "group123",
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
            id=uuid.uuid4().hex, llm_transitions=[], context_transitions=[]
        )

        assert not handoff.llm_transitions
        assert not handoff.context_transitions

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
            target_type="AgentTarget", value=special_chars
        )

        assert target.value == special_chars

    def test_unicode_characters(self) -> None:
        """Test handling of unicode characters."""
        unicode_text = "Hello 世界 🌍 café naïve résumé σήμερα"

        condition = WaldiezStringLLMCondition(
            condition_type="string_llm", prompt=unicode_text
        )

        assert condition.prompt == unicode_text
