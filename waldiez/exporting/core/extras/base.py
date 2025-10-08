# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Base extras system for all exporters."""

import abc
from dataclasses import dataclass, field
from typing import Sequence

from ..enums import AgentPosition, ContentOrder, ExportPosition, ImportPosition
from ..protocols import ExportContributor
from ..result import ExportResult
from ..types import ImportStatement, InstanceArgument


@dataclass
class BaseExtras(ExportContributor):
    """Base class for all exporter extras with export contribution."""

    instance_id: str
    extra_imports: list[ImportStatement] = field(  # pyright: ignore
        default_factory=list,
    )
    before_agent: str = ""
    after_agent: str = ""
    after_all_agents: str = ""
    extra_args: list[InstanceArgument] = field(  # pyright: ignore
        default_factory=list,
    )

    def get_extra_args_content(self) -> str:
        """Get the extra arguments content.

        Returns
        -------
        str
            The extra arguments content.
        """
        return "\n".join([arg.get_content() for arg in self.extra_args]) + "\n"

    def add_arg(self, arg: InstanceArgument | str, tabs: int = 0) -> None:
        """Add an extra argument.

        Parameters
        ----------
        arg : InstanceArgument | str
            The argument to add.
        tabs : int, optional
            The number of tabs to indent the argument, by default 0.
        """
        if isinstance(arg, InstanceArgument):
            if arg not in self.extra_args:
                self.extra_args.append(arg)
        elif isinstance(arg, str) and arg.strip():  # pyright: ignore
            # If it's a string, create an InstanceArgument
            # split by '=' (it's an argument line)
            parts = arg.split("=", 1)
            if len(parts) == 2:
                name, value = parts
                comment = ""
                if " #" in value:
                    value, _comment = value.split(" #", 1)
                    comment = _comment.strip()
                new_arg = InstanceArgument(
                    instance_id=self.instance_id,
                    name=name.strip(),
                    value=value.strip(),
                    tabs=tabs,
                    comment=comment.strip(),
                )
                if new_arg not in self.extra_args:
                    self.extra_args.append(new_arg)

    def add_import(self, import_statement: ImportStatement) -> None:
        """Add an import statement.

        Parameters
        ----------
        import_statement : ImportStatement
            The import statement to add.
        """
        if import_statement and import_statement.statement.strip():
            self.extra_imports.append(import_statement)

    def add_imports(self, imports: Sequence[ImportStatement]) -> None:
        """Add multiple import statements.

        Parameters
        ----------
        imports : Set[str]
            The import statements to add.
        """
        for imp in imports:
            self.add_import(imp)

    def prepend_before_agent(self, content: str) -> None:
        """Prepend content to the before_agent section.

        Parameters
        ----------
        content : str
            The content to prepend.
        """
        stripped = content.rstrip()
        if stripped and stripped not in self.before_agent:
            if self.before_agent:
                self.before_agent = stripped + "\n" + self.before_agent
            else:
                self.before_agent = stripped

    def append_before_agent(self, content: str) -> None:
        """Append content to the before_agent section.

        Parameters
        ----------
        content : str
            The content to append.
        """
        stripped = content.rstrip()
        if stripped and stripped not in self.before_agent:
            if self.before_agent:
                self.before_agent += "\n" + stripped
            else:
                self.before_agent = stripped

    def append_after_agent(self, content: str) -> None:
        """Append content to the after_agent section.

        Parameters
        ----------
        content : str
            The content to append.
        """
        stripped = content.rstrip()
        if stripped and stripped not in self.after_agent:
            if self.after_agent:
                self.after_agent += "\n" + stripped
            else:
                self.after_agent = stripped

    def append_after_all_agents(self, content: str) -> None:
        """Append content to the after_all_agents section.

        Parameters
        ----------
        content : str
            The content to append.
        """
        stripped = content.rstrip()
        if stripped and stripped not in self.after_all_agents:
            if self.after_all_agents:
                self.after_all_agents += "\n" + stripped
            else:
                self.after_all_agents = stripped

    def prepend_after_all_agents(self, content: str) -> None:
        """Prepend content to the after_all_agents section.

        Parameters
        ----------
        content : str
            The content to prepend.
        """
        stripped = content.rstrip()
        if stripped and stripped not in self.after_all_agents:
            if self.after_all_agents:
                self.after_all_agents = stripped + "\n" + self.after_all_agents
            else:
                self.after_all_agents = stripped

    def contribute_to_export(self, result: ExportResult) -> None:
        """Contribute this extras' content to the export result.

        Parameters
        ----------
        result : ExportResult
            The export result to contribute to.
        """
        # Add imports
        result.add_imports(self.extra_imports, ImportPosition.THIRD_PARTY)

        # Add before/after content with default positioning
        # Subclasses can override this method for custom positioning
        if self.before_agent:
            result.add_content(
                self.before_agent,
                ExportPosition.AGENTS,
                order=ContentOrder.PRE_CONTENT,
            )

        if self.extra_args:
            for arg in self.extra_args:
                result.add_content(
                    arg.get_content(),
                    ExportPosition.AGENTS,
                    order=ContentOrder.MAIN_CONTENT,
                    agent_position=AgentPosition.AS_ARGUMENT,
                )

        if self.after_agent:
            result.add_content(
                self.after_agent,
                ExportPosition.AGENTS,
                order=ContentOrder.POST_CONTENT,
            )

        # Allow subclasses to contribute additional content
        self._contribute_specific_content(result)

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute subclass-specific content.

        Override in subclasses to add type-specific content.

        Parameters
        ----------
        result : ExportResult
            The export result to contribute to.
        """

    @abc.abstractmethod
    def has_specific_content(self) -> bool:
        """Check if there's subclass-specific content.

        Returns
        -------
        bool
            True if there's specific content for this extras type.
        """

    def has_content(self) -> bool:
        """Check if there's any meaningful content.

        Returns
        -------
        bool
            True if there's any content in this extras instance.
        """
        return bool(
            self.extra_imports
            or self.before_agent.strip()
            or self.after_agent.strip()
            or self.has_specific_content()
        )
