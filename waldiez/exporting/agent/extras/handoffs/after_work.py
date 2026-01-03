# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""After-work processor for Waldiez agents."""

# pylint: disable=too-few-public-methods
from dataclasses import dataclass, field
from typing import Callable

from waldiez.models import WaldiezAgent, WaldiezChat, WaldiezTransitionTarget

from .target import TransitionTargetProcessor


@dataclass
class AfterWorkResult:
    """Result from processing after-work configuration.

    Attributes
    ----------
    content : str
        The registration string for the after-work transition.
    before_content : str
        Any additional code that should be placed before the main content,
    extra_imports : set[str]
        Additional imports required for the after-work transition.
    """

    content: str = ""
    before_content: str = ""
    extra_imports: set[str] = field(default_factory=set)


class AfterWorkProcessor:
    """Processor for after-work configurations."""

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_names: dict[str, str],
        chat_names: dict[str, str],
        all_chats: list[WaldiezChat],
        serializer: Callable[..., str],
    ):
        """Initialize the processor."""
        self.agent = agent
        self.agent_names = agent_names
        self.agent_name = agent_names[agent.id]
        self.chat_names = chat_names
        self.all_chats = all_chats
        self.serializer = serializer

    # noinspection PyTypeHints
    def process(self, after_work: WaldiezTransitionTarget) -> AfterWorkResult:
        """Process after-work configuration.

        Parameters
        ----------
        after_work : WaldiezTransitionTarget
            The after-work transition target to process.

        Returns
        -------
        AfterWorkResult
            The processed result containing the registration string,
            before_content code, and extra imports.
        """
        target_processor = TransitionTargetProcessor(
            agent=self.agent,
            agent_names=self.agent_names,
            chat_names=self.chat_names,
            all_chats=self.all_chats,
            serializer=self.serializer,
        )
        target_result = target_processor.process(after_work)
        return AfterWorkResult(
            content=target_result.content,
            before_content=target_result.before_content,
            extra_imports=target_result.extra_imports,
        )
