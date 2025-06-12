# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use
"""Test waldiez.models.common.handoff.*."""

from typing import Any, Literal

import pytest
from pydantic import ValidationError

from waldiez.models.common.handoff import (
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
    WaldiezTransitionAvailability,
)


class TestWaldiezAgentTarget:
    """Test WaldiezAgentTarget class."""

    def test_valid_agent_target(self) -> None:
        """Test creating a valid agent target."""
        target = WaldiezAgentTarget(
            target_type="AgentTarget", value=["agent123"]
        )
        assert target.target_type == "AgentTarget"
        assert target.value[0] == "agent123"

    def test_agent_target_validation_error(self) -> None:
        """Test validation errors for agent target."""
        with pytest.raises(ValidationError):  # Wrong type
            WaldiezAgentTarget(
                target_type="InvalidType",  # type: ignore
                value=["agent123"],
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
        )
        assert target.target_type == "RandomAgentTarget"
        assert target.value == ["agent1", "agent2", "agent3"]

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
        target = WaldiezSimpleTarget(target_type=target_type)
        assert target.target_type == target_type

    def test_simple_target_default_values(self) -> None:
        """Test default values for simple target."""
        target = WaldiezSimpleTarget()
        assert target.target_type == "TerminateTarget"

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
            target_type=target_type,
            value=["group123"],
        )
        assert target.target_type == target_type
        assert target.value[0] == "group123"

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
                value=["group123"],
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
        assert condition.is_not_empty()

    def test_string_llm_condition_default_data(self) -> None:
        """Test default empty data dict."""
        condition = WaldiezStringLLMCondition(
            condition_type="string_llm", prompt="Test prompt"
        )
        assert condition.data == {}
        assert condition.is_not_empty()

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
        assert condition.is_not_empty()

    def test_context_str_llm_condition_default_data(self) -> None:
        """Test default empty data dict."""
        condition = WaldiezContextStrLLMCondition(
            condition_type="context_str_llm", context_str="test_context"
        )
        assert condition.data == {}
        assert condition.is_not_empty()


class TestWaldiezStringContextCondition:
    """Test WaldiezStringContextCondition class."""

    def test_valid_string_context_condition(self) -> None:
        """Test creating valid string context condition."""
        condition = WaldiezStringContextCondition(
            condition_type="string_context", variable_name="user_input"
        )
        assert condition.condition_type == "string_context"
        assert condition.variable_name == "user_input"
        assert condition.is_not_empty()

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
        assert condition.is_not_empty()

    def test_expression_context_condition_default_data(self) -> None:
        """Test default empty data dict."""
        condition = WaldiezExpressionContextCondition(
            condition_type="expression_context", expression="True"
        )
        assert condition.data == {}
        assert condition.is_not_empty()


class TestWaldiezLLMBasedTransition:
    """Test WaldiezLLMBasedTransition class."""

    def test_valid_llm_transition_with_string_llm(self) -> None:
        """Test creating valid llm transition with string LLM condition."""
        target = WaldiezAgentTarget(
            target_type="AgentTarget", value=["agent123"]
        )
        llm_condition = WaldiezStringLLMCondition(
            condition_type="string_llm",
            prompt="Should we continue?",
        )
        available = WaldiezTransitionAvailability(type="none", value="")
        llm_transition = WaldiezLLMBasedTransition(
            target=target,
            condition=llm_condition,
            available=available,
        )
        assert llm_transition.target == target
        assert llm_transition.condition == llm_condition
        assert llm_transition.available == available
        assert llm_transition.condition.is_not_empty()

    def test_valid_llm_stransition_with_context_str_llm(self) -> None:
        """Test creating valid llm transition with ctx string LLM condition."""
        target = WaldiezSimpleTarget(target_type="TerminateTarget")
        llm_condition = WaldiezContextStrLLMCondition(
            condition_type="context_str_llm",
            context_str="conversation_state",
        )
        available = WaldiezTransitionAvailability(type="none", value="")
        llm_transition = WaldiezLLMBasedTransition(
            target=target,
            condition=llm_condition,
            available=available,
        )
        assert llm_transition.target == target
        assert llm_transition.condition == llm_condition
        assert llm_transition.available == available
        assert llm_transition.condition.is_not_empty()


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
        available = WaldiezTransitionAvailability(type="none", value="")
        context_transition = WaldiezContextBasedTransition(
            target=target,
            condition=context_condition,
            available=available,
        )
        assert context_transition.target == target
        assert context_transition.condition == context_condition
        assert context_transition.available == available
        assert context_transition.condition.is_not_empty()

    def test_valid_context_transition_with_expression(self) -> None:
        """Test creating valid context transition with expr condition."""
        target = WaldiezGroupOrNestedTarget(
            target_type="GroupChatTarget", value=["support_group"]
        )
        context_condition = WaldiezExpressionContextCondition(
            condition_type="expression_context",
            expression="priority == 'high'",
        )
        available = WaldiezTransitionAvailability(type="none", value="")
        context_transition = WaldiezContextBasedTransition(
            target=target,
            condition=context_condition,
            available=available,
        )
        assert context_transition.target == target
        assert context_transition.condition == context_condition
        assert context_transition.available == available
        assert context_transition.condition.is_not_empty()


class TestTransitionTargetDiscrimination:
    """Test WaldiezTransitionTarget discriminated union."""

    def test_transition_target_agent_discrimination(self) -> None:
        """Test that agent targets are properly discriminated."""
        data: dict[str, Any] = {
            "target_type": "AgentTarget",
            "value": ["agent123"],
        }

        # This should work with the discriminated union
        target = WaldiezAgentTarget(**data)
        assert isinstance(target, WaldiezAgentTarget)

    def test_transition_target_random_agent_discrimination(self) -> None:
        """Test that random agent targets are properly discriminated."""
        data: dict[str, Any] = {
            "target_type": "RandomAgentTarget",
            "value": ["agent1", "agent2"],
        }

        target = WaldiezRandomAgentTarget(**data)
        assert isinstance(target, WaldiezRandomAgentTarget)

    def test_transition_target_simple_discrimination(self) -> None:
        """Test that simple targets are properly discriminated."""
        data: dict[str, Any] = {"target_type": "TerminateTarget"}

        target = WaldiezSimpleTarget(**data)
        assert isinstance(target, WaldiezSimpleTarget)

    def test_transition_target_group_discrimination(self) -> None:
        """Test that group targets are properly discriminated."""
        data: dict[str, Any] = {
            "target_type": "GroupChatTarget",
            "value": ["group123"],
        }

        target = WaldiezGroupOrNestedTarget(**data)
        assert isinstance(target, WaldiezGroupOrNestedTarget)


class TestEdgeCases:
    """Test edge cases and error conditions."""

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
            target_type="AgentTarget", value=[special_chars]
        )

        assert target.value == [special_chars]

    def test_unicode_characters(self) -> None:
        """Test handling of unicode characters."""
        unicode_text = "Hello 世界 🌍 café naïve résumé σήμερα"

        condition = WaldiezStringLLMCondition(
            condition_type="string_llm", prompt=unicode_text
        )

        assert condition.prompt == unicode_text

    def test_empty_string_conditions(self) -> None:
        """Test handling of empty strings in conditions."""
        condition = WaldiezStringLLMCondition(
            condition_type="string_llm", prompt=""
        )

        assert condition.prompt == ""
        assert condition.is_not_empty() is False

    def test_empty_list_targets(self) -> None:
        """Test handling of empty lists in targets."""
        with pytest.raises(ValidationError):
            WaldiezContextBasedTransition(
                target=WaldiezGroupOrNestedTarget(
                    target_type="GroupChatTarget", value=[]
                ),
                condition=WaldiezExpressionContextCondition(
                    condition_type="expression_context",
                    expression="priority == 'high'",
                ),
                available=WaldiezTransitionAvailability(type="none", value=""),
            )
