# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument
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

    def process_event_core(
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

        # Store event in history with rotation
        event_info = event.model_dump(
            mode="json", exclude_none=True, fallback=str
        )
        event_info["count"] = self.runner.event_count
        current_last_sender = self.runner.last_sender
        event_info["sender"] = getattr(event, "sender", current_last_sender)
        current_last_recipient = self.runner.last_recipient
        event_info["recipient"] = getattr(
            event, "recipient", current_last_recipient
        )
        if not event_info["sender"] or not event_info["recipient"]:
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
        if (
            event_info.get("type") == "group_chat_run_chat"
            and "content" in event_info
            and isinstance(event_info["content"], dict)
        ):
            content = event_info.get("content", {})
            speaker = content.get("speaker")
            if isinstance(speaker, str) and speaker:
                event_info["sender"] = speaker
        # Update last known participants
        self.runner.last_sender = event_info["sender"]
        self.runner.last_recipient = event_info["recipient"]

        # Add to history with size limit
        self.runner.add_to_history(event_info)
        current_history = self.runner.event_history
        if len(current_history) > self.runner.max_event_history:
            # Remove oldest events (FIFO)
            excess = len(current_history) - self.runner.max_event_history
            for _ in range(excess):
                self.runner.pop_event()

        should_break = self.runner.should_break_on_event(
            event, self.runner.step_mode
        )

        return {
            "action": "continue",
            "should_break": should_break,
            "event_info": event_info,
        }
