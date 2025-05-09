# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez tool extra requirements."""

from typing import Iterator, Set

from .tool import WaldiezTool


def get_tools_extra_requirements(
    tools: Iterator[WaldiezTool],
    autogen_version: str,
) -> Set[str]:
    """Get the tools extra requirements.

    Parameters
    ----------
    tools : List[WaldiezTool]
        The tools.
    autogen_version : str
        The ag2 version.

    Returns
    -------
    List[str]
        The tools extra requirements.
    """
    tool_requirements: Set[str] = set()
    for tool in tools:
        if tool.tool_type == "langchain":
            tool_requirements.add(f"ag2[interop-langchain]=={autogen_version}")
        if tool.tool_type == "crewai":
            tool_requirements.add(f"ag2[interop-crewai]=={autogen_version}")
        for requirement in tool.requirements:
            tool_requirements.add(requirement)
    return tool_requirements
