# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Utilities for chat content after exporting."""

from waldiez.exporting.base import (
    AgentPosition,
    ExportPosition,
    ExportPositions,
)


def add_before_chat_content(
    chat_content: str,
    before_export: list[tuple[str, ExportPosition | AgentPosition]],
) -> str:
    """Add the before chat content.

    Parameters
    ----------
    chat_content : str
        The chat content.
    before_export : list[tuple[str, ExportPosition | AgentPosition]]
        The before export.

    Returns
    -------
    str
        The chat content with the before chat content.
    """
    new_content = str(chat_content)
    for content, position in before_export:
        if (
            isinstance(position, ExportPosition)
            and position.position == ExportPositions.CHATS
        ):
            new_content = content + "\n" + new_content
    if not new_content.endswith("\n"):
        new_content += "\n"
    return new_content


def add_after_chat_content(
    chat_content: str,
    after_export: list[tuple[str, ExportPosition | AgentPosition]],
) -> str:
    """Add the after chat content.

    Parameters
    ----------
    chat_content : str
        The chat content.
    after_export : list[tuple[str, ExportPosition | AgentPosition]]
        The after export.

    Returns
    -------
    str
        The chat content with the after chat content.
    """
    new_content = str(chat_content)
    for content, position in after_export:
        if (
            isinstance(position, ExportPosition)
            and position.position == ExportPositions.CHATS
        ):
            new_content += content + "\n"
    if not new_content.endswith("\n"):
        new_content += "\n"
    return new_content
