# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Storage protocol for workspace and checkpoint management."""
# pylint: disable=unnecessary-ellipsis

from collections.abc import Generator, Iterable, Mapping
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Protocol, runtime_checkable

from typing_extensions import Self

from .checkpoint import WaldiezCheckpoint, WaldiezCheckpointInfo


@runtime_checkable
class Storage(Protocol):  # pragma: no cover
    """Protocol for handling workspace directory and checkpoints management."""

    @property
    def workspace_dir(self) -> Path:
        """Base workspace directory."""
        ...

    @staticmethod
    def load_dict(json_file: Path) -> dict[str, Any]:
        """Load dict from json.

        Parameters
        ----------
        json_file : Path
            The path of the file to load data from.
        """
        ...

    @staticmethod
    def load_list(
        json_file: Path, fallback_dict_key: str
    ) -> list[dict[str, Any]]:
        """Load list from json.

        Parameters
        ----------
        json_file : Path
            The path of the file to load data from.
        fallback_dict_key : str
            The key to get the list from if the loaded data is dict.
        """
        ...

    @contextmanager
    def transaction(self) -> Generator[Self, None, None]:
        """Batch multiple operations together.

        Raises
        ------
        Exception
            If any of the operations fails.

        Example
        -------
        with storage.transaction():
            storage.save_checkpoint("session1", state1)
            storage.save_checkpoint("session2", state2)
            storage.delete_checkpoint("session3", timestamp)
        """
        ...

    def save_checkpoint(
        self,
        session_name: str,
        state: dict[str, Any],
        metadata: dict[str, Any] | None = None,
        timestamp: datetime | None = None,
    ) -> Path:
        """Save a checkpoint for a session.

        Parameters
        ----------
        session_name : str
            Name of the session
        state : dict[str, Any]
            State data to save
        metadata : dict[str, Any]
            Optional metadata to include
        timestamp: datetime
            Optional timestamp (defaults to now)
        """
        ...

    def get_checkpoint(
        self, session_name: str, timestamp: datetime | None = None
    ) -> WaldiezCheckpointInfo | None:
        """Load a checkpoint for a session.

        Parameters
        ----------
        session_name : str
            Name of the session
        timestamp: datetime
            Optional timestamp (defaults to latest)

        Raises
        ------
        FileNotFoundError
            If no checkpoint found
        """
        ...

    def load_checkpoint(
        self, info: WaldiezCheckpointInfo, history_index: int | None
    ) -> WaldiezCheckpoint:
        """Load a checkpoint.

        Parameters
        ----------
        info: WaldiezCheckpointInfo
            The checkpoint info to get the path.
        history_index: int | None
            Optional history index to use.
        """
        ...

    def link_checkpoint(
        self,
        to: Path,
        session_name: str,
        timestamp: datetime | None = None,
    ) -> None:
        """Create a symlink to a checkpoint.

        Parameters
        ----------
        to: Path
            Where to create the symlink to.
        session_name : str
            Name of the session
        timestamp: datetime | None
            Optional specific checkpoint timestamp (defaults to latest)

        Raises
        ------
        FileNotFoundError
            If no checkpoint found
        """
        ...

    def list_checkpoints(
        self, session_name: str | None = None
    ) -> list[WaldiezCheckpointInfo]:
        """List available checkpoints.

        Parameters
        ----------
        session_name : str | None
            Optional filter by session name
        """
        ...

    def list_sessions(self) -> list[str]:
        """List available sessions."""
        ...

    def delete_session(self, session_name: str) -> None:
        """Delete a session and all its checkpoints.

        Parameters
        ----------
        session_name : str
            The session to delete.
        """
        ...

    def delete_checkpoint(self, session_name: str, timestamp: datetime) -> None:
        """Delete a specific checkpoint.

        Parameters
        ----------
        session_name : str
            The name of the session
        timestamp : datetime
            Timestamp of the checkpoint to delete

        Raises
        ------
        FileNotFoundError
            If checkpoint not found
        """
        ...

    def cleanup_old_checkpoints(
        self, session_name: str, keep_count: int = 5
    ) -> int:
        """Clean up old checkpoints, keeping only the most recent ones.

        Parameters
        ----------
        session_name : str
            Name of the session
        keep_count : int
            Number of recent checkpoints to keep
        """
        ...

    def clean_broken_symlinks(self, session_name: str | None = None) -> int:
        """Clean up broken symlinks.

        This cleans both internal symlinks (inside workspace) and
        registered external symlinks.

        Parameters
        ----------
        session_name : str | None
            If provided, clean only in that session's directory.
            If None, clean in all session directories.
        """
        ...

    def compact_registry(self) -> int:
        """Remove entries for non-existent checkpoints and links."""
        ...

    def verify_links(
        self, session_name: str | None = None
    ) -> Mapping[str, Iterable[str]]:
        """Verify all links are valid and pointing to correct targets.

        Parameters
        ----------
        session_name : str | None
            If provided, verify only links for that session.
            If None, verify all links.
        """
        ...

    def delete_checkpoints_batch(
        self, checkpoints: Iterable[tuple[str, datetime]]
    ) -> int:
        """Delete multiple checkpoints efficiently.

        Parameters
        ----------
        checkpoints : Iterable[tuple[str, datetime]]
            List of (session_name, timestamp) tuples
            Number of checkpoints successfully deleted
        """
        ...
