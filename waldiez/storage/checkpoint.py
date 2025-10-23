# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportUnknownVariableType=false

"""Checkpoint data structures."""

import json
from contextlib import suppress
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass
class Checkpoint:
    """A saved checkpoint."""

    session_name: str
    timestamp: datetime
    path: Path
    _state: dict[str, Any] | None = field(init=False, default=None)
    _metadata: dict[str, Any] | None = field(init=False, default=None)

    @property
    def state(self) -> dict[str, Any]:
        """Get the checkpoint's state."""
        if self._state is None:
            self._state = self._load_json(self.state_file) or {}
        return self._state

    @property
    def metadata(self) -> dict[str, Any]:
        """Get the checkpoint's metadata."""
        if self._metadata is None:
            self._metadata = self._load_json(self.metadata_file) or {}
        return self._metadata

    @staticmethod
    def _load_json(path: Path) -> dict[str, Any] | None:
        with suppress(Exception):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                if (
                    isinstance(data, list)
                    and data
                    and isinstance(data[0], dict)
                ):
                    return data[0]
        return None

    def refresh(self) -> None:
        """Reset the state and metadata."""
        self._state = None
        self._metadata = None

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
        return self.path.is_dir() and self.state_file.is_file()


@dataclass
class CheckpointInfo:
    """Information about a checkpoint."""

    session_name: str
    timestamp: datetime
    path: Path
    _checkpoint: Checkpoint | None = field(init=False, default=None)

    @property
    def checkpoint(self) -> Checkpoint:
        """Get the checkpoint."""
        if self._checkpoint is None:
            self._checkpoint = Checkpoint(
                session_name=self.session_name,
                timestamp=self.timestamp,
                path=self.path,
            )
        return self._checkpoint

    def to_dict(self) -> dict[str, Any]:
        """Get the dict representation of the checkpoint's info.

        Returns
        -------
        dict[str, Any]
            The dict representation of the checkpoint's info.
        """
        ts = self.timestamp
        if ts.tzinfo is None:
            ts = ts.astimezone(timezone.utc)
        elif ts.tzinfo != timezone.utc:
            ts = ts.replace(tzinfo=timezone.utc)
        return {
            "session": self.session_name,
            "timestamp": self.timestamp.strftime("%Y%m%d_%H%M%S_%f"),
            "path": str(self.path),
            "name": str(self.path.name),
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
        )
