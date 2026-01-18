# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Tool related utilities and processors."""

from dataclasses import dataclass, field
from pathlib import Path

from waldiez.models import WaldiezTool

from ..core.constants import FILE_HEADER
from ..core.errors import ExporterContentError
from ..core.types import EnvironmentVariable


@dataclass
class ToolProcessingResult:
    """Result from processing tools."""

    content: str = ""
    builtin_imports: list[str] = field(default_factory=list)
    third_party_imports: list[str] = field(
        default_factory=list,
    )
    environment_variables: list[EnvironmentVariable] = field(
        default_factory=list,
    )


class ToolProcessor:
    """Processor for tool content generation."""

    def __init__(
        self,
        flow_name: str,
        tools: list[WaldiezTool],
        tool_names: dict[str, str],
        is_async: bool,
        output_dir: Path | None = None,
    ):
        """Initialize the tool processor.

        Parameters
        ----------
        flow_name : str
            The name of the flow.
        tools : list[WaldiezTool]
            The tools to process.
        tool_names : dict[str, str]
            Mapping of tool IDs to names.
        output_dir : Path | None, optional
            Output directory for generated files, by default None
        """
        self.flow_name = flow_name
        self.tools = tools
        self.tool_names = tool_names
        self.output_dir = output_dir
        self.is_async = is_async

    def process(self) -> ToolProcessingResult:
        """Process all tools and return consolidated result.

        Returns
        -------
        ToolProcessingResult
            The processed result containing tool content,
            imports, and environment variables.
        """
        result = ToolProcessingResult()

        # Separate shared and regular tools
        shared_tools = [tool for tool in self.tools if tool.is_shared]
        regular_tools = [tool for tool in self.tools if not tool.is_shared]

        # Process shared tools first
        # (they might need to be available to other tools)
        for tool in shared_tools:
            self._process_single_tool(tool, result)

        # Then regular tools
        for tool in regular_tools:
            self._process_single_tool(tool, result)

        # Clean up and finalize result
        self._finalize_result(result)

        return result

    def _process_single_tool(
        self, tool: WaldiezTool, result: ToolProcessingResult
    ) -> None:
        """Process a single tool and add to result.

        Parameters
        ----------
        tool : WaldiezTool
            The tool to process.
        result : ToolProcessingResult
            The result to add processed content to.
        """
        # Get tool content
        tool_content = tool.get_content(
            runtime_kwargs={
                "is_async": self.is_async,
                "name": self.tool_names[tool.id],
            }
        )
        if tool_content:  # pragma: no branch
            # Add interop conversion if needed
            if tool.is_interop:
                tool_content += self._get_interop_conversion(tool)

            result.content += tool_content + "\n\n"

        # Get imports
        builtin_imports, third_party_imports = tool.get_imports()
        if builtin_imports:
            result.builtin_imports.extend(builtin_imports)
        if third_party_imports:
            result.third_party_imports.extend(third_party_imports)

        # Handle secrets
        if tool.secrets:
            self._process_tool_secrets(tool, result)

    def _get_interop_conversion(self, tool: WaldiezTool) -> str:
        """Get interop conversion code for a tool.

        Parameters
        ----------
        tool : WaldiezTool
            The tool that needs interop conversion.

        Returns
        -------
        str
            The interop conversion code.
        """
        tool_name = self.tool_names[tool.id]
        return f"""
ag2_{tool_name}_interop = Interoperability()
ag2_{tool_name} = ag2_{tool_name}_interop.convert_tool(
    tool={tool_name},
    type="{tool.tool_type}"
)"""

    def _process_tool_secrets(
        self, tool: WaldiezTool, result: ToolProcessingResult
    ) -> None:
        """Process tool secrets and add to result.

        Parameters
        ----------
        tool : WaldiezTool
            The tool with secrets.
        result : ToolProcessingResult
            The result to add secrets to.
        """
        tool_name = self.tool_names[tool.id]

        # Add to environment variables
        for key, value in tool.secrets.items():
            result.environment_variables.append(
                EnvironmentVariable(
                    name=key,
                    value=value,
                    description=f"Secret for tool '{tool_name}'",
                )
            )

        # Write secrets file if output directory provided
        if self.output_dir:
            self._write_secrets_file(tool, tool_name)

    def _write_secrets_file(self, tool: WaldiezTool, tool_name: str) -> None:
        """Write tool secrets to a Python file.

        Parameters
        ----------
        tool : WaldiezTool
            The tool with secrets.
        tool_name : str
            The name of the tool.
        """
        if not self.output_dir or not tool.secrets:  # pragma: no cover
            return

        self.output_dir.mkdir(parents=True, exist_ok=True)
        secrets_file = (
            self.output_dir / f"{self.flow_name}_{tool_name}_secrets.py"
        )
        # pylint: disable=too-many-try-statements
        try:
            with secrets_file.open("w", encoding="utf-8", newline="\n") as f:
                f.write(f'''{FILE_HEADER}
# flake8: noqa: E501
# pylint: disable=line-too-long
"""Secrets for the tool: {tool_name}."""

''')
                f.write("import os\n\n")
                for key, value in tool.secrets.items():
                    # f.write(f'os.environ["{key}"] = "{value}"\n')
                    # check first if the key already exists in os.environ
                    to_write = (
                        f'os.environ["{key}"] = '
                        f'os.environ.get("{key}", "{value}")\n'
                    )
                    f.write(to_write)
        except Exception as exc:  # pragma: no cover
            raise ExporterContentError(
                f"Failed to write secrets file for tool '{tool_name}': {exc}"
            ) from exc

    def _finalize_result(self, result: ToolProcessingResult) -> None:
        """Finalize the processing result.

        Parameters
        ----------
        result : ToolProcessingResult
            The result to finalize.
        """
        # Clean up content - remove excessive newlines
        result.content = result.content.replace("\n\n\n", "\n\n").strip()

        # Sort and deduplicate imports
        result.builtin_imports = self._sort_imports(result.builtin_imports)
        result.third_party_imports = self._sort_imports(
            result.third_party_imports
        )

    # pylint: disable=no-self-use
    # noinspection PyMethodMayBeStatic
    def _sort_imports(self, imports: list[str]) -> list[str]:
        """Sort imports: 'import' statements first, then 'from' statements.

        Parameters
        ----------
        imports : list[str]
            The import statements to sort.

        Returns
        -------
        list[str]
            The sorted import statements.
        """
        if not imports:
            return []

        # Remove duplicates
        unique_imports = list(set(imports))

        # Separate import types
        import_statements = [
            imp for imp in unique_imports if imp.startswith("import ")
        ]
        from_statements = [
            imp for imp in unique_imports if imp.startswith("from ")
        ]

        # Sort each type
        return sorted(import_statements) + sorted(from_statements)
