# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument,no-self-use
"""Command handler for step-by-step execution."""

from typing import TYPE_CHECKING, Any, Union

if TYPE_CHECKING:
    from autogen.events.base_event import BaseEvent  # type: ignore
    from autogen.messages.base_message import BaseMessage  # type: ignore

    # noinspection PyUnusedImports
    from .step_by_step_runner import WaldiezStepByStepRunner


# pylint: disable=too-few-public-methods
class EventProcessor:
    """Processes events for the step-by-step runner."""

    def __init__(self, runner: "WaldiezStepByStepRunner"):
        self.runner = runner

    def process_event(
        self, event: Union["BaseEvent", "BaseMessage"]
    ) -> dict[str, Any]:
        """Shared logic for both sync and async event processing.

        Parameters
        ----------
        event : BaseEvent | BaseMessage
            The event to process.

        Returns
        -------
        dict[str, Any]
            The result of processing the event.
        """
        self.runner.event_plus_one()
        self.runner.current_event = event

        if self.runner.is_stop_requested():
            return {"action": "stop", "reason": "stop_requested"}

        event_info = self._create_event_info(event)
        self._update_participant_info(event_info)
        self._manage_event_history(event_info)
        self._check_for_input_request(event_info)

        should_break = self.runner.should_break_on_event(event)

        return {
            "action": "continue",
            "should_break": should_break,
            "event_info": event_info,
        }

    def _create_event_info(
        self, event: Union["BaseEvent", "BaseMessage"]
    ) -> dict[str, Any]:
        """Create event info dictionary from event object.

        Parameters
        ----------
        event : BaseEvent | BaseMessage
            The event to convert to info dict.

        Returns
        -------
        dict[str, Any]
            Event information dictionary.
        """
        event_info = event.model_dump(
            mode="json", exclude_none=True, fallback=str
        )
        event_info["count"] = self.runner.event_count
        event_info["sender"] = getattr(event, "sender", self.runner.last_sender)
        event_info["recipient"] = getattr(
            event, "recipient", self.runner.last_recipient
        )
        return event_info

    def _update_participant_info(self, event_info: dict[str, Any]) -> None:
        """Update sender and recipient information in event_info.

        Parameters
        ----------
        event_info : dict[str, Any]
            Event information dictionary to update.
        """
        if not event_info["sender"] or not event_info["recipient"]:
            self._extract_participants_from_content(event_info)

        self._handle_group_chat_speaker(event_info)
        self._extract_participants_from_direct_content(event_info)

        # Update last known participants
        self.runner.last_sender = event_info["sender"]
        self.runner.last_recipient = event_info["recipient"]

    def _extract_participants_from_content(
        self, event_info: dict[str, Any]
    ) -> None:
        """Extract sender/recipient from nested content structure.

        Parameters
        ----------
        event_info : dict[str, Any]
            Event information dictionary to update.
        """
        content = event_info.get("content", {})
        if (
            isinstance(content, dict)
            and "chat_info" in content
            and isinstance(content["chat_info"], dict)
        ):
            content = content.get("chat_info", {})  # pyright: ignore

        if not event_info["sender"] and "sender" in content:
            event_info["sender"] = content["sender"]
        if not event_info["recipient"] and "recipient" in content:
            event_info["recipient"] = content["recipient"]

    def _handle_group_chat_speaker(self, event_info: dict[str, Any]) -> None:
        """Handle speaker information for group chat events.

        Parameters
        ----------
        event_info : dict[str, Any]
            Event information dictionary to update.
        """
        if (
            event_info.get("type") == "group_chat_run_chat"
            and "content" in event_info
            and isinstance(event_info["content"], dict)
        ):
            content = event_info.get("content", {})
            speaker = content.get("speaker")
            if isinstance(speaker, str) and speaker:
                event_info["sender"] = speaker

    def _extract_participants_from_direct_content(
        self, event_info: dict[str, Any]
    ) -> None:
        """Extract sender/recipient directly from content dictionary.

        Parameters
        ----------
        event_info : dict[str, Any]
            Event information dictionary to update.
        """
        if "content" in event_info and isinstance(event_info["content"], dict):
            content = event_info.get("content", {})

            sender = content.get("sender", "")
            if isinstance(sender, str) and sender:
                event_info["sender"] = sender

            recipient = content.get("recipient", "")
            if isinstance(recipient, str) and recipient:
                event_info["recipient"] = recipient

    def _manage_event_history(self, event_info: dict[str, Any]) -> None:
        """Add event to history and manage history size limits.

        Parameters
        ----------
        event_info : dict[str, Any]
            Event information to add to history.
        """
        self.runner.add_to_history(event_info)
        self._trim_history_if_needed()

    def _trim_history_if_needed(self) -> None:
        """Remove oldest events from history if over size limit."""
        current_history = self.runner.event_history
        if len(current_history) > self.runner.max_event_history:
            excess = len(current_history) - self.runner.max_event_history
            for _ in range(excess):
                self.runner.pop_event()

    def _check_for_input_request(self, event_info: dict[str, Any]) -> None:
        """Swap participant names if we have an input request."""
        if (
            event_info["type"] in ("input_request", "debug_input_request")
            and "sender" in event_info
            and "recipient" in event_info
        ):
            # swap them,
            # before:
            # "recipient" is the user (the one received the input request),
            # make her the "sender" (the one typing...)
            sender = event_info["sender"]
            recipient = event_info["recipient"]
            event_info["sender"] = recipient
            event_info["recipient"] = sender
            self.runner.last_sender = recipient
            self.runner.last_recipient = sender
