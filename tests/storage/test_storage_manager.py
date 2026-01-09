# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=no-self-use,too-many-public-methods,missing-yield-doc

"""Tests for storage manager."""

import json
import shutil
from collections.abc import Generator
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

from waldiez.storage import FilesystemStorage, Storage, StorageManager


class TestStorageManager:
    """Tests for StorageManager class."""

    @pytest.fixture
    def manager(self, tmp_path: Path) -> Generator[StorageManager, None, None]:
        """Create a StorageManager instance for testing."""
        manager = StorageManager(workspace_dir=tmp_path / "workspace")
        yield manager
        for session in manager.sessions():
            manager.cleanup(session, keep_count=0)

    def test_init_default_storage(self, tmp_path: Path) -> None:
        """Test initialization with default storage."""
        manager = StorageManager(workspace_dir=tmp_path / "workspace")
        assert isinstance(manager.storage, FilesystemStorage)
        assert manager.workspace_dir == (tmp_path / "workspace").resolve()

    def test_init_custom_storage(self, tmp_path: Path) -> None:
        """Test initialization with custom storage."""
        mock_storage = Mock(spec=Storage)
        mock_storage.workspace_dir = tmp_path / "custom"

        manager = StorageManager(storage=mock_storage)
        assert manager.storage is mock_storage
        assert manager.workspace_dir == tmp_path / "custom"

    def test_init_no_workspace_dir(self, tmp_path: Path) -> None:
        """Test initialization without workspace_dir uses get_root_dir."""
        with patch(
            "waldiez.storage.storage_manager.get_root_dir"
        ) as mock_get_root:
            mock_get_root.return_value = tmp_path / "mock" / "root"
            manager = StorageManager()
            mock_get_root.assert_called_once()
            assert isinstance(manager.storage, FilesystemStorage)

    def test_save(self, manager: StorageManager) -> None:
        """Test saving a checkpoint."""
        state = {"agents": ["agent1", "agent2"]}
        metadata = {"version": "1.0"}

        checkpoint_path = manager.save("test_session_save", state, metadata)

        assert checkpoint_path.exists()
        assert (checkpoint_path / "state.json").exists()

        with open(checkpoint_path / "state.json", encoding="utf-8") as f:
            saved_state = json.load(f)
        assert saved_state == state

    def test_update(self, manager: StorageManager) -> None:
        """Test updating a checkpoint."""
        state = {"agents": ["agent1", "agent2"]}
        metadata = {"version": "1.0"}

        checkpoint_path = manager.save("test_session_update", state, metadata)

        assert checkpoint_path.exists()
        assert (checkpoint_path / "state.json").exists()

        with open(checkpoint_path / "state.json", encoding="utf-8") as f:
            saved_state = json.load(f)
        assert saved_state == state

        new_state = {"agents": ["agent2", "agent3"]}
        new_metadata = {"version": "1.0"}
        manager.update(
            session_name="test_session_update",
            checkpoint=checkpoint_path.name,
            state=new_state,
            metadata=new_metadata,
        )
        with open(checkpoint_path / "state.json", encoding="utf-8") as f:
            saved_state = json.load(f)
        assert saved_state == new_state

    def test_load(self, manager: StorageManager) -> None:
        """Test loading a checkpoint."""
        state = {"data": "test"}
        manager.save("test_session_load", state)

        loaded_info = manager.get("test_session_load")
        assert loaded_info
        loaded_state = loaded_info.checkpoint.state
        assert loaded_state == state

    def test_load_with_timestamp(self, manager: StorageManager) -> None:
        """Test loading a checkpoint with specific timestamp."""
        timestamp = datetime.now(timezone.utc)
        state = {"data": "specific"}

        manager.storage.save_checkpoint(
            "test_session_load_with_ts", state, timestamp=timestamp
        )

        loaded_info = manager.get("test_session_load_with_ts", timestamp)
        assert loaded_info
        loaded_state = loaded_info.checkpoint.state
        assert loaded_state == state

    def test_link(self, manager: StorageManager, tmp_path: Path) -> None:
        """Test creating a symlink."""
        manager.save("test_session_load_with_ts", {"data": "test"})

        link_dir = tmp_path / "links"
        link_dir.mkdir()

        manager.link(link_dir, "test_session_load_with_ts")

        # Should have created a link
        links = list(link_dir.iterdir())
        assert len(links) == 1
        assert links[0].is_symlink()

    def test_list(self, manager: StorageManager) -> None:
        """Test listing checkpoints."""
        # Save checkpoints
        for i in range(3):
            manager.save(f"session_{i}", {"iteration": i})

        # List all
        all_checkpoints = manager.checkpoints()
        assert len(all_checkpoints) == 3

        # List specific session
        session_checkpoints = manager.checkpoints("session_1")
        assert len(session_checkpoints) == 1
        assert session_checkpoints[0].session_name == "session_1"

    def test_delete(self, manager: StorageManager) -> None:
        """Test deleting a checkpoint."""
        timestamp = datetime.now(timezone.utc)
        checkpoint_path = manager.storage.save_checkpoint(
            "test_session", {"data": "test"}, timestamp=timestamp
        )

        assert checkpoint_path.exists()

        manager.delete("test_session", timestamp)

        assert not checkpoint_path.exists()

    def test_cleanup(self, manager: StorageManager) -> None:
        """Test cleanup of old checkpoints."""
        # Save 10 checkpoints
        for i in range(10):
            manager.save("test_session_cleanup", {"iteration": i})

        # Cleanup keeping only 3
        deleted = manager.cleanup("test_session_cleanup", keep_count=3)
        assert deleted == 7

        remaining = manager.checkpoints("test_session_cleanup")
        assert len(remaining) == 3

    def test_clean_broken_symlinks(self, manager: StorageManager) -> None:
        """Test cleaning broken symlinks."""
        # This method only works with FilesystemStorage
        assert hasattr(manager.storage, "clean_broken_symlinks")

        # Create a checkpoint and then delete it to create broken symlinks
        checkpoint_path = manager.save("test_session", {"data": "test"})
        shutil.rmtree(checkpoint_path)

        cleaned = manager.clean_broken_symlinks()
        assert cleaned >= 0

    def test_transaction_with_filesystem_storage(
        self, manager: StorageManager
    ) -> None:
        """Test transaction context manager with FilesystemStorage."""
        initial_state = {"data": "initial"}
        manager.save("test_session", initial_state)

        # Successful transaction
        with manager.transaction():
            manager.save("test_session", {"data": "updated"})

        # Failed transaction
        with pytest.raises(ValueError):
            with manager.transaction():
                manager.save("test_session", {"data": "failed"})
                raise ValueError("Test error")

    def test_transaction_without_support(self) -> None:
        """Test transaction with storage that doesn't support it."""
        mock_storage = Mock(spec=Storage)
        mock_storage.workspace_dir = Path("/mock")

        # Remove transaction method from mock
        if hasattr(mock_storage, "transaction"):
            delattr(mock_storage, "transaction")

        manager = StorageManager(storage=mock_storage)

        # Should work without error
        with manager.transaction():
            pass

    def test_get_latest_checkpoint(self, manager: StorageManager) -> None:
        """Test getting the latest checkpoint."""
        # No checkpoints
        manager.cleanup("test_get_latest_checkpoint")
        assert (
            manager.get_latest_checkpoint("test_get_latest_checkpoint") is None
        )

        # Save checkpoints
        for i in range(3):
            manager.save(
                "test_get_latest_checkpoint", {"status": "OK"}, {"iteration": i}
            )

        latest = manager.get_latest_checkpoint("test_get_latest_checkpoint")
        assert latest is not None

    def test_session_exists(self, manager: StorageManager) -> None:
        """Test checking if session exists."""
        assert not manager.session_exists("test_session_exists")

        manager.save("test_session_exists", {"data": "test"})

        assert manager.session_exists("test_session_exists")

    def test_finalize(self, manager: StorageManager, tmp_path: Path) -> None:
        """Test the finalize method."""
        # Create temporary directory with artifacts
        tmp_dir = tmp_path / "tmp_run"
        tmp_dir.mkdir()

        # Add some files
        (tmp_dir / "output.txt").write_text("test output")
        (tmp_dir / "results.json").write_text('{"result": "success"}')

        # Create subdirectory
        (tmp_dir / "logs").mkdir()
        (tmp_dir / "logs" / "run.log").write_text("log data")

        # Create output file
        output_file = tmp_path / "script.py"
        output_file.write_text("print('test')")

        # Finalize
        checkpoint_path, public_link = manager.finalize(
            session_name="test_run",
            output_file=output_file,
            tmp_dir=tmp_dir,
            metadata={"status": "complete"},
        )

        # Verify checkpoint was created
        assert checkpoint_path.exists()
        assert (checkpoint_path / "output.txt").exists()
        assert (checkpoint_path / "results.json").exists()
        assert (checkpoint_path / "logs" / "run.log").exists()

        # Verify public link
        assert public_link.is_symlink()
        assert public_link.resolve() == checkpoint_path

        # Verify tmp_dir was removed
        assert not tmp_dir.exists()

    def test_finalize_with_copy_into_subdir(
        self, manager: StorageManager, tmp_path: Path
    ) -> None:
        """Test finalize with copy_into_subdir option."""
        tmp_dir = tmp_path / "tmp_run"
        tmp_dir.mkdir()
        (tmp_dir / "data.txt").write_text("data")

        output_file = tmp_path / "script.py"
        output_file.write_text("print('test')")

        checkpoint_path, _ = manager.finalize(
            session_name="test_run",
            output_file=output_file,
            tmp_dir=tmp_dir,
            copy_into_subdir="artifacts",
        )

        # Verify files were copied into subdirectory
        assert (checkpoint_path / "artifacts" / "data.txt").exists()
        assert not (checkpoint_path / "data.txt").exists()

    def test_finalize_keep_tmp(
        self, manager: StorageManager, tmp_path: Path
    ) -> None:
        """Test finalize with keep_tmp=True."""
        tmp_dir = tmp_path / "tmp_run"
        tmp_dir.mkdir()
        (tmp_dir / "data.txt").write_text("data")

        output_file = tmp_path / "script.py"

        manager.finalize(
            session_name="test_run",
            output_file=output_file,
            tmp_dir=tmp_dir,
            keep_tmp=True,
        )

        # Verify tmp_dir was not removed
        assert tmp_dir.exists()

    def test_finalize_custom_link_root(
        self, manager: StorageManager, tmp_path: Path
    ) -> None:
        """Test finalize with custom link_root."""
        tmp_dir = tmp_path / "tmp_run"
        tmp_dir.mkdir()

        output_file = tmp_path / "script.py"
        custom_link_root = tmp_path / "custom_links"

        _, public_link = manager.finalize(
            session_name="test_finalize_custom_link_root",
            output_file=output_file,
            tmp_dir=tmp_dir,
            link_root=custom_link_root,
        )

        # Verify link was created in custom location
        assert (
            public_link.parent
            == custom_link_root / "test_finalize_custom_link_root"
        )

    def test_finalize_promote_files(
        self, manager: StorageManager, tmp_path: Path
    ) -> None:
        """Test finalize promotes specific files to output directory."""
        tmp_dir = tmp_path / "tmp_run"
        tmp_dir.mkdir()

        # Create files to promote
        (tmp_dir / "tree_of_thoughts.png").write_bytes(b"image data")
        (tmp_dir / "reasoning_tree.json").write_text("{}")
        (tmp_dir / "other.txt").write_text("not promoted")

        output_file = tmp_path / "output" / "script.py"
        output_file.parent.mkdir()
        output_file.write_text("print('test')")

        manager.finalize(
            session_name="test_run",
            output_file=output_file,
            tmp_dir=tmp_dir,
        )

        # Verify promoted files are in output directory
        assert (output_file.parent / "tree_of_thoughts.png").exists()
        assert (output_file.parent / "reasoning_tree.json").exists()
        assert not (output_file.parent / "other.txt").exists()

    def test_finalize_ignore_names(
        self, manager: StorageManager, tmp_path: Path
    ) -> None:
        """Test finalize ignores specified files/directories."""
        tmp_dir = tmp_path / "tmp_run"
        tmp_dir.mkdir()

        # Create files/dirs to ignore
        (tmp_dir / ".cache").mkdir()
        (tmp_dir / ".cache" / "data").write_text("cached")
        (tmp_dir / ".env").write_text("SECRET=value")
        (tmp_dir / "keep.txt").write_text("keep this")

        output_file = tmp_path / "script.py"

        checkpoint_path, _ = manager.finalize(
            session_name="test_run",
            output_file=output_file,
            tmp_dir=tmp_dir,
        )

        # Verify ignored files were not copied
        assert not (checkpoint_path / ".cache").exists()
        assert not (checkpoint_path / ".env").exists()
        assert (checkpoint_path / "keep.txt").exists()

    def test_finalize_nonexistent_tmp_dir(
        self, manager: StorageManager, tmp_path: Path
    ) -> None:
        """Test finalize with non-existent tmp_dir."""
        tmp_dir = tmp_path / "non_existent"
        output_file = tmp_path / "script.py"

        with pytest.raises(FileNotFoundError):
            manager.finalize(
                session_name="test_run",
                output_file=output_file,
                tmp_dir=tmp_dir,
            )

    def test_finalize_with_timestamp(
        self, manager: StorageManager, tmp_path: Path
    ) -> None:
        """Test finalize with specific timestamp."""
        tmp_dir = tmp_path / "tmp_run"
        tmp_dir.mkdir()

        output_file = tmp_path / "script.py"
        timestamp = datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

        _, __ = manager.finalize(
            session_name="test_run",
            output_file=output_file,
            tmp_dir=tmp_dir,
            timestamp=timestamp,
        )

        # Verify checkpoint has correct timestamp
        checkpoints = manager.checkpoints("test_run")
        assert len(checkpoints) == 1
        assert checkpoints[0].timestamp == timestamp
