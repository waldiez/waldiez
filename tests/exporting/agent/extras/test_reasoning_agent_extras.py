# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Test waldiez.exporting.agents.extras.reasoning_agent_extras.*."""

import shutil
from pathlib import Path

from waldiez.exporting.agent import AgentExporter

from ..common import create_agent


def test_export_reasoning_agent(tmp_path: Path) -> None:
    """Test exporting a reasoning agent.

    Parameters
    ----------
    tmp_path : Path
        Temporary path for the output directory.
    """
    agent, tools, models = create_agent(1, "reasoning")
    output_dir = tmp_path / "test_reasoning_agent_exporter"
    output_dir.mkdir(exist_ok=True)
    model_names = {model.id: model.name for model in models}
    # noinspection PyTypeChecker
    exporter = AgentExporter(
        agent=agent,
        agent_names={agent.id: agent.name},
        tool_names={tool.id: tool.name for tool in tools},
        models=(models, model_names),
        chats=([], {}),
        is_async=False,
        cache_seed=None,
        for_notebook=False,
        initial_chats=[],
        group_chat_members=[],
        arguments_resolver=lambda _agent: [
            '    llm_config="model-config"',
        ],
        output_dir=output_dir,
    )
    result = exporter.export()
    expected = (
        f"{agent.name} = ReasoningAgent(\n"
        f'    name="{agent.name}",\n'
        f'    description="{agent.description}",'
        '\n    system_message="system message of agent 1",\n'
        '    human_input_mode="NEVER",\n'
        "    max_consecutive_auto_reply=None,\n"
        '    default_auto_reply="",\n'
        "    code_execution_config=False,\n"
        "    is_termination_msg=None,\n"
        "    reason_config={\n"
        '        "method": "beam_search",\n'
        '        "max_depth": 3,\n'
        '        "forest_size": 1,\n'
        '        "rating_scale": 10,\n'
        '        "beam_size": 3,\n'
        '        "answer_approach": "pool"\n'
        "    },\n"
        "    verbose=True,\n"
        '    llm_config="model-config"\n'
        ")\n\n"
        f'__AGENTS__["{agent.name}"] = {agent.name}'
        "\n\n"
    )
    assert result.main_content == expected
    shutil.rmtree(output_dir)
