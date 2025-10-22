# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Checkpoint data structures."""

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


@dataclass
class Checkpoint:
    """A saved checkpoint."""

    session_name: str
    timestamp: datetime
    path: Path
    metadata: dict[str, Any]

    @property
    def state_file(self) -> Path:
        """Path to the state.json file."""
        return self.path / "state.json"

    @property
    def exists(self) -> bool:
        """Check if the checkpoint exists on disk."""
        return self.path.exists() and self.state_file.exists()


@dataclass
class CheckpointInfo:
    """Information about a checkpoint."""

    session_name: str
    timestamp: datetime
    path: Path
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        """Get the dict representation of the checkpoint's info.

        Returns
        -------
        dict[str, Any]
            The dict representation of the checkpoint's info.
        """
        return {
            "session": self.session_name,
            "timestamp": self.timestamp.strftime("%Y%m%d_%H%M%S_%f"),
            "path": str(self.path),
            "metadata": self.metadata,
        }

    @classmethod
    def from_checkpoint(cls, checkpoint: Checkpoint) -> "CheckpointInfo":
        """Create CheckpointInfo from a Checkpoint.

        Parameters
        ----------
        checkpoint : Checkpoint
            The checkpoint to load info from

        Returns
        -------
        CheckpointInfo
            The loaded checkpoint info.
        """
        return cls(
            session_name=checkpoint.session_name,
            timestamp=checkpoint.timestamp,
            path=checkpoint.path,
            metadata=checkpoint.metadata,
        )
