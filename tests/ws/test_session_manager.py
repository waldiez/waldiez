# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-param-doc,missing-return-doc
# pylint: disable=no-self-use,unused-argument,too-many-try-statements
# pylint: disable=broad-exception-caught,protected-access
# pylint: disable=attribute-defined-outside-init
# pyright: reportPrivateUsage=false,reportUnknownMemberType=false
"""Tests for SessionManager functionality."""

import asyncio
import time
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from waldiez.ws.models import ExecutionMode, WorkflowStatus
from waldiez.ws.session_manager import SessionManager


# pylint: disable=too-many-public-methods
class TestSessionManager:
    """Test SessionManager functionality."""

    def setup_method(self) -> None:
        """Set up test method."""
        self.session_manager = SessionManager()
        self.client_id = "test_client_123"
        self.session_id = "test_session_456"

    @pytest.mark.asyncio
    async def test_session_manager_init(self) -> None:
        """Test SessionManager initialization."""
        manager = SessionManager(cleanup_interval=600.0, max_session_age=7200.0)

        assert manager._cleanup_interval == 600.0
        assert manager._max_session_age == 7200.0
        assert not manager._sessions
        assert not manager._client_sessions
        assert manager._cleanup_task is None

    @pytest.mark.asyncio
    async def test_start_stop(self) -> None:
        """Test starting and stopping session manager."""
        manager = SessionManager()

        # Start manager
        await manager.start()
        assert manager._cleanup_task is not None
        assert not manager._cleanup_task.done()

        # Stop manager
        await manager.stop()
        assert manager._cleanup_task is None
        assert not manager._sessions

    @pytest.mark.asyncio
    async def test_create_session(self) -> None:
        """Test creating a new session."""
        await self.session_manager.start()

        try:
            session = await self.session_manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
                metadata={"test": "data"},
            )

            assert session.session_id == self.session_id
            assert session.client_id == self.client_id
            assert session.mode == ExecutionMode.STANDARD
            assert session.status == WorkflowStatus.IDLE
            assert session.metadata == {"test": "data"}

            # Check internal storage
            assert self.session_id in self.session_manager._sessions
            assert self.client_id in self.session_manager._client_sessions
            assert (
                self.session_id
                in self.session_manager._client_sessions[self.client_id]
            )

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_create_session_duplicate(self) -> None:
        """Test creating session with duplicate ID."""
        await self.session_manager.start()

        try:
            # Create first session
            await self.session_manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            # Try to create duplicate
            with pytest.raises(ValueError, match="already exists"):
                await self.session_manager.create_session(
                    session_id=self.session_id,
                    client_id="different_client",
                    mode=ExecutionMode.STEP_BY_STEP,
                )

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_create_session_with_runner(self, tmp_path: Path) -> None:
        """Test creating session with runner and temp file."""
        await self.session_manager.start()

        try:
            mock_runner = MagicMock()
            session = await self.session_manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.SUBPROCESS,
                runner=mock_runner,
                temp_file=tmp_path,
            )

            assert session.runner is mock_runner
            assert session.temp_file == tmp_path

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_get_session(self) -> None:
        """Test getting session by ID."""
        await self.session_manager.start()

        try:
            # Create session
            created_session = await self.session_manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            # Get session
            retrieved_session = await self.session_manager.get_session(
                self.session_id
            )

            assert retrieved_session is not None
            assert retrieved_session.session_id == self.session_id
            assert retrieved_session is created_session

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_get_session_not_found(self) -> None:
        """Test getting non-existent session."""
        await self.session_manager.start()

        try:
            session = await self.session_manager.get_session("nonexistent")
            assert session is None

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_get_client_sessions(self) -> None:
        """Test getting all sessions for a client."""
        await self.session_manager.start()

        try:
            # Create multiple sessions for same client
            await self.session_manager.create_session(
                session_id="session1",
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            await self.session_manager.create_session(
                session_id="session2",
                client_id=self.client_id,
                mode=ExecutionMode.STEP_BY_STEP,
            )

            # Create session for different client
            await self.session_manager.create_session(
                session_id="session3",
                client_id="other_client",
                mode=ExecutionMode.STANDARD,
            )

            # Get sessions for our client
            client_sessions = await self.session_manager.get_client_sessions(
                self.client_id
            )

            assert len(client_sessions) == 2
            session_ids = [s.session_id for s in client_sessions]
            assert "session1" in session_ids
            assert "session2" in session_ids
            assert "session3" not in session_ids

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_get_client_sessions_empty(self) -> None:
        """Test getting sessions for client with no sessions."""
        await self.session_manager.start()

        try:
            sessions = await self.session_manager.get_client_sessions(
                "nonexistent_client"
            )
            assert sessions == []

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_update_session_status(self) -> None:
        """Test updating session status."""
        await self.session_manager.start()

        try:
            # Create session
            session = await self.session_manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            assert session.status == WorkflowStatus.IDLE

            # Update status
            result = await self.session_manager.update_session_status(
                self.session_id, WorkflowStatus.RUNNING
            )

            assert result is True
            assert session.status == WorkflowStatus.RUNNING

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_update_session_status_not_found(self) -> None:
        """Test updating status of non-existent session."""
        await self.session_manager.start()

        try:
            result = await self.session_manager.update_session_status(
                "nonexistent", WorkflowStatus.RUNNING
            )

            assert result is False

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_get_session_mode(self) -> None:
        """Test getting session execution mode."""
        await self.session_manager.start()

        try:
            # Create session
            await self.session_manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STEP_BY_STEP,
            )

            mode = await self.session_manager.get_session_mode(self.session_id)
            assert mode == ExecutionMode.STEP_BY_STEP

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_get_session_mode_not_found(self) -> None:
        """Test getting execution mode for non-existent session."""
        await self.session_manager.start()

        try:
            mode = await self.session_manager.get_session_mode("nonexistent")
            assert mode is None

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_remove_session(self) -> None:
        """Test removing a session."""
        await self.session_manager.start()

        try:
            # Create session with mock runner
            mock_runner = MagicMock()
            mock_runner.stop = MagicMock()

            await self.session_manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
                runner=mock_runner,
            )

            # Remove session
            result = await self.session_manager.remove_session(self.session_id)

            assert result is True
            assert self.session_id not in self.session_manager._sessions
            assert self.client_id not in self.session_manager._client_sessions

            # Verify cleanup was called
            mock_runner.stop.assert_called_once()

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_remove_session_not_found(self) -> None:
        """Test removing non-existent session."""
        await self.session_manager.start()

        try:
            result = await self.session_manager.remove_session("nonexistent")
            assert result is False

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_remove_client_sessions(self) -> None:
        """Test removing all sessions for a client."""
        await self.session_manager.start()

        try:
            # Create multiple sessions
            await self.session_manager.create_session(
                session_id="session1",
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            await self.session_manager.create_session(
                session_id="session2",
                client_id=self.client_id,
                mode=ExecutionMode.STEP_BY_STEP,
            )

            await self.session_manager.create_session(
                session_id="session3",
                client_id="other_client",
                mode=ExecutionMode.STANDARD,
            )

            # Remove sessions for our client
            removed_count = await self.session_manager.remove_client_sessions(
                self.client_id
            )

            assert removed_count == 2
            assert "session1" not in self.session_manager._sessions
            assert "session2" not in self.session_manager._sessions
            assert (
                "session3" in self.session_manager._sessions
            )  # Other client's session remains
            assert self.client_id not in self.session_manager._client_sessions

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_remove_client_sessions_no_sessions(self) -> None:
        """Test removing sessions for client with no sessions."""
        await self.session_manager.start()

        try:
            removed_count = await self.session_manager.remove_client_sessions(
                "nonexistent_client"
            )
            assert removed_count == 0

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_get_stats(self) -> None:
        """Test getting session statistics."""
        await self.session_manager.start()

        try:
            # Initially empty
            stats = await self.session_manager.get_stats()
            assert stats.total_sessions == 0
            assert stats.active_sessions == 0

            # Create sessions with different statuses
            await self.session_manager.create_session(
                session_id="session1",
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            await self.session_manager.create_session(
                session_id="session2",
                client_id=self.client_id,
                mode=ExecutionMode.STEP_BY_STEP,
            )

            # Update statuses
            await self.session_manager.update_session_status(
                "session1", WorkflowStatus.RUNNING
            )
            await self.session_manager.update_session_status(
                "session2", WorkflowStatus.COMPLETED
            )

            # Get updated stats
            stats = await self.session_manager.get_stats()
            assert stats.total_sessions == 2
            assert stats.active_sessions == 1
            assert stats.completed_sessions == 1
            assert self.client_id in stats.sessions_by_client
            assert stats.sessions_by_client[self.client_id] == 2

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_cleanup_old_sessions(self) -> None:
        """Test cleaning up old sessions."""
        await self.session_manager.start()

        try:
            # Create session and mark it as old
            session = await self.session_manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            # Mark as completed and set old end time
            session.update_status(WorkflowStatus.COMPLETED)
            # 2 hours ago
            session.state.end_time = (
                time.monotonic_ns() - 2 * 60 * 60 * 1_000_000_000
            )

            # Cleanup with 1 hour max age
            cleaned_count = await self.session_manager.cleanup_old_sessions(
                max_age=3600.0
            )

            assert cleaned_count == 1
            assert self.session_id not in self.session_manager._sessions

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_cleanup_old_sessions_inactive(self) -> None:
        """Test cleaning up old inactive sessions."""
        await self.session_manager.start()

        try:
            # Create session and make it look old and inactive
            session = await self.session_manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            # Make session look very old (inactive for long time)
            # 3 hours ago
            session._last_accessed = time.monotonic_ns() - 10800 * 1_000_000_000

            # Cleanup with 1 hour max age
            # (should cleanup inactive sessions after 2 hours)
            cleaned_count = await self.session_manager.cleanup_old_sessions(
                max_age=3600.0
            )

            assert cleaned_count == 1
            assert self.session_id not in self.session_manager._sessions

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_cleanup_old_sessions_none_old(self) -> None:
        """Test cleanup when no sessions are old enough."""
        await self.session_manager.start()

        try:
            # Create recent session
            await self.session_manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            # Cleanup with very long max age
            cleaned_count = await self.session_manager.cleanup_old_sessions(
                max_age=86400.0
            )  # 24 hours

            assert cleaned_count == 0
            assert self.session_id in self.session_manager._sessions

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_cleanup_all_sessions(self) -> None:
        """Test cleaning up all sessions."""
        await self.session_manager.start()

        try:
            # Create multiple sessions
            mock_runner = MagicMock()

            await self.session_manager.create_session(
                session_id="session1",
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
                runner=mock_runner,
            )

            await self.session_manager.create_session(
                session_id="session2",
                client_id="other_client",
                mode=ExecutionMode.STEP_BY_STEP,
            )

            # Cleanup all
            await self.session_manager.cleanup_all_sessions()

            assert len(self.session_manager._sessions) == 0
            assert len(self.session_manager._client_sessions) == 0

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_cleanup_loop(self) -> None:
        """Test background cleanup loop."""
        # Use very short cleanup interval for testing
        manager = SessionManager(cleanup_interval=0.1, max_session_age=0.1)

        await manager.start()

        try:
            # Create old session
            session = await manager.create_session(
                session_id=self.session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            # Mark as old
            session.update_status(WorkflowStatus.COMPLETED)
            # 1 second ago
            session.state.end_time = time.monotonic_ns() - 1_000_000_000

            # Wait for cleanup loop to run
            await asyncio.sleep(0.3)

            # Session should be cleaned up
            assert self.session_id not in manager._sessions

        finally:
            await manager.stop()

    @pytest.mark.asyncio
    async def test_cleanup_loop_exception_handling(self) -> None:
        """Test cleanup loop handles exceptions gracefully."""
        manager = SessionManager(cleanup_interval=0.1)

        # Mock cleanup_old_sessions to raise exception
        with patch.object(
            manager,
            "cleanup_old_sessions",
            side_effect=RuntimeError("Cleanup error"),
        ):
            await manager.start()

            try:
                # Wait for cleanup loop to run and handle exception
                await asyncio.sleep(0.3)

                # Cleanup task should still be running despite exception
                assert manager._cleanup_task is not None
                assert not manager._cleanup_task.done()

                # Stats should show error
                stats = await manager.get_stats()
                assert stats.error_count > 0

            finally:
                await manager.stop()

    async def test_get_session_count(self) -> None:
        """Test getting total session count."""
        assert await self.session_manager.get_session_count() == 0

        # Add some sessions directly to test
        self.session_manager._sessions["session1"] = MagicMock()
        self.session_manager._sessions["session2"] = MagicMock()

        assert await self.session_manager.get_session_count() == 2

    async def test_get_client_count(self) -> None:
        """Test getting client count."""
        assert await self.session_manager.get_client_count() == 0

        # Add some client sessions directly to test
        self.session_manager._client_sessions["client1"] = ["session1"]
        self.session_manager._client_sessions["client2"] = [
            "session2",
            "session3",
        ]

        assert await self.session_manager.get_client_count() == 2

    @pytest.mark.asyncio
    async def test_get_detailed_status(self) -> None:
        """Test getting detailed status information."""
        await self.session_manager.start()

        try:
            status = await self.session_manager.get_status()

            assert "session_manager" in status
            assert "statistics" in status
            assert "timestamp" in status

            manager_info = status["session_manager"]
            assert manager_info["total_sessions"] == 0
            assert manager_info["total_clients"] == 0
            assert manager_info["cleanup_interval"] == 300.0
            assert manager_info["max_session_age"] == 3600.0
            assert manager_info["cleanup_task_running"] is True

        finally:
            await self.session_manager.stop()


class TestSessionManagerEdgeCases:
    """Test edge cases for SessionManager."""

    @pytest.mark.asyncio
    async def test_concurrent_session_operations(self) -> None:
        """Test concurrent session operations."""
        manager = SessionManager()
        await manager.start()

        try:
            # Create multiple sessions concurrently
            tasks: list[Any] = []
            for i in range(10):
                task = manager.create_session(
                    session_id=f"session_{i}",
                    client_id=f"client_{i % 3}",  # 3 different clients
                    mode=ExecutionMode.STANDARD,
                )
                tasks.append(task)

            sessions = await asyncio.gather(*tasks)

            assert len(sessions) == 10
            assert await manager.get_session_count() == 10
            assert await manager.get_client_count() == 3

        finally:
            await manager.stop()

    @pytest.mark.asyncio
    async def test_session_cleanup_race_condition(self) -> None:
        """Test potential race conditions during cleanup."""
        manager = SessionManager()
        await manager.start()

        try:
            # Create session
            await manager.create_session(
                session_id="test_session",
                client_id="test_client",
                mode=ExecutionMode.STANDARD,
            )

            # Try to remove session while accessing it concurrently
            async def access_session() -> None:
                for _ in range(10):
                    await manager.get_session("test_session")
                    await asyncio.sleep(0.01)

            async def remove_session() -> None:
                await asyncio.sleep(0.05)
                await manager.remove_session("test_session")

            # Run both operations concurrently
            await asyncio.gather(
                access_session(), remove_session(), return_exceptions=True
            )

            # Should handle gracefully without errors

        finally:
            await manager.stop()

    @pytest.mark.asyncio
    async def test_session_with_cleanup_failure(self) -> None:
        """Test session removal when cleanup fails."""
        manager = SessionManager()
        await manager.start()

        try:
            # Create session with mock runner that fails cleanup
            mock_runner = MagicMock()
            mock_runner.cleanup.side_effect = RuntimeError("Cleanup failed")

            await manager.create_session(
                session_id="test_session",
                client_id="test_client",
                mode=ExecutionMode.STANDARD,
                runner=mock_runner,
            )

            # Remove session - should handle cleanup failure gracefully
            result = await manager.remove_session("test_session")

            assert result is True
            assert "test_session" not in manager._sessions

        finally:
            await manager.stop()

    @pytest.mark.asyncio
    async def test_empty_client_list_cleanup(self) -> None:
        """Test cleanup of empty client session lists."""
        manager = SessionManager()
        await manager.start()

        try:
            # Create session
            await manager.create_session(
                session_id="test_session",
                client_id="test_client",
                mode=ExecutionMode.STANDARD,
            )

            assert "test_client" in manager._client_sessions

            # Remove session
            await manager.remove_session("test_session")

            # Client should be removed from _client_sessions
            # when list becomes empty
            assert "test_client" not in manager._client_sessions

        finally:
            await manager.stop()

    @pytest.mark.asyncio
    async def test_stats_with_complex_scenarios(self) -> None:
        """Test statistics calculation with complex scenarios."""
        manager = SessionManager()
        await manager.start()

        try:
            # Create sessions with various statuses and execution modes
            sessions_data = [
                (
                    "session1",
                    "client1",
                    ExecutionMode.STANDARD,
                    WorkflowStatus.RUNNING,
                ),
                (
                    "session2",
                    "client1",
                    ExecutionMode.STEP_BY_STEP,
                    WorkflowStatus.COMPLETED,
                ),
                (
                    "session3",
                    "client2",
                    ExecutionMode.SUBPROCESS,
                    WorkflowStatus.FAILED,
                ),
                (
                    "session4",
                    "client2",
                    ExecutionMode.STANDARD,
                    WorkflowStatus.CANCELLED,
                ),
                (
                    "session5",
                    "client3",
                    ExecutionMode.STEP_BY_STEP,
                    WorkflowStatus.RUNNING,
                ),
            ]

            for session_id, client_id, mode, status in sessions_data:
                await manager.create_session(
                    session_id=session_id,
                    client_id=client_id,
                    mode=mode,
                )
                await manager.update_session_status(session_id, status)

            stats = await manager.get_stats()

            assert stats.total_sessions == 5
            assert stats.active_sessions == 2  # RUNNING sessions
            assert stats.completed_sessions == 1
            assert stats.failed_sessions == 1
            assert stats.cancelled_sessions == 1

            # Check client distribution
            assert stats.sessions_by_client["client1"] == 2
            assert stats.sessions_by_client["client2"] == 2
            assert stats.sessions_by_client["client3"] == 1

            # Check execution mode distribution
            assert stats.sessions_by_mode["standard"] == 2
            assert stats.sessions_by_mode["step_by_step"] == 2
            assert stats.sessions_by_mode["subprocess"] == 1

        finally:
            await manager.stop()
