# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Export position enum."""

from dataclasses import dataclass
from enum import Enum


class ExportPositions(Enum):
    """Export position.

    Attributes
    ----------
    TOP : int
        The top of the export (name, comments etc.)
    IMPORTS : int
        The imports section.
    MODELS : int
        The models section (define the llm_configs).
    SKILLS : int
        The skills section (generate the skill files, and import them)
    AGENTS : int
        The agents section.
    CHATS : int
        The chats section (e.g. agent.initiate_chat, or initiate_chats)
    BOTTOM : int
        The bottom part of the export (like the main function and calling it).
    """

    TOP = 0
    IMPORTS = 1
    SKILLS = 2
    MODELS = 3
    AGENTS = 4
    CHATS = 5
    BOTTOM = 6


@dataclass(order=True, frozen=True, slots=True)
class ExportPosition:
    """Export position.

    Optionally, the order can be provided
    to sort the exported content.
    """

    position: ExportPositions
    order: int = 0
