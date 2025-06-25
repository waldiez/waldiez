# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Predefined tools registry for Waldiez."""

from ._config import PredefinedToolConfig
from ._wikipedia import WikipediaSearchTool

PREDEFINED_TOOLS: dict[str, PredefinedToolConfig] = {
    WikipediaSearchTool.name: PredefinedToolConfig(
        name=WikipediaSearchTool.name,
        description=WikipediaSearchTool.description,
        required_secrets=WikipediaSearchTool.required_secrets,
        requirements=WikipediaSearchTool.requirements,
        tags=WikipediaSearchTool.tags,
        implementation=WikipediaSearchTool,
    ),
}


def get_predefined_tool_config(tool_name: str) -> PredefinedToolConfig | None:
    """Get configuration for a predefined tool.

    Parameters
    ----------
    tool_name : str
        Name of the tool to retrieve configuration for.

    Returns
    -------
    PredefinedToolConfig | None
        Configuration of the tool if it exists, otherwise None.
    """
    return PREDEFINED_TOOLS.get(tool_name)


def get_predefined_tool_requirements(tool_name: str) -> list[str]:
    """Get requirements for a predefined tool.

    Parameters
    ----------
    tool_name : str
        Name of the tool to retrieve requirements for.

    Returns
    -------
    list[str]
        List of requirements for the tool,
        or an empty list if the tool does not exist.
    """
    config = get_predefined_tool_config(tool_name)
    return config.requirements if config else []
