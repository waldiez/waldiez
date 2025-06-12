# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Export result containers and related classes."""

from dataclasses import dataclass, field
from typing import Any, Optional, Union

from .constants import (
    DEFAULT_EXPORT_POSITION,
    DEFAULT_IMPORT_POSITION,
)
from .content import (
    PositionedContent,
)
from .enums import (
    AgentPosition,
    ContentOrder,
    ExportPosition,
    ImportPosition,
)
from .types import (
    EnvironmentVariable,
    ImportStatement,
    InstanceArgument,
)
from .validation import ValidationResult


@dataclass
class ExportResult:
    """Complete export result with all components."""

    main_content: Optional[str] = None
    imports: set[ImportStatement] = field(
        default_factory=set[ImportStatement],
    )
    positioned_content: list[PositionedContent] = field(
        default_factory=list[PositionedContent],
    )
    instance_arguments: list[InstanceArgument] = field(
        default_factory=list[InstanceArgument],
    )
    environment_variables: list[EnvironmentVariable] = field(
        default_factory=list[EnvironmentVariable]
    )
    validation_result: Optional[ValidationResult] = None
    metadata: dict[str, Any] = field(default_factory=dict[str, Any])

    def add_import(
        self, statement: str, position: ImportPosition = DEFAULT_IMPORT_POSITION
    ) -> None:
        """Add an import statement.

        Parameters
        ----------
        statement : str
            The import statement to add.
        position : ImportPosition, optional
            The position of the import, by default THIRD_PARTY
        """
        if statement and statement.strip():
            self.imports.add(
                ImportStatement(
                    statement=statement.strip(),
                    position=position,
                )
            )

    def add_imports(
        self,
        statements: Union[
            set[str],
            list[str],
            set[ImportStatement],
            list[ImportStatement],
        ],
        position: ImportPosition = DEFAULT_IMPORT_POSITION,
    ) -> None:
        """Add multiple import statements.

        Parameters
        ----------
        statements : Union[
                set[str],
                list[str]],
                set[ImportStatement],
                list[ImportStatement]
            ]
            The import statements to add.
        position : ImportPosition, optional
            The position of the imports, by default THIRD_PARTY
        """
        for statement in statements:
            if isinstance(statement, ImportStatement):
                # If it's already an ImportStatement, use it directly
                self.add_import(statement.statement, statement.position)
            else:
                # Otherwise, treat it as a string
                self.add_import(statement, position)
            # self.add_import(statement, position)

    def add_instance_argument(
        self,
        name: str,
        value: Any,
        instance_id: str,
        tabs: int = 0,
        comment: Optional[str] = None,
    ) -> None:
        """Add an instance argument.

        Parameters
        ----------
        name : str
            The name of the argument.
        value : Any
            The value of the argument.
        instance_id : str
            The ID of the instance this argument belongs to.
        tabs : int, optional
            Number of tabs for indentation, by default 0
        comment : Optional[str], optional
            Optional comment for the argument, by default None
        """
        if name and value is not None:
            arg = InstanceArgument(
                instance_id=instance_id,
                name=name,
                value=value,
                comment=comment,
                tabs=tabs,
            )
            # Avoid duplicates based on name
            for existing in self.instance_arguments:
                if existing.name == name:
                    # Update existing
                    existing.value = value
                    existing.comment = comment
                    return
            self.instance_arguments.append(arg)

    def add_instance_arguments(
        self,
        arguments: Union[list[InstanceArgument], set[InstanceArgument]],
    ) -> None:
        """Add multiple instance arguments.

        Parameters
        ----------
        arguments : Union[list[InstanceArgument], set[InstanceArgument]]
            The instance arguments to add.
        """
        for arg in arguments:
            self.add_instance_argument(
                instance_id=arg.instance_id,
                name=arg.name,
                value=arg.value,
                comment=arg.comment,
            )

    def merge(
        self,
        other: "ExportResult",
        position: ExportPosition = DEFAULT_EXPORT_POSITION,
    ) -> None:
        """Merge another ExportResult into this one.

        Parameters
        ----------
        other : ExportResult
            The other result to merge.
        position : ExportPosition, optional
            The position for the merged content, by default AGENTS
        """
        if other.main_content:
            self.main_content = (
                (self.main_content or "") + "\n" + other.main_content
            ).strip()

        self.imports.update(other.imports)

        self.positioned_content.extend(
            PositionedContent(
                content=c.content,
                position=position,
                order=c.order,
                agent_id=c.agent_id,
                agent_position=c.agent_position,
                **c.metadata,
            )
            for c in other.positioned_content
        )

        self.environment_variables.extend(other.environment_variables)

        if other.validation_result:
            if self.validation_result:
                self.validation_result.merge(other.validation_result)
            else:
                self.validation_result = other.validation_result

        # Merge instance arguments
        for arg in other.instance_arguments:
            self.add_instance_argument(
                name=arg.name,
                value=arg.value,
                instance_id=arg.instance_id,
                comment=arg.comment,
            )

        self.metadata.update(other.metadata)

    def add_content(
        self,
        content: str,
        position: ExportPosition = DEFAULT_EXPORT_POSITION,
        order: Union[ContentOrder, int] = ContentOrder.MAIN_CONTENT,
        skip_strip: bool = False,
        agent_id: Optional[str] = None,
        agent_position: Optional[AgentPosition] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> None:
        """Add positioned content.

        Parameters
        ----------
        content : str
            The content to add.
        position : ExportPosition, optional
            The position of the content, by default AGENTS
        order : int, optional
            The order within the position, by default 0
        skip_strip : bool, optional
            Whether to skip stripping whitespace from content, by default False
        agent_id : Optional[str], optional
            The agent ID if positioned relative to an agent, by default None
        agent_position : Optional[AgentPosition], optional
            The position relative to the agent, by default None
        metadata : Optional[dict[str, Any]], optional
            Additional metadata for the content, by default None
        """
        order_value = order.value if isinstance(order, ContentOrder) else order
        if content and content.strip():
            positioned = PositionedContent(
                content=content.strip() if not skip_strip else content,
                position=position,
                order=order_value,
                agent_id=agent_id,
                agent_position=agent_position,
                **(metadata or {}),
            )
            if positioned not in self.positioned_content:
                self.positioned_content.append(positioned)

    def add_env_var(
        self,
        name: str,
        value: str,
        description: Optional[str] = None,
        required: bool = True,
    ) -> None:
        """Add environment variable.

        Parameters
        ----------
        name : str
            The name of the environment variable.
        value : str
            The value of the environment variable.
        description : Optional[str], optional
            Description of the variable, by default None
        required : bool, optional
            Whether the variable is required, by default True
        """
        if name and value:
            env_var = EnvironmentVariable(
                name=name,
                value=value,
                description=description,
                required=required,
            )
            # Avoid duplicates based on name
            for existing in self.environment_variables:
                if existing.name == name:
                    # Update existing
                    existing.value = value
                    existing.description = description
                    existing.required = required
                    return
            self.environment_variables.append(env_var)

    def get_sorted_imports(self) -> list[ImportStatement]:
        """Get imports sorted by position and statement.

        Returns
        -------
        list[ImportStatement]
            Sorted list of import statements.
        """
        return sorted(self.imports)

    def get_imports_by_position(
        self, position: ImportPosition
    ) -> list[ImportStatement]:
        """Get imports filtered by position.

        Parameters
        ----------
        position : ImportPosition
            The position to filter by.

        Returns
        -------
        list[ImportStatement]
            list of imports for the specified position.
        """
        return [
            imp for imp in self.get_sorted_imports() if imp.position == position
        ]

    def get_content_by_position(
        self,
        position: ExportPosition,
        skip_agent_arguments: bool = True,
    ) -> list[PositionedContent]:
        """Get all content for a specific position.

        Parameters
        ----------
        position : ExportPosition
            The position to filter by.
        skip_agent_arguments : bool, optional
            Whether to skip content positioned as agent arguments,
            by default True

        Returns
        -------
        list[PositionedContent]
            Sorted list of content for the specified position.
        """
        if not skip_agent_arguments:
            content = [
                c for c in self.positioned_content if c.position == position
            ]
        else:
            content = [
                c
                for c in self.positioned_content
                if c.position == position
                and (c.agent_position != AgentPosition.AS_ARGUMENT)
            ]
        return sorted(content)

    def get_agent_content(
        self, agent_id: str, agent_position: Optional[AgentPosition] = None
    ) -> list[PositionedContent]:
        """Get content positioned relative to a specific agent.

        Parameters
        ----------
        agent_id : str
            The ID of the agent.
        agent_position : Optional[AgentPosition], optional
            Filter by specific agent position, by default None (all positions)

        Returns
        -------
        list[PositionedContent]
            Sorted list of content for the specified agent.
        """
        content = [
            c
            for c in self.positioned_content
            if c.agent_id == agent_id
            and (agent_position is None or c.agent_position == agent_position)
        ]
        return sorted(content)

    def get_all_content_sorted(self) -> list[PositionedContent]:
        """Get all positioned content sorted by position and order.

        Returns
        -------
        list[PositionedContent]
            All positioned content sorted.
        """
        return sorted(self.positioned_content)

    def merge_with(self, other: "ExportResult") -> None:
        """Merge another ExportResult into this one.

        Parameters
        ----------
        other : ExportResult
            The other result to merge.
        """
        # Merge imports (set automatically handles duplicates)
        self.imports.update(other.imports)

        # Merge positioned content
        self.positioned_content.extend(other.positioned_content)

        # Merge environment variables (avoid duplicates by name)
        for env_var in other.environment_variables:
            self.add_env_var(
                env_var.name,
                env_var.value,
                env_var.description,
                env_var.required,
            )

        # Merge metadata
        self.metadata.update(other.metadata)

        # Handle validation results
        if other.validation_result:
            if self.validation_result:
                # Merge validation results
                self.validation_result.errors.extend(
                    other.validation_result.errors
                )
                self.validation_result.warnings.extend(
                    other.validation_result.warnings
                )
                self.validation_result.is_valid = (
                    self.validation_result.is_valid
                    and other.validation_result.is_valid
                )
            else:
                self.validation_result = other.validation_result

    def has_content(self) -> bool:
        """Check if there's any meaningful content.

        Returns
        -------
        bool
            True if there's any content, imports, or environment variables.
        """
        return bool(
            self.main_content
            or self.imports
            or self.positioned_content
            or self.environment_variables
        )

    def has_errors(self) -> bool:
        """Check if there are validation errors.

        Returns
        -------
        bool
            True if there are validation errors.
        """
        return (
            self.validation_result is not None
            and self.validation_result.has_errors()
        )

    def has_warnings(self) -> bool:
        """Check if there are validation warnings.

        Returns
        -------
        bool
            True if there are validation warnings.
        """
        return (
            self.validation_result is not None
            and self.validation_result.has_warnings()
        )

    def get_statistics(self) -> dict[str, int]:
        """Get statistics about the export result.

        Returns
        -------
        dict[str, int]
            dictionary with statistics about the export.
        """
        return {
            "total_imports": len(self.imports),
            "builtin_imports": len(
                self.get_imports_by_position(ImportPosition.BUILTINS)
            ),
            "third_party_imports": len(
                self.get_imports_by_position(ImportPosition.THIRD_PARTY)
            ),
            "local_imports": len(
                self.get_imports_by_position(ImportPosition.LOCAL)
            ),
            "positioned_content_items": len(self.positioned_content),
            "environment_variables": len(self.environment_variables),
            "validation_errors": (
                len(self.validation_result.errors)
                if self.validation_result
                else 0
            ),
            "validation_warnings": (
                len(self.validation_result.warnings)
                if self.validation_result
                else 0
            ),
        }

    def clear(self) -> None:
        """Clear all content from the result."""
        self.main_content = None
        self.imports.clear()
        self.positioned_content.clear()
        self.environment_variables.clear()
        self.validation_result = None
        self.metadata.clear()


@dataclass
class ExportResultBuilder:
    """Builder pattern for constructing ExportResult objects."""

    _result: ExportResult = field(default_factory=ExportResult)

    def with_main_content(self, content: str) -> "ExportResultBuilder":
        """Set the main content.

        Parameters
        ----------
        content : str
            The main content to set.

        Returns
        -------
        ExportResultBuilder
            Self for method chaining.
        """
        self._result.main_content = content
        return self

    def with_import(
        self, statement: str, position: ImportPosition = DEFAULT_IMPORT_POSITION
    ) -> "ExportResultBuilder":
        """Add an import statement.

        Parameters
        ----------
        statement : str
            The import statement.
        position : ImportPosition, optional
            The import position, by default THIRD_PARTY

        Returns
        -------
        ExportResultBuilder
            Self for method chaining.
        """
        self._result.add_import(statement, position)
        return self

    def with_content(
        self,
        content: str,
        position: ExportPosition = DEFAULT_EXPORT_POSITION,
        order: ContentOrder = ContentOrder.MAIN_CONTENT,
        agent_id: Optional[str] = None,
        agent_position: Optional[AgentPosition] = None,
    ) -> "ExportResultBuilder":
        """Add positioned content.

        Parameters
        ----------
        content : str
            The content to add.
        position : ExportPosition, optional
            The content position, by default AGENTS
        order : int, optional
            The order within position, by default 0
        agent_id : Optional[str], optional
            Agent ID for agent-relative positioning, by default None
        agent_position : Optional[AgentPosition], optional
            Position relative to agent, by default None

        Returns
        -------
        ExportResultBuilder
            Self for method chaining.
        """
        self._result.add_content(
            content=content,
            position=position,
            order=order,
            agent_id=agent_id,
            agent_position=agent_position,
        )
        return self

    def with_env_var(
        self, name: str, value: str, description: Optional[str] = None
    ) -> "ExportResultBuilder":
        """Add environment variable.

        Parameters
        ----------
        name : str
            Variable name.
        value : str
            Variable value.
        description : Optional[str], optional
            Variable description, by default None

        Returns
        -------
        ExportResultBuilder
            Self for method chaining.
        """
        self._result.add_env_var(name, value, description)
        return self

    def with_metadata(self, key: str, value: Any) -> "ExportResultBuilder":
        """Add metadata.

        Parameters
        ----------
        key : str
            Metadata key.
        value : Any
            Metadata value.

        Returns
        -------
        ExportResultBuilder
            Self for method chaining.
        """
        self._result.metadata[key] = value
        return self

    def build(self) -> ExportResult:
        """Build the final ExportResult.

        Returns
        -------
        ExportResult
            The constructed ExportResult.
        """
        return self._result


# Utility functions for common operations
def merge_export_results(*results: ExportResult) -> ExportResult:
    """Merge multiple ExportResult objects into one.

    Parameters
    ----------
    *results : ExportResult
        Variable number of ExportResult objects to merge.

    Returns
    -------
    ExportResult
        A new ExportResult containing all merged content.
    """
    if not results:
        return ExportResult()

    merged = ExportResult()
    for result in results:
        merged.merge_with(result)

    return merged


def create_empty_result() -> ExportResult:
    """Create an empty ExportResult.

    Returns
    -------
    ExportResult
        An empty ExportResult instance.
    """
    return ExportResult()


def create_result_with_content(
    main_content: str,
    imports: Optional[list[str]] = None,
) -> ExportResult:
    """Create an ExportResult with basic content.

    Parameters
    ----------
    main_content : str
        The main content.
    imports : Optional[list[str]], optional
        list of import statements, by default None

    Returns
    -------
    ExportResult
        The created ExportResult.
    """
    result = ExportResult(main_content=main_content)

    if imports:
        result.add_imports(imports)

    return result
