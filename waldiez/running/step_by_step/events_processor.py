# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=unused-argument,no-self-use
# pyright: reportMissingTypeStubs=false, reportImportCycles=false
# pyright: reportDeprecated=false, reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false

"""Command handler for step-by-step execution."""

import inspect
from typing import TYPE_CHECKING, Any, Optional, Union

if TYPE_CHECKING:
    from autogen.agentchat import ConversableAgent  # type: ignore
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
        self,
        event: Union["BaseEvent", "BaseMessage"],
        agents: list["ConversableAgent"],
    ) -> dict[str, Any]:
        """Shared logic for both sync and async event processing.

        Parameters
        ----------
        event : BaseEvent | BaseMessage
            The event to process.
        agents : list[ConversableAgent]
            The workflow's known agents.

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
        self._add_agents_info(event_info, agents)

        should_break = self.runner.should_break_on_event(
            event, sender_only=True
        )

        return {
            "action": "break" if should_break else "continue",
            "event_info": event_info,
        }

    def _create_event_info(
        self,
        event: Union["BaseEvent", "BaseMessage"],
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

        self._check_for_event_speaker(event_info)
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
            content = content.get("chat_info", {})

        if not event_info["sender"] and "sender" in content:
            event_info["sender"] = content["sender"]
        if not event_info["recipient"] and "recipient" in content:
            event_info["recipient"] = content["recipient"]

    def _check_for_event_speaker(self, event_info: dict[str, Any]) -> None:
        """Handle speaker information for group chat events.

        Parameters
        ----------
        event_info : dict[str, Any]
            Event information dictionary to update.
        """
        if "content" in event_info and isinstance(event_info["content"], dict):
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

    @staticmethod
    def _get_agent_dump(
        agent: Optional["ConversableAgent"],
    ) -> dict[str, Any] | None:
        if not agent:
            return None
        dump = {
            name: _trim_value(value)
            for name, value in inspect.getmembers(agent)
            if not name.startswith("_")
            and not inspect.ismethod(value)
            and not inspect.isfunction(value)
            and name.upper() != name
        }
        dump["cost"] = {
            "actual": agent.get_actual_usage(),
            "total": agent.get_total_usage(),
        }
        return dump

    def _add_agents_info(
        self, event_info: dict[str, Any], agents: list["ConversableAgent"]
    ) -> None:
        """Add agents info."""
        sender = event_info.get("sender", self.runner.last_sender)
        recipient = event_info.get("recipient", self.runner.last_recipient)

        agent_map = {agent.name: agent for agent in agents}

        sender_agent = agent_map.get(sender)
        recipient_agent = agent_map.get(recipient)

        ordered_agents: list["ConversableAgent"] = []
        seen: set[str] = set()

        for a in (sender_agent, recipient_agent):
            if a and a.name not in seen:
                ordered_agents.append(a)
                seen.add(a.name)

        for a in agents:
            if a.name not in seen:
                ordered_agents.append(a)
                seen.add(a.name)

        event_info["agents"] = {
            "sender": self._get_agent_dump(sender_agent),
            "recipient": self._get_agent_dump(recipient_agent),
            "all": [self._get_agent_dump(a) for a in ordered_agents if a],
        }


# pylint: disable=too-complex,too-many-return-statements
def _trim_value(value: Any, max_len: int = 200) -> Any:
    """Recursively trim values for serialization."""
    if isinstance(value, str):
        return value[:max_len] + "..." if len(value) > max_len else value
    if isinstance(value, dict):
        return {k: _trim_value(v, max_len) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        trimmed = [_trim_value(item, max_len) for item in value]
        return trimmed if isinstance(value, list) else tuple(trimmed)
    if isinstance(value, set):
        return {_trim_value(item, max_len) for item in value}
    if hasattr(value, "__dict__"):
        # Handle objects with attributes by converting to dict
        try:
            return {
                k: _trim_value(v, max_len)
                for k, v in value.__dict__.items()
                if not k.startswith("_")
            }
        except Exception:  # pylint: disable=broad-exception-caught
            return (
                str(value)[:max_len] + "..."
                if len(str(value)) > max_len
                else str(value)
            )
    try:
        str_val = str(value)
        if len(str_val) > max_len:
            return str_val[:max_len] + "..."
    except Exception:  # pylint: disable=broad-exception-caught
        pass
    return value
