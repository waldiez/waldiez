# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Tool registration processor."""

import json

from waldiez.models import WaldiezAgent, WaldiezTool


class ToolRegistrationProcessor:
    """Processor for tool registration code."""

    def __init__(
        self,
        agents: list[WaldiezAgent],
        agent_names: dict[str, str],
        tools: list[WaldiezTool],
        tool_names: dict[str, str],
    ):
        """Initialize the tool registration processor.

        Parameters
        ----------
        agents : list[WaldiezAgent]
            The agents that use tools.
        agent_names : dict[str, str]
            Mapping of agent IDs to names.
        tools : list[WaldiezTool]
            The available tools.
        tool_names : dict[str, str]
            Mapping of tool IDs to names.
        """
        self.agents = agents
        self.agent_names = agent_names
        self.tools = tools
        self.tool_names = tool_names

    def process(self) -> str:
        """Process tool registrations for all agents.

        Returns
        -------
        str
            The generated tool registration code for all agents.
        """
        registrations: list[str] = []

        for agent in self.agents:
            agent_registration = self._process_agent_registrations(agent)
            if agent_registration:
                registrations.append(agent_registration)

        return "\n\n".join(registrations) if registrations else ""

    def _process_agent_registrations(self, agent: WaldiezAgent) -> str:
        """Process tool registrations for a single agent.

        Parameters
        ----------
        agent : WaldiezAgent
            The agent to process tool registrations for.

        Returns
        -------
        str
            The tool registration code for this agent.
        """
        if not agent.data.tools or agent.is_group_member:
            # if group member, it's a handoff
            return ""

        registrations: list[str] = []
        agent_name = self.agent_names[agent.id]

        for tool_link in agent.data.tools:
            # Find the actual tool
            tool = next((t for t in self.tools if t.id == tool_link.id), None)
            if not tool:  # pragma: no cover
                continue

            tool_name = self.tool_names[tool_link.id]

            # Use converted name for interop tools
            if tool.is_interop:
                tool_name = f"ag2_{tool_name}"

            executor_name = self.agent_names[tool_link.executor_id]
            description = tool.description or f"Description of {tool_name}"

            registration = self._create_registration(
                caller_name=agent_name,
                executor_name=executor_name,
                tool_name=tool_name,
                description=description,
            )
            registrations.append(registration)

        return "\n".join(registrations) if registrations else ""

    # pylint: disable=no-self-use
    # noinspection PyMethodMayBeStatic
    def _create_registration(
        self,
        caller_name: str,
        executor_name: str,
        tool_name: str,
        description: str,
    ) -> str:
        """Create a single tool registration statement.

        Parameters
        ----------
        caller_name : str
            The name of the agent calling the tool.
        executor_name : str
            The name of the agent executing the tool.
        tool_name : str
            The name of the tool.
        description : str
            The description of the tool.

        Returns
        -------
        str
            The tool registration code.
        """
        return f"""register_function(
    {tool_name},
    caller={caller_name},
    executor={executor_name},
    name="{tool_name}",
    description={json.dumps(description)},
)"""
