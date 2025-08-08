# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Tools exporter."""

from pathlib import Path
from typing import Any, Optional

from waldiez.models import WaldiezAgent, WaldiezTool

from ..core import (
    ContentOrder,
    Exporter,
    ExporterContext,
    ExportPosition,
    ImportPosition,
    ImportStatement,
    ToolExtras,
    get_comment,
)
from .processor import ToolProcessor
from .registration import ToolRegistrationProcessor


class ToolsExporter(Exporter[ToolExtras]):
    """Tools exporter with structured extras."""

    def __init__(
        self,
        flow_name: str,
        agents: list[WaldiezAgent],
        agent_names: dict[str, str],
        tools: list[WaldiezTool],
        tool_names: dict[str, str],
        is_async: bool,
        output_dir: str | Path | None = None,
        context: ExporterContext | None = None,
        **kwargs: Any,
    ):
        """Initialize the tools exporter.

        Parameters
        ----------
        flow_name : str
            The name of the flow.
        agents : list[WaldiezAgent]
            The agents that use tools.
        agent_names : dict[str, str]
            Mapping of agent IDs to names.
        tools : list[WaldiezTool]
            The tools to export.
        tool_names : dict[str, str]
            Mapping of tool IDs to names.
        is_async : bool
            Whether the flow is asynchronous.
        output_dir : str | Path | None
            Output directory for generated files, by default None
        context : ExporterContext | None
            Exporter context with dependencies, by default None
        **kwargs
            Additional keyword arguments.
        """
        super().__init__(context, **kwargs)

        self.flow_name = flow_name
        self.agents = agents
        self.agent_names = agent_names
        self.tools = tools
        self.tool_names = tool_names
        self.is_async = is_async
        self.output_dir = Path(output_dir) if output_dir else None

        # Initialize extras with processed tool content
        self._extras = self._create_tool_extras()

    @property
    def extras(self) -> ToolExtras:
        """Get the tool extras."""
        return self._extras

    def _create_tool_extras(self) -> ToolExtras:
        """Create and populate tool extras."""
        extras = ToolExtras("tools")

        # Process tools to generate content
        tool_processor = ToolProcessor(
            flow_name=self.flow_name,
            tools=self.tools,
            tool_names=self.tool_names,
            is_async=self.is_async,
            output_dir=self.output_dir,
        )

        tool_result = tool_processor.process()

        # Add tool content
        if tool_result.content:
            extras.add_function_content(tool_result.content)

        # Add imports
        for import_stmt in tool_result.builtin_imports:
            extras.add_import(
                ImportStatement(import_stmt, ImportPosition.BUILTINS)
            )
            # Override import position for builtins
            self.add_import(import_stmt, ImportPosition.BUILTINS)

        for import_stmt in tool_result.third_party_imports:
            extras.add_import(
                ImportStatement(import_stmt, ImportPosition.THIRD_PARTY)
            )

        # Add environment variables
        for environment_variable in tool_result.environment_variables:
            self.add_env_var(
                name=environment_variable.name,
                value=environment_variable.value,
                description=environment_variable.description,
                required=environment_variable.required,
            )

        # Process tool registrations

        registration_processor = ToolRegistrationProcessor(
            agents=self.agents,
            agent_names=self.agent_names,
            tools=self.tools,
            tool_names=self.tool_names,
        )

        registration_content = registration_processor.process()
        if registration_content:
            extras.add_registration_content(registration_content)

        if self.output_dir is not None:
            # add the tool secrets loader script
            for tool in self.tools:
                if tool.secrets:
                    tool_name = self.tool_names.get(tool.id, tool.id)
                    tool_secrets_loader_script = (
                        self.get_tool_secrets_loader_script(tool_name=tool_name)
                    )
                    self.add_content(
                        tool_secrets_loader_script,
                        ExportPosition.TOOLS,
                        order=ContentOrder.EARLY_SETUP,
                        skip_strip=True,
                    )
        return extras

    def generate_main_content(self) -> Optional[str]:
        """Generate the main tools content."""
        # handled as positioned content
        return None

    def _add_default_imports(self) -> None:
        """Add default imports for tools."""
        # Tools might need register_function import
        if any(agent.data.tools for agent in self.agents):  # pragma: no branch
            self.add_import("from autogen import register_function")

        # Add interop import if needed
        if any(tool.is_interop for tool in self.tools):
            self.add_import("from autogen.interop import Interoperability")

    def get_tool_secrets_loader_script(self, tool_name: str) -> str:
        """Get the tool secrets loader script.

        Parameters
        ----------
        tool_name : str
            The name of the tool for which to generate the loader script.

        Returns
        -------
        str
            The tool secrets loader script.
        """
        comment = get_comment(
            "Load tool secrets module if needed",
            for_notebook=self.config.for_notebook,
        )
        loader_script = f'''{comment}# NOTE:
# This section assumes that a file named:
# "{self.flow_name}_{tool_name}_secrets.py"
# exists in the same directory as this file.
# This file contains the secrets for the tool used in this flow.
# It should be .gitignored and not shared publicly.
# If this file is not present, you can either create it manually
# or change the way secrets are loaded in the flow.


def load_tool_secrets_module(flow_name: str, tool_name: str) -> ModuleType:
    """Load the tool secrets module for the given flow name and tool name.

    Parameters
    ----------
    flow_name : str
        The flow name.

    Returns
    -------
    ModuleType
        The loaded module.
    """
    module_name = f"{{flow_name}}_{{tool_name}}_secrets"
    if module_name in sys.modules:
        return importlib.reload(sys.modules[module_name])
    return importlib.import_module(module_name)

load_tool_secrets_module("{self.flow_name}", "{tool_name}")
'''
        return loader_script
