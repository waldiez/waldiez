# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.group_manager.group_manager_data.*."""

from waldiez.models.agents.group_manager.group_manager_data import (
    WaldiezGroupManagerData,
)


# noinspection PyArgumentList
def test_waldiez_group_manager_data() -> None:
    """Test WaldiezGroupManagerData."""
    group_manager_data = WaldiezGroupManagerData(initial_agent_id="agent_1")
    assert group_manager_data.human_input_mode == "NEVER"
    # assert defaults
    assert group_manager_data.max_round == 20
    assert group_manager_data.admin_name is None
    assert group_manager_data.speakers.selection_method == "auto"
    assert group_manager_data.speakers.selection_custom_method is None
    assert group_manager_data.speakers.max_retries_for_selecting is None
    assert group_manager_data.speakers.selection_mode == "repeat"
    assert group_manager_data.speakers.allow_repeat is True
    assert not group_manager_data.speakers.allowed_or_disallowed_transitions
    assert group_manager_data.speakers.transitions_type == "allowed"
    assert group_manager_data.speakers.custom_method_string is None
