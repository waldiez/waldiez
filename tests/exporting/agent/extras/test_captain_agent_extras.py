# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.agents.extras.captain_agent_extras."""

import shutil
from pathlib import Path

from waldiez.exporting.agent import AgentExporter, create_agent_exporter
from waldiez.models import WaldiezCaptainAgent, WaldiezCaptainAgentLibEntry

from ..common import create_agent


def test_export_captain_agent(tmp_path: Path) -> None:
    """Test exporting a reasoning agent.

    Parameters
    ----------
    tmp_path : Path
        Temporary path for the output directory.
    """
    agent, tools, models = create_agent(1, "captain")
    output_dir = tmp_path / "test_captain_agent_exporter"
    output_dir.mkdir(exist_ok=True)
    model_names: dict[str, str] = {model.id: model.name for model in models}
    # noinspection PyTypeChecker
    exporter = AgentExporter(
        agent=agent,
        agent_names={agent.id: agent.name},
        tool_names={tool.id: tool.name for tool in tools},
        models=(models, model_names),
        chats=([], {}),
        for_notebook=False,
        initial_chats=[],
        group_chat_members=[],
        arguments_resolver=lambda _agent: [
            "    llm_config='model-config'",
        ],
        output_dir=output_dir,
        is_async=False,
        cache_seed=None,
    )
    result = exporter.export()
    config_arg = f'"config_file_or_env": "{agent.name}_llm_config.json"'
    expected = (
        f"{agent.name} = CaptainAgent(\n"
        f'    name="{agent.name}",\n'
        f'    description="{agent.description}",\n'
        '    system_message="system message of agent 1",\n'
        '    human_input_mode="NEVER",\n'
        "    max_consecutive_auto_reply=None,\n"
        '    default_auto_reply="",\n'
        "    code_execution_config=False,\n"
        "    is_termination_msg=None,  # pyright: ignore\n"
        "    agent_config_save_path=os.getcwd(),\n"
        "    nested_config={\n"
        '        "autobuild_init_config": {\n'
        f"            {config_arg},\n"
        '            "builder_model": "gpt-4o",\n'
        '            "agent_model": "gpt-4o"\n'
        "        },\n"
        '        "autobuild_build_config": {\n'
        '            "default_llm_config": {\n'
        '                "temperature": 1,\n'
        '                "top_p": 0.95,\n'
        '                "max_tokens": 2048\n'
        "            },\n"
        '            "code_execution_config": {\n'
        '                "timeout": 300,\n'
        '                "work_dir": "groupchat",\n'
        '                "last_n_messages": 1,\n'
        '                "use_docker": False\n'
        "            },\n"
        '            "coding": False\n'
        "        },\n"
        '        "group_chat_config": {\n'
        '            "max_round": 10\n'
        "        },\n"
        '        "group_chat_llm_config": None,\n'
        '        "max_turns": 5\n'
        "    },\n"
        "    llm_config='model-config'\n"
        ")"
    )
    assert result.main_content == expected
    shutil.rmtree(output_dir)

    output_dir = tmp_path / "test_captain_agent_exporter_2"

    agent1, tools, models = create_agent(2, "captain")
    assert isinstance(agent1, WaldiezCaptainAgent)
    agent1.data.agent_lib = [
        WaldiezCaptainAgentLibEntry(
            name="agentX",
            description="Agent X library",
            system_message="system message of agent X",
        ),
        WaldiezCaptainAgentLibEntry(
            name="agentY",
            description="Agent Y library",
            system_message="system message of agent Y",
        ),
    ]
    exporter = create_agent_exporter(
        agent=agent1,
        agent_names={agent1.id: agent1.name},
        models=(models, model_names),
        tool_names={tool.id: tool.name for tool in tools},
        chats=([], {}),
        cache_seed=None,
        for_notebook=False,
        group_chat_members=[],
        initial_chats=[],
        is_async=False,
        arguments_resolver=lambda _agent: [
            "    llm_config='model-config'",
        ],
        output_dir=output_dir,
    )
    config_arg = f'"config_file_or_env": "{agent1.name}_llm_config.json"'
    expected = (
        f"{agent1.name} = CaptainAgent(\n"
        f'    name="{agent1.name}",\n'
        f'    description="{agent1.description}",\n'
        '    system_message="system message of agent 2",\n'
        '    human_input_mode="NEVER",\n'
        "    max_consecutive_auto_reply=None,\n"
        '    default_auto_reply="",\n'
        "    code_execution_config=False,\n"
        "    is_termination_msg=None,  # pyright: ignore\n"
        "    agent_config_save_path=os.getcwd(),\n"
        f'    agent_lib="{agent1.name}_agent_lib.json",\n'
        # '    tool_lib="default",\n'
        "    nested_config={\n"
        '        "autobuild_init_config": {\n'
        f"            {config_arg},\n"
        '            "builder_model": "gpt-4o",\n'
        '            "agent_model": "gpt-4o"\n'
        "        },\n"
        '        "autobuild_build_config": {\n'
        '            "default_llm_config": {\n'
        '                "temperature": 1,\n'
        '                "top_p": 0.95,\n'
        '                "max_tokens": 2048\n'
        "            },\n"
        '            "code_execution_config": {\n'
        '                "timeout": 300,\n'
        '                "work_dir": "groupchat",\n'
        '                "last_n_messages": 1,\n'
        '                "use_docker": False\n'
        "            },\n"
        '            "coding": False\n'
        "        },\n"
        '        "group_chat_config": {\n'
        '            "max_round": 10\n'
        "        },\n"
        '        "group_chat_llm_config": None,\n'
        '        "max_turns": 5\n'
        "    },\n"
        "    llm_config='model-config'\n"
        ")"
    )
    assert exporter.export().main_content == expected
    shutil.rmtree(output_dir)
