# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods, no-self-use
"""Processor for generating Waldiez agent definitions."""

import json
from dataclasses import dataclass
from typing import Callable

from waldiez.models import WaldiezAgent

from ..core.enums import GroupManagerStrategy
from ..core.extras.agent_extras import GroupManagerExtras, StandardExtras


@dataclass
class AgentProcessingResult:
    """Result from processing an agent."""

    content: str = ""


class AgentProcessor:
    """Processor for main agent definition generation."""

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_names: dict[str, str],
        arguments_resolver: Callable[[WaldiezAgent], list[str]],
        extras: StandardExtras,
    ):
        self.agent = agent
        self.agent_names = agent_names
        self.arguments_resolver = arguments_resolver
        self.extras = extras

    def _should_skip_group_manager(self) -> bool:
        """Check if the group manager should be skipped.

        Returns
        -------
        bool
            True if the group manager should be skipped, False otherwise.
        """
        return (
            isinstance(self.extras, GroupManagerExtras)
            and self.extras.strategy == GroupManagerStrategy.PATTERN
        )

    def process(self) -> AgentProcessingResult:
        """Process the agent and generate its definition.

        Returns
        -------
        str
            The generated agent definition string.
        """
        if (
            isinstance(self.extras, GroupManagerExtras)
            and self._should_skip_group_manager()
        ):
            return AgentProcessingResult(content="")
        agent_name = self.agent_names[self.agent.id]

        ag2_class = self.agent.ag2_class
        # Build extra arguments
        extra_args = ""
        for arg in self.extras.extra_args:
            extra_args += arg.get_content(append_new_line=True)

        # Get additional arguments from resolver
        resolved_args = self.arguments_resolver(self.agent)
        if resolved_args:  # pragma: no branch
            extra_args += ",\n".join(resolved_args)
        # Build the agent definition
        agent_str = f"""{agent_name} = {ag2_class}(
{self.get_name_arg()}
{self.get_description_arg()},{self.extras.get_system_message_arg()}
{self.get_human_input_mode_arg()},
{self.get_max_consecutive_auto_reply_arg()},
{self.get_auto_reply_arg()},
{self.extras.get_code_execution_arg()}
{self.extras.get_termination_arg()}
{extra_args}
)"""

        return AgentProcessingResult(content=agent_str)

    def get_name_arg(self) -> str:
        """Get the agent name argument.

        Returns
        -------
        str
            The agent name argument.
        """
        return f'    name="{self.agent_names[self.agent.id]}",'

    def get_human_input_mode_arg(self) -> str:
        """Get the human input mode argument.

        Returns
        -------
        str
            The human input mode argument.
        """
        return f'    human_input_mode="{self.agent.data.human_input_mode}"'

    def get_max_consecutive_auto_reply_arg(self) -> str:
        """Get the maximum consecutive auto reply argument.

        Returns
        -------
        str
            The maximum consecutive auto reply argument.
        """
        value = self.agent.data.max_consecutive_auto_reply
        return f"    max_consecutive_auto_reply={value}"

    def get_description_arg(self) -> str:
        """Get the agent description.

        Returns
        -------
        str
            The agent description.
        """
        description = (
            json.dumps(self.agent.description)
            if self.agent.description
            else '""'
        )
        return f"    description={description}"

    def get_auto_reply_arg(self) -> str:
        """Get the default auto reply argument.

        Returns
        -------
        str
            The default auto reply argument.
        """
        default_auto_reply = '""'
        if self.agent.data.agent_default_auto_reply:
            # Escape the default auto reply string
            default_auto_reply = json.dumps(
                self.agent.data.agent_default_auto_reply
            )
        return f"    default_auto_reply={default_auto_reply}"
