# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=no-self-use

"""Tests for checkpoint data structures."""

from datetime import datetime, timezone
from pathlib import Path

from waldiez.storage.checkpoint import WaldiezCheckpoint, WaldiezCheckpointInfo


class TestWaldiezCheckpoint:
    """Tests for WaldiezCheckpoint class."""

    def test_checkpoint_creation(self, tmp_path: Path) -> None:
        """Test creating a checkpoint."""
        checkpoint = WaldiezCheckpoint(
            session_name="test_session",
            timestamp=datetime.now(timezone.utc),
            path=tmp_path / "checkpoint",
        )

        assert checkpoint.session_name == "test_session"
        assert isinstance(checkpoint.timestamp, datetime)
        assert checkpoint.path == tmp_path / "checkpoint"

    def test_state_file_property(self, tmp_path: Path) -> None:
        """Test state_file property."""
        checkpoint = WaldiezCheckpoint(
            session_name="test_session",
            timestamp=datetime.now(timezone.utc),
            path=tmp_path / "checkpoint",
        )

        assert checkpoint.state_file == tmp_path / "checkpoint" / "state.json"

    def test_exists_property(self, tmp_path: Path) -> None:
        """Test exists property."""
        checkpoint_path = tmp_path / "checkpoint"
        checkpoint = WaldiezCheckpoint(
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

    def test_timestamp_formatting(self) -> None:
        """Test timestamp formatting and parsing."""
        original = datetime.now(timezone.utc)

        # Format and parse
        formatted = WaldiezCheckpoint.format_timestamp(original)
        parsed = WaldiezCheckpoint.parse_timestamp(formatted)
        assert parsed

        # Should be very close (within microseconds)
        diff = abs((original - parsed).total_seconds())
        assert diff < 0.001  # Less than 1 millisecond

        invalid = WaldiezCheckpoint.parse_timestamp("invalid")
        assert not invalid


class TestWaldiezCheckpointInfo:
    """Tests for WaldiezCheckpointInfo class."""

    def test_checkpoint_info_creation(self, tmp_path: Path) -> None:
        """Test creating checkpoint info."""
        info = WaldiezCheckpointInfo(
            session_name="test_session",
            timestamp=datetime.now(timezone.utc),
            path=tmp_path / "checkpoint",
        )

        assert info.session_name == "test_session"
        assert isinstance(info.timestamp, datetime)
        assert info.path == tmp_path / "checkpoint"

    def test_from_checkpoint(self, tmp_path: Path) -> None:
        """Test creating WaldiezCheckpointInfo from WaldiezCheckpoint."""
        checkpoint = WaldiezCheckpoint(
            session_name="test_session",
            timestamp=datetime.now(timezone.utc),
            path=tmp_path / "checkpoint",
        )

        info = WaldiezCheckpointInfo.from_checkpoint(checkpoint)

        assert info.session_name == checkpoint.session_name
        assert info.timestamp == checkpoint.timestamp
        assert info.path == checkpoint.path
