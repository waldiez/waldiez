# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.base.utils.naming.*."""

from typing import Dict

from waldiez.exporting.base.utils.naming import (
    get_valid_instance_name,
    get_valid_python_variable_name,
)


def test_get_valid_python_variable_name() -> None:
    """Test get_valid_python_variable_name."""
    # Given
    name = ""
    # When
    result = get_valid_python_variable_name(name)
    # Then
    assert result == "w_"

    # Given
    name = "valid"
    # When
    result = get_valid_python_variable_name(name)
    # Then
    assert result == "valid"

    # Given
    name = "aGent-1"
    # When
    result = get_valid_python_variable_name(name)
    # Then
    assert result == "agent_1"

    # Given
    name = "agent 1"
    # When
    result = get_valid_python_variable_name(name)
    # Then
    assert result == "agent_1"

    # Given
    name = "#Som3thingWei#rd@s@Nam3{wit)hSp&c1alCh@r$"
    # When
    result = get_valid_python_variable_name(name)
    # Then
    # cspell: disable
    assert result == "w_som3thingwei_rd_s_nam3_wit_hsp_c1alch_r_"

    # Given
    name = "agent1 -> agent2"
    # When
    result = get_valid_python_variable_name(name)
    # Then
    assert result == "agent1_to_agent2"

    # Given
    name = "agent1 <- agent2"
    # When
    result = get_valid_python_variable_name(name)
    # Then
    assert result == "agent1_from_agent2"

    # Given
    name = "1agent"
    # When
    result = get_valid_python_variable_name(name)
    # Then
    assert result == "w_1agent"


def test_get_valid_instance_name() -> None:
    """Test get_valid_instance_name."""
    # Given
    instance = ("id1", "agent 1")
    current_names: Dict[str, str] = {}
    # When
    result = get_valid_instance_name(instance, current_names)
    # Then
    assert result == {"id1": "agent_1"}

    # Given
    instance = ("id1", "agent 1")
    current_names = {"id1": "agent_1"}
    # When
    result = get_valid_instance_name(instance, current_names)
    # Then
    assert result == {"id1": "agent_1"}

    # Given
    instance = ("id2", "agent 1")
    current_names = {"id1": "agent_1"}
    # When
    result = get_valid_instance_name(instance, current_names)
    # Then
    assert result == {"id1": "agent_1", "id2": "w_agent_1"}

    # Given
    instance = ("id3", "agent 1")
    current_names = {"id1": "agent_1", "id2": "w_agent_1"}
    # When
    result = get_valid_instance_name(instance, current_names, prefix="wa")
    # Then
    assert result == {
        "id1": "agent_1",
        "id2": "w_agent_1",
        "id3": "wa_agent_1",
    }

    # Given
    instance = ("id4", "agent 1")
    current_names = {"id1": "agent_1", "id2": "w_agent_1", "id3": "wa_agent_1"}
    # When
    result = get_valid_instance_name(instance, current_names, prefix="wa")
    # Then
    assert result == {
        "id1": "agent_1",
        "id2": "w_agent_1",
        "id3": "wa_agent_1",
        "id4": "wa_agent_1_1",
    }

    # Given
    instance = ("id5", "agent 1")
    current_names = {
        "id1": "agent_1",
        "id2": "w_agent_1",
        "id3": "wa_agent_1",
        "id4": "wa_agent_1_1",
    }
    # When
    result = get_valid_instance_name(instance, current_names, prefix="wa")
    # Then
    assert result == {
        "id1": "agent_1",
        "id2": "w_agent_1",
        "id3": "wa_agent_1",
        "id4": "wa_agent_1_1",
        "id5": "wa_agent_1_2",
    }
