# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportUnknownVariableType=false

"""WaldiezCheckpoint data structures."""

import json
from contextlib import suppress
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


# noinspection PyBroadException
@dataclass
class WaldiezCheckpoint:
    """A saved checkpoint."""

    session_name: str
    timestamp: datetime
    path: Path
    _state: dict[str, Any] | None = field(init=False, default=None)
    _metadata: dict[str, Any] | None = field(init=False, default=None)

    @property
    def id(self) -> str:
        """Get the id of the checkpoint.

        Returns
        -------
        str
            The id of the checkpoint.
        """
        return WaldiezCheckpoint.format_timestamp(self.timestamp)

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

    @property
    def state_file(self) -> Path:
        """Path to the state.json file."""
        return self.path / "state.json"

    @property
    def metadata_file(self) -> Path:
        """Path to the metadata.json file."""
        return self.path / "metadata.json"

    @property
    def history_file(self) -> Path:
        """Path to the history.json file."""
        return self.path / "history.json"

    @property
    def exists(self) -> bool:
        """Check if the checkpoint exists on disk."""
        return self.path.is_dir() and self.state_file.is_file()

    def history(self) -> list[dict[str, Any]]:
        """Get the state history.

        Returns
        -------
        list[dict[str, Any]]
            The stored history entries
        """
        if not self.history_file.is_file():
            return []
        history_dict = self._load_json(self.history_file)
        if not history_dict:
            return []
        history_entries = history_dict.get("history", [])
        if history_entries and isinstance(history_entries, list):
            return history_entries
        return []

    def to_dict(self, include_history: bool = False) -> dict[str, Any]:
        """Get the dict representation of the checkpoint.

        Parameters
        ----------
        include_history : bool
            Include the history in the dict or not.

        Returns
        -------
        dict[str, Any]
            The dict representation of the checkpoint.
        """
        ts = self.timestamp
        if ts.tzinfo is None:
            ts = ts.astimezone(timezone.utc)
        elif ts.tzinfo != timezone.utc:
            ts = ts.replace(tzinfo=timezone.utc)
        the_dict: dict[str, Any] = {
            "session": self.session_name,
            "timestamp": WaldiezCheckpoint.format_timestamp(ts),
            "path": self.path,
            "name": str(self.path.name),
            "state": self.state,
            "metadata": self.metadata,
        }
        if include_history:
            the_dict["history"] = self.history()
        return the_dict

    def refresh(self) -> None:
        """Reset the state and metadata."""
        self._state = None
        self._metadata = None

    @staticmethod
    def parse_timestamp(timestamp_str: str) -> datetime | None:
        """Parse timestamp from directory name.

        Parameters
        ----------
        timestamp_str : str
            The directory name

        Returns
        -------
        datetime | None
            The parsed datetime if the directory name has the expected format.
        """
        # pylint: disable=broad-exception-caught
        try:
            ts_int = int(timestamp_str)
        except Exception:
            return None
        # Normalize to seconds
        if ts_int > 1e15:  # microseconds
            ts_sec = ts_int / 1_000_000
        elif ts_int > 1e12:  # milliseconds
            ts_sec = ts_int / 1_000
        else:  # seconds
            ts_sec = ts_int
        try:
            return datetime.fromtimestamp(ts_sec, tz=timezone.utc)
        except Exception:
            return None

    @staticmethod
    def format_timestamp(timestamp: datetime) -> str:
        """Format timestamp for directory name.

        Parameters
        ----------
        timestamp: datetime
            The datetime instance.

        Returns
        -------
        str
            The formatted string.
        """
        return str(int(timestamp.timestamp() * 1_000_000))

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


@dataclass
class WaldiezCheckpointInfo:
    """Information about a checkpoint."""

    session_name: str
    timestamp: datetime
    path: Path
    _checkpoint: WaldiezCheckpoint | None = field(init=False, default=None)

    @property
    def id(self) -> str:
        """Get the id of the checkpoint info."""
        return WaldiezCheckpoint.format_timestamp(self.timestamp)

    @property
    def checkpoint(self) -> WaldiezCheckpoint:
        """Get the checkpoint."""
        if self._checkpoint is None:
            self._checkpoint = WaldiezCheckpoint(
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
            "timestamp": WaldiezCheckpoint.format_timestamp(ts),
            "path": str(self.path),
            "name": str(self.path.name),
        }

    @classmethod
    def from_checkpoint(
        cls, checkpoint: WaldiezCheckpoint
    ) -> "WaldiezCheckpointInfo":
        """Create WaldiezCheckpointInfo from a WaldiezCheckpoint.

        Parameters
        ----------
        checkpoint : WaldiezCheckpoint
            The checkpoint to load info from

        Returns
        -------
        WaldiezCheckpointInfo
            The loaded checkpoint info.
        """
        return cls(
            session_name=checkpoint.session_name,
            timestamp=checkpoint.timestamp,
            path=checkpoint.path,
        )
