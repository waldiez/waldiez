# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=too-many-public-methods

"""High-level storage manager for workspace and checkpoint operations."""

from __future__ import annotations

import os
import shutil
import sys
from collections.abc import Generator, Iterable
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from typing_extensions import Self

from .checkpoint import WaldiezCheckpoint, WaldiezCheckpointInfo
from .filesystem_storage import FilesystemStorage
from .protocol import Storage
from .utils import copy_results, get_root_dir, symlink


class StorageManager:
    """High-level storage manager to work with different storage backends."""

    _storage: Storage

    def __init__(
        self,
        storage: Storage | None = None,
        workspace_dir: Path | str | None = None,
    ) -> None:
        """
        Initialize the storage manager.

        Parameters
        ----------
        storage : Storage
            The Storage backend to use (defaults to FilesystemStorage)
        workspace_dir : Path | str | None
            Workspace directory (only used if storage is None)
        """
        if storage is None:
            if workspace_dir is None:
                workspace_dir = get_root_dir()
            self._storage = FilesystemStorage(workspace_dir)
        else:
            self._storage = storage

    @staticmethod
    def parse_checkpoint_arg(checkpoint_arg: str) -> tuple[str, int | None]:
        """Parse checkpoint arg.

        Parameters
        ----------
        checkpoint_arg : str
            The arg to parse.

        Returns
        -------
        tuple[str, int | None]
            The checkpoint id and an optional history index.
        """
        arg_parts = checkpoint_arg.split(":")
        history_index: int | None = None
        if len(arg_parts) == 2:
            try:
                history_index = int(arg_parts[1])
            except BaseException:  # pylint: disable=broad-exception-caught
                pass
        checkpoint_id = arg_parts[0]
        return checkpoint_id, history_index

    @staticmethod
    def default_root() -> Path:
        """Get the default global root.

        Returns
        -------
        Path
            The default global root.
        """
        return get_root_dir()

    @staticmethod
    def load_dict(json_file: Path) -> dict[str, Any]:
        """Load dict from json.

        Parameters
        ----------
        json_file : Path
            The path of the file to load data from.

        Returns
        -------
        dict[str, Any]
            The loaded dict.
        """
        return FilesystemStorage.load_dict(json_file)

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

        Returns
        -------
        list[dict[str, Any]]
            The loaded list.
        """
        return FilesystemStorage.load_list(json_file, fallback_dict_key)

    @property
    def storage(self) -> Storage:
        """Get the underlying storage backend."""
        return self._storage

    @property
    def workspace_dir(self) -> Path:
        """Get the workspace directory."""
        return self._storage.workspace_dir

    # pylint: disable=too-many-locals,too-many-arguments,too-complex
    # pylint: disable=too-many-branches
    def finalize(  # noqa: C901
        self,
        session_name: str,
        output_file: Path,
        tmp_dir: Path,
        *,
        metadata: dict[str, Any] | None = None,
        timestamp: datetime | None = None,
        link_root: Path | None = None,
        link_latest: bool = True,
        keep_tmp: bool = False,
        copy_into_subdir: str | None = None,
        promote_to_output: Iterable[str] = (
            "tree_of_thoughts.png",
            "reasoning_tree.json",
        ),
        ignore_names: Iterable[str] = (".cache", ".env"),
        skip_symlinks: bool = False,
    ) -> tuple[Path, Path]:
        """Copy a run's temporary artifacts into a new checkpoint.

        Parameters
        ----------
        session_name : str
            Session name for the checkpoint.
        output_file : Path
            The path to the output.
        tmp_dir : Path
            Directory containing artifacts produced by the run.
        metadata : dict[str, Any] | None
            Optional metadata to store in the checkpoint.
        timestamp : datetime | None
            Optional checkpoint timestamp (defaults to now).
        link_root : Path | None
            Base directory for outward-facing links.
            Defaults to CWD/"waldiez_out".
        link_latest : bool
            Whether to update a `latest` link under link_root/session_name.
            Defaults to True.
        keep_tmp : bool
            If False, delete the tmp_dir after copying. Defaults to False.
        copy_into_subdir : str | None
            If set, copy artifacts into
            checkpoint/<copy_into_subdir> instead of the root.
        promote_to_output : Iterable[str]
            File names (exact matches) to also copy into output_dir.
        ignore_names : Iterable[str]
            Directory/file names to skip entirely.
        skip_symlinks : bool
            Whether to skip creating symlinks for checkpoints.

        Returns
        -------
        tuple[Path, Path]
            (checkpoint_path, public_link_path)
            Path to the checkpoint in the workspace and the created public link.

        Raises
        ------
        FileNotFoundError
            If tmp_dir does not exist or is not a directory.
        """
        if not tmp_dir.exists() or not tmp_dir.is_dir():
            raise FileNotFoundError(
                f"tmp_dir does not exist or is not a directory: {tmp_dir}"
            )

        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        checkpoint_path = self._storage.save_checkpoint(
            session_name=session_name,
            state={},
            metadata=metadata or {},
            timestamp=timestamp,
        )

        target_dir = (
            (checkpoint_path / copy_into_subdir)
            if copy_into_subdir
            else checkpoint_path
        )
        target_dir.mkdir(parents=True, exist_ok=True)
        copy_results(
            temp_dir=tmp_dir,
            output_file=output_file,
            destination_dir=target_dir,
            promote_to_output=promote_to_output,
            ignore_names=ignore_names,
        )
        if link_root is None:
            link_root = Path.cwd() / "waldiez_out"

        session_out_dir = link_root / session_name
        session_out_dir.mkdir(parents=True, exist_ok=True)

        public_link_path = session_out_dir / checkpoint_path.name
        if not skip_symlinks:
            # Symlink-based public path
            symlink(public_link_path, checkpoint_path, overwrite=True)

            if link_latest:
                latest_link = session_out_dir / "latest"
                tmp_latest = session_out_dir / ".latest.tmp"
                symlink(tmp_latest, checkpoint_path, overwrite=True)
                # pylint: disable=too-many-try-statements,broad-exception-caught
                # noinspection PyBroadException
                try:
                    if sys.platform == "win32":
                        # Windows: remove target first
                        if os.path.exists(latest_link):
                            os.remove(latest_link)
                        os.rename(tmp_latest, latest_link)
                    else:
                        # Unix-like: atomic replace
                        os.replace(tmp_latest, latest_link)
                except BaseException:
                    pass
                finally:
                    if tmp_latest.exists():
                        tmp_latest.unlink(missing_ok=True)
        else:
            # Copy-based public path (no symlinks)
            if public_link_path.exists():
                if public_link_path.is_symlink() or public_link_path.is_file():
                    public_link_path.unlink()
                else:
                    shutil.rmtree(public_link_path)
            shutil.copytree(checkpoint_path, public_link_path)

            if link_latest:
                latest_link = session_out_dir / "latest"
                if latest_link.exists():
                    if latest_link.is_symlink() or latest_link.is_file():
                        latest_link.unlink()
                    else:
                        shutil.rmtree(latest_link)
                shutil.copytree(checkpoint_path, latest_link)

        if keep_tmp is False:
            shutil.rmtree(tmp_dir, ignore_errors=True)

        return checkpoint_path, public_link_path

    def save(
        self,
        session_name: str,
        state: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> Path:
        """
        Save a checkpoint with automatic timestamp creation.

        Parameters
        ----------
        session_name : str
            The name of the session.
        state : dict[str, Any]
            The session state to store.
        metadata : dict[str, Any] | None
            Optional checkpoint metadata.

        Returns
        -------
        Path
            Path to the saved checkpoint
        """
        return self._storage.save_checkpoint(
            session_name=session_name, state=state, metadata=metadata
        )

    def get(
        self, session_name: str, timestamp: datetime | None = None
    ) -> WaldiezCheckpointInfo | None:
        """
        Get a checkpoint (latest by default).

        Parameters
        ----------
        session_name : str
            The name of the session
        timestamp : datetime | None
            Optional specific timestamp

        Returns
        -------
        WaldiezCheckpointInfo | None
            The loaded state data
        """
        return self._storage.get_checkpoint(
            session_name=session_name, timestamp=timestamp
        )

    def update(
        self,
        session_name: str,
        checkpoint: str | datetime,
        state: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Update a checkpoint with new state and optionally new metadata.

        Parameters
        ----------
        session_name : str
            The name of the session
        checkpoint : str | datetime
            Specific timestamp for checkpoint.
        state : dict[str, Any]
            The new state to set.
        metadata : dict[str, Any]
            Optional new metadata to set.
        """
        if isinstance(checkpoint, str):
            # maybe a full
            dir_name = Path(checkpoint).name
            checkpoint_dt = WaldiezCheckpoint.parse_timestamp(dir_name)
            if not checkpoint_dt:
                return
        else:
            checkpoint_dt = checkpoint
        self._storage.save_checkpoint(
            session_name=session_name,
            state=state,
            metadata=metadata,
            timestamp=checkpoint_dt,
        )

    def load(
        self,
        info: WaldiezCheckpointInfo,
        history_index: int | None,
    ) -> WaldiezCheckpoint:
        """Load a checkpoint.

        Parameters
        ----------
        info: WaldiezCheckpointInfo
            The checkpoint info to load.
        history_index: int | None
            Optional history index to use.

        Returns
        -------
        dict[str, Any]
            The loaded checkpoint data.
        """
        return self._storage.load_checkpoint(info, history_index=history_index)

    def link(
        self,
        to: Path,
        session_name: str,
        timestamp: datetime | None = None,
    ) -> None:
        """
        Create a symlink to a checkpoint.

        Parameters
        ----------
        to: Path
            Where to create the symlink to.
        session_name : str
            The name of the session
        timestamp : datetime | None
            Optional specific timestamp
        """
        self._storage.link_checkpoint(
            to=to,
            session_name=session_name,
            timestamp=timestamp,
        )

    def checkpoints(
        self, session_name: str | None = None
    ) -> list[WaldiezCheckpointInfo]:
        """
        List available checkpoints.

        Parameters
        ----------
        session_name : str
            Optional filter by session

        Returns
        -------
        list[WaldiezCheckpointInfo]
            List of checkpoint information
        """
        return self._storage.list_checkpoints(session_name=session_name)

    def history(
        self, session_name: str, checkpoint_name: str | None = None
    ) -> dict[str, list[dict[str, Any]]]:
        """Get a session's checkpoints' history.

        Parameters
        ----------
        session_name : str
            The session to use.
        checkpoint_name : str | None
            Optional checkpoint/folder name to use

        Returns
        -------
        list[list[dict[str, Any]]]
            Each checkpoint's history.
        """
        entries: dict[str, list[dict[str, Any]]] = {}
        if checkpoint_name:
            checkpoint_dt = WaldiezCheckpoint.parse_timestamp(checkpoint_name)
            checkpoint_info = self._storage.get_checkpoint(
                session_name=session_name, timestamp=checkpoint_dt
            )
            if not checkpoint_info:
                return {"history": []}
            return {"history": checkpoint_info.checkpoint.history()}
        for checkpoint_info in self._storage.list_checkpoints(
            session_name=session_name
        ):
            checkpoint_history = checkpoint_info.checkpoint.history()
            if checkpoint_history:
                entries[
                    WaldiezCheckpoint.format_timestamp(
                        checkpoint_info.timestamp
                    )
                ] = checkpoint_history
        return entries

    def sessions(self) -> list[str]:
        """List available sessions.

        Returns
        -------
        list[str]
            The workspace sessions.
        """
        return self._storage.list_sessions()

    def delete_session(self, session_name: str) -> None:
        """Delete a session and all its checkpoints.

        Parameters
        ----------
        session_name : str
            The session to delete.
        """
        self.storage.delete_session(session_name)

    def delete(self, session_name: str, timestamp: datetime) -> None:
        """
        Delete a specific checkpoint.

        Args:
            session_name: Name of the session
            timestamp: Timestamp of the checkpoint
        """
        self._storage.delete_checkpoint(
            session_name=session_name, timestamp=timestamp
        )

    def cleanup(self, session_name: str, keep_count: int = 5) -> int:
        """
        Clean up old checkpoints.

        Parameters
        ----------
        session_name : str
            Name of the session
        keep_count : int
            Number of recent checkpoints to keep

        Returns
        -------
        int
            Number of checkpoints deleted
        """
        return self._storage.cleanup_old_checkpoints(
            session_name=session_name, keep_count=keep_count
        )

    def clean_broken_symlinks(self, session_name: str | None = None) -> int:
        """
        Clean up broken symlinks.

        Parameters
        ----------
        session_name : str | None
            If provided, clean only in that session's directory.
            If None, clean in all session directories.

        Returns
        -------
        int
            Number of broken symlinks removed.
        """
        # Only FilesystemStorage has this method currently
        if hasattr(self._storage, "clean_broken_symlinks"):
            return self._storage.clean_broken_symlinks(session_name)
        return 0

    @contextmanager
    def transaction(self) -> Generator[Self, None, None]:
        """
        Batch multiple operations together.

        Yields
        ------
        StorageManager
            Self

        Example
        -------
        with storage.transaction():
            storage.save("session1", state1)
            storage.save("session2", state2)
            storage.delete("session3", timestamp)
        """
        if hasattr(self._storage, "transaction"):
            with self._storage.transaction():
                yield self
        else:
            # No transaction support, just yield
            yield self

    def get_latest_checkpoint(
        self, session_name: str
    ) -> WaldiezCheckpointInfo | None:
        """Get information about the latest checkpoint for a session.

        Parameters
        ----------
        session_name : str
            Name of the session

        Returns
        -------
        WaldiezCheckpointInfo | None
            WaldiezCheckpoint info if found, None otherwise
        """
        checkpoints = self.checkpoints(session_name=session_name)
        if checkpoints:
            return checkpoints[0]  # Already sorted by timestamp desc
        return None

    def session_exists(self, session_name: str) -> bool:
        """
        Check if a session has any checkpoints.

        Parameters
        ----------
        session_name : str
            Name of the session

        Returns
        -------
        bool
            True if session has checkpoints.
        """
        checkpoints = self.checkpoints(session_name=session_name)
        return len(checkpoints) > 0
