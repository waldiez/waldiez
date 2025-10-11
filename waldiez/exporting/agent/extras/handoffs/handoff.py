# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Handoff processor for Waldiez agents."""

from dataclasses import dataclass, field
from typing import Callable

from waldiez.models import (
    WaldiezAgent,
    WaldiezChat,
    WaldiezHandoff,
    WaldiezTransitionTarget,
)

from .available import (
    TransitionAvailableProcessor,
    TransitionAvailableResult,
)
from .condition import ConditionProcessor, ConditionResult
from .target import TargetResult, TransitionTargetProcessor


@dataclass
class HandoffResult:
    """Result from processing handoffs.

    Attributes
    ----------
        Content to be placed before the agent definition.
    after_agent : str
        Content to be placed after the agent definition.
    extra_imports : set[str]
        Additional imports required for the handoff.
    """

    after_agent: str = ""
    extra_imports: set[str] = field(default_factory=set)


class HandoffProcessor:
    """Processor for agent handoffs."""

    result: HandoffResult
    IMPORT_PREFIX = "from autogen.agentchat.group import "

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_names: dict[str, str],
        chat_names: dict[str, str],
        all_chats: list[WaldiezChat],
        serializer: Callable[..., str],
    ) -> None:
        self.agent = agent
        self.agent_names = agent_names
        self.agent_name = agent_names[agent.id]
        self.chat_names = chat_names
        self.all_chats = all_chats
        self.serializer = serializer
        self.result = HandoffResult()

    def process(self) -> HandoffResult:
        """Process all handoff configurations.

        Returns
        -------
        HandoffResult
            The processed handoff result containing after_agent code,
            and extra imports.
        """
        for handoff in self.agent.handoffs:
            if handoff.is_empty():
                continue
            target = TransitionTargetProcessor(
                agent=self.agent,
                agent_names=self.agent_names,
                chat_names=self.chat_names,
                all_chats=self.all_chats,
                serializer=self.serializer,
            ).process(target=handoff.target)
            self.result.extra_imports.update(target.extra_imports)
            if target.before_content:
                self.result.after_agent += f"{target.before_content}\n"
            condition = ConditionProcessor(
                agent=self.agent,
                agent_names=self.agent_names,
                chat_names=self.chat_names,
                all_chats=self.all_chats,
                serializer=self.serializer,
            ).process(condition=handoff.condition)
            self.result.extra_imports.update(condition.extra_imports)
            available = TransitionAvailableProcessor(
                serializer=self.serializer,
            ).process(
                available=handoff.available,
            )
            registration = self._create_handoff_registration(
                handoff=handoff,
                target=target,
                condition=condition,
                available=available,
            )
            self.result.extra_imports.update(available.extra_imports)
            if registration:
                self.result.after_agent += f"{registration}\n"

        if self.agent.data.after_work:
            after_work_result = self._process_after_work(
                self.agent.data.after_work
            )
            if after_work_result.before_content:
                self.result.after_agent += (
                    f"{after_work_result.before_content}\n"
                )
            self.result.after_agent += after_work_result.content
            self.result.extra_imports.update(after_work_result.extra_imports)
        return self.result

    def _create_handoff_registration(
        self,
        handoff: WaldiezHandoff,
        target: TargetResult,
        condition: ConditionResult,
        available: TransitionAvailableResult,
    ) -> str:
        """Create the handoff registration string."""
        if handoff.is_empty():
            return ""
        reg_string = ""
        if handoff.is_llm_based():
            reg_string += f"{self.agent_name}.handoffs.add_llm_condition(\n"
            reg_string += "    condition=OnCondition(\n"
            self.result.extra_imports.add(f"{self.IMPORT_PREFIX}OnCondition")
        else:
            reg_string += f"{self.agent_name}.handoffs.add_context_condition(\n"
            reg_string += "    condition=OnContextCondition(\n"
            self.result.extra_imports.add(
                f"{self.IMPORT_PREFIX}OnContextCondition"
            )
        reg_string += f"        target={target.content},\n"
        reg_string += f"        condition={condition.content},\n"
        if available.content:
            reg_string += f"        available={available.content},\n"
        reg_string += "    )\n"
        reg_string += ")"
        return reg_string

    # noinspection PyTypeHints
    def _process_after_work(
        self, after_work: WaldiezTransitionTarget
    ) -> TargetResult:
        target_processor = TransitionTargetProcessor(
            agent=self.agent,
            agent_names=self.agent_names,
            chat_names=self.chat_names,
            all_chats=self.all_chats,
            serializer=self.serializer,
        )
        target_result = target_processor.process(after_work)
        if not target_result.content:
            return TargetResult()
        registration = (
            f"{self.agent_name}.handoffs.set_after_work(\n"
            f"    target={target_result.content}\n"
            ")"
        )
        return TargetResult(
            content=registration,
            before_content=target_result.before_content,
            extra_imports=target_result.extra_imports,
        )
