# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Code execution related functions for exporting agents."""

from typing import Tuple

from waldiez.models import WaldiezAgent


def get_agent_code_execution_config(
    agent: WaldiezAgent, agent_name: str, tool_names: dict[str, str]
) -> Tuple[str, str, str]:
    """Get the code execution config for the agent.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    agent_name : str
        The agent name.
    tool_names : dict[str, str]
        A mapping of tool id to tool name.

    Returns
    -------
    Tuple[str, str, str, Set[str]]
        - The executor content.
        - The executor argument.
        - The extra autogen.coding import if needed.
    """
    if agent.data.code_execution_config is False:
        return "", "False", ""
    use_docker = agent.data.code_execution_config.use_docker
    if use_docker is None:
        use_docker = False
    executor_class_name = (
        "DockerCommandLineCodeExecutor"
        if use_docker
        else "LocalCommandLineCodeExecutor"
    )
    executor_content = f"{agent_name}_executor = {executor_class_name}(" + "\n"
    if agent.data.code_execution_config.work_dir:
        wok_dir = agent.data.code_execution_config.work_dir.replace(
            '"', '\\"'
        ).replace("\n", "\\n")
        executor_content += f'    work_dir="{wok_dir}",' + "\n"
    if agent.data.code_execution_config.timeout:
        executor_content += (
            f"    timeout={agent.data.code_execution_config.timeout}," + "\n"
        )
    if use_docker is False and agent.data.code_execution_config.functions:
        function_names: list[str] = []
        for tool_id in agent.data.code_execution_config.functions:
            tool_name = tool_names[tool_id]
            function_names.append(tool_name)
        if function_names:
            # pylint: disable=inconsistent-quotes
            function_names_string = ", ".join(function_names)
            executor_content += (
                f"    functions=[{function_names_string}]," + "\n"
            )
    executor_content += ")\n\n"
    executor_arg = f'{{"executor": {agent_name}_executor}}'
    the_import = f"from autogen.coding import {executor_class_name}"
    return executor_content, executor_arg, the_import
