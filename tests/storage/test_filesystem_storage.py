# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=no-self-use,protected-access,too-many-public-methods
# pyright: reportUnknownArgumentType=false

"""Tests for filesystem storage implementation."""

import json
import shutil
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pytest

from waldiez.storage import WaldiezCheckpoint
from waldiez.storage.filesystem_storage import FilesystemStorage


class TestFilesystemStorage:
    """Tests for FilesystemStorage class."""

    @pytest.fixture
    def storage(self, tmp_path: Path) -> FilesystemStorage:
        """Create a FilesystemStorage instance for testing."""
        return FilesystemStorage(tmp_path / "workspace")

    def test_init_creates_workspace_dir(self, tmp_path: Path) -> None:
        """Test that initialization creates the workspace directory."""
        workspace_dir = tmp_path / "test_workspace"
        assert not workspace_dir.exists()

        storage = FilesystemStorage(workspace_dir)
        assert workspace_dir.exists()
        assert storage.workspace_dir == workspace_dir

    def test_save_checkpoint(self, storage: FilesystemStorage) -> None:
        """Test saving a checkpoint."""
        state = {"agents": ["agent1", "agent2"], "config": {"model": "gpt-4"}}
        metadata = {"version": "1.0"}

        checkpoint_path = storage.save_checkpoint(
            session_name="test_session",
            state=state,
            metadata=metadata,
        )

        # Verify checkpoint was created
        assert checkpoint_path.exists()
        assert (checkpoint_path / "state.json").exists()
        assert (checkpoint_path / "metadata.json").exists()

        # Verify state content
        with open(checkpoint_path / "state.json", encoding="utf-8") as f:
            saved_state = json.load(f)
        assert saved_state == state

        # Verify metadata content
        with open(checkpoint_path / "metadata.json", encoding="utf-8") as f:
            saved_metadata = json.load(f)
        assert saved_metadata == metadata

        # Verify latest symlink
        latest_link = storage.workspace_dir / "test_session" / "latest"
        assert latest_link.is_symlink()
        assert latest_link.resolve() == checkpoint_path

    def test_save_checkpoint_without_metadata(
        self, storage: FilesystemStorage
    ) -> None:
        """Test saving a checkpoint without metadata."""
        state = {"data": "test"}

        checkpoint_path = storage.save_checkpoint(
            session_name="test_session",
            state=state,
        )

        assert (checkpoint_path / "state.json").exists()
        assert not (checkpoint_path / "metadata.json").exists()

    def test_get_checkpoint_latest(self, storage: FilesystemStorage) -> None:
        """Test loading the latest checkpoint."""
        # Save multiple checkpoints
        states: list[dict[str, Any]] = []
        for i in range(3):
            state = {"iteration": i}
            storage.save_checkpoint("test_session", state)
            states.append(state)
            time.sleep(0.01)  # Ensure different timestamps

        # Load latest
        loaded_info = storage.get_checkpoint("test_session")
        assert loaded_info
        loaded_state = loaded_info.checkpoint.state
        assert loaded_state == states[-1]

    def test_get_checkpoint_specific_timestamp(
        self, storage: FilesystemStorage
    ) -> None:
        """Test loading a checkpoint with specific timestamp."""
        timestamp = datetime.now(timezone.utc)
        state = {"data": "specific"}

        storage.save_checkpoint("test_session", state, timestamp=timestamp)

        loaded_info = storage.get_checkpoint("test_session", timestamp)
        assert loaded_info
        loaded_state = loaded_info.checkpoint.state
        assert loaded_state == state

    def test_get_checkpoint_not_found(self, storage: FilesystemStorage) -> None:
        """Test loading a non-existent checkpoint."""
        with pytest.raises(FileNotFoundError):
            storage.get_checkpoint("non_existent_session")

    def test_link_checkpoint(
        self, storage: FilesystemStorage, tmp_path: Path
    ) -> None:
        """Test creating a symlink to a checkpoint."""
        # Save a checkpoint
        state = {"data": "test"}
        checkpoint_path = storage.save_checkpoint("test_session", state)

        # Create link
        link_dir = tmp_path / "links"
        link_dir.mkdir()
        storage.link_checkpoint(link_dir, "test_session")

        # Verify link was created
        link_path = link_dir / checkpoint_path.name
        assert link_path.is_symlink()
        assert link_path.resolve() == checkpoint_path

        # Verify link is registered (external link)
        assert str(checkpoint_path) in storage._links_registry
        assert str(link_path) in storage._links_registry[str(checkpoint_path)]

    def test_link_checkpoint_internal(self, storage: FilesystemStorage) -> None:
        """Test creating an internal symlink (not registered)."""
        # Save a checkpoint
        state = {"data": "test"}
        checkpoint_path = storage.save_checkpoint("test_session", state)

        # Create internal link
        link_dir = storage.workspace_dir / "internal_links"
        link_dir.mkdir()
        storage.link_checkpoint(link_dir, "test_session")

        # Verify link was created but not registered
        link_path = link_dir / checkpoint_path.name
        assert link_path.is_symlink()
        assert str(checkpoint_path) not in storage._links_registry

    def test_list_checkpoints_single_session(
        self, storage: FilesystemStorage
    ) -> None:
        """Test listing checkpoints for a single session."""
        # Save checkpoints
        for i in range(3):
            storage.save_checkpoint(
                "test_session", {"iteration": i}, {"index": i}
            )
            time.sleep(0.01)

        checkpoints = storage.list_checkpoints("test_session")
        assert len(checkpoints) == 3

        # Verify they're sorted by timestamp (newest first)
        for i in range(len(checkpoints) - 1):
            assert checkpoints[i].timestamp > checkpoints[i + 1].timestamp

    def test_list_checkpoints_all_sessions(
        self, storage: FilesystemStorage
    ) -> None:
        """Test listing checkpoints for all sessions."""
        # Save checkpoints for multiple sessions
        for session in [
            "test_list_checkpoints_all_sessions1",
            "test_list_checkpoints_all_sessions2",
            "test_list_checkpoints_all_sessions3",
        ]:
            for i in range(2):
                storage.save_checkpoint(session, {"iteration": i})

        checkpoints = storage.list_checkpoints()
        assert len(checkpoints) == 6

        # Verify all sessions are included
        sessions = {cp.session_name for cp in checkpoints}
        assert sessions == {
            "test_list_checkpoints_all_sessions1",
            "test_list_checkpoints_all_sessions2",
            "test_list_checkpoints_all_sessions3",
        }

    def test_delete_checkpoint(self, storage: FilesystemStorage) -> None:
        """Test deleting a checkpoint."""
        timestamp = datetime.now(timezone.utc)
        checkpoint_path = storage.save_checkpoint(
            "test_delete_checkpoint", {"data": "test"}, timestamp=timestamp
        )

        # Verify checkpoint exists
        assert checkpoint_path.exists()

        # Delete checkpoint
        storage.delete_checkpoint("test_delete_checkpoint", timestamp)

        # Verify checkpoint is gone
        assert not checkpoint_path.exists()

    def test_delete_checkpoint_with_external_links(
        self, storage: FilesystemStorage, tmp_path: Path
    ) -> None:
        """Test deleting a checkpoint removes external links."""
        timestamp = datetime.now(timezone.utc)
        checkpoint_path = storage.save_checkpoint(
            "test_delete_checkpoint_with_external_links",
            {"data": "test"},
            timestamp=timestamp,
        )

        # Create external link
        link_dir = tmp_path / "external"
        link_dir.mkdir()
        storage.link_checkpoint(
            link_dir, "test_delete_checkpoint_with_external_links", timestamp
        )

        link_path = link_dir / checkpoint_path.name
        assert link_path.is_symlink()

        # Delete checkpoint
        storage.delete_checkpoint(
            "test_delete_checkpoint_with_external_links", timestamp
        )

        # Verify link was removed
        assert not link_path.exists()

    def test_cleanup_old_checkpoints(self, storage: FilesystemStorage) -> None:
        """Test cleaning up old checkpoints."""
        # Save 10 checkpoints
        for i in range(10):
            storage.save_checkpoint("test_session", {"iteration": i})
            time.sleep(0.01)

        # Keep only 3
        deleted = storage.cleanup_old_checkpoints("test_session", keep_count=3)
        assert deleted == 7

        # Verify only 3 remain
        remaining = storage.list_checkpoints("test_session")
        assert len(remaining) == 3

    def test_clean_broken_symlinks(
        self, storage: FilesystemStorage, tmp_path: Path
    ) -> None:
        """Test cleaning broken symlinks."""
        # Create a checkpoint
        checkpoint_path = storage.save_checkpoint(
            "test_session", {"data": "test"}
        )

        # Create external link
        link_dir = tmp_path / "external"
        link_dir.mkdir()
        storage.link_checkpoint(link_dir, "test_session")

        # Manually delete the checkpoint directory
        shutil.rmtree(checkpoint_path)

        # Clean broken symlinks
        removed = storage.clean_broken_symlinks()
        assert removed >= 1  # At least the external link

    def test_compact_registry(
        self, storage: FilesystemStorage, tmp_path: Path
    ) -> None:
        """Test compacting the registry."""
        # Create checkpoints and links
        checkpoint_paths: list[Path] = []
        for i in range(3):
            cp = storage.save_checkpoint("test_session", {"iteration": i})
            checkpoint_paths.append(cp)

            link_dir = tmp_path / f"link_{i}"
            link_dir.mkdir()
            storage.link_checkpoint(link_dir, "test_session")

        # Manually delete some checkpoints
        shutil.rmtree(checkpoint_paths[0])
        shutil.rmtree(checkpoint_paths[1])

        # Compact registry
        removed = storage.compact_registry()
        assert removed == 2

    def test_verify_links(
        self, storage: FilesystemStorage, tmp_path: Path
    ) -> None:
        """Test verifying links."""
        # Create checkpoint and links
        checkpoint_path = storage.save_checkpoint(
            "test_session", {"data": "test"}
        )

        link_dir = tmp_path / "links"
        link_dir.mkdir()
        storage.link_checkpoint(link_dir, "test_session")

        # Initially no issues
        issues = storage.verify_links()
        assert len(issues) == 0

        # Create a broken link manually
        broken_link = link_dir / "broken"
        broken_link.symlink_to(tmp_path / "non_existent")
        storage._links_registry[str(checkpoint_path)].append(str(broken_link))

        # Now there should be issues
        issues = storage.verify_links()
        assert len(issues) > 0
        assert any(
            "Missing" in issue
            for issues_list in issues.values()
            for issue in issues_list
        )

    def test_delete_checkpoints_batch(self, storage: FilesystemStorage) -> None:
        """Test batch deletion of checkpoints."""
        # Create checkpoints
        checkpoints_to_delete: list[tuple[str, datetime]] = []
        for i in range(5):
            timestamp = datetime.now(timezone.utc) + timedelta(seconds=i)
            storage.save_checkpoint(
                f"session_{i}", {"data": i}, timestamp=timestamp
            )
            checkpoints_to_delete.append((f"session_{i}", timestamp))

        # Delete in batch
        deleted = storage.delete_checkpoints_batch(checkpoints_to_delete)
        assert deleted == 5

        # Verify all are gone
        for session_name, _ in checkpoints_to_delete:
            assert len(storage.list_checkpoints(session_name)) == 0

    def test_transaction_rollback(self, storage: FilesystemStorage) -> None:
        """Test transaction rollback on error."""
        # Save initial checkpoint
        storage.save_checkpoint("test_session", {"data": "initial"})

        # Get initial registry state
        initial_registry = storage._links_registry.copy()

        # Try transaction that fails
        with pytest.raises(ValueError):
            with storage.transaction():
                # Make some changes
                storage.save_checkpoint("test_session", {"data": "new"})
                # Force an error
                raise ValueError("Test error")

        # Verify registry was rolled back
        assert storage._links_registry == initial_registry

    def test_thread_safety(
        self, storage: FilesystemStorage, tmp_path: Path
    ) -> None:
        """Test thread-safe operations."""

        def worker(worker_id: int) -> None:
            """Worker function for thread test."""
            for i in range(5):
                # Save checkpoint
                storage.save_checkpoint(
                    f"session_{worker_id}", {"iteration": i}
                )

                # Create link
                link_dir = tmp_path / f"worker_{worker_id}" / f"link_{i}"
                link_dir.mkdir(parents=True, exist_ok=True)
                storage.link_checkpoint(link_dir, f"session_{worker_id}")

        # Run multiple threads
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(worker, i) for i in range(5)]
            for future in futures:
                future.result()

        # Verify all operations succeeded
        for worker_id in range(5):
            checkpoints = storage.list_checkpoints(f"session_{worker_id}")
            assert len(checkpoints) == 5

    def test_corrupted_registry_handling(
        self, storage: FilesystemStorage
    ) -> None:
        """Test handling of corrupted registry file."""
        # Write corrupted registry
        storage._links_registry_file.write_text("invalid json{")

        # Load should handle corruption
        storage._load_links_registry()
        assert storage._links_registry == {}

        # Verify backup was created
        backup = storage._links_registry_file.with_suffix(".corrupted")
        assert backup.exists()

    def test_session_directory_structure(
        self, storage: FilesystemStorage
    ) -> None:
        """Test the directory structure created for sessions."""
        # Save checkpoints for multiple sessions
        storage.save_checkpoint("project_a", {"data": "a"})
        storage.save_checkpoint("project_b", {"data": "b"})

        # Verify structure
        assert (storage.workspace_dir / "project_a").is_dir()
        assert (storage.workspace_dir / "project_b").is_dir()
        assert (storage.workspace_dir / "project_a" / "latest").is_symlink()
        assert (storage.workspace_dir / "project_b" / "latest").is_symlink()

    def test_registry_persistence(self, tmp_path: Path) -> None:
        """Test that registry persists across instances."""
        workspace = tmp_path / "persistent_workspace"

        # First instance
        storage1 = FilesystemStorage(workspace)
        checkpoint_path = storage1.save_checkpoint("test", {"data": "test"})

        link_dir = tmp_path / "external"
        link_dir.mkdir()
        storage1.link_checkpoint(link_dir, "test")

        # Second instance
        storage2 = FilesystemStorage(workspace)

        # Registry should be loaded
        assert str(checkpoint_path) in storage2._links_registry
        assert len(storage2._links_registry[str(checkpoint_path)]) == 1

    def test_delete_session_removes_all_checkpoints_and_links(
        self, storage: FilesystemStorage, tmp_path: Path
    ) -> None:
        """Deleting a session removes everything."""
        # Create a few checkpoints
        cps: list[Path] = []
        for i in range(3):
            cp = storage.save_checkpoint("to_delete", {"i": i})
            cps.append(cp)
            time.sleep(0.01)

        # Create an internal "latest" (already created by save_checkpoint)
        session_dir = storage.workspace_dir / "to_delete"
        latest_link = session_dir / "latest"
        assert latest_link.is_symlink()

        # Create external links for each checkpoint
        ext_links: list[Path] = []
        for i, cp in enumerate(cps):
            link_dir = tmp_path / f"ext_{i}"
            link_dir.mkdir()
            if i == 0:
                storage.link_checkpoint(link_dir, "to_delete")
            else:
                storage.link_checkpoint(
                    link_dir,
                    "to_delete",
                    WaldiezCheckpoint.parse_timestamp(cp.name),
                )
            if i == 0:
                # latest link uses newest checkpoint name
                newest = storage._find_checkpoints("to_delete")[0].path
                ext_links.append(link_dir / newest.name)
            else:
                ext_links.append(link_dir / cp.name)

        # Sanity: links exist and registry has entries
        for lp in ext_links:
            assert lp.is_symlink()
        assert any(
            session_dir in Path(k).parents
            or Path(k).is_relative_to(session_dir)
            for k in storage._links_registry.keys()
        )

        # Delete the whole session
        storage.delete_session("to_delete")

        # Session dir gone (and thus internal 'latest' gone)
        assert not session_dir.exists()

        # All external links removed
        for lp in ext_links:
            assert not lp.exists()

        # No registry entries left for that session
        assert all(
            not (
                Path(k).is_relative_to(storage.workspace_dir)
                and Path(k).relative_to(storage.workspace_dir).parts[:1]
                == ("to_delete",)
            )
            for k in storage._links_registry.keys()
        )

    def test_delete_session_nonexistent_noop(
        self, storage: FilesystemStorage
    ) -> None:
        """Deleting a non-existent session should not raise or affect others."""
        # Create another session to ensure isolation
        storage.save_checkpoint("keep_me", {"ok": True})
        storage.delete_session("does_not_exist")

        # 'keep_me' still present
        assert "keep_me" in storage.list_sessions()
        assert len(storage.list_checkpoints("keep_me")) == 1

    def test_delete_session_does_not_affect_other_sessions(
        self, storage: FilesystemStorage, tmp_path: Path
    ) -> None:
        """Deleting one session doesn't touch other sessions' data or links."""
        # Create two sessions
        cp_keep = storage.save_checkpoint("keep_session", {"k": 1})
        cp_del = storage.save_checkpoint("del_session", {"d": 1})

        # External link for the session that should be kept
        link_dir = tmp_path / "ext_keep"
        link_dir.mkdir()
        storage.link_checkpoint(link_dir, "keep_session")
        keep_link = link_dir / cp_keep.name  # name of the newest checkpoint

        # External link for the session to delete
        link_dir2 = tmp_path / "ext_del"
        link_dir2.mkdir()
        storage.link_checkpoint(link_dir2, "del_session")
        del_link = link_dir2 / cp_del.name

        # Delete only 'del_session'
        storage.delete_session("del_session")

        # 'keep_session' intact
        assert "keep_session" in storage.list_sessions()
        assert keep_link.exists() and keep_link.is_symlink()
        assert str(cp_keep) in storage._links_registry

        # 'del_session' gone and its link removed
        assert "del_session" not in storage.list_sessions()
        assert not del_link.exists()
        assert all(
            "del_session" not in k for k in storage._links_registry.keys()
        )

    def test_delete_session_cleans_registry_garbage(
        self, storage: FilesystemStorage
    ) -> None:
        """If registry has stray entries under session dir, they are purged."""
        # Create a valid checkpoint so the session exists
        storage.save_checkpoint("garbage_session", {"x": 1})
        session_dir = storage.workspace_dir / "garbage_session"
        assert session_dir.exists()

        # Manually inject garbage registry entries pointing under the session
        fake_cp_dir = session_dir / "1900-01-01T00-00-00Z"
        fake_link = storage.workspace_dir.parent / "outside" / "fake_link"
        storage._links_registry[str(fake_cp_dir)] = [str(fake_link)]
        storage._save_links_registry()

        # Delete the session
        storage.delete_session("garbage_session")

        # Session gone and registry entries purged
        assert not session_dir.exists()
        assert all(
            "garbage_session" not in k for k in storage._links_registry.keys()
        )

    def test_delete_session_updates_list_sessions(
        self, storage: FilesystemStorage
    ) -> None:
        """list_sessions reflects removal after delete_session."""
        storage.save_checkpoint("s1", {"a": 1})
        storage.save_checkpoint("s2", {"b": 2})
        sessions = set(storage.list_sessions())
        assert {"s1", "s2"} <= sessions

        storage.delete_session("s1")
        sessions_after = set(storage.list_sessions())
        assert "s1" not in sessions_after
        assert "s2" in sessions_after
