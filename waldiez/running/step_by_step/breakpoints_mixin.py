# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument
"""Breakpoints management mixin for step-by-step debugging."""

from typing import TYPE_CHECKING, Any, Iterable, Union

from .step_by_step_models import (
    WaldiezDebugBreakpointAdded,
    WaldiezDebugBreakpointCleared,
    WaldiezDebugBreakpointRemoved,
    WaldiezDebugBreakpointsList,
    WaldiezDebugError,
    WaldiezDebugMessage,
)

if TYPE_CHECKING:
    from autogen.events import BaseEvent  # type: ignore
    from autogen.messages import BaseMessage  # type: ignore


class BreakpointsMixin:
    """Mixin class for managing breakpoints in step-by-step debugging."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize breakpoints storage."""
        self._breakpoints: set[str] = set()

    def emit(self, message: WaldiezDebugMessage) -> None:
        """Emit a debug message. Implemented by the class using this mixin.

        Parameters
        ----------
        message : WaldiezDebugMessage
            The debug message to emit.
        """
        raise NotImplementedError("emit method must be implemented")

    def add_breakpoint(self, event_type: str) -> None:
        """Add a breakpoint for an event type.

        Parameters
        ----------
        event_type : str
            The event type to add a breakpoint for.
        """
        if not event_type or not isinstance(event_type, str):  # pyright: ignore
            self.emit(
                WaldiezDebugError(
                    error="Invalid event type: must be a non-empty string"
                )
            )
            return

        self._breakpoints.add(event_type)
        self.emit(WaldiezDebugBreakpointAdded(breakpoint=event_type))

    def remove_breakpoint(self, event_type: str) -> bool:
        """Remove a breakpoint for an event type.

        Parameters
        ----------
        event_type : str
            The event type to remove the breakpoint for.

        Returns
        -------
        bool
            True if the breakpoint was removed, False if it didn't exist.
        """
        if not event_type or not isinstance(event_type, str):  # pyright: ignore
            self.emit(
                WaldiezDebugError(
                    error="Invalid event type: must be a non-empty string"
                )
            )
            return False

        if event_type in self._breakpoints:
            self._breakpoints.remove(event_type)
            self.emit(WaldiezDebugBreakpointRemoved(breakpoint=event_type))
            return True
        self.emit(
            WaldiezDebugError(
                error=f"Breakpoint for '{event_type}' does not exist"
            )
        )
        return False

    def list_breakpoints(self) -> None:
        """List all current breakpoints."""
        self.emit(
            WaldiezDebugBreakpointsList(breakpoints=sorted(self._breakpoints))
        )

    def clear_breakpoints(self) -> None:
        """Clear all breakpoints."""
        count = len(self._breakpoints)
        self._breakpoints.clear()
        if count > 0:
            self.emit(
                WaldiezDebugBreakpointCleared(
                    message=f"Cleared {count} breakpoint(s)"
                )
            )

    def set_breakpoints(self, event_types: Iterable[str]) -> None:
        """Set which event types to break on.

        Parameters
        ----------
        event_types : Iterable[str]
            Iterable of event types to break on. Empty means break on all.
        """
        self._breakpoints = set(event_types)

    def get_breakpoints(self) -> set[str]:
        """Get current breakpoints.

        Returns
        -------
        set[str]
            Set of current breakpoint event types.
        """
        return self._breakpoints.copy()

    def has_breakpoint(self, event_type: str) -> bool:
        """Check if a breakpoint exists for an event type.

        Parameters
        ----------
        event_type : str
            The event type to check.

        Returns
        -------
        bool
            True if a breakpoint exists for this event type.
        """
        return event_type in self._breakpoints

    def should_break_on_event(
        self, event: Union["BaseEvent", "BaseMessage"], step_mode: bool = True
    ) -> bool:
        """Determine if we should break on this event.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event to check.
        step_mode : bool, optional
            Whether step mode is enabled, by default True.

        Returns
        -------
        bool
            True if we should break, False otherwise.
        """
        if not step_mode:
            return False

        # Get event type
        event_type = getattr(event, "type", "unknown")

        # Don't break on input requests - they're handled separately
        if event_type == "input_request":
            return False

        # If no specific breakpoints set, break on all events
        if not self._breakpoints:
            return True

        # Check if this event type has a breakpoint
        return event_type in self._breakpoints

    def get_breakpoint_stats(self) -> dict[str, Any]:
        """Get breakpoint statistics.

        Returns
        -------
        dict[str, Any]
            Dictionary containing breakpoint statistics.
        """
        return {
            "total_breakpoints": len(self._breakpoints),
            "breakpoints": sorted(self._breakpoints),
            "has_breakpoints": len(self._breakpoints) > 0,
        }
