# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportUnknownVariableType=false

"""Checkpoint data structures."""

import json
from dataclasses import dataclass, field
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
    state: dict[str, Any] = field(init=False, default_factory=dict)

    def __post_init__(self) -> None:
        """Load the state after init."""
        state_dict: dict[str, Any] = {}
        if self.exists:
            with open(self.state_file, "r", encoding="utf-8") as state_file:
                state_data = json.load(state_file)
                if isinstance(state_data, list) and isinstance(
                    state_data[0], dict
                ):
                    state_dict = state_data[0]
                elif isinstance(state_data, dict):
                    state_dict = state_data
        self.state = state_dict

        if self.metadata_file.is_file():
            # pylint: disable=broad-exception-caught,too-many-try-statements
            try:
                with open(
                    self.metadata_file, "r", encoding="utf-8"
                ) as meta_file:
                    meta_data = json.load(meta_file)
                    if isinstance(meta_data, list) and isinstance(
                        meta_data[0], dict
                    ):
                        self.metadata = meta_data[0]
                    elif isinstance(meta_data, dict):
                        self.metadata = meta_data
            except BaseException:
                pass

    @property
    def state_file(self) -> Path:
        """Path to the state.json file."""
        return self.path / "state.json"

    @property
    def metadata_file(self) -> Path:
        """Path to the metadata.json file."""
        return self.path / "metadata.json"

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

    checkpoint: Checkpoint = field(init=False)

    def __post_init__(self) -> None:
        """Load the checkpoint after init."""
        self.checkpoint = Checkpoint(
            session_name=self.session_name,
            timestamp=self.timestamp,
            path=self.path,
            metadata=self.metadata,
        )
        self.metadata = self.checkpoint.metadata

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
            "name": str(self.path.name),
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
