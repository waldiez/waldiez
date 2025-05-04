# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
"""Test waldiez.exporting.agent.AgentExporter."""

import shutil
from pathlib import Path

from waldiez.exporting import AgentExporter

from .common import create_agent


def test_export_reasoning_agent() -> None:
    """Test exporting a reasoning agent."""
    agent, skills, models = create_agent(1, "reasoning")
    output_dir = Path("test_reasoning_agent_exporter")
    output_dir.mkdir(exist_ok=True)
    model_names = {model.id: model.name for model in models}
    exporter = AgentExporter(
        agent=agent,
        agent_names={agent.id: agent.name},
        skill_names={skill.id: skill.name for skill in skills},
        models=(models, model_names),
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
    # pylint: disable=line-too-long
    assert "from autogen.agents.experimental import ReasoningAgent" in imports
    content = output["content"]
    assert content == (
        f"{agent.name} = ReasoningAgent(\n"
        f'    name="{agent.name}",\n'
        f'    description="{agent.description}",\n'
        '    system_message="system message of agent 1",\n'
        '    human_input_mode="NEVER",\n'
        "    max_consecutive_auto_reply=None,\n"
        "    default_auto_reply=None,\n"
        "    code_execution_config=False,\n"
        "    is_termination_msg=None,\n"
        "    verbose=True,\n"
        "    reason_config={\n"
        '        "method": "beam_search",\n'
        '        "max_depth": 3,\n'
        '        "forest_size": 1,\n'
        '        "rating_scale": 10,\n'
        '        "beam_size": 3,\n'
        '        "answer_approach": "pool"\n'
        "    },\n"
        "    llm_config='model-config'\n"
        ")"
    )
    after_export = output["after_export"]
    assert not after_export
    before_export = output["before_export"]
    assert not before_export
    shutil.rmtree(output_dir)
