# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Base exporter classes."""

import abc
from typing import Any, Generic, Optional

from .constants import DEFAULT_IMPORT_POSITION
from .content import PositionedContent
from .context import DefaultExporterContext, ExporterContext
from .enums import (
    AgentPosition,
    ContentOrder,
    ExportPosition,
    ImportPosition,
)
from .protocols import ExportContributor
from .result import ExportResult, ExportResultBuilder
from .types import (
    EnvironmentVariable,
    ExportConfig,
    Extras,
    ImportStatement,
)


class Exporter(abc.ABC, Generic[Extras]):
    """Exporter base class with structured extras and clean interface."""

    def __init__(
        self,
        context: Optional[ExporterContext] = None,
        **kwargs: Any,
    ):
        """Initialize the exporter.

        Parameters
        ----------
        context : Optional[ExporterContext], optional
            The exporter context with dependencies, by default None
        **kwargs : Any
            Additional keyword arguments for subclasses.
        """
        self._context = context or DefaultExporterContext(
            config=ExportConfig.create(**kwargs)
        )
        config = self._context.get_config()
        config.update(**kwargs)
        self._context.set_config(config)
        self._result = ExportResult()
        self._initialized = False
        self._builder = ExportResultBuilder()
        self.config = self._context.get_config()

        # Allow subclasses to handle additional kwargs
        self._handle_kwargs(**kwargs)

    def _handle_kwargs(self, **kwargs: Any) -> None:
        """Handle additional keyword arguments.

        Override in subclasses to handle specific arguments.

        Parameters
        ----------
        **kwargs : Any
            Additional keyword arguments.
        """

    @property
    def context(self) -> ExporterContext:
        """Get the exporter context.

        Returns
        -------
        ExporterContext
            The exporter context.
        """
        return self._context

    @property
    @abc.abstractmethod
    def extras(self) -> Extras:
        """Get the structured extras for this exporter.

        Returns
        -------
        Extras
            The extras instance.
        """

    @abc.abstractmethod
    def generate_main_content(self) -> str | None:
        """Generate the main export content.

        Returns
        -------
        str | None
            The main content, or None if no content should be generated.
        """

    def _ensure_initialized(self) -> None:
        """Ensure the exporter is properly initialized."""
        if not self._initialized:
            self._initialize_export()
            self._initialized = True

    def _initialize_export(self) -> None:
        """Initialize the export with content from extras and main content."""
        # Let extras contribute their content first
        if isinstance(self.extras, ExportContributor):
            self.extras.contribute_to_export(self._result)

        # Generate and set main content
        main_content = self.generate_main_content()
        if main_content:
            self._result.main_content = main_content

        # Add default imports if available
        self._add_default_imports()

        # Allow subclasses to add additional content
        self._add_additional_content()

        # Validate if validator is available
        self._validate_result()

    def _add_default_imports(self) -> None:
        """Add default imports for this exporter type.

        Override in subclasses to add type-specific imports.
        """

    def _add_additional_content(self) -> None:
        """Additional content (subclasses hook).

        This is called after extras contribution and main content generation.
        """

    def _validate_result(self) -> None:
        """Validate the export result if validator is available."""
        if self._context.validator:
            validation_result = self._context.validator.validate(self._result)
            self._result.validation_result = validation_result

    # Convenience methods for adding content

    def add_import(
        self,
        statement: str,
        position: ImportPosition = DEFAULT_IMPORT_POSITION,
    ) -> None:
        """Add an import statement.

        Parameters
        ----------
        statement : str
            The import statement to add.
        position : ImportPosition, optional
            The position of the import, by default THIRD_PARTY
        """
        self._result.add_import(statement, position)

    def add_imports(
        self,
        statements: set[str],
        position: ImportPosition = DEFAULT_IMPORT_POSITION,
    ) -> None:
        """Add multiple import statements.

        Parameters
        ----------
        statements : Set[str]
            The import statements to add.
        position : ImportPosition, optional
            The position of the imports, by default THIRD_PARTY
        """
        self._result.add_imports(statements, position)

    def add_content(
        self,
        content: str,
        position: ExportPosition,
        order: ContentOrder = ContentOrder.MAIN_CONTENT,
        agent_id: str | None = None,
        agent_position: AgentPosition | None = None,
        skip_strip: bool | None = None,
        **metadata: Any,
    ) -> None:
        """Add positioned content.

        Parameters
        ----------
        content : str
            The content to add.
        position : ExportPosition
            The position of the content.
        order : ContentOrder, optional
            The order within the position, by default ContentOrder.MAIN_CONTENT
        agent_id : str | None, optional
            Agent ID for agent-relative positioning, by default None
        agent_position : AgentPosition | None, optional
            Position relative to agent, by default None
        skip_strip : bool | None, optional
            Whether to skip stripping whitespace, by default None
            If None, defaults to True for CHATS position (keep identation),
        **metadata : Any
            Additional metadata for the content.
        """
        if skip_strip is None:
            skip_strip = position == ExportPosition.CHATS
        self._result.add_content(
            content=content,
            position=position,
            order=order,
            agent_id=agent_id,
            agent_position=agent_position,
            skip_strip=skip_strip,
            **metadata,
        )

    def add_env_var(
        self,
        name: str,
        value: str,
        description: str | None = None,
        required: bool = True,
    ) -> None:
        """Add environment variable.

        Parameters
        ----------
        name : str
            The name of the environment variable.
        value : str
            The value of the environment variable.
        description : str | None, optional
            Description of the variable, by default None
        required : bool, optional
            Whether the variable is required, by default True
        """
        self._result.add_env_var(name, value, description, required)

    def set_metadata(self, key: str, value: Any) -> None:
        """Set metadata on the export result.

        Parameters
        ----------
        key : str
            The metadata key.
        value : Any
            The metadata value.
        """
        self._result.metadata[key] = value

    def get_metadata(self, key: str, default: Any = None) -> Any:
        """Get metadata from the export result.

        Parameters
        ----------
        key : str
            The metadata key.
        default : Any, optional
            Default value if key not found, by default None

        Returns
        -------
        Any
            The metadata value or default.
        """
        return self._result.metadata.get(key, default)

    # Public interface methods

    def export(self) -> ExportResult:
        """Export and return the complete result.

        Returns
        -------
        ExportResult
            The complete export result.
        """
        self._ensure_initialized()
        return self._result

    def get_imports(self) -> list[ImportStatement]:
        """Get sorted imports.

        Returns
        -------
        List[ImportStatement]
            Sorted list of import statements.
        """
        self._ensure_initialized()
        return self._result.get_sorted_imports()

    def get_content_by_position(
        self, position: ExportPosition
    ) -> list[PositionedContent]:
        """Get content for a specific position.

        Parameters
        ----------
        position : ExportPosition
            The position to filter by.

        Returns
        -------
        List[PositionedContent]
            List of content for the specified position.
        """
        self._ensure_initialized()
        return self._result.get_content_by_position(position)

    def get_main_content(self) -> Optional[str]:
        """Get the main content.

        Returns
        -------
        Optional[str]
            The main content.
        """
        self._ensure_initialized()
        return self._result.main_content

    def get_environment_variables(self) -> list[EnvironmentVariable]:
        """Get environment variables.

        Returns
        -------
        List[EnvironmentVariable]
            List of environment variables.
        """
        self._ensure_initialized()
        return self._result.environment_variables

    def has_content(self) -> bool:
        """Check if the exporter has any content.

        Returns
        -------
        bool
            True if there's any content.
        """
        self._ensure_initialized()
        return self._result.has_content()

    def has_errors(self) -> bool:
        """Check if there are validation errors.

        Returns
        -------
        bool
            True if there are validation errors.
        """
        self._ensure_initialized()
        return self._result.has_errors()

    def has_warnings(self) -> bool:
        """Check if there are validation warnings.

        Returns
        -------
        bool
            True if there are validation warnings.
        """
        self._ensure_initialized()
        return self._result.has_warnings()

    def get_statistics(self) -> dict[str, int]:
        """Get statistics about the export.

        Returns
        -------
        Dict[str, int]
            Dictionary with export statistics.
        """
        self._ensure_initialized()
        return self._result.get_statistics()

    def clear(self) -> None:
        """Clear all export content and reset initialization state."""
        self._result.clear()
        self._initialized = False

    def reset(self) -> None:
        """Reset the exporter to initial state."""
        self._result = ExportResult()
        self._initialized = False
        self._builder = ExportResultBuilder()
