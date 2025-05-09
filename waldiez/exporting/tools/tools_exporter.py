# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Tool related string generation functions.

Functions
---------
get_agent_tool_registration
    Get an agent's tool registration string.
export_tools
    Get the tools content and secrets.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

from waldiez.models import WaldiezAgent, WaldiezTool

from ..base import (
    AgentPosition,
    AgentPositions,
    BaseExporter,
    ExporterMixin,
    ExporterReturnType,
    ExportPosition,
    ImportPosition,
)
from .utils import export_tools, get_agent_tool_registrations


class ToolsExporter(BaseExporter, ExporterMixin):
    """Tool exporter."""

    def __init__(
        self,
        flow_name: str,
        agents: List[WaldiezAgent],
        agent_names: Dict[str, str],
        tools: List[WaldiezTool],
        tool_names: Dict[str, str],
        output_dir: Optional[Union[str, Path]] = None,
    ) -> None:
        """Initialize the tool exporter.

        Parameters
        ----------
        flow_name : str
            The name of the flow.
        agents : List[WaldiezAgent]
            The agents.
        agent_names : Dict[str, str]
            The agent names.
        tools : List[WaldiezTool]
            The tools.
        tool_names : Dict[str, str]
            The tool names.
        output_dir : Optional[Union[str, Path]], optional
            The output directory if any, by default None
        """
        self.flow_name = flow_name
        self.agents = agents
        self.agent_names = agent_names
        self.tools = tools
        self.tool_names = tool_names
        self.output_dir = output_dir
        self.tool_imports, self.tool_secrets, self.tools_contents = (
            export_tools(
                flow_name=flow_name,
                tools=tools,
                tool_names=tool_names,
                output_dir=output_dir,
            )
        )

    def get_environment_variables(self) -> List[Tuple[str, str]]:
        """Get the environment variables to set.

        Returns
        -------
        List[Tuple[str, str]]
            The environment variables to set.
        """
        return self.tool_secrets

    def get_imports(self) -> List[Tuple[str, ImportPosition]]:
        """Generate the imports string.

        Returns
        -------
        Tuple[str, int]
            The exported imports and the position of the imports.
        """
        imports: List[Tuple[str, ImportPosition]] = []
        if not self.tool_imports:
            return imports
        # standard imports
        for import_statement in self.tool_imports[0]:
            imports.append((import_statement, ImportPosition.BUILTINS))
        # third party imports
        for import_statement in self.tool_imports[1]:
            imports.append((import_statement, ImportPosition.THIRD_PARTY))
        # secrets/local imports
        for import_statement in self.tool_imports[2]:
            imports.append((import_statement, ImportPosition.LOCAL))
        return imports

    def get_before_export(
        self,
    ) -> Optional[List[Tuple[str, Union[ExportPosition, AgentPosition]]]]:
        """Generate the content before the main export.

        Returns
        -------
        Optional[List[Tuple[str, Union[ExportPosition, AgentPosition]]]]
            The exported content before the main export and its position.
        """

    def generate(self) -> Optional[str]:
        """Generate the main export.

        Returns
        -------
        Optional[str]
            The exported content.
        """
        return self.tools_contents

    def get_after_export(
        self,
    ) -> Optional[List[Tuple[str, Union[ExportPosition, AgentPosition]]]]:
        """Generate the content after the main export.

        Returns
        -------
        Optional[List[Tuple[str, Union[ExportPosition, AgentPosition]]]]
            The exported content after the main export and its position.
        """
        agent_registrations: List[
            Tuple[str, Union[ExportPosition, AgentPosition]]
        ] = []
        for agent in self.agents:
            agent_registration = get_agent_tool_registrations(
                agent=agent,
                agent_names=self.agent_names,
                all_tools=self.tools,
                tool_names=self.tool_names,
                string_escape=self.string_escape,
            )
            if agent_registration:
                # after all agents since we use the executor
                # (it might not yet be defined)
                position = AgentPosition(None, AgentPositions.AFTER_ALL, 1)
                agent_registrations.append((agent_registration, position))
        return agent_registrations

    def export(self) -> ExporterReturnType:
        """Export the tools.

        Returns
        -------
        ExporterReturnType
            The exported tools content, the imports,
            the before export strings, the after export strings,
            and the environment variables.
        """
        content = self.generate()
        imports = self.get_imports()
        after_export = self.get_after_export()
        environment_variables = self.get_environment_variables()
        result: ExporterReturnType = {
            "content": content,
            "imports": imports,
            "before_export": None,
            "after_export": after_export,
            "environment_variables": environment_variables,
        }
        return result
