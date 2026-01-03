# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Predefined tools registry for Waldiez."""

from ._config import PredefinedToolConfig
from ._duckduckgo import DuckDuckGoSearchConfig
from ._google import GoogleSearchConfig
from ._perplexity import PerplexitySearchConfig
from ._searxng import SearxNGSearchConfig
from ._tavily import TavilySearchConfig
from ._waldiez import WaldiezFlowConfig
from ._wikipedia import WikipediaSearchConfig
from ._youtube import YouTubeSearchConfig

PREDEFINED_TOOLS: dict[str, PredefinedToolConfig] = {
    GoogleSearchConfig.name: GoogleSearchConfig,
    WikipediaSearchConfig.name: WikipediaSearchConfig,
    YouTubeSearchConfig.name: YouTubeSearchConfig,
    TavilySearchConfig.name: TavilySearchConfig,
    DuckDuckGoSearchConfig.name: DuckDuckGoSearchConfig,
    PerplexitySearchConfig.name: PerplexitySearchConfig,
    SearxNGSearchConfig.name: SearxNGSearchConfig,
    WaldiezFlowConfig.name: WaldiezFlowConfig,
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


def get_predefined_tool_imports(tool_name: str) -> list[str]:
    """Get imports for a predefined tool.

    Parameters
    ----------
    tool_name : str
        Name of the tool to retrieve imports for.

    Returns
    -------
    list[str]
        List of imports for the tool,
        or an empty list if the tool does not exist.
    """
    config = get_predefined_tool_config(tool_name)
    return config.implementation.tool_imports if config else []


def list_predefined_tools() -> list[str]:
    """List all available predefined tools.

    Returns
    -------
    list[str]
        List of all predefined tool names.
    """
    return list(PREDEFINED_TOOLS.keys())
