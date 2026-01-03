# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test for waldiez.exporting.tools.ToolsExporter."""

import shutil
from pathlib import Path

from waldiez.exporting.tools import ToolsExporter
from waldiez.exporting.tools.factory import create_tools_exporter
from waldiez.models import WaldiezAgent, WaldiezTool


# flake8: noqa: E501
# pylint: disable=too-many-locals,unused-argument,line-too-long,inconsistent-quotes
# noinspection PyArgumentList
def test_tools_exporter(tmp_path: Path) -> None:
    """Test ToolsExporter.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    flow_name = "flow1"
    agent1_name = "agent1"
    agent2_name = "agent2"
    tool1_name = "tool1"
    tool2_name = "tool2"
    tool3_name = "tool3"
    # fmt: off
    tool1_content = (
        f"def {tool1_name}():" + "\n" + f'    return "tool body of {tool1_name}"'
    )
    tool2_content = (
        f"def {tool2_name}():" + "\n" + f'    return "tool body of {tool2_name}"'
    )
    tool3_content = '''
"""Some content before the function."""

import os
import other

def other_function():
    return "other function"

def tool3():
    return "tool body of tool3"

'''
    # fmt: on
    tool1 = WaldiezTool(
        id="wt-1",
        name=tool1_name,
        description=f"{tool1_name} description",
        data={  # type: ignore
            "content": tool1_content,
            "secrets": {
                "SECRET_KEY_1": "SECRET_VALUE_1",
                "SECRET_KEY_2": "SECRET_VALUE_2",
            },
        },
    )
    tool2 = WaldiezTool(
        id="wt-2",
        name=tool2_name,
        description=f"{tool2_name} description",
        data={  # type: ignore
            "content": tool2_content,
            "secrets": {},
        },
    )
    tool3 = WaldiezTool(
        id="wt-3",
        name="tool3",
        description="tool3 description",
        data={"content": tool3_content, "secrets": {}},  # type: ignore
    )
    agent1 = WaldiezAgent(
        id="wa-1",
        name=agent1_name,
        agent_type="assistant",
        description="agent description",
        data={  # type: ignore
            "tools": [
                {
                    "id": "wt-1",
                    "executor_id": "wa-1",
                },
                {
                    "id": "wt-2",
                    "executor_id": "wa-2",
                },
                {
                    "id": "wt-3",
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
        data={"tools": []},  # type: ignore
    )
    agent_names = {"wa-1": "agent1", "wa-2": "agent2"}
    tool_names = {
        "wt-1": tool1_name,
        "wt-2": tool2_name,
        "wt-3": tool3_name,
    }
    tools_exporter = ToolsExporter(
        flow_name=flow_name,
        agents=[agent1, agent2],
        agent_names=agent_names,
        tools=[tool1, tool2, tool3],
        tool_names=tool_names,
        is_async=False,
        output_dir=None,
    )
    main_content = tools_exporter.get_main_content()
    assert not main_content
    generated = tools_exporter.extras.function_content
    expected_string = (
        tool1_content
        + "\n\n"
        + tool2_content
        + "\n\n"
        + 'def tool3():\n    return "tool body of tool3"'
        + "\n\n"
    )
    assert generated == expected_string
    expected_environment_variables = [
        ("SECRET_KEY_1", "SECRET_VALUE_1"),
        ("SECRET_KEY_2", "SECRET_VALUE_2"),
    ]
    assert [
        entry.as_tuple() for entry in tools_exporter.get_environment_variables()
    ] == expected_environment_variables
    expected_after_agent_string = (
        "\n"
        "register_function(\n"
        f"    {tool1_name},"
        "\n"
        f"    caller={agent1_name},"
        "\n"
        f"    executor={agent1_name},"
        "\n"
        f'    name="{tool1_name}",'
        "\n"
        f'    description="{tool1_name} description",'
        "\n"
        ")\n"
        "register_function(\n"
        f"    {tool2_name},"
        "\n"
        f"    caller={agent1_name},"
        "\n"
        f"    executor={agent2_name},"
        "\n"
        f'    name="{tool2_name}",'
        "\n"
        f'    description="{tool2_name} description",'
        "\n"
        ")\n"
        "register_function(\n"
        "    tool3,\n"
        f"    caller={agent1_name},\n"
        f"    executor={agent1_name},\n"
        f'    name="{tool3_name}",\n'
        f'    description="{tool3_name} description",\n'
        ")\n"
    )
    after_agent = tools_exporter.extras.registration_content
    assert after_agent is not None
    assert after_agent == expected_after_agent_string
    output_dir = tmp_path / "test_tools_exporter"
    output_dir.mkdir()
    # and one with with factory and no tools
    agent1.data.tools = []
    agent2.data.tools = []
    create_tools_exporter(
        flow_name=flow_name,
        agents=[agent1, agent2],
        agent_names=agent_names,
        tools=[],
        tool_names=tool_names,
        is_async=False,
        output_dir=str(output_dir),
    )
    shutil.rmtree(output_dir)


# noinspection PyArgumentList
def test_export_interop_tool(tmp_path: Path) -> None:
    """Test export_interop_tool.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    flow_name = "flow1"
    agent1_name = "agent1"
    agent2_name = "agent2"
    tool1_name = "tool1"
    tool2_name = "wiki_tool"
    # fmt: off
    tool1_content = (
        f"def {tool1_name}():" + "\n" + f'    return "tool body of {tool1_name}"'
    )
    tool2_content = '''
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
    tool2_expected_content = (
        '"""Wikipedia Query Run."""\n\n'
        'api_wrapper = WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)\n'
        'wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)\n'
        'ag2_wiki_tool_interop = Interoperability()\n'
        'ag2_wiki_tool = ag2_wiki_tool_interop.convert_tool(\n'
        '    tool=wiki_tool,\n'
        '    type="langchain"\n)'
    )
    # fmt: on
    agent_names = {"wa-1": "agent1", "wa-2": "agent2"}
    tool_names = {
        "wt-1": tool1_name,
        "wt-2": tool2_name,
    }
    tool1 = WaldiezTool(
        id="wt-1",
        name=tool1_name,
        description=f"{tool1_name} description",
        data={  # type: ignore
            "content": tool1_content,
            "secrets": {
                "SECRET_KEY_1": "SECRET_VALUE_1",
                "SECRET_KEY_2": "SECRET_VALUE_2",
            },
        },
    )
    tool2 = WaldiezTool(
        id="wt-2",
        name=tool2_name,
        description=f"{tool2_name} description",
        data={  # type: ignore
            "content": tool2_content,
            "tool_type": "langchain",
            "secrets": {},
        },
    )
    agent1 = WaldiezAgent(
        id="wa-1",
        name=agent1_name,
        agent_type="assistant",
        description="agent description",
        data={  # type: ignore
            "tools": [
                {
                    "id": "wt-1",
                    "executor_id": "wa-1",
                },
                {
                    "id": "wt-2",
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
        data={"tools": []},  # type: ignore
    )
    tools_exporter = create_tools_exporter(
        flow_name=flow_name,
        agents=[agent1, agent2],
        agent_names=agent_names,
        tools=[tool1, tool2],
        tool_names=tool_names,
        is_async=False,
        output_dir=str(tmp_path / "test_export_interop_tool"),
    )
    expected_environment_variables = [
        ("SECRET_KEY_1", "SECRET_VALUE_1"),
        ("SECRET_KEY_2", "SECRET_VALUE_2"),
    ]
    assert [
        env.as_tuple() for env in tools_exporter.get_environment_variables()
    ] == expected_environment_variables
    contents = tools_exporter.extras.function_content
    expected_string = tool1_content + "\n\n" + tool2_expected_content + "\n\n"
    assert contents == expected_string
    after_agent = tools_exporter.extras.registration_content
    assert after_agent is not None
    expected_after_agent_string = (
        "\n"
        "register_function(\n"
        f"    {tool1_name},"
        "\n"
        f"    caller={agent1_name},"
        "\n"
        f"    executor={agent1_name},"
        "\n"
        f'    name="{tool1_name}",'
        "\n"
        f'    description="{tool1_name} description",'
        "\n"
        ")\n"
        "register_function(\n"
        f"    ag2_wiki_tool,\n"
        f"    caller={agent1_name},\n"
        f"    executor={agent2_name},\n"
        f'    name="ag2_{tool2_name}",\n'
        f'    description="{tool2_name} description",\n'
        ")\n"
    )
    assert after_agent == expected_after_agent_string
