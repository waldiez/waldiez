# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=too-many-locals,too-many-statements,line-too-long
"""Test waldiez.exporting.agent.AgentExporter."""

import shutil
from pathlib import Path

from waldiez.exporting import AgentExporter

from .common import create_agent


def test_export_user(tmp_path: Path) -> None:
    """Test exporting a user agent.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    output_dir = tmp_path / "test_agent_exporter"
    output_dir.mkdir(exist_ok=True)
    agent, skills, models = create_agent(1, "user_proxy")
    model_names = {model.id: model.name for model in models}
    exporter = AgentExporter(
        agent=agent,
        chats=([], {}),
        agent_names={agent.id: agent.name},
        skill_names={skill.id: skill.name for skill in skills},
        models=(models, model_names),
        for_notebook=False,
        arguments_resolver=lambda _agent: [
            "    llm_config='model-config'",
        ],
        is_async=False,
        output_dir=output_dir,
    )
    output = exporter.export()
    assert output["imports"]
    imports = [x[0] for x in output["imports"]]
    assert "from autogen import UserProxyAgent" in imports
    content = output["content"]
    assert content == (
        f"{agent.name} = UserProxyAgent(\n"
        f'    name="{agent.name}",\n'
        f'    description="{agent.description}",\n'
        '    system_message="system message of agent 1",\n'
        '    human_input_mode="ALWAYS",\n'
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
