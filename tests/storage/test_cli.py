# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=missing-yield-doc,no-self-use,unused-argument
# pylint: disable=too-few-public-methods,too-many-public-methods

"""Tests for storage CLI module."""

from collections.abc import Generator
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
import typer
from typer.testing import CliRunner

from waldiez.storage.checkpoint import WaldiezCheckpoint
from waldiez.storage.cli import app, handle_checkpoints


class MockWaldiezCheckpointInfo:
    """Mock WaldiezCheckpointInfo for testing."""

    def __init__(
        self,
        session_name: str,
        timestamp: datetime,
        path: Path,
        metadata: dict[str, Any],
    ):
        self.session_name = session_name
        self.timestamp = timestamp
        self.path = path
        self.metadata = metadata

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "session_name": self.session_name,
            "timestamp": self.timestamp.isoformat(),
            "path": str(self.path),
            "metadata": self.metadata,
        }


class TestStorageCLI:
    """Tests for storage CLI."""

    @pytest.fixture(name="runner")
    def runner_fixture(self) -> CliRunner:
        """Create a CLI runner."""
        return CliRunner()

    @pytest.fixture(name="mock_storage_manager")
    def mock_storage_manager_fixture(
        self,
    ) -> Generator[MagicMock | AsyncMock, Any, None]:
        """Create a mock StorageManager."""
        with patch("waldiez.storage.cli.StorageManager") as mock:
            yield mock

    @pytest.fixture(name="mock_workspace")
    def mock_workspace_fixture(self, tmp_path: Path) -> Path:
        """Create a mock workspace directory."""
        workspace = tmp_path / "test_workspace"
        workspace.mkdir()
        return workspace

    def test_app_metadata(self) -> None:
        """Test app metadata is set correctly."""
        assert app.info.name == "waldiez-checkpoints"
        assert app.info.help
        assert "checkpoints management" in app.info.help
        assert app.info.context_settings
        assert app.info.context_settings["help_option_names"] == [
            "-h",
            "--help",
        ]
        assert app.info.context_settings["allow_extra_args"] is True
        assert app.info.context_settings["ignore_unknown_options"] is True

    def test_checkpoints_no_args_shows_help(self, runner: CliRunner) -> None:
        """Test that checkpoints command with no args shows help."""
        result = runner.invoke(app, [])
        assert result.exit_code == 2
        assert "--help" in result.output or "Usage:" in result.output

    def test_list_checkpoints(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
        tmp_path: Path,
    ) -> None:
        """Test listing checkpoints."""
        # Setup mock
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance
        checkpoints_root = tmp_path / "workspace"
        # Create mock checkpoints
        checkpoints = [
            MockWaldiezCheckpointInfo(
                "session1",
                datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
                checkpoints_root / "session1" / "20240101_120000_000",
                {"version": "1.0"},
            ),
            MockWaldiezCheckpointInfo(
                "session2",
                datetime(2024, 1, 2, 13, 0, 0, tzinfo=timezone.utc),
                checkpoints_root / "session2" / "20240102_130000_000",
                {"version": "2.0"},
            ),
        ]
        mock_instance.checkpoints.return_value = checkpoints

        # Run command
        result = runner.invoke(
            app, ["--workspace", str(mock_workspace), "--list"]
        )

        assert result.exit_code == 0
        mock_instance.checkpoints.assert_called_once_with(session_name=None)

        # Check output contains checkpoint data
        assert "session1" in result.output
        assert "session2" in result.output

    def test_list_checkpoints_with_session(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
        tmp_path: Path,
    ) -> None:
        """Test listing checkpoints for a specific session."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        checkpoints = [
            MockWaldiezCheckpointInfo(
                "session1",
                datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
                tmp_path / "workspace" / "session1" / "20240101_120000_000",
                {},
            )
        ]
        mock_instance.checkpoints.return_value = checkpoints

        result = runner.invoke(
            app,
            [
                "--workspace",
                str(mock_workspace),
                "--list",
                "--session",
                "session1",
            ],
        )

        assert result.exit_code == 0
        mock_instance.checkpoints.assert_called_once_with(
            session_name="session1"
        )

    def test_list_sessions(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test listing sessions."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        sessions = ["session1", "session2", "session3"]
        mock_instance.sessions.return_value = sessions

        result = runner.invoke(
            app,
            ["--workspace", str(mock_workspace), "--sessions"],
        )

        assert result.exit_code == 0
        mock_instance.sessions.assert_called_once()

        # Check output contains sessions
        for session in sessions:
            assert session in result.output

    def test_delete_checkpoint_success(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test deleting a checkpoint successfully."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        timestamp_str = WaldiezCheckpoint.format_timestamp(
            datetime.now(timezone.utc)
        )

        result = runner.invoke(
            app,
            [
                "--workspace",
                str(mock_workspace),
                "--delete",
                "--session",
                "test_session",
                "--checkpoint",
                timestamp_str,
            ],
        )

        assert result.exit_code == 0

        # Verify delete was called with correct timestamp
        mock_instance.delete.assert_called_once_with(
            session_name="test_session",
            timestamp=WaldiezCheckpoint.parse_timestamp(timestamp_str),
        )

    def test_delete_checkpoint_no_session(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test deleting checkpoint without session fails."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        result = runner.invoke(
            app,
            [
                "--workspace",
                str(mock_workspace),
                "--delete",
                "--checkpoint",
                "20240101_120000_123456",
            ],
        )

        assert result.exit_code == 1
        assert "Please provide the session" in result.output

    def test_delete_checkpoint_no_checkpoint(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test deleting checkpoint without checkpoint timestamp fails."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        result = runner.invoke(
            app,
            [
                "--workspace",
                str(mock_workspace),
                "--delete",
                "--session",
                "test_session",
            ],
        )

        assert result.exit_code == 1
        assert "Please provide the checkpoint's timestamp" in result.output

    def test_cleanup_specific_session(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test cleanup for specific session."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        result = runner.invoke(
            app,
            [
                "--workspace",
                str(mock_workspace),
                "--clean",
                "--session",
                "test_session",
                "--keep",
                "5",
            ],
        )

        assert result.exit_code == 0
        mock_instance.cleanup.assert_called_once_with(
            session_name="test_session", keep_count=5
        )

    def test_cleanup_all_sessions(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test cleanup for all sessions."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        sessions = ["session1", "session2", "session3"]
        mock_instance.sessions.return_value = sessions

        result = runner.invoke(
            app,
            [
                "--workspace",
                str(mock_workspace),
                "--clean",
                "--keep",
                "3",
            ],
        )

        assert result.exit_code == 0
        mock_instance.sessions.assert_called_once()

        # Verify cleanup was called for each session
        assert mock_instance.cleanup.call_count == 3
        for session in sessions:
            mock_instance.cleanup.assert_any_call(
                session_name=session, keep_count=3
            )

    def test_cleanup_no_keep_value(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test cleanup without keep value (deletes all)."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        result = runner.invoke(
            app,
            [
                "--workspace",
                str(mock_workspace),
                "--clean",
                "--session",
                "test_session",
            ],
        )

        assert result.exit_code == 0
        mock_instance.cleanup.assert_called_once_with(
            session_name="test_session", keep_count=0
        )

    def test_cleanup_negative_keep_value(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test cleanup with negative keep value (converts to 0)."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        result = runner.invoke(
            app,
            [
                "--workspace",
                str(mock_workspace),
                "--clean",
                "--session",
                "test_session",
                "--keep",
                "-5",
            ],
        )

        assert result.exit_code == 0
        mock_instance.cleanup.assert_called_once_with(
            session_name="test_session",
            keep_count=0,  # Negative values are converted to 0
        )

    def test_multiple_operations(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test multiple operations in single command."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance
        mock_instance.checkpoints.return_value = []

        # List checkpoints takes precedence and exits early
        result = runner.invoke(
            app,
            [
                "--workspace",
                str(mock_workspace),
                "--list",
                "--delete",  # This should be ignored
                "--clean",  # This should be ignored
            ],
        )

        assert result.exit_code == 0
        mock_instance.checkpoints.assert_called_once()
        # Delete and cleanup should not be called
        mock_instance.delete.assert_not_called()
        mock_instance.cleanup.assert_not_called()

    def test_invalid_workspace(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
    ) -> None:
        """Test with invalid workspace directory."""
        result = runner.invoke(
            app, ["--workspace", "/non/existent/path", "--list"]
        )

        # Typer should validate the path exists
        assert result.exit_code != 0

    def test_command_shortcuts(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test command shortcuts work."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance
        mock_instance.checkpoints.return_value = []

        # Test -l shortcut for --list
        result = runner.invoke(app, ["-w", str(mock_workspace), "-l"])
        assert result.exit_code == 0

        # Test -s shortcut for --sessions
        mock_instance.sessions.return_value = []
        result = runner.invoke(app, ["-w", str(mock_workspace), "-s"])
        assert result.exit_code == 0

        # Test -d shortcut for --delete
        result = runner.invoke(app, ["-w", str(mock_workspace), "-d"])
        # Should fail because no session/checkpoint provided
        assert result.exit_code == 1

    def test_pretty_print_output(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
        capsys: pytest.CaptureFixture[str],
        tmp_path: Path,
    ) -> None:
        """Test pretty print formatting."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance
        # Create checkpoints with various data types
        checkpoints = [
            MockWaldiezCheckpointInfo(
                "test_session",
                datetime(2024, 1, 1, 12, 30, 45, 123456, tzinfo=timezone.utc),
                tmp_path / "workspace" / "test" / "checkpoint",
                {"complex": {"nested": "data"}, "number": 42},
            )
        ]
        mock_instance.checkpoints.return_value = checkpoints

        result = runner.invoke(
            app, ["--workspace", str(mock_workspace), "--list"]
        )

        assert result.exit_code == 0
        # Pretty print should format the complex metadata
        assert "nested" in result.output
        assert "42" in result.output

    def test_handle_checkpoints_direct_call(
        self,
        mock_storage_manager: MagicMock,
        tmp_path: Path,
    ) -> None:
        """Test calling handle_checkpoints directly."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance
        mock_instance.checkpoints.return_value = []

        # Test list checkpoints with direct call
        with pytest.raises(typer.Exit) as exc_info:
            handle_checkpoints(
                workspace=tmp_path,
                list_checkpoints=True,
                list_sessions=False,
                session=None,
                delete_checkpoint=False,
                checkpoint=None,
                cleanup=False,
                keep=None,
            )

        assert exc_info.value.exit_code == 0
        mock_instance.checkpoints.assert_called_once()

    def test_cleanup_priority_order(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test operation priority when multiple flags are set."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        # Set up mocks
        mock_instance.checkpoints.return_value = []
        mock_instance.sessions.return_value = ["session1"]

        # List checkpoints has priority over list sessions
        result = runner.invoke(
            app,
            [
                "--workspace",
                str(mock_workspace),
                "--list",
                "--sessions",
            ],
        )

        assert result.exit_code == 0
        mock_instance.checkpoints.assert_called_once()
        mock_instance.sessions.assert_not_called()

    def test_edge_cases(
        self,
        runner: CliRunner,
        mock_storage_manager: MagicMock,
        mock_workspace: MagicMock,
    ) -> None:
        """Test various edge cases."""
        mock_instance = Mock()
        mock_storage_manager.return_value = mock_instance

        # Empty sessions list
        mock_instance.sessions.return_value = []
        result = runner.invoke(
            app,
            ["--workspace", str(mock_workspace), "--sessions"],
        )
        assert result.exit_code == 0
        assert "[]" in result.output

        # Empty checkpoints list
        mock_instance.checkpoints.return_value = []
        result = runner.invoke(
            app, ["--workspace", str(mock_workspace), "--list"]
        )
        assert result.exit_code == 0
        assert "[]" in result.output


class TestCLIIntegration:
    """Integration tests for CLI with real storage."""

    @pytest.fixture(name="runner")
    def runner_fixture(self) -> CliRunner:
        """Create a CLI runner."""
        return CliRunner()

    def test_full_workflow(self, runner: MagicMock, tmp_path: Path) -> None:
        """Test full workflow with real storage manager."""
        # Create a test checkpoint structure
        workspace = tmp_path / "test_workspace"
        session_dir = workspace / "test_session"
        checkpoint_dir = session_dir / "1761725646601"
        checkpoint_dir.mkdir(parents=True)

        state_file = checkpoint_dir / "state.json"
        state_file.write_text('{"data": "test"}')

        # List checkpoints
        result = runner.invoke(
            app,
            [
                "--workspace",
                str(workspace),
                "--list",
                "--session",
                "test_session",
            ],
        )

        assert result.exit_code == 0
        # Should show the checkpoint
        assert "test_session" in result.output
        assert "1761725646601" in result.output
