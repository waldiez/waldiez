# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Transition target processor for Waldiez agents."""

from dataclasses import dataclass, field
from typing import Callable, Set

from waldiez.exporting.chats.utils.nested import get_nested_chat_queue
from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentTarget,
    WaldiezChat,
    WaldiezGroupOrNestedTarget,
    WaldiezRandomAgentTarget,
    WaldiezTransitionTarget,
)


@dataclass
class TargetResult:
    """Result from processing a transition target."""

    target_string: str = ""
    after_agent: str = ""
    extra_imports: Set[str] = field(default_factory=set)  # pyright: ignore


class TransitionTargetProcessor:
    """Processor for transition targets."""

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_names: dict[str, str],
        chat_names: dict[str, str],
        all_chats: list[WaldiezChat],
        serializer: Callable[..., str],
    ) -> None:
        """Initialize the processor with agent names and context.

        Parameters
        ----------
        agent_names : dict[str, str]
            Mapping of agent IDs to their names.
        """
        self.agent_names = agent_names
        self.chat_names = chat_names
        self.agent = agent
        self.agent_name = agent_names[agent.id]
        self.all_chats = all_chats
        self.serializer = serializer

    def process(self, target: WaldiezTransitionTarget) -> TargetResult:
        """Process transition target based on its type.

        Parameters
        ----------
        target : WaldiezTransitionTarget
            The transition target to process.

        Returns
        -------
        TargetResult
            The processed result containing the target string,
            after_agent code, and extra imports.

        Raises
        ------
        ValueError
            If the target type is unknown.
        """
        result = TargetResult()
        where = "autogen.agentchat.group"
        if target.target_type == "GroupManagerTarget":
            where += ".targets.group_manager_target"
        result.extra_imports.add(f"from {where} import {target.target_type}")

        processors: dict[str, Callable[[WaldiezTransitionTarget], str]] = {
            "AgentTarget": self._process_agent_target,
            "RandomAgentTarget": self._process_random_agent_target,
            "GroupChatTarget": self._process_group_chat_target,
            "NestedChatTarget": self._process_nested_chat_target,
            "AskUserTarget": self._process_simple_target,
            "GroupManagerTarget": self._process_simple_target,
            "RevertToUserTarget": self._process_simple_target,
            "StayTarget": self._process_simple_target,
            "TerminateTarget": self._process_simple_target,
        }

        processor = processors.get(target.target_type)
        if not processor:
            raise ValueError(f"Unknown target type: {target.target_type}")

        result.target_string = processor(target)

        # Special handling for nested chat targets
        if target.target_type == "NestedChatTarget":
            nested_result = self._process_nested_chat_target_full(target)
            result.after_agent = nested_result.after_agent

        return result

    def _process_agent_target(self, target: WaldiezTransitionTarget) -> str:
        """Process agent target."""
        if not isinstance(target, WaldiezAgentTarget):
            raise ValueError(
                "Expected WaldiezAgentTarget for agent target processing."
            )
        agent_name = self.agent_names[target.value[0]]
        return f"AgentTarget({agent_name})"

    def _process_random_agent_target(
        self, target: WaldiezTransitionTarget
    ) -> str:
        """Process random agent target."""
        if not isinstance(target, WaldiezRandomAgentTarget):
            raise ValueError(
                "Expected WaldiezRandomAgentTarget"
                " for random agent target processing."
            )
        agent_vars = [self.agent_names[agent_id] for agent_id in target.value]
        agents_str = ", ".join(agent_vars)
        return f"RandomAgentTarget([{agents_str}])"

    def _process_group_chat_target(
        self, target: WaldiezTransitionTarget
    ) -> str:
        """Process group chat target."""
        if not isinstance(target, WaldiezGroupOrNestedTarget):
            raise ValueError(
                "Expected WaldiezGroupOrNestedTarget for group chat target "
                "processing."
            )
        chat_name = self.chat_names[target.value[0]]
        return f"GroupChatTarget({chat_name})"

    def _process_nested_chat_target(self, _: WaldiezTransitionTarget) -> str:
        """Process nested chat target (simple string only)."""
        chat_name = f"{self.agent_name}_handoff_nested_chat_queue"
        target_arg = f'nested_chat_config={{"chat_queue": {chat_name}}}'
        return f"NestedChatTarget({target_arg})"

    def _process_nested_chat_target_full(
        self, _: WaldiezTransitionTarget
    ) -> TargetResult:
        """Process nested chat target with full configuration."""
        result = TargetResult()

        chat_queue, extra_methods = get_nested_chat_queue(
            nested_chat=self.agent.data.nested_chats[0],
            agent=self.agent,
            agent_names=self.agent_names,
            chat_names=self.chat_names,
            all_chats=self.all_chats,
            serializer=self.serializer,
        )

        chat_name = f"{self.agent_name}_handoff_nested_chat_queue"

        if extra_methods:
            result.after_agent += "\n".join(extra_methods) + "\n"

        result.after_agent += (
            f"{chat_name}: list[dict[str, Any]] = {chat_queue}\n\n"
        )
        return result

    # pylint: disable=no-self-use
    def _process_simple_target(self, target: WaldiezTransitionTarget) -> str:
        """Process simple targets that don't need parameters.

        Parameters
        ----------
        target : WaldiezTransitionTarget
            The target to process.
        """
        return f"{target.target_type}()"
