# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=broad-exception-caught,no-member,invalid-name
# pyright: reportUnknownVariableType=false,reportAny=false
# pyright: reportDeprecated=false, reportUnannotatedClassAttribute=false
"""Session management models for WebSocket workflow execution."""

import time
from pathlib import Path
from typing import Any

from .models import ExecutionMode, SessionState, WorkflowStatus


# noinspection TryExceptPass,PyBroadException
class WorkflowSession:
    """Enhanced session wrapper with runtime management capabilities."""

    def __init__(
        self,
        session_state: SessionState,
        runner: Any = None,
        temp_file: Path | None = None,
    ):
        """Initialize workflow session.

        Parameters
        ----------
        session_state : SessionState
            The session state data
        runner : Any, optional
            The workflow runner instance
        temp_file : Path, optional
            Temporary file path for cleanup
        """
        self._state = session_state
        self.runner = runner
        self._temp_file = temp_file
        self._created_at = time.monotonic_ns()
        self._last_accessed = time.monotonic_ns()
        self._access_count = 0

    @property
    def start_time(self) -> int:
        """Get the start time of the session."""
        return self._state.start_time

    @property
    def state(self) -> SessionState:
        """Get the session state."""
        self._last_accessed = time.monotonic_ns()
        self._access_count += 1
        return self._state

    @property
    def raw_state(self) -> SessionState:
        """Get the raw session state."""
        return self._state

    @property
    def session_id(self) -> str:
        """Get session ID."""
        return self._state.session_id

    @property
    def client_id(self) -> str:
        """Get client ID."""
        return self._state.client_id

    @property
    def status(self) -> WorkflowStatus:
        """Get current status."""
        return self._state.status

    @property
    def mode(self) -> ExecutionMode:
        """Get execution mode."""
        return self._state.mode

    @property
    def temp_file(self) -> Path | None:
        """Get temporary file path."""
        return self._temp_file

    @property
    def metadata(self) -> dict[str, Any]:
        """Get session metadata."""
        return self._state.metadata

    @property
    def last_accessed(self) -> float:
        """Get last access time."""
        return self._last_accessed

    @property
    def access_count(self) -> int:
        """Get access count."""
        return self._access_count

    def update_status(self, new_status: WorkflowStatus) -> None:
        """Update session status.

        Parameters
        ----------
        new_status : WorkflowStatus
            The new status to set.
        """
        self._state.update_status(new_status)
        self._access_count += 1
        self._last_accessed = time.monotonic_ns()

    def cleanup(self) -> None:
        """Cleanup session resources."""
        # Stop runner if still running
        if self.runner and hasattr(self.runner, "stop"):
            try:
                self.runner.stop()
            except Exception:
                pass  # Best effort cleanup

        # Remove temporary file
        if self._temp_file and self._temp_file.exists():
            try:
                self._temp_file.unlink()
            except Exception:
                pass  # Best effort cleanup

    def to_dict(self) -> dict[str, Any]:
        """Convert session to dictionary representation.

        Returns
        -------
        dict[str, Any]
            The dictionary representation of the session.
        """
        base_dict = self._state.get_execution_summary()
        base_dict.update(
            {
                "created_at": self._created_at,
                "last_accessed": self._last_accessed,
                "access_count": self._access_count,
                "has_runner": self.runner is not None,
                "has_temp_file": self._temp_file is not None,
            }
        )
        return base_dict
