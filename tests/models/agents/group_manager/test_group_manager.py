# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.group_manager.group_manager.*."""

import pytest

from waldiez.models.agents.group_manager.group_manager import (
    WaldiezGroupManager,
)


def test_waldiez_group_manager() -> None:
    """Test WaldiezGroupManager."""
    group_manager = WaldiezGroupManager(
        id="wa-1",
        name="group_manager",
        data={
            "initialAgentId": "wa-1",  # type: ignore
        },
    )
    assert group_manager.data.human_input_mode == "NEVER"
    assert group_manager.agent_type == "group_manager"

    group_manager.validate_transitions(agent_ids=["wa-1"])


def test_waldiez_group_manager_transitions() -> None:
    """Test WaldiezGroupManager transitions."""
    group_manager1 = WaldiezGroupManager(
        id="wa-1",
        name="group_manager",
        data={  # type: ignore
            "initialAgentId": "wa-2",
            "speakers": {
                "selection_mode": "transition",
                "allow_repeat": ["wa-2"],
                "allowed_or_disallowed_transitions": {
                    "wa-2": ["wa-3"],
                    "wa-3": ["wa-2"],
                },
            },
        },
    )
    group_manager1.validate_transitions(agent_ids=["wa-2", "wa-3"])

    group_manager2 = WaldiezGroupManager(
        id="wa-1",
        name="group_manager",
        data={  # type: ignore
            "initialAgentId": "wa-2",
            "speakers": {
                "selection_mode": "transition",
                "allowed_or_disallowed_transitions": {
                    "wa-2": ["wa-3"],
                    "wa-3": ["wa-2"],
                },
            },
        },
    )
    with pytest.raises(ValueError):
        group_manager2.validate_transitions(agent_ids=["wa-2", "wa-4"])

    group_manager3 = WaldiezGroupManager(
        id="wa-1",
        name="group_manager",
        data={  # type: ignore
            "initialAgentId": "wa-2",
            "speakers": {
                "selection_mode": "transition",
                "allow_repeat": ["wa-5"],
                "allowed_or_disallowed_transitions": {
                    "wa-2": ["wa-3"],
                    "wa-3": ["wa-2"],
                },
            },
        },
    )
    with pytest.raises(ValueError):
        group_manager3.validate_transitions(agent_ids=["wa-2", "wa-3"])

    group_manager4 = WaldiezGroupManager(
        id="wa-1",
        name="group_manager",
        data={  # type: ignore
            "initial_agent_id": "wa-2",
            "speakers": {
                "selection_mode": "transition",
                "allow_repeat": ["wa-2"],
                "allowed_or_disallowed_transitions": {
                    "wa-4": ["wa-3"],
                    "wa-3": ["wa-2"],
                },
            },
        },
    )
    with pytest.raises(ValueError):
        group_manager4.validate_transitions(agent_ids=["wa-2", "wa-3"])
        group_manager4.validate_transitions(agent_ids=["wa-2", "wa-3"])
        group_manager4.validate_transitions(agent_ids=["wa-2", "wa-3"])
        group_manager4.validate_transitions(agent_ids=["wa-2", "wa-3"])
        group_manager4.validate_transitions(agent_ids=["wa-2", "wa-3"])
        group_manager4.validate_transitions(agent_ids=["wa-2", "wa-3"])
        group_manager4.validate_transitions(agent_ids=["wa-2", "wa-3"])
        group_manager4.validate_transitions(agent_ids=["wa-2", "wa-3"])
        group_manager4.validate_transitions(agent_ids=["wa-2", "wa-3"])
