# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Content module for Waldiez exporting core."""

from dataclasses import dataclass, field
from typing import Any, Optional

from .enums import (
    AgentPosition,
    ContentType,
    ExportPosition,
)
from .errors import ExporterContentError


@dataclass
class PositionedContent:
    """Content with position and ordering metadata."""

    content: str
    position: ExportPosition
    order: int = 0
    agent_id: Optional[str] = None
    agent_position: Optional[AgentPosition] = None
    metadata: dict[str, Any] = field(default_factory=dict[str, Any])

    def __post_init__(self) -> None:
        """Validate positioned content."""
        if not self.content.strip():
            raise ExporterContentError("Content cannot be empty or whitespace.")

    def is_agent_positioned(self) -> bool:
        """Check if this content is positioned relative to an agent.

        Returns
        -------
        bool
            True if this content has an agent ID and position, otherwise False.
        """
        return self.agent_position is not None and self.agent_id is not None

    def __lt__(self, other: "PositionedContent") -> bool:
        """Enable sorting by position, then order, then content.

        Parameters
        ----------
        other : PositionedContent
            The other positioned content to compare against.

        Returns
        -------
        bool
            True if this positioned content should come before the other.
        """
        if self.position != other.position:
            return self.position.value < other.position.value
        if self.order != other.order:
            return self.order < other.order
        return self.content < other.content


@dataclass
class ContentMetadata:
    """Metadata about exported content."""

    content_type: ContentType
    source_id: Optional[str] = None
    dependencies: list[str] = field(default_factory=list[str])
    tags: set[str] = field(default_factory=set[str])
