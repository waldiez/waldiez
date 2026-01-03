# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=unused-argument
# pyright: reportDeprecated=false, reportMissingTypeStubs=false
# pyright: reportUnusedParameter=false, reportUnnecessaryIsInstance=false
# pyright: reportUnknownMemberType=false, reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false

"""Breakpoints management mixin for step-by-step debugging."""

import logging
from collections.abc import Iterable
from functools import lru_cache
from typing import TYPE_CHECKING, Any, Callable, Union

from .step_by_step_models import (
    WaldiezBreakpoint,
    WaldiezDebugBreakpointAdded,
    WaldiezDebugBreakpointCleared,
    WaldiezDebugBreakpointRemoved,
    WaldiezDebugBreakpointsList,
    WaldiezDebugConfig,
    WaldiezDebugError,
    WaldiezDebugMessage,
)

if TYPE_CHECKING:
    from autogen.events import BaseEvent  # type: ignore
    from autogen.messages import BaseMessage  # type: ignore


def handle_breakpoint_errors(func: Callable[..., bool]) -> Callable[..., bool]:
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

    def _wrapper(self: "BreakpointsMixin", *args: Any, **kwargs: Any) -> bool:
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

    _breakpoints: set[WaldiezBreakpoint]
    _agent_id_to_name: dict[str, str]
    _config: WaldiezDebugConfig

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize breakpoints storage."""
        self._breakpoints = set()
        self._agent_id_to_name = {}

        # Statistics for monitoring
        self._breakpoint_stats = {
            "total_matches": 0,
            "cache_hits": 0,
            "cache_misses": 0,
        }

        # Create the cached function with proper binding
        self._check_breakpoint_match_cached = lru_cache(maxsize=1000)(
            self._check_breakpoint_match_impl
        )
        self._config = kwargs.get("config", WaldiezDebugConfig())

    @staticmethod
    def get_initial_breakpoints(
        items: Iterable[Any],
    ) -> set[WaldiezBreakpoint]:
        """Get initial breakpoints.

        Parameters
        ----------
        items : Iterable[Any]
            The items to parse for getting the endpoints.

        Returns
        -------
        set[WaldiezBreakpoint]
            The parsed breakpoints.
        """
        breakpoints: set[WaldiezBreakpoint] = set()
        for item in items:
            if isinstance(item, str):
                # noinspection PyBroadException
                try:
                    entry = WaldiezBreakpoint.from_string(item)
                    breakpoints.add(entry)
                except BaseException:  # pylint: disable=broad-exception-caught
                    pass
            elif isinstance(item, WaldiezBreakpoint):
                breakpoints.add(item)
        return breakpoints

    def set_agent_id_to_name(self, mapping: dict[str, str]) -> None:
        """Set the agent id to agent name mapping.

        Parameters
        ----------
        mapping : dict[str, str]
            The agent id to agent name mapping.
        """
        self._agent_id_to_name = mapping

    # noinspection PyTypeHints
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
        self._check_breakpoint_match_cached.cache_clear()

    def _get_breakpoints_signature(self) -> frozenset[str]:
        """Get a hashable signature of current breakpoints."""
        return frozenset(str(bp) for bp in self._breakpoints)

    def _check_breakpoint_match_impl(
        self,
        event_type: str,
        sender: str,
        recipient: str,
        sender_only: bool,
        breakpoints_sig: frozenset[str],
    ) -> bool:
        """Check if the event matches any breakpoints.

        Parameters
        ----------
        event_type : str
            The event type to check.
        sender : str
            The event sender.
        recipient : str
            The event recipient.
        sender_only : bool
            Only check for event's sender agent.
        breakpoints_sig : frozenset[str]
            Signature of current breakpoints for cache invalidation.

        Returns
        -------
        bool
            True if any breakpoint matches, False otherwise.
        """
        event_dict = {
            "type": event_type,
            "sender": self._agent_id_to_name.get(sender, sender),
            "recipient": self._agent_id_to_name.get(recipient, recipient),
        }

        # Reconstruct breakpoints from signature for cache safety
        # noinspection PyBroadException
        try:
            breakpoints = {
                WaldiezBreakpoint.from_string(bp_str)
                for bp_str in breakpoints_sig
            }
            return any(
                bp.matches(
                    event_dict,
                    self._agent_id_to_name,
                    sender_only=sender_only,
                )
                for bp in breakpoints
            )
        except Exception:  # pylint: disable=broad-exception-caught
            # Fallback to current breakpoints if signature is malformed
            return any(
                bp.matches(
                    event_dict,
                    self._agent_id_to_name,
                    sender_only=sender_only,
                )
                for bp in self._breakpoints
            )

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
        if not spec or not isinstance(spec, str):
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
        elif isinstance(spec, str) and spec:
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

    @staticmethod
    def _get_event_core(event_dict: dict[str, Any]) -> tuple[str, str, str]:
        event_type = event_dict.get("type", "unknown")
        sender = event_dict.get("sender", "")
        if not sender:
            event_content = event_dict.get("content", {})
            if isinstance(event_content, dict):
                sender = event_content.get(
                    "sender",
                    event_content.get("speaker", ""),
                )
        if not isinstance(sender, str):
            sender = ""
        recipient = event_dict.get("recipient", "")
        if not recipient:
            event_content = event_dict.get("content", {})
            if isinstance(event_content, dict):
                recipient = event_content.get("recipient")
        if not isinstance(recipient, str):
            recipient = ""
        return event_type, sender, recipient

    def _got_breakpoint_match(
        self, event_dump: dict[str, Any], sender_only: bool
    ) -> bool:
        event_type, sender, recipient = BreakpointsMixin._get_event_core(
            event_dump
        )
        event_dict = {
            "type": event_type,
            "sender": sender,
            "recipient": recipient,
        }

        has_agent_breakpoints = any(
            bp.agent is not None for bp in self._breakpoints
        )
        if has_agent_breakpoints:
            # Don't use cache for agent-based breakpoints
            # (we might have a mix of agent ids and names)
            matches_breakpoint = any(
                bp.matches(
                    event_dict,
                    self._agent_id_to_name,
                    sender_only=sender_only,
                )
                for bp in self._breakpoints
            )
        else:
            # Get current breakpoints signature for cache invalidation
            breakpoints_sig = self._get_breakpoints_signature()

            # Check cached result
            # noinspection PyBroadException
            try:
                matches_breakpoint = self._check_breakpoint_match_cached(
                    event_type, sender, recipient, sender_only, breakpoints_sig
                )
                self._breakpoint_stats["cache_hits"] += 1
            except Exception:  # pylint: disable=broad-exception-caught
                # Fallback to non-cached check
                matches_breakpoint = any(
                    bp.matches(
                        event_dict,
                        self._agent_id_to_name,
                        sender_only=sender_only,
                    )
                    for bp in self._breakpoints
                )
                self._breakpoint_stats["cache_misses"] += 1

        return matches_breakpoint

    def should_break_on_event(
        self,
        event: Union["BaseEvent", "BaseMessage"],
        sender_only: bool,
    ) -> bool:
        """Determine if we should break on this event.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event to check.
        sender_only : bool
            Only check for event's sender agent.

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

        if not self._breakpoints:
            return not bool(self._config.auto_continue)

        # Check if this event matches any breakpoint using caching
        if not hasattr(event, "model_dump"):
            return not bool(self._config.auto_continue)
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            event_dump = event.model_dump(
                mode="python", exclude_none=True, fallback=str
            )
            matches_breakpoint = self._got_breakpoint_match(
                event_dump, sender_only=sender_only
            )
            # If any breakpoint matches: break regardless of step_mode
            if matches_breakpoint:
                self._breakpoint_stats["total_matches"] += 1
                return True

        except Exception as e:  # pylint: disable=broad-exception-caught
            logging.warning("Error processing event for breakpoints: %s", e)
            self._breakpoint_stats["cache_misses"] += 1

        return not bool(self._config.auto_continue)

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
                "agent": bp.agent,
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

        # Get cache info from lru_cache
        cache_info = self._check_breakpoint_match_cached.cache_info()

        return {
            "total_breakpoints": len(self._breakpoints),
            "breakpoints": breakpoints,
            "has_breakpoints": len(self._breakpoints) > 0,
            "cache_stats": {
                "cache_hit_rate": f"{cache_hit_rate:.2%}",
                "cache_size": cache_info.currsize,
                "cache_maxsize": cache_info.maxsize,
                "total_matches": self._breakpoint_stats["total_matches"],
                "cache_hits": cache_info.hits,
                "cache_misses": cache_info.misses,
            },
            "performance": {
                "lru_cache_info": {
                    "hits": cache_info.hits,
                    "misses": cache_info.misses,
                    "maxsize": cache_info.maxsize,
                    "currsize": cache_info.currsize,
                }
            },
        }

    def reset_stats(self) -> None:
        """Reset breakpoint statistics."""
        self._breakpoint_stats = {
            "total_matches": 0,
            "cache_hits": 0,
            "cache_misses": 0,
        }
        self._invalidate_cache()

    def optimize_cache(self) -> None:
        """Manually optimize the cache by clearing it."""
        self._invalidate_cache()

    def export_breakpoints(self) -> list[str]:
        """Export breakpoints as a list of strings for persistence.

        Returns
        -------
        list[str]
            List of breakpoint specifications as strings.
        """
        return [str(bp) for bp in sorted(self._breakpoints, key=str)]

    def is_auto_run(self) -> bool:
        """Check if we are in auto-run mode.

        Returns
        -------
        bool
            False if we don't have any breakpoints and
            we don't have any 'all' breakpoints, True otherwise.
        """
        if not self._breakpoints:
            return False
        if any(bp.type.value == "all" for bp in self._breakpoints):
            self._breakpoints.clear()
            self._invalidate_cache()
            return False
        return True

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
