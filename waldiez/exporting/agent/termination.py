# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Termination message configuration for Waldiez agents."""

from waldiez.models import WaldiezAgent

from ..core import TerminationConfig


class TerminationProcessor:
    """Processor for termination message configuration."""

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_name: str,
    ):
        self.agent = agent
        self.agent_name = agent_name

    def process(self) -> TerminationConfig:
        """Process termination configuration.

        Returns
        -------
        TerminationConfig
            The processed termination configuration.
        """
        if self.agent.data.termination.type == "none":
            return TerminationConfig(
                termination_arg="None",
                before_content="",
            )
        if self.agent.data.termination.type == "keyword":
            return TerminationConfig(
                termination_arg=self.agent.data.termination.string,
                before_content="",
            )
        if self.agent.data.termination.type == "method":
            content, function_name = (
                self.agent.data.termination.get_termination_function(
                    name_suffix=self.agent_name
                )
            )
            return TerminationConfig(
                termination_arg=function_name,
                before_content="\n\n" + content + "\n",
            )
        # noinspection PyUnreachableCode
        return TerminationConfig()
