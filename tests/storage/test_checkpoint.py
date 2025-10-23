# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=no-self-use

"""Tests for checkpoint data structures."""

from datetime import datetime, timezone
from pathlib import Path

from waldiez.storage.checkpoint import Checkpoint, CheckpointInfo


class TestCheckpoint:
    """Tests for Checkpoint class."""

    def test_checkpoint_creation(self, tmp_path: Path) -> None:
        """Test creating a checkpoint."""
        checkpoint = Checkpoint(
            session_name="test_session",
            timestamp=datetime.now(timezone.utc),
            path=tmp_path / "checkpoint",
        )

        assert checkpoint.session_name == "test_session"
        assert isinstance(checkpoint.timestamp, datetime)
        assert checkpoint.path == tmp_path / "checkpoint"

    def test_state_file_property(self, tmp_path: Path) -> None:
        """Test state_file property."""
        checkpoint = Checkpoint(
            session_name="test_session",
            timestamp=datetime.now(timezone.utc),
            path=tmp_path / "checkpoint",
        )

        assert checkpoint.state_file == tmp_path / "checkpoint" / "state.json"

    def test_exists_property(self, tmp_path: Path) -> None:
        """Test exists property."""
        checkpoint_path = tmp_path / "checkpoint"
        checkpoint = Checkpoint(
            session_name="test_session",
            timestamp=datetime.now(timezone.utc),
            path=checkpoint_path,
        )

        # Initially doesn't exist
        assert not checkpoint.exists

        # Create the directory and state file
        checkpoint_path.mkdir()
        (checkpoint_path / "state.json").write_text("{}")

        # Now it exists
        assert checkpoint.exists

        # Remove state file
        (checkpoint_path / "state.json").unlink()
        assert not checkpoint.exists


class TestCheckpointInfo:
    """Tests for CheckpointInfo class."""

    def test_checkpoint_info_creation(self, tmp_path: Path) -> None:
        """Test creating checkpoint info."""
        info = CheckpointInfo(
            session_name="test_session",
            timestamp=datetime.now(timezone.utc),
            path=tmp_path / "checkpoint",
        )

        assert info.session_name == "test_session"
        assert isinstance(info.timestamp, datetime)
        assert info.path == tmp_path / "checkpoint"

    def test_from_checkpoint(self, tmp_path: Path) -> None:
        """Test creating CheckpointInfo from Checkpoint."""
        checkpoint = Checkpoint(
            session_name="test_session",
            timestamp=datetime.now(timezone.utc),
            path=tmp_path / "checkpoint",
        )

        info = CheckpointInfo.from_checkpoint(checkpoint)

        assert info.session_name == checkpoint.session_name
        assert info.timestamp == checkpoint.timestamp
        assert info.path == checkpoint.path
