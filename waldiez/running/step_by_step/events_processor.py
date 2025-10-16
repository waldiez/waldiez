# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=unused-argument,no-self-use
# pyright: reportMissingTypeStubs=false, reportImportCycles=false
# pyright: reportDeprecated=false, reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false, reportUnknownArgumentType=false

"""Command handler for step-by-step execution."""

import inspect
from collections.abc import Mapping, Sequence
from dataclasses import asdict, is_dataclass
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
            name: _trimmed(value)
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


# pylint: disable=too-complex,too-many-return-statements,
# pylint: disable=broad-exception-caught,too-complex,too-many-branches
def _trimmed(  # noqa: C901
    value: Any, max_len: int = 200, _depth: int = 0, _max_depth: int = 10
) -> Any:
    """Recursively trim values for serialization."""
    if _depth >= _max_depth:
        # Hard stop
        s = str(value)
        return (s[:max_len] + "...") if len(s) > max_len else s

    if isinstance(value, str):
        return value[:max_len] + "..." if len(value) > max_len else value

    if value is None or isinstance(value, (int, float, bool)):
        return value

    if isinstance(value, (bytes, bytearray)):
        try:
            s = value.decode("utf-8", errors="replace")
            return s[:max_len] + "..." if len(s) > max_len else s
        except Exception:
            return f"<{type(value).__name__}> {len(value)} bytes"

    if callable(value):
        # pylint: disable=too-many-try-statements
        try:
            name = getattr(value, "__name__", repr(value))
            module = getattr(value, "__module__", "")
            if module:
                s = f"<callable> {module}.{name}"
            else:
                s = f"<callable> {name}"
            return s[:max_len] + "..." if len(s) > max_len else s
        except Exception:
            return "<callable>"

    if _is_dataclass_instance(value):
        try:
            value = asdict(value)
        except Exception:
            s = str(value)
            return (s[:max_len] + "...") if len(s) > max_len else s

    if isinstance(value, Mapping):
        out: dict[str, Any] = {}
        for k, v in value.items():
            jk = _to_json_key(k, max_len)
            out[jk] = _trimmed(v, max_len, _depth + 1, _max_depth)
        return out
    if isinstance(value, (set, frozenset)):
        items = [_trimmed(it, max_len, _depth + 1, _max_depth) for it in value]
        try:
            items.sort(key=repr)
        except Exception:
            pass
        return items

    if isinstance(value, Sequence) and not isinstance(
        value, (str, bytes, bytearray)
    ):
        return [_trimmed(it, max_len, _depth + 1, _max_depth) for it in value]
    if hasattr(value, "__dict__"):
        try:
            return _trimmed(
                {
                    k: v
                    for k, v in vars(value).items()
                    if not str(k).startswith("__")
                },
                max_len,
                _depth + 1,
                _max_depth,
            )
        except Exception:
            pass

    # Fallback: stringify and trim
    try:
        s = str(value)
        return s[:max_len] + "..." if len(s) > max_len else s
    except Exception:
        return None


def _is_dataclass_instance(obj: Any) -> bool:
    """Check if an object is an instance of a dataclass."""
    return is_dataclass(obj) and not isinstance(obj, type)


def _to_json_key(key: Any, max_len: int) -> str:
    """Convert dict key to a JSON-legal key."""
    if key is None or isinstance(key, (bool, int, float)):
        # JSON allows these directly; turn into str to be safe and consistent.
        return str(key)

    if isinstance(key, str):
        return key[:max_len] + "..." if len(key) > max_len else key

    # Non-primitive key: include type to avoid collisions like 1 vs "1"
    s = f"<{type(key).__name__}> {repr(key)}"
    return s[:max_len] + "..." if len(s) > max_len else s
