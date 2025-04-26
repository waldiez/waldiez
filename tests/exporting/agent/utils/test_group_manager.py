# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=line-too-long
"""Test waldiez.exporting.agents.group_manager.*."""

from typing import List

from waldiez.exporting.agent.utils.group_manager import get_group_manager_extras
from waldiez.exporting.base import ExporterMixin
from waldiez.models import (
    WaldiezAgent,
    WaldiezGroupManager,
    WaldiezGroupManagerData,
    WaldiezGroupManagerSpeakers,
)


def test_get_group_manager_extras() -> None:
    """Test get_group_manager_extras()."""
    # Given
    agent = WaldiezAgent(
        id="wa-1",
        name="agent_name",
        agent_type="assistant",
    )
    group_chat_members: List[WaldiezAgent] = []
    agent_names = {"wa-1": "agent_name"}
    expected_output = ("", "")
    # When
    output = get_group_manager_extras(
        agent=agent,
        group_chat_members=group_chat_members,
        agent_names=agent_names,
        serializer=ExporterMixin.serializer,
    )
    # Then
    assert output == expected_output
    # Given
    manager = WaldiezGroupManager(
        id="wa-2",
        name="group_manager",
        agent_type="manager",
    )
    group_chat_members = [agent]
    agent_names = {"wa-1": "agent_name", "wa-2": "group_manager"}
    expected_group_chat = (
        "\n"
        "group_manager_group_chat = GroupChat(\n"
        "    agents=[agent_name],\n"
        "    enable_clear_history=None,\n"
        "    send_introductions=False,\n"
        "    messages=[],\n"
        '    speaker_selection_method="auto",\n'
        "    allow_repeat_speaker=True,\n"
        ")\n\n"
    )
    expected_arg = "\n    groupchat=group_manager_group_chat,"
    expected_output = (expected_group_chat, expected_arg)
    # When
    output = get_group_manager_extras(
        agent=manager,
        group_chat_members=group_chat_members,
        agent_names=agent_names,
        serializer=ExporterMixin.serializer,
    )
    # Then
    assert output == expected_output
    # Given
    custom_selection_content = (
        "def custom_speaker_selection(last_speaker, groupchat):\n"
        "    return last_speaker"
    )
    manager = WaldiezGroupManager(
        id="wa-2",
        name="group_manager",
        agent_type="manager",
        data=WaldiezGroupManagerData(
            speakers=WaldiezGroupManagerSpeakers(
                selection_method="custom",
                selection_custom_method=custom_selection_content,
                max_retries_for_selecting=3,
                selection_mode="repeat",
                allow_repeat=True,
                transitions_type="allowed",
                allowed_or_disallowed_transitions={},
            ),
        ),
    )
    group_chat_members = [agent]
    agent_names = {"wa-1": "agent_name", "wa-2": "group_manager"}
    expected_group_chat = (
        "def custom_speaker_selection_group_manager(\n"
        "    last_speaker: ConversableAgent,\n"
        "    groupchat: GroupChat,\n"
        ") -> Optional[Union[Agent, str]]:\n"
        "    return last_speaker"
        "\n\n\n"
        "group_manager_group_chat = GroupChat(\n"
        "    agents=[agent_name],\n"
        "    enable_clear_history=None,\n"
        "    send_introductions=False,\n"
        "    messages=[],\n"
        "    max_retries_for_selecting_speaker=3,\n"
        "    speaker_selection_method=custom_speaker_selection_group_manager,\n"
        "    allow_repeat_speaker=True,\n"
        ")\n\n"
    )
    expected_arg = "\n    groupchat=group_manager_group_chat,"
    expected_output = (expected_group_chat, expected_arg)
    # When
    output = get_group_manager_extras(
        agent=manager,
        group_chat_members=group_chat_members,
        agent_names=agent_names,
        serializer=ExporterMixin.serializer,
    )
    # Then
    assert output == expected_output

    # Given
    custom_selection_content = (
        "def custom_speaker_selection(last_speaker, groupchat):\n"
        "    return last_speaker"
    )
    manager = WaldiezGroupManager(
        id="wa-2",
        name="group_manager",
        agent_type="manager",
        data=WaldiezGroupManagerData(
            max_round=5,
            admin_name="agent_name",
            speakers=WaldiezGroupManagerSpeakers(
                selection_method="custom",
                selection_custom_method=custom_selection_content,
                max_retries_for_selecting=3,
                selection_mode="transition",
                allow_repeat=["wa-1"],
                transitions_type="allowed",
                allowed_or_disallowed_transitions={
                    "wa-1": ["wa-2"],
                },
            ),
        ),
    )
    group_chat_members = [agent]
    agent_names = {"wa-1": "agent_name", "wa-2": "group_manager"}
    #
    expected_group_chat = (
        "def custom_speaker_selection_group_manager(\n"
        "    last_speaker: ConversableAgent,\n"
        "    groupchat: GroupChat,\n"
        ") -> Optional[Union[Agent, str]]:\n"
        "    return last_speaker"
        "\n\n\n"
        "group_manager_group_chat = GroupChat(\n"
        "    agents=[agent_name],\n"
        "    enable_clear_history=None,\n"
        "    send_introductions=False,\n"
        "    messages=[],\n"
        "    max_round=5,\n"
        '    admin_name="agent_name",\n'
        "    max_retries_for_selecting_speaker=3,\n"
        "    speaker_selection_method=custom_speaker_selection_group_manager,\n"
        "    allowed_or_disallowed_speaker_transitions={\n"
        "        agent_name: [\n"
        "            group_manager\n"
        "        ]\n"
        "    },\n"
        '    speaker_transitions_type="allowed",\n'
        ")\n\n"
    )
    expected_arg = "\n    groupchat=group_manager_group_chat,"
    expected_output = (expected_group_chat, expected_arg)
    # When
    output = get_group_manager_extras(
        agent=manager,
        group_chat_members=group_chat_members,
        agent_names=agent_names,
        serializer=ExporterMixin.serializer,
    )
    # Then
    assert output == expected_output
    # Given
    manager = WaldiezGroupManager(
        id="wa-2",
        name="group_manager",
        agent_type="manager",
        data=WaldiezGroupManagerData(
            speakers=WaldiezGroupManagerSpeakers(
                selection_method="round_robin",
                selection_custom_method=None,
                max_retries_for_selecting=3,
                selection_mode="repeat",
                allow_repeat=["wa-1"],
                transitions_type="allowed",
                allowed_or_disallowed_transitions={},
            ),
        ),
    )
    group_chat_members = [agent]
    agent_names = {"wa-1": "agent_name", "wa-2": "group_manager"}
    expected_group_chat = (
        "\n"
        "group_manager_group_chat = GroupChat(\n"
        "    agents=[agent_name],\n"
        "    enable_clear_history=None,\n"
        "    send_introductions=False,\n"
        "    messages=[],\n"
        "    max_retries_for_selecting_speaker=3,\n"
        '    speaker_selection_method="round_robin",\n'
        "    allow_repeat=[agent_name],\n"
        ")\n\n"
    )
    expected_arg = "\n    groupchat=group_manager_group_chat,"
    expected_output = (expected_group_chat, expected_arg)
    # When
    output = get_group_manager_extras(
        agent=manager,
        group_chat_members=group_chat_members,
        agent_names=agent_names,
        serializer=ExporterMixin.serializer,
    )
    # Then
    assert output == expected_output
