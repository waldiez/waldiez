# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pyright: reportCallIssue=false
"""Helper functions for Waldiez models."""

from typing_extensions import Literal

from waldiez.models import (
    WaldiezTool,
    WaldiezToolData,
    WaldiezToolType,
)


def get_tool(
    tool_id: str = "wt-1",
    tool_type: WaldiezToolType = "custom",
) -> WaldiezTool:
    """Get a WaldiezTool.

    Parameters
    ----------
    tool_id : str, optional
        The tool ID, by default "wt-1"
    tool_type : WaldiezToolType, optional
        The tool type, by default "custom"

    Returns
    -------
    WaldiezTool
        A WaldiezTool instance.
    """
    return WaldiezTool(
        id=tool_id,
        name="tool_name",
        description="Tool Description",
        tags=["tool"],
        requirements=["chess"],
        type="tool",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezToolData(
            tool_type=tool_type,
            content=(
                "def tool_name() -> str:\n"
                '    """Tool Description."""\n'
                "    return 'Tool Response'"
            ),
            secrets={
                "TOOL_KEY": "tool_value",
            },
        ),
    )


def get_interop_tool(
    tool_id: str = "wt-2",
    tool_type: Literal["langchain", "crewai"] = "langchain",
) -> WaldiezTool:
    """Get an interop tool.

    Parameters
    ----------
    tool_id : str, optional
        The tool ID, by default "wt-2"
    tool_type : Literal["langchain", "crewai"]
        The tool type, by default "langchain"

    Returns
    -------
    WaldiezTool
        A WaldiezTool instance.
    """
    tool_name = f"{tool_type}_tool"
    # noinspection PyTypeChecker
    return WaldiezTool(
        id=tool_id,
        name=tool_name,
        description="Interop Tool Description",
        tags=["interop_tool"],
        requirements=[],
        type="tool",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezToolData(
            content=f"{tool_name} = lambda: 'Interop Tool Response'",
            tool_type=tool_type,
            secrets={},
        ),
    )
