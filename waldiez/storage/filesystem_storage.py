# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=broad-exception-caught,no-self-use,too-many-try-statements
# pylint: disable=import-error,too-complex,possibly-used-before-assignment
# pyright: reportPossiblyUnboundVariable=false,reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# flake8: noqa: C901

"""Filesystem-based implementation of the Storage protocol."""

import json
import os
import re
import shutil
import threading
from collections.abc import Generator, Iterable, Mapping
from contextlib import contextmanager, suppress
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from typing_extensions import Self

from .checkpoint import WaldiezCheckpoint, WaldiezCheckpointInfo
from .utils import symlink

_PATTERNS = r"^(?!.*\.\.)(?!\.)(?!.*\.$)[\w\-.]{1,128}$"

_SAFE = re.compile(_PATTERNS, re.UNICODE)


class FilesystemStorage:
    """Filesystem-based storage implementation."""

    def __init__(self, workspace_dir: Path | str = "workspace"):
        """Initialize filesystem storage.

        Parameters
        ----------
        workspace_dir : str | Path
            Base directory for all workspace data
        """
        self._workspace_dir = Path(workspace_dir).resolve()
        self._workspace_dir.mkdir(parents=True, exist_ok=True)
        self._links_registry_file = self._workspace_dir / ".links_registry.json"
        self._links_registry: dict[str, list[str]] = {}
        self._registry_lock = threading.RLock()
        self._load_links_registry()

    @property
    def workspace_dir(self) -> Path:
        """Base workspace directory."""
        return self._workspace_dir

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

        Returns
        -------
        Path
            The path of the generated checkpoint.
        """
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        checkpoint_path = self._get_checkpoint_path(session_name, timestamp)
        checkpoint_path.mkdir(parents=True, exist_ok=True)
        state_file = checkpoint_path / "state.json"
        with open(state_file, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, default=str)
        if metadata:
            metadata_file = checkpoint_path / "metadata.json"
            with open(metadata_file, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2, default=str)
        latest_link = self._get_session_dir(session_name) / "latest"
        symlink(latest_link, checkpoint_path, overwrite=True)

        return checkpoint_path

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

        Returns
        -------
        WaldiezCheckpointInfo | None
            The loaded checkpoint info.
        """
        if timestamp is None:
            checkpoints = self._find_checkpoints(session_name)
            if not checkpoints:
                raise FileNotFoundError(
                    f"No checkpoints found for session '{session_name}'"
                )
            checkpoint = checkpoints[0]
        else:
            checkpoint_path = self._get_checkpoint_path(session_name, timestamp)
            if not checkpoint_path.exists():
                msg = (
                    f"WaldiezCheckpoint not found for session '{session_name}' "
                    f"at {WaldiezCheckpoint.format_timestamp(timestamp)}"
                )
                raise FileNotFoundError(msg)
            checkpoint = WaldiezCheckpoint(
                session_name=session_name,
                timestamp=timestamp,
                path=checkpoint_path,
            )
        return WaldiezCheckpointInfo.from_checkpoint(checkpoint)

    def load_checkpoint(self, info: WaldiezCheckpointInfo) -> WaldiezCheckpoint:
        """Load a checkpoint.

        Parameters
        ----------
        info: WaldiezCheckpointInfo
            The checkpoint info to get the path.

        Returns
        -------
        dict[str, Any]
            The loaded checkpoint data.
        """
        return WaldiezCheckpoint(
            session_name=info.session_name,
            timestamp=info.timestamp,
            path=info.path,
        )

    def link_checkpoint(
        self,
        to: Path,
        session_name: str,
        timestamp: datetime | None = None,
        overwrite: bool = False,
    ) -> None:
        """Create a symlink to a checkpoint.

        Parameters
        ----------
        to: Path
            Where to create the symlink to.
        session_name : str
            The name of the session
        timestamp : datetime | None
            Optional specific timestamp
        overwrite : bool
            Overwrite existing link if needed.

        Raises
        ------
        FileNotFoundError
            If checkpoint not found
        """
        link_path = to
        if timestamp is None:
            checkpoints = self._find_checkpoints(session_name)
            if not checkpoints:
                raise FileNotFoundError(
                    f"No checkpoints found for session '{session_name}'"
                )
            checkpoint = checkpoints[0]
            link_path = to / checkpoint.path.name
        else:
            checkpoint_path = self._get_checkpoint_path(session_name, timestamp)
            if not checkpoint_path.exists():
                msg = (
                    f"WaldiezCheckpoint not found for session '{session_name}' "
                    f"at {WaldiezCheckpoint.format_timestamp(timestamp)}"
                )
                raise FileNotFoundError(msg)
            checkpoint = WaldiezCheckpoint(
                session_name=session_name,
                timestamp=timestamp,
                path=checkpoint_path,
            )
            link_path = to / checkpoint_path.name

        symlink(link_path, checkpoint.path, overwrite=overwrite)
        if not link_path.is_relative_to(self._workspace_dir):
            self._register_link(checkpoint.path, link_path)

    def list_sessions(self) -> list[str]:
        """List available sessions.

        Returns
        -------
        list[str]
            The workspace sessions.
        """
        if not self._workspace_dir.exists():
            return []
        return sorted(
            [p.name for p in self._workspace_dir.iterdir() if p.is_dir()],
            reverse=True,
        )

    def delete_session(self, session_name: str) -> None:
        """Delete a session and all its checkpoints.

        Parameters
        ----------
        session_name : str
            The session to delete.
        """
        session_dir = self._get_session_dir(session_name)
        if not session_dir.exists():
            return

        checkpoints = self._find_checkpoints(session_name)

        external_links: list[Path] = []
        for cp in checkpoints:
            external_links.extend(self._unregister_checkpoint_links(cp.path))

        for link_path in external_links:
            if link_path.is_symlink():
                try:
                    link_path.unlink(missing_ok=True)
                except Exception:
                    pass

        try:
            shutil.rmtree(session_dir)
        except Exception:
            try:
                self._clean_broken_symlinks(session_dir)
                shutil.rmtree(session_dir)
            except Exception:
                pass

        # remove any entries still pointing under this session.
        with self._registry_transaction():
            to_delete: list[str] = []
            for checkpoint_str in self._links_registry.keys():
                try:
                    rel = Path(checkpoint_str).relative_to(self._workspace_dir)
                except ValueError:
                    continue
                if rel.parts and rel.parts[0] == session_name:
                    to_delete.append(checkpoint_str)
            for key in to_delete:
                self._links_registry.pop(key, None)

    def list_checkpoints(
        self, session_name: str | None = None
    ) -> list[WaldiezCheckpointInfo]:
        """List available checkpoints.

        Parameters
        ----------
        session_name : str | None
            Optional filter by session name

        Returns
        -------
        list[WaldiezCheckpointInfo]
            The list of the checkpoints found.
        """
        checkpoints: list[WaldiezCheckpoint] = []

        if session_name:
            session_checkpoints = self._find_checkpoints(session_name)
            checkpoints.extend(session_checkpoints)
        else:
            if self._workspace_dir.exists():
                for session_dir in self._workspace_dir.iterdir():
                    if session_dir.is_dir():
                        session_checkpoints = self._find_checkpoints(
                            session_dir.name
                        )
                        if session_checkpoints:
                            checkpoints.extend(session_checkpoints)

        return [WaldiezCheckpointInfo.from_checkpoint(c) for c in checkpoints]

    def delete_checkpoint(self, session_name: str, timestamp: datetime) -> None:
        """Delete a specific checkpoint and clean up all its symlinks.

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
        checkpoint_path = self._get_checkpoint_path(session_name, timestamp)
        if not checkpoint_path.exists():
            msg = (
                f"WaldiezCheckpoint not found for session '{session_name}' "
                f"at {WaldiezCheckpoint.format_timestamp(timestamp)}"
            )
            raise FileNotFoundError(msg)

        external_links = self._unregister_checkpoint_links(checkpoint_path)
        for link_path in external_links:
            if link_path.is_symlink():
                try:
                    link_path.unlink(missing_ok=True)
                except Exception:
                    pass
        shutil.rmtree(checkpoint_path)
        latest_link = self._get_session_dir(session_name) / "latest"
        if latest_link.exists() and latest_link.resolve() == checkpoint_path:
            latest_link.unlink(missing_ok=True)
            # Point to next latest if available
            checkpoints = self._find_checkpoints(session_name)
            if checkpoints:
                symlink(latest_link, checkpoints[0].path, overwrite=True)

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

        Returns
        -------
        int
            The number of deleted checkpoints.
        """
        checkpoints = self._find_checkpoints(session_name)

        if len(checkpoints) <= keep_count:
            return 0
        checkpoints_to_delete = checkpoints[keep_count:]
        deleted_count = 0

        for checkpoint in checkpoints_to_delete:
            try:
                self.delete_checkpoint(session_name, checkpoint.timestamp)
                deleted_count += 1
            except Exception:
                pass

        return deleted_count

    # pylint: disable=too-many-branches
    def _remove_external_links(self) -> tuple[int, Iterable[str]]:
        links_to_remove: list[str] = []
        removed_count = 0
        for checkpoint_path_str, link_paths in self._links_registry.items():
            checkpoint_path = Path(checkpoint_path_str)
            if not checkpoint_path.exists():
                for link_path_str in link_paths:
                    link_path = Path(link_path_str)
                    if link_path.is_symlink():
                        try:
                            link_path.unlink(missing_ok=True)
                            removed_count += 1
                        except Exception:
                            pass
                links_to_remove.append(checkpoint_path_str)
            else:
                valid_links: list[str] = []
                for link_path_str in link_paths:
                    link_path = Path(link_path_str)
                    if link_path.is_symlink() and not link_path.exists():
                        # Broken symlink
                        try:
                            link_path.unlink(missing_ok=True)
                            removed_count += 1
                        except Exception:
                            pass
                    elif link_path.exists():
                        valid_links.append(link_path_str)

                if valid_links:
                    self._links_registry[checkpoint_path_str] = valid_links
                else:
                    links_to_remove.append(checkpoint_path_str)

        for checkpoint_path_str in links_to_remove:
            self._links_registry.pop(checkpoint_path_str, None)
        return removed_count, links_to_remove

    def clean_broken_symlinks(self, session_name: str | None = None) -> int:
        """Clean up broken symlinks.

        This cleans both internal symlinks (inside workspace) and
        registered external symlinks.

        Parameters
        ----------
        session_name : str | None
            If provided, clean only in that session's directory.
            If None, clean in all session directories.

        Returns
        -------
        int
            Total number of broken symlinks removed.
        """
        removed_count = 0
        if session_name:
            session_dir = self._get_session_dir(session_name)
            removed_count += self._clean_broken_symlinks(session_dir)
        else:
            if self._workspace_dir.exists():
                for session_dir in self._workspace_dir.iterdir():
                    if session_dir.is_dir():
                        removed_count += self._clean_broken_symlinks(
                            session_dir
                        )

        with self._registry_transaction():
            external_count, _ = self._remove_external_links()
            removed_count += external_count

        return removed_count

    def compact_registry(self) -> int:
        """Remove entries for non-existent checkpoints and links.

        Returns
        -------
        int
            Number of entries removed from registry
        """
        with self._registry_transaction():
            initial_size = len(self._links_registry)
            valid_registry = {}

            for checkpoint_str, links in self._links_registry.items():
                if Path(checkpoint_str).exists():
                    valid_links = [
                        lnk for lnk in links if Path(lnk).is_symlink()
                    ]
                    if valid_links:
                        valid_registry[checkpoint_str] = valid_links

            self._links_registry = valid_registry
            return initial_size - len(self._links_registry)

    def verify_links(
        self, session_name: str | None = None
    ) -> Mapping[str, Iterable[str]]:
        """Verify all links are valid and pointing to correct targets.

        Parameters
        ----------
        session_name : str | None
            If provided, verify only links for that session.
            If None, verify all links.

        Returns
        -------
        Mapping[str, Iterable[str]]
            Dictionary mapping checkpoint paths to list of issues found
        """
        issues: dict[str, list[str]] = {}

        with self._registry_lock:
            registry_copy = self._links_registry.copy()

        for checkpoint_str, links in registry_copy.items():
            checkpoint_path = Path(checkpoint_str)

            if session_name:
                try:
                    relative = checkpoint_path.relative_to(self._workspace_dir)
                    session_part = relative.parts[0] if relative.parts else ""
                    if session_part != session_name:
                        continue
                except ValueError:
                    continue

            for link_str in links:
                link_path = Path(link_str)

                if not link_path.exists():
                    issues.setdefault(checkpoint_str, []).append(
                        f"Missing: {link_str}"
                    )
                    continue
                if not link_path.is_symlink():
                    issues.setdefault(checkpoint_str, []).append(
                        f"Not a symlink: {link_str}"
                    )
                    continue
                try:
                    target = link_path.resolve()
                    if target != checkpoint_path:
                        issues.setdefault(checkpoint_str, []).append(
                            f"Wrong target: {link_str} -> {link_path.resolve()}"
                        )
                except Exception:
                    issues.setdefault(checkpoint_str, []).append(
                        f"Cannot resolve: {link_str}"
                    )

        return issues

    def delete_checkpoints_batch(
        self, checkpoints: Iterable[tuple[str, datetime]]
    ) -> int:
        """Delete multiple checkpoints efficiently.

        Parameters
        ----------
        checkpoints : list[tuple[str, datetime]]
            List of (session_name, timestamp) tuples

        Returns
        -------
        int
            Number of checkpoints successfully deleted
        """
        deleted = 0
        all_external_links: list[Path] = []
        checkpoints_to_delete: list[tuple[str, datetime, Path]] = []

        for session_name, timestamp in checkpoints:
            checkpoint_path = self._get_checkpoint_path(session_name, timestamp)
            if checkpoint_path.exists():
                checkpoints_to_delete.append(
                    (session_name, timestamp, checkpoint_path)
                )
                external_links = self._unregister_checkpoint_links(
                    checkpoint_path
                )
                all_external_links.extend(external_links)

        for link_path in all_external_links:
            if link_path.is_symlink():
                try:
                    link_path.unlink(missing_ok=True)
                except Exception:
                    pass
        for session_name, _, checkpoint_path in checkpoints_to_delete:
            try:
                shutil.rmtree(checkpoint_path)

                # Update latest link if needed
                latest_link = self._get_session_dir(session_name) / "latest"
                if (
                    latest_link.exists()
                    and latest_link.resolve() == checkpoint_path
                ):
                    latest_link.unlink(missing_ok=True)
                    # Point to next latest if available
                    remaining_checkpoints = self._find_checkpoints(session_name)
                    if remaining_checkpoints:
                        symlink(
                            latest_link,
                            remaining_checkpoints[0].path,
                            overwrite=True,
                        )

                deleted += 1
            except Exception:
                pass

        return deleted

    @contextmanager
    def transaction(self) -> Generator[Self, None, None]:
        """Batch multiple operations together.

        Yields
        ------
        FilesystemStorage
            Self

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
        # Backup current state
        with self._registry_lock:
            original_registry = self._links_registry.copy()

        try:
            yield self
        except Exception:
            # Rollback
            with self._registry_lock:
                self._links_registry = original_registry
                self._save_links_registry()
            raise

    @contextmanager
    def _registry_transaction(self) -> Generator[None, None, None]:
        """Context manager for safe registry operations."""
        with self._registry_lock:
            self._load_links_registry()
            yield
            self._save_links_registry()

    def _load_links_registry(self) -> None:
        """Load and validate the registry of external links."""
        if self._links_registry_file.exists():
            try:
                with open(
                    self._links_registry_file, "r", encoding="utf-8"
                ) as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        for key, value in data.items():
                            if isinstance(value, list):
                                valid_links = [
                                    v for v in value if isinstance(v, str)
                                ]
                                if valid_links:
                                    self._links_registry[key] = valid_links
            except (json.JSONDecodeError, ValueError):
                # Backup corrupted file
                backup = self._links_registry_file.with_suffix(".corrupted")
                shutil.copy2(self._links_registry_file, backup)
                self._links_registry = {}
            except Exception:
                self._links_registry = {}

    def _save_links_registry(self) -> None:
        """Save the registry with file locking."""
        temp_file = self._links_registry_file.with_suffix(".tmp")
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(self._links_registry, f, indent=2)
            os.replace(temp_file, self._links_registry_file)
        finally:
            with suppress(FileNotFoundError):
                temp_file.unlink(missing_ok=True)

    def _register_link(self, checkpoint_path: Path, link_path: Path) -> None:
        """Register an external link in the registry."""
        key = str(checkpoint_path)
        val = str(link_path)
        with self._registry_transaction():
            self._links_registry.setdefault(key, [])
            if val not in self._links_registry[key]:
                self._links_registry[key].append(val)

    def _unregister_checkpoint_links(self, checkpoint_path: Path) -> list[Path]:
        """Get and remove all registered links for a checkpoint."""
        with self._registry_transaction():
            checkpoint_key = str(checkpoint_path)
            links = self._links_registry.pop(checkpoint_key, [])
        return [Path(link) for link in links]

    def _get_session_dir(self, session_name: str) -> Path:
        """Get the directory for a session."""
        if not _SAFE.match(session_name):
            raise ValueError("Invalid session_name")
        return self._workspace_dir / session_name

    def _get_checkpoint_path(
        self, session_name: str, timestamp: datetime
    ) -> Path:
        """Get the path for a checkpoint."""
        timestamp_str = WaldiezCheckpoint.format_timestamp(timestamp)
        return self._get_session_dir(session_name) / timestamp_str

    def _find_checkpoints(self, session_name: str) -> list[WaldiezCheckpoint]:
        """Find all checkpoints for a session."""
        session_dir = self._get_session_dir(session_name)
        if not session_dir.exists():
            return []

        checkpoints: list[WaldiezCheckpoint] = []
        for path in session_dir.iterdir():
            if not path.is_dir():
                continue
            try:
                timestamp = WaldiezCheckpoint.parse_timestamp(path.name)
                if not timestamp:
                    continue
                state_file = path / "state.json"
                if state_file.exists():
                    checkpoint = WaldiezCheckpoint(
                        session_name=session_name,
                        timestamp=timestamp,
                        path=path,
                    )
                    checkpoints.append(checkpoint)
            except ValueError:
                continue

        return sorted(checkpoints, key=lambda c: c.timestamp, reverse=True)

    def _clean_broken_symlinks(self, directory: Path) -> int:
        """Remove broken symlinks in a directory.

        Parameters
        ----------
        directory : Path
            Directory to clean

        Returns
        -------
        int
            Number of broken symlinks removed
        """
        if not directory.exists():
            return 0

        removed = 0
        for item in directory.iterdir():
            try:
                if item.is_symlink() or item.is_dir():
                    target = item.resolve()
                    if (
                        item.is_symlink() and not item.exists()
                    ) or not target.exists():
                        item.unlink(missing_ok=True)
                        removed += 1
            except Exception:
                with suppress(Exception):
                    item.unlink(missing_ok=True)
                    removed += 1
        return removed
