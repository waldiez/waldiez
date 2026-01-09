# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Transition availability processor for Waldiez agents."""

from dataclasses import dataclass, field
from typing import Callable

from waldiez.models import WaldiezTransitionAvailability


@dataclass
class TransitionAvailableResult:
    """Result from processing transition availability."""

    content: str = ""
    extra_imports: set[str] = field(default_factory=set)


class TransitionAvailableProcessor:
    """Processor for transition availability."""

    def __init__(
        self,
        serializer: Callable[..., str],
    ) -> None:
        """Initialize the processor."""
        self.serializer = serializer

    def process(
        self,
        available: WaldiezTransitionAvailability,
    ) -> TransitionAvailableResult:
        """Process the transition availability.

        Parameters
        ----------
        available : WaldiezTransitionAvailability
            The transition availability to process.

        Returns
        -------
        TransitionAvailableResult
            The result of processing the transition availability.

        Raises
        ------
        ValueError
            If the transition type is unsupported.
        """
        result = TransitionAvailableResult()
        if available.type == "none":
            return result
        import_prefix = "from autogen.agentchat.group import "
        if available.type == "string":
            content = self.serializer(available.value)
            result.content = f"StringAvailableCondition({content})"
            result.extra_imports.add(f"{import_prefix}StringAvailableCondition")
            return result
        if available.type == "expression":
            content = self.serializer(available.value)
            result.content = (
                "ExpressionAvailableCondition(\n"
                f"            expression=ContextExpression({content})\n"
                "        )"
            )
            result.extra_imports.add(
                f"{import_prefix}ExpressionAvailableCondition"
            )
            result.extra_imports.add(f"{import_prefix}ContextExpression")
            return result
        # noinspection PyUnreachableCode
        raise ValueError(
            f"Unsupported transition availability type: {available.type}"
        )
