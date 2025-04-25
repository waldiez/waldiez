# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.skills.SkillsExporter."""

import shutil
from pathlib import Path

from waldiez.exporting.base import AgentPosition, AgentPositions
from waldiez.exporting.skills import SkillsExporter

from waldiez.models import WaldiezAgent, WaldiezSkill


# flake8: noqa: E501
# pylint: disable=too-many-locals,unused-argument,line-too-long,inconsistent-quotes
def test_skills_exporter(tmp_path: Path) -> None:
    """Test SkillsExporter.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    flow_name = "flow1"
    agent1_name = "agent1"
    agent2_name = "agent2"
    skill1_name = "skill1"
    skill2_name = "skill2"
    skill3_name = "skill3"
    # fmt: off
    skill1_content = (
        f"def {skill1_name}():" + "\n" + f'    return "skill body of {skill1_name}"'
    )
    skill2_content = (
        f"def {skill2_name}():" + "\n" + f'    return "skill body of {skill2_name}"'
    )
    skill3_content = '''
"""Some content before the function."""

import os
import other

def other_function():
    return "other function"

def skill3():
    return "skill body of skill3"

'''
    # fmt: on
    skill1 = WaldiezSkill(
        id="ws-1",
        name=skill1_name,
        description=f"{skill1_name} description",
        data={  # type: ignore
            "content": skill1_content,
            "secrets": {
                "SECRET_KEY_1": "SECRET_VALUE_1",
                "SECRET_KEY_2": "SECRET_VALUE_2",
            },
        },
    )
    skill2 = WaldiezSkill(
        id="ws-2",
        name=skill2_name,
        description=f"{skill2_name} description",
        data={  # type: ignore
            "content": skill2_content,
            "secrets": {},
        },
    )
    skill3 = WaldiezSkill(
        id="ws-3",
        name="skill3",
        description="skill3 description",
        data={"content": skill3_content, "secrets": {}},  # type: ignore
    )
    agent1 = WaldiezAgent(
        id="wa-1",
        name=agent1_name,
        agent_type="assistant",
        description="agent description",
        data={  # type: ignore
            "skills": [
                {
                    "id": "ws-1",
                    "executor_id": "wa-1",
                },
                {
                    "id": "ws-2",
                    "executor_id": "wa-2",
                },
                {
                    "id": "ws-3",
                    "executor_id": "wa-1",
                },
            ],
        },
    )
    agent2 = WaldiezAgent(
        id="wa-2",
        name=agent2_name,
        agent_type="assistant",
        description="agent description",
        data={"skills": []},  # type: ignore
    )
    agent_names = {"wa-1": "agent1", "wa-2": "agent2"}
    skill_names = {
        "ws-1": skill1_name,
        "ws-2": skill2_name,
        "ws-3": skill3_name,
    }
    skills_exporter = SkillsExporter(
        flow_name=flow_name,
        agents=[agent1, agent2],
        agent_names=agent_names,
        skills=[skill1, skill2, skill3],
        skill_names=skill_names,
        output_dir=None,
    )
    generated = skills_exporter.generate()
    expected_string = (
        skill1_content
        + "\n\n"
        + skill2_content
        + "\n\n"
        + 'def skill3():\n    return "skill body of skill3"'
        + "\n\n"
    )
    assert generated == expected_string
    expected_environment_variables = [
        ("SECRET_KEY_1", "SECRET_VALUE_1"),
        ("SECRET_KEY_2", "SECRET_VALUE_2"),
    ]
    assert (
        skills_exporter.get_environment_variables()
        == expected_environment_variables
    )
    assert skills_exporter.get_before_export() is None
    expected_after_agent_position = AgentPosition(
        None, AgentPositions.AFTER_ALL, 1
    )
    expected_after_agent_string = (
        "\n"
        "register_function(\n"
        f"    {skill1_name},"
        "\n"
        f"    caller={agent1_name},"
        "\n"
        f"    executor={agent1_name},"
        "\n"
        f'    name="{skill1_name}",'
        "\n"
        f'    description="{skill1_name} description",'
        "\n"
        ")\n"
        "\n"
        "register_function(\n"
        f"    {skill2_name},"
        "\n"
        f"    caller={agent1_name},"
        "\n"
        f"    executor={agent2_name},"
        "\n"
        f'    name="{skill2_name}",'
        "\n"
        f'    description="{skill2_name} description",'
        "\n"
        ")\n"
        "\n"
        "register_function(\n"
        "    skill3,\n"
        f"    caller={agent1_name},\n"
        f"    executor={agent1_name},\n"
        f'    name="{skill3_name}",\n'
        f'    description="{skill3_name} description",\n'
        ")\n"
        "\n"
    )
    after_agent = skills_exporter.get_after_export()
    assert after_agent is not None
    assert after_agent[0][0] == expected_after_agent_string
    assert after_agent[0][1] == expected_after_agent_position
    output_dir = tmp_path / "test_skills_exporter"
    output_dir.mkdir()
    # and one with no skills
    agent1.data.skills = []
    agent2.data.skills = []
    skills_exporter = SkillsExporter(
        flow_name=flow_name,
        agents=[agent1, agent2],
        agent_names=agent_names,
        skills=[],
        skill_names=skill_names,
        output_dir=str(output_dir),
    )
    imports = skills_exporter.get_imports()
    assert not imports
    shutil.rmtree(output_dir)


def test_export_interop_skill(tmp_path: Path) -> None:
    """Test export_interop_skill.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    flow_name = "flow1"
    agent1_name = "agent1"
    agent2_name = "agent2"
    skill1_name = "skill1"
    skill2_name = "wiki_tool"
    # fmt: off
    skill1_content = (
        f"def {skill1_name}():" + "\n" + f'    return "skill body of {skill1_name}"'
    )
    skill2_content = '''
"""Wikipedia Query Run."""
import os
import sys
from typing import List

from autogen.interop import Interoperability
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)
wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)
'''
    skill2_expected_content = (
        '"""Wikipedia Query Run."""\n\n'
        'api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)\n'
        'wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)\n'
        'ag2_wiki_tool_interop = Interoperability()\n'
        'ag2_wiki_tool = ag2_wiki_tool_interop.convert_tool(tool=wiki_tool, type="langchain")'
    )
    # fmt: on
    agent_names = {"wa-1": "agent1", "wa-2": "agent2"}
    skill_names = {
        "ws-1": skill1_name,
        "ws-2": skill2_name,
    }
    skill1 = WaldiezSkill(
        id="ws-1",
        name=skill1_name,
        description=f"{skill1_name} description",
        data={  # type: ignore
            "content": skill1_content,
            "secrets": {
                "SECRET_KEY_1": "SECRET_VALUE_1",
                "SECRET_KEY_2": "SECRET_VALUE_2",
            },
        },
    )
    skill2 = WaldiezSkill(
        id="ws-2",
        name=skill2_name,
        description=f"{skill2_name} description",
        data={  # type: ignore
            "content": skill2_content,
            "skill_type": "langchain",
            "secrets": {},
        },
    )
    agent1 = WaldiezAgent(
        id="wa-1",
        name=agent1_name,
        agent_type="assistant",
        description="agent description",
        data={  # type: ignore
            "skills": [
                {
                    "id": "ws-1",
                    "executor_id": "wa-1",
                },
                {
                    "id": "ws-2",
                    "executor_id": "wa-2",
                },
            ],
        },
    )
    agent2 = WaldiezAgent(
        id="wa-2",
        name=agent2_name,
        agent_type="assistant",
        description="agent description",
        data={"skills": []},  # type: ignore
    )
    skills_exporter = SkillsExporter(
        flow_name=flow_name,
        agents=[agent1, agent2],
        agent_names=agent_names,
        skills=[skill1, skill2],
        skill_names=skill_names,
        output_dir=str(tmp_path / "test_export_interop_skill"),
    )
    generated = skills_exporter.generate()
    expected_string = skill1_content + "\n\n" + skill2_expected_content + "\n\n"
    assert generated == expected_string
    expected_environment_variables = [
        ("SECRET_KEY_1", "SECRET_VALUE_1"),
        ("SECRET_KEY_2", "SECRET_VALUE_2"),
    ]
    assert (
        skills_exporter.get_environment_variables()
        == expected_environment_variables
    )
    assert skills_exporter.get_before_export() is None
    expected_after_agent_position = AgentPosition(
        None, AgentPositions.AFTER_ALL, 1
    )
    expected_after_agent_string = (
        "\n"
        "register_function(\n"
        f"    {skill1_name},"
        "\n"
        f"    caller={agent1_name},"
        "\n"
        f"    executor={agent1_name},"
        "\n"
        f'    name="{skill1_name}",'
        "\n"
        f'    description="{skill1_name} description",'
        "\n"
        ")\n"
        "\n"
        "register_function(\n"
        f"    ag2_{skill2_name},"
        "\n"
        f"    caller={agent1_name},"
        "\n"
        f"    executor={agent2_name},"
        "\n"
        f'    name="ag2_{skill2_name}",'
        "\n"
        f'    description="{skill2_name} description",'
        "\n"
        ")\n"
        "\n"
    )
    after_agent = skills_exporter.get_after_export()
    assert after_agent is not None
    assert after_agent[0][0] == expected_after_agent_string
    assert after_agent[0][1] == expected_after_agent_position
