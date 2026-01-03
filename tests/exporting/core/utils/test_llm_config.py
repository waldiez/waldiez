# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=missing-module-docstring,missing-class-docstring,line-too-long
# pylint: disable=missing-function-docstring,missing-param-doc,missing-return-doc
# pylint: disable=no-self-use
"""Test waldiez.exporting.core.utils.llm_config.*."""

from typing import Any

import pytest

from waldiez.exporting.core.utils.llm_config import (
    get_agent_llm_config_arg,
)
from waldiez.models import (
    WaldiezAgentTerminationMessage,
    WaldiezAssistant,
    WaldiezAssistantData,
    WaldiezModel,
    WaldiezModelAPIType,
    WaldiezModelData,
    WaldiezModelPrice,
)


def create_test_agent(
    model_ids: list[str], agent_id: str = "agent1"
) -> WaldiezAssistant:
    """Create a test agent with given model IDs."""
    return WaldiezAssistant(
        id=agent_id,
        type="agent",
        agent_type="assistant",
        name="Test Agent",
        description="A test agent",
        tags=["test", "agent"],
        requirements=["test-requirement"],
        created_at="2023-10-01T00:00:00Z",
        updated_at="2023-10-01T00:00:00Z",
        data=WaldiezAssistantData(
            model_ids=model_ids,
            termination=WaldiezAgentTerminationMessage(
                type="none",
            ),
        ),
    )


def create_test_model(
    model_id: str,
    name: str,
    temperature: float | None = 0.7,
    api_type: WaldiezModelAPIType = "openai",
) -> WaldiezModel:
    """Create a test model with given parameters."""
    return WaldiezModel(
        id=model_id,
        type="model",
        name=name,
        description=f"{name} model",
        tags=["tag1", "tag2"],
        requirements=["requirement1"],
        created_at="2023-10-01T00:00:00Z",
        updated_at="2023-10-01T00:00:00Z",
        data=WaldiezModelData(
            base_url="https://api.openai.com/v1",
            api_key="your_api_key",
            api_type=api_type,
            api_version="v1",
            temperature=temperature,
            top_p=1.0,
            max_tokens=1000,
            price=WaldiezModelPrice(
                prompt_price_per_1k=0.0001,
                completion_token_price_per_1k=0.0002,
            ),
        ),
    )


def create_test_setup(
    model_ids: list[str],
    model_configs: list[dict[str, Any]] | None = None,
) -> tuple[WaldiezAssistant, list[WaldiezModel], dict[str, str]]:
    """Create a complete test setup with agent, models, and model_names.

    Parameters
    ----------
    model_ids : List[str]
        List of model IDs to assign to the agent
    model_configs : List[Dict] | None, optional
        List of dicts with model configuration. Each dict can contain:
        - id: model ID (required)
        - name: model name (defaults to id)
        - temperature: temperature value (defaults to 0.7)
        - api_type: API type (defaults to "openai")

    Returns
    -------
    tuple[WaldiezAssistant, List[WaldiezModel], Dict[str, str]]
        Agent, list of models, and model_names mapping
    """
    if model_configs is None:
        # Create default configs for each model_id
        model_configs = [{"id": mid, "name": mid} for mid in set(model_ids)]

    agent = create_test_agent(model_ids)

    models: list[WaldiezModel] = []
    model_names: dict[str, str] = {}

    for config in model_configs:
        model_id = config["id"]
        name = config.get("name", model_id)
        temperature = config.get("temperature", 0.7)
        api_type = config.get("api_type", "openai")

        # noinspection PyTypeChecker
        model = create_test_model(model_id, name, temperature, api_type)
        models.append(model)
        model_names[model_id] = name

    return agent, models, model_names


class TestGetAgentLlmConfigArg:
    """Test the main get_agent_llm_config_arg function."""

    def test_as_dict_false_calls_arg_function(self) -> None:
        """Test that as_dict=False calls the argument version."""
        agent, models, model_names = create_test_setup(["model1"])

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False, tabs=1
        )

        # Should call _get_agent_llm_config_arg_as_arg
        assert "llm_config=autogen.LLMConfig(" in result
        assert '"llm_config":' not in result  # Dict style not used

    def test_as_dict_true_calls_dict_function(self) -> None:
        """Test that as_dict=True calls the dictionary version."""
        agent, models, model_names = create_test_setup(["model1"])

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=True, tabs=1
        )

        # Should call _get_agent_llm_config_arg_as_dict with tabs+1
        assert '"llm_config": autogen.LLMConfig(' in result
        assert (
            "llm_config=autogen.LLMConfig(" not in result
        )  # Arg style not used

    def test_tabs_parameter_passed_correctly(self) -> None:
        """Test that tabs parameter is passed correctly to subfunctions."""
        agent, models, model_names = create_test_setup(["model1"])

        # Test with as_dict=False (tabs passed as-is)
        result_arg = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False, tabs=2
        )

        # Should have 8 spaces (2 tabs * 4 spaces) at start
        assert result_arg.startswith("        llm_config=")

        # Test with as_dict=True (tabs+1 passed)
        result_dict = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=True, tabs=1
        )

        # Should have 8 spaces (2 tabs * 4 spaces) at start
        assert result_dict.startswith('        "llm_config":')


class TestArgFormat:
    """Test the argument format output (as_dict=False)."""

    def test_no_model_ids_returns_false_config(self) -> None:
        """Test that agent with no model IDs returns False config."""
        agent, models, model_names = create_test_setup([])

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        expected = "    llm_config=False,\n"
        assert result == expected

    def test_single_model_with_temperature(self) -> None:
        """Test agent with single model including temperature."""
        agent, models, model_names = create_test_setup(
            ["model1"], [{"id": "model1", "name": "gpt4", "temperature": 0.7}]
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        expected_lines = [
            "    llm_config=autogen.LLMConfig(",
            "        config_list=[",
            "            gpt4_llm_config,",
            "        ],",
            "        cache_seed=42,",
            "        temperature=0.7,",
            "    ),",
        ]

        for line in expected_lines:
            assert line in result
        assert result.endswith("\n")

    def test_single_model_without_temperature(self) -> None:
        """Test agent with single model without temperature."""
        agent, models, model_names = create_test_setup(
            ["model1"], [{"id": "model1", "name": "gpt4", "temperature": None}]
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        assert "temperature=" not in result
        assert "cache_seed=42," in result
        assert "gpt4_llm_config," in result

    def test_multiple_models(self) -> None:
        """Test agent with multiple models."""
        agent, models, model_names = create_test_setup(
            ["model1", "model2"],
            [
                {"id": "model1", "name": "gpt4", "temperature": 0.7},
                {"id": "model2", "name": "claude", "temperature": 0.5},
            ],
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        assert "gpt4_llm_config," in result
        assert "claude_llm_config," in result
        # Should use the last model's temperature
        assert "temperature=0.5," in result

    def test_model_not_found_in_all_models(self) -> None:
        """Test when agent references model not in all_models list."""
        agent = create_test_agent(["model1", "missing_model"])
        models = [create_test_model("model1", "gpt4", 0.7)]
        model_names = {"model1": "gpt4", "missing_model": "missing"}

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        # Should only include the found model
        assert "gpt4_llm_config," in result
        assert "missing_llm_config," not in result
        assert "temperature=0.7," in result

    def test_no_valid_models_found(self) -> None:
        """Test when no valid models are found."""
        agent = create_test_agent(["missing1", "missing2"])
        models = [create_test_model("other_model", "other", 0.7)]
        model_names = {"missing1": "missing1", "missing2": "missing2"}

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        expected = "    llm_config=False,\n"
        assert result == expected

    def test_none_cache_seed(self) -> None:
        """Test with None cache_seed."""
        agent, models, model_names = create_test_setup(["model1"])

        result = get_agent_llm_config_arg(
            agent, models, model_names, None, as_dict=False
        )

        assert "cache_seed=None," in result

    def test_custom_tabs(self) -> None:
        """Test custom indentation settings."""
        agent, models, model_names = create_test_setup(["model1"])

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False, tabs=2
        )

        # Should start with 8 spaces (2 tabs * 4 spaces)
        assert result.startswith("        llm_config=")

    def test_zero_tabs(self) -> None:
        """Test with zero tabs."""
        agent, models, model_names = create_test_setup(["model1"])

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False, tabs=0
        )

        # Should start with no indentation
        assert result.startswith("llm_config=")


class TestDictFormat:
    """Test the dictionary format output (as_dict=True)."""

    def test_no_model_ids_returns_false_config(self) -> None:
        """Test that agent with no model IDs returns False config."""
        agent, models, model_names = create_test_setup([])

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=True
        )

        expected = '        "llm_config": False,\n'
        assert result == expected

    def test_single_model_with_temperature(self) -> None:
        """Test agent with single model including temperature."""
        agent, models, model_names = create_test_setup(
            ["model1"], [{"id": "model1", "name": "gpt4", "temperature": 0.7}]
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=True
        )

        expected_lines = [
            '"llm_config": autogen.LLMConfig(',
            "    config_list=[",
            "        gpt4_llm_config,",
            "    ],",
            "    cache_seed=42,",
            "    temperature=0.7,",
            "),",
        ]

        for line in expected_lines:
            assert line in result
        assert result.endswith("\n")

    def test_single_model_without_temperature(self) -> None:
        """Test agent with single model without temperature."""
        agent, models, model_names = create_test_setup(
            ["model1"], [{"id": "model1", "name": "gpt4", "temperature": None}]
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=True
        )

        assert "temperature=" not in result
        assert "cache_seed=42," in result
        assert "gpt4_llm_config," in result
        assert '"llm_config": autogen.LLMConfig(' in result

    def test_multiple_models(self) -> None:
        """Test agent with multiple models."""
        agent, models, model_names = create_test_setup(
            ["model1", "model2"],
            [
                {"id": "model1", "name": "gpt4", "temperature": 0.7},
                {"id": "model2", "name": "claude", "temperature": 0.5},
            ],
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=True
        )

        assert "gpt4_llm_config," in result
        assert "claude_llm_config," in result
        # Should use the last model's temperature
        assert "temperature=0.5," in result

    def test_custom_tabs(self) -> None:
        """Test custom indentation settings."""
        agent, models, model_names = create_test_setup(["model1"])

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=True, tabs=2
        )

        # Should start with 12 spaces (3 tabs * 4 spaces) due to tabs+1
        assert result.startswith('            "llm_config":')

    def test_zero_tabs(self) -> None:
        """Test with zero tabs."""
        agent, models, model_names = create_test_setup(["model1"])

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=True, tabs=0
        )

        # Should start with 4 spaces (1 tab * 4 spaces) due to tabs+1
        assert result.startswith('    "llm_config":')


class TestEdgeCases:
    """Test edge cases and unusual scenarios."""

    def test_temperature_zero_is_included(self) -> None:
        """Test that temperature=0.0 is included in output."""
        agent, models, model_names = create_test_setup(
            ["model1"], [{"id": "model1", "name": "gpt4", "temperature": 0.0}]
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        # Temperature of 0.0 should be included (it's not None)
        assert "temperature=0.0," in result

    def test_negative_temperature(self) -> None:
        """Test with negative temperature value."""
        agent, models, model_names = create_test_setup(
            ["model1"], [{"id": "model1", "name": "gpt4", "temperature": -0.5}]
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        assert "temperature=-0.5," in result

    def test_very_large_cache_seed(self) -> None:
        """Test with very large cache seed."""
        agent, models, model_names = create_test_setup(["model1"])

        large_seed = 999999999999
        result = get_agent_llm_config_arg(
            agent, models, model_names, large_seed, as_dict=False
        )

        assert f"cache_seed={large_seed}," in result

    def test_special_characters_in_model_names(self) -> None:
        """Test with special characters in model names."""
        agent, models, model_names = create_test_setup(
            ["model1"], [{"id": "model1", "name": "gpt-4_turbo.v1"}]
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        assert "gpt-4_turbo.v1_llm_config," in result

    def test_empty_model_names_dict(self) -> None:
        """Test with empty model_names dictionary."""
        agent = create_test_agent(["model1"])
        models = [create_test_model("model1", "gpt4", 0.7)]
        model_names: dict[str, str] = {}  # Empty model_names

        # This should cause a KeyError when trying
        # to access model_names[model_id]
        with pytest.raises(KeyError):
            get_agent_llm_config_arg(
                agent,
                models,
                model_names,
                42,
            )

    def test_model_names_missing_key(self) -> None:
        """Test when model_names is missing a required key."""
        agent = create_test_agent(["model1", "model2"])
        models = [
            create_test_model("model1", "gpt4", 0.7),
            create_test_model("model2", "claude", 0.5),
        ]
        model_names = {"model1": "gpt4"}  # Missing model2

        # Should raise KeyError when trying to access model_names["model2"]
        with pytest.raises(KeyError):
            get_agent_llm_config_arg(agent, models, model_names, 42)


class TestIntegration:
    """Integration tests combining multiple scenarios."""

    def test_complex_scenario_as_arg(self) -> None:
        """Test complex scenario with multiple models using arg format."""
        agent, models, model_names = create_test_setup(
            ["model1", "model2", "model3"],
            [
                {"id": "model1", "name": "gpt4", "temperature": 0.7},
                {"id": "model2", "name": "claude", "temperature": None},
                {"id": "model3", "name": "llama", "temperature": 1.0},
            ],
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 123, as_dict=False, tabs=2
        )

        # Check structure
        assert result.startswith("        llm_config=autogen.LLMConfig(")
        assert "gpt4_llm_config," in result
        assert "claude_llm_config," in result
        assert "llama_llm_config," in result
        assert "cache_seed=123," in result
        assert "temperature=1.0," in result  # Last model's temperature
        assert result.endswith("),\n")

    def test_complex_scenario_as_dict(self) -> None:
        """Test complex scenario with multiple models using dict format."""
        agent, models, model_names = create_test_setup(
            ["model1", "model2"],
            [
                {"id": "model1", "name": "gpt4", "temperature": 0.8},
                {"id": "model2", "name": "claude", "temperature": 0.2},
            ],
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, None, as_dict=True, tabs=1
        )

        # Check structure (tabs+1 = 2 tabs = 8 spaces)
        assert result.startswith('        "llm_config": autogen.LLMConfig(')
        assert "gpt4_llm_config," in result
        assert "claude_llm_config," in result
        assert "cache_seed=None," in result
        assert "temperature=0.2," in result  # Last model's temperature
        assert result.endswith("),\n")

    def test_mixed_found_and_missing_models(self) -> None:
        """Test scenario with mix of found and missing models."""
        agent = create_test_agent(["found1", "missing", "found2"])
        models = [
            create_test_model("found1", "model_a", 0.5),
            create_test_model("found2", "model_c", 0.9),
            create_test_model(
                "other", "other_model", 0.1
            ),  # Not referenced by agent
        ]
        model_names = {
            "found1": "model_a",
            "missing": "model_b",
            "found2": "model_c",
        }

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        # Should only include found models
        assert "model_a_llm_config," in result
        assert "model_b_llm_config," not in result  # Missing from all_models
        assert "model_c_llm_config," in result
        assert "temperature=0.9," in result  # Last found model's temperature

    def test_different_api_types(self) -> None:
        """Test with different API types."""
        agent, models, model_names = create_test_setup(
            ["model1", "model2"],
            [
                {"id": "model1", "name": "gpt4", "api_type": "openai"},
                {"id": "model2", "name": "claude", "api_type": "anthropic"},
            ],
        )

        result = get_agent_llm_config_arg(
            agent, models, model_names, 42, as_dict=False
        )

        # Should work regardless of API type
        assert "gpt4_llm_config," in result
        assert "claude_llm_config," in result
        assert "cache_seed=42," in result
