# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=too-many-locals,too-many-statements,line-too-long
"""Test waldiez.exporting.agent.AgentExporter."""

import shutil
from pathlib import Path

from waldiez.exporting import AgentExporter

from .common import create_agent


def test_export_group_manager() -> None:
    """Test exporting a group manager agent."""
    member1 = create_agent(1, "user")[0]
    member2 = create_agent(2, "assistant")[0]
    manager = create_agent(3, "manager")[0]
    output_dir = Path("test_group_manager_exporter")
    output_dir.mkdir(exist_ok=True)
    model_names = {"wm-1_1": "model1_1", "wm-1_2": "model1_2"}
    exporter = AgentExporter(
        agent=manager,
        agent_names={
            manager.id: manager.name,
            member1.id: member1.name,
            member2.id: member2.name,
        },
        skill_names={"ws-1_1": "skill1_1", "ws-1_2": "skill1_2"},
        models=([], model_names),
        chats=([], {}),
        is_async=False,
        group_chat_members=[member1, member2],
        for_notebook=False,
        arguments_resolver=lambda _agent: [
            "    llm_config='model-config'",
        ],
        output_dir=output_dir,
    )
    output = exporter.export()
    assert output["imports"]
    imports = [x[0] for x in output["imports"]]
    assert "from autogen import GroupChatManager" in imports
    content = output["content"]
    assert content == (
        f"{manager.name} = GroupChatManager(\n"
        f'    name="{manager.name}",\n'
        f'    description="{manager.description}",\n'
        '    system_message="system message of agent 3",\n'
        '    human_input_mode="NEVER",\n'
        "    max_consecutive_auto_reply=None,\n"
        "    default_auto_reply=None,\n"
        "    code_execution_config=False,\n"
        "    is_termination_msg=None,\n"
        "    groupchat=agent3_group_chat,\n"
        "    llm_config='model-config'\n"
        ")"
    )
    after_export = output["after_export"]
    assert not after_export
    before_export = output["before_export"]
    assert before_export
    assert before_export[0][0] == (
        "\nagent3_group_chat = GroupChat(\n"
        f"    agents=[{member1.name}, {member2.name}]," + "\n"
        "    enable_clear_history=None,\n"
        "    send_introductions=False,\n"
        "    messages=[],\n"
        '    speaker_selection_method="auto",\n'
        "    allow_repeat_speaker=True,\n"
        ")\n\n"
    )
    shutil.rmtree(output_dir)
