# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=line-too-long
"""Test waldiez.exporting.agent.AgentExporter."""

import shutil
from pathlib import Path

from waldiez.exporting import AgentExporter

from .common import create_agent


def test_export_swarm_agent() -> None:
    """Test exporting a swarm agent."""
    member1 = create_agent(1, "user")[0]
    member2 = create_agent(2, "assistant")[0]
    agent, skills, models = create_agent(3, "swarm")
    output_dir = Path("test_swarm_agent_exporter")
    output_dir.mkdir(exist_ok=True)
    model_names = {model.id: model.name for model in models}
    exporter = AgentExporter(
        agent=agent,
        agent_names={
            agent.id: agent.name,
            member1.id: member1.name,
            member2.id: member2.name,
        },
        skill_names={skill.id: skill.name for skill in skills},
        models=(models, model_names),
        chats=([], {}),
        is_async=False,
        for_notebook=False,
        arguments_resolver=lambda _agent: [
            "    llm_config='model-config'",
        ],
        group_chat_members=[],
        output_dir=output_dir,
    )
    output = exporter.export()
    assert output["imports"]
    imports = [x[0] for x in output["imports"]]
    # pylint: disable=duplicate-code
    new_swarm_imports = """from autogen.agentchat.group import (
    AgentNameTarget,
    AgentTarget,
    AskUserTarget,
    ContextExpression,
    ContextStr,
    ContextStrLLMCondition,
    ContextVariables,
    ExpressionAvailableCondition,
    ExpressionContextCondition,
    GroupChatConfig,
    GroupChatTarget,
    Handoffs,
    NestedChatTarget,
    OnCondition,
    OnContextCondition,
    ReplyResult,
    RevertToUserTarget,
    SpeakerSelectionResult,
    StayTarget,
    StringAvailableCondition,
    StringContextCondition,
    StringLLMCondition,
    TerminateTarget,
)"""
    assert new_swarm_imports in imports
    content = output["content"]
    assert content == (
        f"{agent.name} = ConversableAgent(\n"
        f'    name="{agent.name}",\n'
        f'    description="{agent.description}",\n'
        '    system_message="system message of agent 3",\n'
        '    human_input_mode="NEVER",\n'
        "    max_consecutive_auto_reply=None,\n"
        "    default_auto_reply=None,\n"
        "    code_execution_config=False,\n"
        "    is_termination_msg=None,\n"
        "    functions=[],\n"
        "    update_agent_state_before_reply=[],\n"
        "    llm_config='model-config'\n"
        ")"
    )
    after_export = output["after_export"]
    assert not after_export
    before_export = output["before_export"]
    assert not before_export
    shutil.rmtree(output_dir)
