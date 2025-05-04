# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.agent.AgentExporter."""

import shutil
from pathlib import Path

from waldiez.exporting import AgentExporter

from .common import create_agent


def test_export_assistant(tmp_path: Path) -> None:
    """Test exporting an assistant agent.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    output_dir = tmp_path / "test_agent_exporter"
    output_dir.mkdir(exist_ok=True)
    agent, skills, models = create_agent(1, "assistant")
    exporter = AgentExporter(
        agent=agent,
        agent_names={agent.id: agent.name},
        skill_names={skill.id: skill.name for skill in skills},
        models=(models, {model.id: model.name for model in models}),
        chats=([], {}),
        is_async=False,
        for_notebook=False,
        arguments_resolver=lambda _agent: [
            "    llm_config='model-config'",
        ],
        output_dir=output_dir,
    )
    output = exporter.export()
    assert output["imports"]
    imports = [x[0] for x in output["imports"]]
    assert "from autogen import AssistantAgent" in imports
    content = output["content"]
    assert content == (
        f"{agent.name} = AssistantAgent(\n"
        f'    name="{agent.name}",\n'
        f'    description="{agent.description}",\n'
        '    system_message="system message of agent 1",\n'
        '    human_input_mode="NEVER",\n'
        "    max_consecutive_auto_reply=None,\n"
        "    default_auto_reply=None,\n"
        "    code_execution_config=False,\n"
        "    is_termination_msg=None,\n"
        "    llm_config='model-config'\n"
        ")"
    )
    after_export = output["after_export"]
    assert not after_export
    shutil.rmtree(output_dir)
