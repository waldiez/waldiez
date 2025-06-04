# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Handoff condition processing for Waldiez agents."""

from dataclasses import dataclass, field
from typing import Callable

from waldiez.models import (
    WaldiezAgent,
    WaldiezChat,
    WaldiezContextStrLLMCondition,
    WaldiezExpressionContextCondition,
    WaldiezHandoffCondition,
    WaldiezStringContextCondition,
    WaldiezStringLLMCondition,
)


@dataclass
class ConditionResult:
    """Result from processing handoff conditions.

    Attributes
    ----------
    content : str
        Content to be used for the handoff condition.
    extra_imports : set[str]
        Additional imports required for the handoff.
    """

    content: str = ""
    extra_imports: set[str] = field(default_factory=set[str])


class ConditionProcessor:
    """Processor for handoff conditions."""

    IMPORT_PREFIX = "from autogen.agentchat.group import "

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_names: dict[str, str],
        chat_names: dict[str, str],
        all_chats: list[WaldiezChat],
        serializer: Callable[..., str],
    ) -> None:
        """Initialize the processor with agent context."""
        self.agent = agent
        self.agent_names = agent_names
        self.agent_name = agent_names[agent.id]
        self.chat_names = chat_names
        self.all_chats = all_chats
        self.serializer = serializer
        self.result = ConditionResult()

    def process(self, condition: WaldiezHandoffCondition) -> ConditionResult:
        """Process handoff conditions.

        Parameters
        ----------
        condition : WaldiezHandoffCondition
            The handoff condition to process.

        Returns
        -------
        ConditionResult
            The processed result containing the relevant code and extra imports.

        Raises
        ------
        ValueError
            If the condition type is unsupported.
        """
        if isinstance(condition, WaldiezStringLLMCondition):
            self._process_string_llm_condition(condition)
        elif isinstance(condition, WaldiezContextStrLLMCondition):
            self._process_context_str_llm_condition(condition)
        elif isinstance(condition, WaldiezStringContextCondition):
            self._process_string_context_condition(condition)
        elif isinstance(
            condition,
            WaldiezExpressionContextCondition,
        ):  # pyright: ignore
            self._process_expression_context_condition(condition)
        else:
            raise ValueError(f"Unsupported condition type: {type(condition)}")
        return self.result

    def _process_string_llm_condition(
        self,
        condition: WaldiezStringLLMCondition,
    ) -> None:
        """Process a string LLM condition handoff."""
        prompt = self.serializer(condition.prompt)

        if hasattr(condition, "data") and condition.data:
            data_str = self.serializer(condition.data)
            condition_string = (
                f"StringLLMCondition(prompt={prompt}, data={data_str})"
            )
        else:
            condition_string = f"StringLLMCondition(prompt={prompt})"
        self.result.content += condition_string
        extra_import = f"{self.IMPORT_PREFIX}StringLLMCondition"
        self.result.extra_imports.add(extra_import)

    def _process_context_str_llm_condition(
        self,
        condition: WaldiezContextStrLLMCondition,
    ) -> None:
        """Process a context string LLM condition handoff."""
        context_str = self.serializer(
            condition.context_str,
        )

        if hasattr(condition, "data") and condition.data:
            data_str = self.serializer(condition.data)
            condition_string = (
                f"ContextStrLLMCondition(context_str={context_str}, "
                f"data={data_str})"
            )
        else:
            condition_string = (
                f"ContextStrLLMCondition(context_str={context_str})"
            )
        self.result.content += condition_string
        extra_import = f"{self.IMPORT_PREFIX}ContextStrLLMCondition"
        self.result.extra_imports.add(extra_import)

    def _process_string_context_condition(
        self,
        condition: WaldiezStringContextCondition,
    ) -> None:
        """Process a string context condition handoff."""
        variable_name = self.serializer(
            condition.variable_name,
        )
        condition_string = (
            f"StringContextCondition(variable_name={variable_name})"
        )
        self.result.content += condition_string
        extra_import = f"{self.IMPORT_PREFIX}StringContextCondition"
        self.result.extra_imports.add(extra_import)

    def _process_expression_context_condition(
        self,
        condition: WaldiezExpressionContextCondition,
    ) -> None:
        """Process an expression context condition handoff."""
        expression = self.serializer(condition.expression)
        condition_string = (
            f"ExpressionContextCondition(expression={expression})"
        )
        self.result.content += condition_string
        extra_import = f"{self.IMPORT_PREFIX}ExpressionContextCondition"
        self.result.extra_imports.add(extra_import)
