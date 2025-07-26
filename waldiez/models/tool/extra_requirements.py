# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez tool extra requirements."""

from typing import Set

from .predefined import get_predefined_tool_requirements
from .tool import WaldiezTool


def get_tools_extra_requirements(
    tools: list[WaldiezTool],
    autogen_version: str,
) -> Set[str]:
    """Get the tools extra requirements.

    Parameters
    ----------
    tools : list[WaldiezTool]
        The tools.
    autogen_version : str
        The ag2 version.

    Returns
    -------
    list[str]
        The tools extra requirements.
    """
    tool_requirements: Set[str] = set()
    for tool in tools:
        if tool.tool_type == "langchain":
            tool_requirements.add(f"ag2[interop-langchain]=={autogen_version}")
        if tool.tool_type == "crewai":
            tool_requirements.add(f"ag2[interop-crewai]=={autogen_version}")
        if tool.is_predefined:
            tool_requirements.update(
                get_predefined_tool_requirements(tool.name)
            )
        for requirement in tool.requirements:
            tool_requirements.add(requirement)
    return tool_requirements
