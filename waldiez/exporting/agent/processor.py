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
        AgentProcessingResult
            The result containing the agent definition string.
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
        if not extra_args.startswith("\n"):
            extra_args = "\n" + extra_args
        if not extra_args.endswith("\n"):
            extra_args += "\n"
        # Build the agent definition
        agent_str = self.get_agent_string(
            agent_name=agent_name, ag2_class=ag2_class, extra_args=extra_args
        )

        return AgentProcessingResult(content=agent_str)

    def get_agent_string(
        self, agent_name: str, ag2_class: str, extra_args: str
    ) -> str:
        """Get the agent definition string.

        Parameters
        ----------
        agent_name : str
            The name of the agent.
        ag2_class : str
            The class of the agent.
        extra_args : str
            Additional arguments for the agent.

        Returns
        -------
        str
            The agent definition string.
        """
        agent_str: str = f"{agent_name} = {ag2_class}(\n"
        if "name" not in self.agent.args_to_skip:
            agent_str += self.get_name_arg()
        if "description" not in self.agent.args_to_skip:
            agent_str += self.get_description_arg()
        if "system_message" not in self.agent.args_to_skip:
            agent_str += self.get_system_message_arg()
        if "human_input_mode" not in self.agent.args_to_skip:
            agent_str += self.get_human_input_mode_arg()
        if "max_consecutive_auto_reply" not in self.agent.args_to_skip:
            agent_str += self.get_max_consecutive_auto_reply_arg()
        if "default_auto_reply" not in self.agent.args_to_skip:
            agent_str += self.get_auto_reply_arg()
        if "code_execution_config" not in self.agent.args_to_skip:
            agent_str += self.get_code_execution_arg()
        if "is_termination_msg" not in self.agent.args_to_skip:
            agent_str += self.get_termination_arg()
        if extra_args:  # pragma: no branch
            agent_str = self.add_extra_args(agent_str, extra_args)
        agent_str += ")"
        return agent_str

    def get_name_arg(self) -> str:
        """Get the agent name argument.

        Returns
        -------
        str
            The agent name argument.
        """
        return f'    name="{self.agent_names[self.agent.id]}",\n'

    def get_system_message_arg(self) -> str:
        """Get the system message argument.

        Returns
        -------
        str
            The system message argument.
        """
        arg = str(self.extras.get_system_message_arg())
        if arg:
            return f"{arg},\n"
        return ""

    def get_code_execution_arg(self) -> str:
        """Get the code execution argument.

        Returns
        -------
        str
            The code execution argument.
        """
        arg = str(self.extras.get_code_execution_arg())
        if arg:
            return f"{arg},\n"
        return ""

    def get_termination_arg(self) -> str:
        """Get the termination argument.

        Returns
        -------
        str
            The termination argument.
        """
        arg = str(self.extras.get_termination_arg())
        if arg:
            return f"{arg}\n"
        return ""

    def get_human_input_mode_arg(self) -> str:
        """Get the human input mode argument.

        Returns
        -------
        str
            The human input mode argument.
        """
        return f'    human_input_mode="{self.agent.data.human_input_mode}",\n'

    def get_max_consecutive_auto_reply_arg(self) -> str:
        """Get the maximum consecutive auto reply argument.

        Returns
        -------
        str
            The maximum consecutive auto reply argument.
        """
        value = self.agent.data.max_consecutive_auto_reply
        return f"    max_consecutive_auto_reply={value},\n"

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
        return f"    description={description},\n"

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
        return f"    default_auto_reply={default_auto_reply},\n"

    # noinspection PyMethodMayBeStatic
    def add_extra_args(self, agent_str: str, extra_args: str) -> str:
        """Add extra agent args.

        Parameters
        ----------
        agent_str : str
            The current agent string
        extra_args : str
            The extra args to add

        Returns
        -------
        str
            The new agent string
        """
        agent_string = str(agent_str)
        if agent_string.endswith("\n"):
            agent_string = agent_string[: -len("\n")]
        agent_string += extra_args
        return agent_string
