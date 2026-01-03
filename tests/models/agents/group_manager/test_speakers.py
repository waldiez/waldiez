# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.group_manager.speakers.*."""

import pytest

from waldiez.models.agents.group_manager.speakers import (
    WaldiezGroupManagerSpeakers,
)


def test_waldiez_group_manager_speakers() -> None:
    """Test WaldiezGroupManagerSpeakers."""
    # Given
    speakers_config = WaldiezGroupManagerSpeakers(
        selection_method="auto",
        selection_custom_method=None,
        max_retries_for_selecting=None,
        selection_mode="repeat",
        allow_repeat=True,
        allowed_or_disallowed_transitions={},
        transitions_type="allowed",
    )
    # Then
    assert speakers_config.selection_method == "auto"
    assert speakers_config.custom_method_string is None

    # Given
    speakers_config = WaldiezGroupManagerSpeakers(
        selection_method="custom",
        selection_custom_method=(
            "def custom_speaker_selection(last_speaker, groupchat):\n"
            "    return last_speaker"
        ),
        max_retries_for_selecting=None,
        selection_mode="repeat",
        allow_repeat=True,
        allowed_or_disallowed_transitions={},
        transitions_type="allowed",
    )

    # Then
    assert speakers_config.selection_method == "custom"
    assert speakers_config.custom_method_string == "    return last_speaker"

    with pytest.raises(ValueError):
        WaldiezGroupManagerSpeakers(
            selection_method="custom",
            selection_custom_method="",
            max_retries_for_selecting=1,
            selection_mode="repeat",
            allow_repeat=True,
            allowed_or_disallowed_transitions={},
            transitions_type="allowed",
        )
    with pytest.raises(ValueError):
        WaldiezGroupManagerSpeakers(
            selection_method="custom",
            selection_custom_method=(
                "def invalid_custom_speaker_selection("
                "last_speaker,"
                "groupchat"
                "):\n"
                "    return last_speaker"
            ),
            max_retries_for_selecting=3,
            selection_mode="transition",
            allow_repeat=True,
            allowed_or_disallowed_transitions={},
            transitions_type="allowed",
        )


def test_waldiez_group_manager_get_custom_method_function() -> None:
    """Test WaldiezGroupManagerSpeakers.get_custom_method_function."""
    speakers_config = WaldiezGroupManagerSpeakers(
        selection_method="custom",
        selection_custom_method=(
            "def custom_speaker_selection(last_speaker, groupchat):\n"
            "    return last_speaker"
        ),
        max_retries_for_selecting=None,
        selection_mode="repeat",
        allow_repeat=True,
        allowed_or_disallowed_transitions={},
        transitions_type="allowed",
    )
    custom_method_function = speakers_config.get_custom_method_function(
        name_prefix="pre",
        name_suffix="post",
    )
    assert custom_method_function[1] == "pre_custom_speaker_selection_post"
    assert custom_method_function[0] == (
        "def pre_custom_speaker_selection_post(\n"
        "    last_speaker: ConversableAgent,\n"
        "    groupchat: GroupChat,\n"
        ") -> Optional[Union[Agent, str]]:\n"
        "    return last_speaker\n"
    )
    custom_method_function = speakers_config.get_custom_method_function()
    assert custom_method_function[1] == "custom_speaker_selection"
    custom_method_function = speakers_config.get_custom_method_function(
        name_prefix="pre",
    )
    assert custom_method_function[1] == "pre_custom_speaker_selection"
    custom_method_function = speakers_config.get_custom_method_function(
        name_suffix="post",
    )
    assert custom_method_function[1] == "custom_speaker_selection_post"


def test_waldiez_group_manager_speakers_order() -> None:
    """Test WaldiezGroupManagerSpeakers order."""
    speakers_config = WaldiezGroupManagerSpeakers(
        selection_method="auto",
        selection_custom_method=None,
        max_retries_for_selecting=None,
        selection_mode="repeat",
        allow_repeat=True,
        allowed_or_disallowed_transitions={},
        transitions_type="allowed",
    )
    with pytest.raises(
        RuntimeError,
        match="Order is not set. Call `set_order` first.",
    ):
        speakers_config.get_order()

    speakers_config.set_order("agent1", ["agent1", "agent2", "agent3"])
    assert speakers_config.get_order() == ["agent1", "agent2", "agent3"]
