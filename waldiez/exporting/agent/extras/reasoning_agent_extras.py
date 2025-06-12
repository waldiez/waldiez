# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods,no-self-use
"""Reasoning agent configuration processor."""

from typing import Optional

from waldiez.models import WaldiezAgent, WaldiezReasoningAgent

from ...core import (
    CodeExecutionConfig,
    DefaultSerializer,
    InstanceArgument,
    Serializer,
    SystemMessageConfig,
    TerminationConfig,
)
from ...core.extras.agent_extras import ReasoningExtras


class ReasoningAgentProcessor:
    """Processor for reasoning agent configuration."""

    def __init__(self, agent: WaldiezAgent, serializer: Serializer | None):
        """Initialize the processor with the agent and serializer.

        Parameters
        ----------
        agent : WaldiezAgent
            The Waldiez agent to process.
        serializer : Serializer | None
            Optional serializer for the reasoning configuration.
            Defaults to DefaultSerializer if not provided.
        """
        self.agent = agent
        self.serializer = serializer or DefaultSerializer()

    def process(
        self,
        code_execution_config: Optional[CodeExecutionConfig] = None,
        termination_config: Optional[TerminationConfig] = None,
        system_message_config: Optional[SystemMessageConfig] = None,
    ) -> ReasoningExtras:
        """Process reasoning agent configuration.

        Parameters
        ----------
        code_execution_config : CodeExecutionConfig, optional
            Configuration for code execution, if applicable.
        termination_config : TerminationConfig, optional
            Configuration for termination, if applicable.
        system_message_config : SystemMessageConfig, optional
            Configuration for system messages, if applicable.

        Returns
        -------
        ReasoningExtras
            The processed result containing extra arguments, before content,
            imports, and environment variables.
        """
        result = ReasoningExtras(
            instance_id=self.agent.id,
            code_execution_config=code_execution_config,
            termination_config=termination_config,
            system_message_config=system_message_config,
        )
        if not self.agent.is_reasoning or not isinstance(
            self.agent, WaldiezReasoningAgent
        ):  # pragma: no cover
            return result

        reasoning_config = self.agent.get_reasoning_config()
        serialized = self.serializer.serialize(reasoning_config)
        reason_arg = InstanceArgument(
            instance_id=self.agent.id,
            name="reason_config",
            value=serialized,
            tabs=1,
        )
        result.add_arg(reason_arg)
        verbose_arg = InstanceArgument(
            instance_id=self.agent.id,
            name="verbose",
            value=self.agent.data.verbose,
            tabs=1,
        )
        result.add_arg(verbose_arg)
        return result
