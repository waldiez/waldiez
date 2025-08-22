# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument
"""Breakpoints management mixin for step-by-step debugging."""

import logging
from typing import TYPE_CHECKING, Any, Callable, Iterable, Union

from .step_by_step_models import (
    WaldiezBreakpoint,
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


def handle_breakpoint_errors(func: Callable[..., Any]) -> Callable[..., Any]:
    """Handle breakpoint-related errors.

    Parameters
    ----------
    func : Callable
        The function to decorate.

    Returns
    -------
    Callable
        The decorated function.
    """

    def _wrapper(self: "BreakpointsMixin", *args: Any, **kwargs: Any) -> Any:
        try:
            return func(self, *args, **kwargs)
        except ValueError as e:
            self.emit(WaldiezDebugError(error=f"Breakpoint error: {e}"))
            return False
        except Exception as e:  # pylint: disable=broad-exception-caught
            self.emit(
                WaldiezDebugError(
                    error=f"Unexpected error in {func.__name__}: {e}"
                )
            )
            logging.exception("Error in %s", func.__name__)
            return False

    return _wrapper


class BreakpointsMixin:
    """Mixin class for managing breakpoints in step-by-step debugging."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize breakpoints storage with performance optimizations."""
        self._breakpoints: set[WaldiezBreakpoint] = set()
        # Cache for performance optimization
        self._breakpoint_cache_version = 0
        self._last_event_cache: dict[str, bool] = {}

        # Statistics for monitoring
        self._breakpoint_stats = {
            "total_matches": 0,
            "cache_hits": 0,
            "cache_misses": 0,
        }

    def emit(self, message: WaldiezDebugMessage) -> None:
        """Emit a debug message. Implemented by the class using this mixin.

        Parameters
        ----------
        message : WaldiezDebugMessage
            The debug message to emit.
        """
        raise NotImplementedError("emit method must be implemented")

    def _invalidate_cache(self) -> None:
        """Invalidate the event matching cache when breakpoints change."""
        self._breakpoint_cache_version += 1
        self._last_event_cache.clear()

    def _generate_event_key(self, event: dict[str, Any]) -> str:
        """Generate a cache key for an event."""
        # Create a deterministic key from relevant event fields
        event_type = event.get("type", "unknown")
        sender = event.get("sender", "")
        recipient = event.get("recipient", "")
        cache_version = self._breakpoint_cache_version
        return f"{event_type}:{sender}:{recipient}:{cache_version}"

    @handle_breakpoint_errors
    def add_breakpoint(self, spec: str) -> bool:
        """Add a breakpoint for an event type.

        Parameters
        ----------
        spec : str
            The event type specification to add a breakpoint for.

        Returns
        -------
        bool
            True if the breakpoint was added successfully, False otherwise.
        """
        if not spec or not isinstance(spec, str):  # pyright: ignore
            self.emit(
                WaldiezDebugError(
                    error="Invalid event type: must be a non-empty string"
                )
            )
            return False
        # pylint: disable=too-many-try-statements
        try:
            breakpoint_obj = WaldiezBreakpoint.from_string(spec)

            # Check if breakpoint already exists
            if breakpoint_obj in self._breakpoints:
                self.emit(
                    WaldiezDebugError(
                        error=f"Breakpoint for '{spec}' already exists"
                    )
                )
                return False

            self._breakpoints.add(breakpoint_obj)
            self._invalidate_cache()
            self.emit(WaldiezDebugBreakpointAdded(breakpoint=spec))
            return True

        except ValueError as e:
            self.emit(
                WaldiezDebugError(error=f"Invalid breakpoint format: {e}")
            )
            return False

    @handle_breakpoint_errors
    def remove_breakpoint(self, spec: str | WaldiezBreakpoint) -> bool:
        """Remove a breakpoint based on its specification.

        Parameters
        ----------
        spec : str | WaldiezBreakpoint
            The event type to remove the breakpoint for.

        Returns
        -------
        bool
            True if the breakpoint was removed, False if it didn't exist.
        """
        if isinstance(spec, WaldiezBreakpoint):
            breakpoint_obj = spec
            spec_str = str(spec)
        elif isinstance(spec, str) and spec:  # pyright: ignore
            try:
                breakpoint_obj = WaldiezBreakpoint.from_string(spec)
                spec_str = spec
            except ValueError as e:
                self.emit(
                    WaldiezDebugError(error=f"Invalid breakpoint format: {e}")
                )
                return False
        else:
            self.emit(
                WaldiezDebugError(error="Invalid breakpoint specification")
            )
            return False

        if breakpoint_obj in self._breakpoints:
            self._breakpoints.remove(breakpoint_obj)
            self._invalidate_cache()
            self.emit(WaldiezDebugBreakpointRemoved(breakpoint=spec_str))
            return True

        self.emit(
            WaldiezDebugError(
                error=f"Breakpoint for '{spec_str}' does not exist"
            )
        )
        return False

    def list_breakpoints(self) -> None:
        """List all current breakpoints."""
        breakpoints_list = sorted(self._breakpoints, key=str)
        self.emit(WaldiezDebugBreakpointsList(breakpoints=breakpoints_list))

    def clear_breakpoints(self) -> None:
        """Clear all breakpoints."""
        count = len(self._breakpoints)
        self._breakpoints.clear()
        self._invalidate_cache()

        if count > 0:
            self.emit(
                WaldiezDebugBreakpointCleared(
                    message=f"Cleared {count} breakpoint(s)"
                )
            )
        else:
            self.emit(
                WaldiezDebugBreakpointCleared(message="No breakpoints to clear")
            )

    @handle_breakpoint_errors
    def set_breakpoints(self, specs: Iterable[str | WaldiezBreakpoint]) -> bool:
        """Set which breakpoints to activate.

        Parameters
        ----------
        specs : Iterable[str | WaldiezBreakpoint]
            Iterable of event types to break on. Empty means no breakpoints.

        Returns
        -------
        bool
            True if all breakpoints were set successfully, False if any failed.
        """
        new_breakpoints: set[WaldiezBreakpoint] = set()
        errors: list[str] = []

        for spec in specs:
            try:
                if isinstance(spec, WaldiezBreakpoint):
                    new_breakpoints.add(spec)
                else:
                    new_breakpoints.add(WaldiezBreakpoint.from_string(spec))
            except ValueError as e:
                errors.append(f"Invalid breakpoint '{spec}': {e}")

        if errors:
            for error in errors:
                self.emit(WaldiezDebugError(error=error))
            return False

        old_count = len(self._breakpoints)
        self._breakpoints = new_breakpoints
        new_count = len(self._breakpoints)
        self._invalidate_cache()

        self.emit(
            WaldiezDebugBreakpointCleared(
                message=f"Updated breakpoints: {old_count} -> {new_count}"
            )
        )
        return True

    def get_breakpoints(self) -> set[WaldiezBreakpoint]:
        """Get current breakpoints.

        Returns
        -------
        set[WaldiezBreakpoint]
            Set of current breakpoint event types.
        """
        return self._breakpoints.copy()

    def has_breakpoint(self, spec: str | WaldiezBreakpoint) -> bool:
        """Check if a breakpoint exists.

        Parameters
        ----------
        spec : str | WaldiezBreakpoint
            The breakpoint specification to check.

        Returns
        -------
        bool
            True if a breakpoint exists for this event type.
        """
        try:
            if isinstance(spec, WaldiezBreakpoint):
                return spec in self._breakpoints
            return WaldiezBreakpoint.from_string(spec) in self._breakpoints
        except ValueError:
            return False

    def should_break_on_event(
        self, event: Union["BaseEvent", "BaseMessage"], step_mode: bool = True
    ) -> bool:
        """Determine if we should break on this event with caching optimization.

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
        # Get event type
        event_type = getattr(event, "type", "unknown")

        # Don't break on input requests - they're handled separately
        if event_type == "input_request":
            return False

        # Quick path: if no breakpoints and not in step mode, don't break
        if not self._breakpoints and not step_mode:
            return False

        # Quick path: if step mode and no specific breakpoints,
        # break on everything
        if step_mode and not self._breakpoints:
            return True

        # Check if this event type has a breakpoint using caching
        if hasattr(event, "model_dump"):
            # pylint: disable=too-many-try-statements
            try:
                event_dict = event.model_dump(
                    mode="python", exclude_none=True, fallback=str
                )

                # Use caching for performance
                event_key = self._generate_event_key(event_dict)

                if event_key in self._last_event_cache:
                    self._breakpoint_stats["cache_hits"] += 1
                    cached_result = self._last_event_cache[event_key]
                    # If cached result says break, or we're in step mode, break
                    return cached_result or step_mode

                self._breakpoint_stats["cache_misses"] += 1

                # Check if any breakpoint matches
                matches_breakpoint = any(
                    bp.matches(event_dict) for bp in self._breakpoints
                )

                # Cache the result
                self._last_event_cache[event_key] = matches_breakpoint

                # Limit cache size to prevent memory issues
                if len(self._last_event_cache) > 1000:
                    # Remove oldest entries (simplified LRU)
                    items = list(self._last_event_cache.items())
                    self._last_event_cache = dict(items[-500:])

                self._breakpoint_stats["total_matches"] += 1

                # If any breakpoint matches: break regardless of step_mode
                if matches_breakpoint:
                    return True

            except Exception as e:  # pylint: disable=broad-exception-caught
                # If there's an error in event processing, log it, don't break
                logging.warning("Error processing event for breakpoints: %s", e)

        # No specific breakpoints matched:
        # - If step_mode, break on every event (single-step behavior)
        # - If not step_mode, do not break
        return bool(step_mode)

    def get_breakpoint_stats(self) -> dict[str, Any]:
        """Get breakpoint statistics including performance metrics.

        Returns
        -------
        dict[str, Any]
            Dictionary containing breakpoint statistics.
        """
        breakpoints: list[dict[str, Any]] = [
            {
                "type": bp.type.value,
                "event_type": bp.event_type,
                "agent_name": bp.agent_name,
                "description": bp.description,
                "string_repr": str(bp),
            }
            for bp in self._breakpoints
        ]

        # Calculate cache efficiency
        total_checks = (
            self._breakpoint_stats["cache_hits"]
            + self._breakpoint_stats["cache_misses"]
        )
        cache_hit_rate = (
            self._breakpoint_stats["cache_hits"] / total_checks
            if total_checks > 0
            else 0
        )

        return {
            "total_breakpoints": len(self._breakpoints),
            "breakpoints": breakpoints,
            "has_breakpoints": len(self._breakpoints) > 0,
            "cache_stats": {
                "cache_hit_rate": f"{cache_hit_rate:.2%}",
                "cache_size": len(self._last_event_cache),
                "total_matches": self._breakpoint_stats["total_matches"],
                "cache_hits": self._breakpoint_stats["cache_hits"],
                "cache_misses": self._breakpoint_stats["cache_misses"],
            },
            "performance": {
                "cache_version": self._breakpoint_cache_version,
                "memory_usage_estimate": len(self._last_event_cache)
                * 100,  # rough bytes estimate
            },
        }

    def reset_stats(self) -> None:
        """Reset breakpoint statistics."""
        self._breakpoint_stats = {
            "total_matches": 0,
            "cache_hits": 0,
            "cache_misses": 0,
        }
        self._last_event_cache.clear()
        self._breakpoint_cache_version += 1

    def optimize_cache(self) -> None:
        """Manually optimize the cache by clearing old entries."""
        if len(self._last_event_cache) > 500:
            # Keep only the most recent 250 entries
            items = list(self._last_event_cache.items())
            self._last_event_cache = dict(items[-250:])

    def export_breakpoints(self) -> list[str]:
        """Export breakpoints as a list of strings for persistence.

        Returns
        -------
        list[str]
            List of breakpoint specifications as strings.
        """
        return [str(bp) for bp in sorted(self._breakpoints, key=str)]

    def import_breakpoints(
        self, breakpoint_specs: list[str]
    ) -> tuple[int, list[str]]:
        """Import breakpoints from a list of string specifications.

        Parameters
        ----------
        breakpoint_specs : list[str]
            List of breakpoint specifications as strings.

        Returns
        -------
        tuple[int, list[str]]
            Tuple of (successful_imports, error_messages).
        """
        successful = 0
        errors: list[str] = []

        for spec in breakpoint_specs:
            # pylint: disable=too-many-try-statements
            try:
                breakpoint_obj = WaldiezBreakpoint.from_string(spec)
                if breakpoint_obj not in self._breakpoints:
                    self._breakpoints.add(breakpoint_obj)
                    successful += 1
                else:
                    errors.append(f"Breakpoint '{spec}' already exists")
            except ValueError as e:
                errors.append(f"Invalid breakpoint '{spec}': {e}")

        if successful > 0:
            self._invalidate_cache()

        return successful, errors
