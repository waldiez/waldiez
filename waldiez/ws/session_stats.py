# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pyright: reportUnknownVariableType=false
# pylint: disable=broad-exception-caught,no-member

"""Session statistics model."""

from pydantic import BaseModel, Field

from .models import WorkflowSession, WorkflowStatus


class SessionStats(BaseModel):
    """Statistics for session management."""

    total_sessions: int = 0
    active_sessions: int = 0
    completed_sessions: int = 0
    failed_sessions: int = 0
    cancelled_sessions: int = 0

    sessions_by_client: dict[str, int] = Field(default_factory=dict)
    sessions_by_mode: dict[str, int] = Field(default_factory=dict)
    sessions_by_status: dict[str, int] = Field(default_factory=dict)

    average_duration: float = 0.0
    total_duration: float = 0.0

    cleanup_count: int = 0
    error_count: int = 0

    def update_from_sessions(self, sessions: list[WorkflowSession]) -> None:
        """Update stats from current sessions.

        Parameters
        ----------
        sessions : list[WorkflowSession]
            The list of sessions to update stats from.
        """
        # Reset counters
        self.total_sessions = len(sessions)
        self.active_sessions = 0
        self.completed_sessions = 0
        self.failed_sessions = 0
        self.cancelled_sessions = 0

        self.sessions_by_client.clear()
        self.sessions_by_mode.clear()
        self.sessions_by_status.clear()

        total_duration = 0.0
        completed_count = 0

        for session in sessions:
            state = session.state

            if state.status == WorkflowStatus.COMPLETED:
                self.completed_sessions += 1
            elif state.status == WorkflowStatus.FAILED:
                self.failed_sessions += 1
            elif state.status == WorkflowStatus.CANCELLED:
                self.cancelled_sessions += 1
            elif state.is_active:
                self.active_sessions += 1

            client_count = self.sessions_by_client.get(state.client_id, 0)
            self.sessions_by_client[state.client_id] = client_count + 1
            mode_key = state.execution_mode.value
            mode_count = self.sessions_by_mode.get(mode_key, 0)
            self.sessions_by_mode[mode_key] = mode_count + 1
            status_key = state.status.value
            status_count = self.sessions_by_status.get(status_key, 0)
            self.sessions_by_status[status_key] = status_count + 1
            if state.is_completed:
                total_duration += state.duration
                completed_count += 1

        self.total_duration = total_duration
        self.average_duration = (
            total_duration / completed_count if completed_count > 0 else 0.0
        )
