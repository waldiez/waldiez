# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Manages workflow sessions across WebSocket clients."""

import asyncio
import logging
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, final

from .models import ExecutionMode, SessionState, WorkflowStatus
from .session import WorkflowSession
from .session_stats import SessionStats


# noinspection TryExceptPass,PyBroadException
@final
class SessionManager:
    """Manage workflow sessions across WebSocket clients."""

    def __init__(
        self,
        cleanup_interval: float = 300.0,
        max_session_age: float = 3600.0,
    ) -> None:
        """Initialize the session manager.

        Parameters
        ----------
        cleanup_interval : float
            The interval at which to clean up expired sessions
        max_session_age : float
            The maximum age of a session before it is considered expired
        """
        self._sessions: dict[str, WorkflowSession] = {}
        self._client_sessions: dict[str, list[str]] = defaultdict(list)
        self._stats = SessionStats()
        self._cleanup_interval = cleanup_interval
        self._max_session_age = max_session_age
        self._cleanup_task: asyncio.Task[Any] | None = None
        self._lock = asyncio.Lock()
        self._stop_event = asyncio.Event()
        self._logger = logging.getLogger(__name__)

    # ---------------- lifecycle ----------------

    async def start(self) -> None:
        """Start the session manager."""
        self._stop_event.clear()
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def stop(self) -> None:
        """Stop the session manager."""
        self._stop_event.set()
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
        await self.cleanup_all_sessions()

    # ---------------- session ops ----------------

    async def create_session(
        self,
        session_id: str,
        client_id: str,
        mode: ExecutionMode,
        runner: Any = None,
        temp_file: Path | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> WorkflowSession:
        """Create a new workflow session.

        Parameters
        ----------
        session_id : str
            The ID of the session to create
        client_id : str
            The ID of the client creating the session
        mode : ExecutionMode
            The execution mode for the session
        runner : Any, optional
            The runner to use for the session
        temp_file : Path | None, optional
            The temporary file to use for the session
        metadata : dict[str, Any] | None, optional
            Metadata to associate with the session

        Returns
        -------
        WorkflowSession
            The created workflow session

        Raises
        ------
        ValueError
            If a session with the given ID already exists
        """
        session_state = SessionState(
            session_id=session_id,
            client_id=client_id,
            status=WorkflowStatus.IDLE,
            mode=mode,
            metadata=metadata or {},
        )
        session = WorkflowSession(
            session_state=session_state, runner=runner, temp_file=temp_file
        )

        async with self._lock:
            if session_id in self._sessions:
                raise ValueError(f"Session {session_id} already exists")
            self._sessions[session_id] = session
            self._client_sessions[client_id].append(session_id)
            self._recompute_stats_locked()
        return session

    async def get_session(self, session_id: str) -> WorkflowSession | None:
        """Get a workflow session by ID.

        Parameters
        ----------
        session_id : str
            The ID of the session to retrieve

        Returns
        -------
        WorkflowSession | None
            The workflow session with the given ID, or None if it does not exist
        """
        async with self._lock:
            return self._sessions.get(session_id)

    async def get_client_sessions(
        self, client_id: str
    ) -> list[WorkflowSession]:
        """Get all workflow sessions for a client.

        Parameters
        ----------
        client_id : str
            The ID of the client to retrieve sessions for

        Returns
        -------
        list[WorkflowSession]
            A list of workflow sessions for the client
        """
        async with self._lock:
            ids = list(self._client_sessions.get(client_id, []))
            return [self._sessions[sid] for sid in ids if sid in self._sessions]

    async def update_session_status(
        self,
        session_id: str,
        new_status: WorkflowStatus,
    ) -> bool:
        """Update the status of a workflow session.

        Parameters
        ----------
        session_id : str
            The ID of the session to update
        new_status : WorkflowStatus
            The new status to set for the session

        Returns
        -------
        bool
            True if the status was updated, False if the session was not found
        """
        async with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return False
            session.update_status(new_status)
            self._recompute_stats_locked()
            return True

    async def get_session_mode(self, session_id: str) -> ExecutionMode | None:
        """Get the execution mode of a workflow session.

        Parameters
        ----------
        session_id : str
            The ID of the session to retrieve the execution mode for

        Returns
        -------
        ExecutionMode | None
            The execution mode of the session, or None if it does not exist
        """
        async with self._lock:
            session = self._sessions.get(session_id)
            return session.mode if session else None

    async def remove_session(self, session_id: str) -> bool:
        """Remove a workflow session by ID.

        Parameters
        ----------
        session_id : str
            The ID of the session to remove

        Returns
        -------
        bool
            True if the session was removed, False if it did not exist
        """
        self._logger.debug("Removing session %s", session_id)
        # Detach under lock
        async with self._lock:
            session = self._sessions.pop(session_id, None)
            if not session:
                return False
            client_id = session.client_id
            if client_id in self._client_sessions:
                try:
                    self._client_sessions[client_id].remove(session_id)
                    if not self._client_sessions[client_id]:
                        del self._client_sessions[client_id]
                except ValueError:
                    pass
        # Cleanup outside lock
        try:
            session.cleanup()
        except Exception:  # pylint: disable=broad-exception-caught
            pass
        # Update stats under lock
        async with self._lock:
            self._stats.cleanup_count += 1
            self._recompute_stats_locked()
        return True

    async def remove_client_sessions(self, client_id: str) -> int:
        """Remove all workflow sessions for a client.

        Parameters
        ----------
        client_id : str
            The ID of the client whose sessions should be removed

        Returns
        -------
        int
            Number of removed sessions
        """
        async with self._lock:
            sids = list(self._client_sessions.get(client_id, []))
        removed = 0
        for sid in sids:
            if await self.remove_session(sid):
                removed += 1
        return removed

    # ---------------- stats / status ----------------

    async def get_stats(self) -> SessionStats:
        """Get session statistics.

        Returns
        -------
        SessionStats
            Session statistics
        """
        async with self._lock:
            self._recompute_stats_locked()
            return self._stats

    async def get_session_count(self) -> int:
        """Get total number of sessions.

        Returns
        -------
        int
            Total number of sessions
        """
        async with self._lock:
            return len(self._sessions)

    async def get_client_count(self) -> int:
        """Get number of clients with sessions.

        Returns
        -------
        int
            Number of clients with sessions
        """
        async with self._lock:
            return len(self._client_sessions)

    async def get_status(self) -> dict[str, Any]:
        """Get detailed status of the session manager.

        Returns
        -------
        dict[str, Any]
            Detailed status information
        """
        stats = await self.get_stats()
        async with self._lock:
            return {
                "session_manager": {
                    "total_sessions": len(self._sessions),
                    "total_clients": len(self._client_sessions),
                    "cleanup_interval": self._cleanup_interval,
                    "max_session_age": self._max_session_age,
                    "cleanup_task_running": self._cleanup_task is not None
                    and not self._cleanup_task.done(),
                },
                "statistics": stats.model_dump(),
                "timestamp": time.time(),
            }

    # ---------------- cleanup ----------------

    async def cleanup_old_sessions(self, max_age: float | None = None) -> int:
        """Cleanup old sessions.

        Parameters
        ----------
        max_age : float | None
            The maximum age of sessions to clean up

        Returns
        -------
        int
            The number of sessions removed
        """
        max_age = max_age or self._max_session_age
        now_ns = time.monotonic_ns()

        async with self._lock:
            to_remove: list[str] = []
            for sid, session in self._sessions.items():
                remove = False
                if session.raw_state.is_completed:
                    from_now_ns = now_ns - (
                        session.raw_state.end_time
                        or session.raw_state.start_time
                    )
                    age_s = from_now_ns / 1_000_000_000
                    remove = age_s > max_age
                elif not session.raw_state.is_active:
                    age_ns = now_ns - session.last_accessed
                    age_s = age_ns / 1_000_000_000
                    remove = age_s > (max_age * 2)
                if remove:
                    to_remove.append(sid)

        removed = 0
        for sid in to_remove:
            if await self.remove_session(sid):
                removed += 1
        return removed

    async def cleanup_all_sessions(self) -> None:
        """Cleanup all sessions."""
        # Detach under lock
        async with self._lock:
            sessions = list(self._sessions.values())
            self._sessions.clear()
            self._client_sessions.clear()
            self._stats = SessionStats()
        # Cleanup outside lock
        for s in sessions:
            try:
                s.cleanup()
            except Exception:  # pylint: disable=broad-exception-caught
                pass

    async def _cleanup_loop(self) -> None:
        """Cleanup loop for old sessions."""
        while not self._stop_event.is_set():
            try:
                await asyncio.sleep(self._cleanup_interval)
                await self.cleanup_old_sessions()
            except asyncio.CancelledError:
                break
            except Exception:  # pylint: disable=broad-exception-caught
                async with self._lock:
                    self._stats.error_count += 1

    # ---------------- internal ----------------

    def _recompute_stats_locked(self) -> None:
        """Recompute session statistics."""
        self._stats.update_from_sessions(list(self._sessions.values()))
