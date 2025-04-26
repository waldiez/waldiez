# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Handle agent contents before and after the agent(s) exports."""

from typing import List, Tuple, Union

from waldiez.exporting.base import (
    AgentPosition,
    AgentPositions,
    ExporterReturnType,
    ExportPosition,
)
from waldiez.models import WaldiezAgent


def add_after_all_agents_content(
    agents_contents: str,
    after_export: List[Tuple[str, Union[ExportPosition, AgentPosition]]],
) -> str:
    """Add the after all agents content.

    Parameters
    ----------
    agents_contents : str
        The agents content.
    after_export : List[Tuple[str, Union[ExportPosition, AgentPosition]]]
        The after export.

    Returns
    -------
    str
        The agents content with the after all agents content.
    """
    new_content = str(agents_contents)
    # let's get the list first, and sort it by the order
    after_all_agent_exports = [
        (content, position)
        for content, position in after_export
        if isinstance(position, AgentPosition)
        and position.position == AgentPositions.AFTER_ALL
    ]
    by_order = sorted(after_all_agent_exports, key=lambda x: x[1].order)
    for content, _ in by_order:
        new_content += content + "\n"
    if not new_content.endswith("\n"):
        new_content += "\n"
    return new_content


def add_before_all_agents_content(
    agents_contents: str,
    before_export: List[Tuple[str, Union[ExportPosition, AgentPosition]]],
) -> str:
    """Add the before all agents content.

    Parameters
    ----------
    agents_contents : str
        The agents content.
    before_export : List[Tuple[str, Union[ExportPosition, AgentPosition]]]
        The before export.

    Returns
    -------
    str
        The agents content with the before all agents content.
    """
    new_content = str(agents_contents)
    before_all_agents_exports = [
        (content, position)
        for content, position in before_export
        if isinstance(position, AgentPosition)
        and position.position == AgentPositions.BEFORE_ALL
    ]
    for content, _ in before_all_agents_exports:
        new_content = content + "\n" + new_content
    if not new_content.startswith("\n"):
        new_content = "\n" + new_content
    return new_content


def add_before_agent_content(
    agent_content: str,
    before_export: List[Tuple[str, Union[ExportPosition, AgentPosition]]],
    agent: WaldiezAgent,
) -> str:
    """Add the before agent content.

    Parameters
    ----------
    agent_content : str
        The agent content.
    before_export : List[Tuple[str, Union[ExportPosition, AgentPosition]]]
        The before export.
    agent : WaldiezAgent
        The agent.

    Returns
    -------
    str
        The agent content with the before agent content.
    """
    new_content = str(agent_content)
    for content, position in before_export:
        if (
            isinstance(position, AgentPosition)
            and position.agent == agent
            and position.position == AgentPositions.BEFORE
        ):
            new_content = content + "\n" + new_content
    if not new_content.startswith("\n"):
        new_content = "\n" + new_content
    return new_content


def add_after_agent_content(
    agent_content: str,
    after_export: List[Tuple[str, Union[ExportPosition, AgentPosition]]],
    agent: WaldiezAgent,
) -> str:
    """Add the after agent content.

    Parameters
    ----------
    agent_content : str
        The agent content.
    after_export : List[Tuple[str, Union[ExportPosition, AgentPosition]]]
        The after export.
    agent : WaldiezAgent
        The agent.

    Returns
    -------
    str
        The agent content with the after agent content.
    """
    new_content = str(agent_content)
    for content, position in after_export:
        if (
            isinstance(position, AgentPosition)
            and position.agent == agent
            and position.position == AgentPositions.AFTER
        ):
            new_content += content + "\n"
    if not new_content.endswith("\n"):
        new_content += "\n"
    return new_content


def gather_agent_outputs(
    before_export: List[Tuple[str, Union[ExportPosition, AgentPosition]]],
    after_export: List[Tuple[str, Union[ExportPosition, AgentPosition]]],
    agent_outputs: List[ExporterReturnType],
) -> ExporterReturnType:
    """Gather all the agent outputs.

    Parameters
    ----------
    before_export : List[Tuple[str, Union[ExportPosition, AgentPosition]]]
        The before export.
    after_export : List[Tuple[str, Union[ExportPosition, AgentPosition]]]
        The after export.
    agent_outputs : List[ExporterReturnType]
        The agent outputs.

    Returns
    -------
    ExporterReturnType
        The gathered agent outputs.
    """
    agents_contents = ""
    agents_imports = []
    agents_before_export = []
    agents_after_export = []
    agents_env_vars = []
    for output in agent_outputs:
        if output["content"]:
            agents_contents += output["content"]
        if output["imports"]:
            agents_imports.extend(output["imports"])
        if output["before_export"]:
            agents_before_export.extend(output["before_export"])
        if output["after_export"]:
            agents_after_export.extend(output["after_export"])
        if output["environment_variables"]:
            agents_env_vars.extend(output["environment_variables"])
    agents_contents = add_before_all_agents_content(
        agents_contents,
        before_export,
    )
    agents_contents = add_after_all_agents_content(
        agents_contents,
        after_export,
    )
    agents_contents = agents_contents.replace("\n\n\n\n", "\n\n\n")
    while agents_contents.endswith("\n\n\n"):
        agents_contents = agents_contents[: -len("\n")]
    return {
        "content": agents_contents,
        "imports": agents_imports,
        "before_export": agents_before_export,
        "after_export": agents_after_export,
        "environment_variables": agents_env_vars,
    }
