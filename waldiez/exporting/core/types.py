# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Core dataclasses for the exporting system."""

from dataclasses import dataclass, field, fields
from pathlib import Path
from typing import Any, Optional, TypeVar

from .enums import (
    ImportPosition,
)

# Generic type for extras
Extras = TypeVar("Extras")


# Sentinel for exporters that do not require extras
# pylint: disable=too-few-public-methods
class _NoExtrasType:
    """Sentinel for exporters that do not require extras."""

    def __repr__(self) -> str:
        """Get the string representation of NoExtras."""
        return "<NoExtras>"


NoExtras = _NoExtrasType()


# Core Data Structures
@dataclass
class ImportStatement:
    """Represents an import statement with its position."""

    statement: str
    position: ImportPosition = ImportPosition.THIRD_PARTY
    metadata: Optional[dict[str, Any]] = None

    def __hash__(self) -> int:
        """Hash based on the import statement.

        Returns
        -------
        int
            The hash value of the import statement.
        """
        return hash(self.statement)

    def __eq__(self, other: object) -> bool:
        """Check equality based on the import statement.

        Parameters
        ----------
        other : object
            The object to compare against.

        Returns
        -------
        bool
            True if the other object is an
            ImportStatement with the same statement.
        """
        if isinstance(other, ImportStatement):
            return self.statement == other.statement
        return False

    def __lt__(self, other: "ImportStatement") -> bool:
        """Enable sorting by position then statement.

        Parameters
        ----------
        other : ImportStatement
            The other import statement to compare against.

        Returns
        -------
        bool
            True if this import statement should come before the other.
        """
        if self.position.value != other.position.value:
            return self.position.value < other.position.value
        return self.statement < other.statement


@dataclass
class EnvironmentVariable:
    """Environment variable with metadata."""

    name: str
    value: str
    description: Optional[str] = None
    required: bool = True

    def __post_init__(self) -> None:
        """Validate environment variable."""
        if not self.name or not self.value:
            raise ValueError("Environment variable name and value are required")

    def __hash__(self) -> int:
        """Hash based on the environment variable name.

        Returns
        -------
        int
            The hash value of the environment variable name.
        """
        return hash(self.name)

    def __eq__(self, other: object) -> bool:
        """Check equality based on the environment variable name.

        Parameters
        ----------
        other : object
            The object to compare against.

        Returns
        -------
        bool
            True if the other object is an
            EnvironmentVariable with the same name.
        """
        if isinstance(other, EnvironmentVariable):
            return self.name == other.name
        return False

    def as_tuple(self) -> tuple[str, str]:
        """Get the environment variable as a tuple.

        Returns
        -------
        tuple[str, str]
            The environment variable as a tuple.
        """
        return (self.name, self.value)


# Instance Argument
@dataclass
class InstanceArgument:
    """Represents an instance argument for an agent, model or tool."""

    instance_id: str
    name: str
    value: Any
    tabs: int = 0
    tabs_length: int = 4  # Assuming 4 spaces per tab
    with_new_line_before: bool = False
    with_new_line_after: bool = False
    with_new_line_if_empty: bool = False
    skip_if_empty_string: bool = True
    comment: Optional[str] = None

    def has_content(self) -> bool:
        """Check if the instance argument has content.

        Returns
        -------
        bool
            True if the instance argument has content, otherwise False.
        """
        if self.skip_if_empty_string and isinstance(self.value, str):
            return bool(self.value.strip())
        return self.value is not None and self.value != ""

    def get_content(
        self,
        prepend_new_line: bool = False,
        append_new_line: bool = False,
    ) -> str:
        """Get the content representation of the instance argument.

        Parameters
        ----------
        prepend_new_line : bool, optional
            Whether to prepend a new line before the content,
            by default False.
        append_new_line : bool, optional
            Whether to append a new line at the end of the content,
            by default False.

        Returns
        -------
        str
            The formatted content string for the instance argument.
        """
        if (
            self.skip_if_empty_string
            and isinstance(self.value, str)
            and not self.value.strip()
        ):
            return "\n" if self.with_new_line_if_empty else ""
        space = " " * (self.tabs * self.tabs_length)
        content = f"{space}{self.name}={self.value}," + (
            f"  # {self.comment}" if self.comment else ""
        )
        if self.with_new_line_before or prepend_new_line:
            content = "\n" + content
        if self.with_new_line_after or append_new_line:
            content += "\n"
        return content

    def __hash__(self) -> int:
        """Hash based on the instance ID and name.

        Returns
        -------
        int
            The hash value of the instance argument.
        """
        return hash((self.instance_id, self.name))

    def __str__(self) -> str:
        """Get the string representation of the instance argument.

        Returns
        -------
        str
            The string representation of the instance argument.
        """
        return self.get_content()

    def __repr__(self) -> str:
        """Get the string representation of the instance argument.

        Returns
        -------
        str
            The string representation of the instance argument.
        """
        return self.get_content()


# Export Configuration
@dataclass
class ExportConfig:
    """Configuration for export operations.

    Attributes
    ----------
    output_extension : str
        The file extension for the exported content.
    is_async : bool
        Whether the exported content should be asynchronous.
    """

    name: str = "Waldiez Flow"
    description: str = (
        "Make AG2 Agents Collaborate: Drag, Drop, and Orchestrate with Waldiez"
    )
    requirements: list[str] = field(default_factory=list[str])
    tags: list[str] = field(default_factory=list[str])
    output_extension: str = "py"
    is_async: bool = False
    output_directory: Optional[str | Path] = None
    cache_seed: Optional[int] = None

    @property
    def for_notebook(self) -> bool:
        """Check if the export is intended for a notebook environment.

        Returns
        -------
        bool
            True if the output extension is 'ipynb', otherwise False.
        """
        return self.output_extension == "ipynb"

    def __post_init__(self) -> None:
        """Post-initialization validation."""
        if not self.name:
            raise ValueError("ExportConfig name cannot be empty")
        if not self.description:
            raise ValueError("ExportConfig description cannot be empty")
        if not self.output_extension:
            raise ValueError("ExportConfig output_extension cannot be empty")

    @classmethod
    def create(cls, **kwargs: Any) -> "ExportConfig":
        """Create a new ExportConfig instance with the provided values.

        Parameters
        ----------
        **kwargs : Any
            Keyword arguments to initialize the ExportConfig.

        Returns
        -------
        ExportConfig
            A new instance of ExportConfig.
        """
        valid_fields = {f.name for f in fields(cls)}
        output_extension = kwargs.pop("output_extension", "py")
        for_notebook = kwargs.pop("for_notebook", output_extension == "ipynb")
        if for_notebook is True:
            output_extension = "ipynb"
        cache_seed = kwargs.pop("cache_seed", None)
        if cache_seed is not None and not isinstance(cache_seed, int):
            cache_seed = None
        return cls(
            cache_seed=cache_seed,
            output_extension=output_extension,
            **{k: v for k, v in kwargs.items() if k in valid_fields},
        )

    def update(self, **kwargs: Any) -> None:
        """Update the export configuration with new values.

        Parameters
        ----------
        **kwargs : Any
            Keyword arguments to update the configuration.

        Raises
        ------
        ValueError
            If an invalid configuration key is provided.
        """
        valid_fields = {f.name for f in fields(self)}
        for key, value in kwargs.items():
            if key in valid_fields:
                setattr(self, key, value)
        if (
            "for_notebook" in kwargs
            and isinstance(kwargs["for_notebook"], bool)
            and "output_extension" not in kwargs
        ):  # pragma: no cover
            self.output_extension = "ipynb" if kwargs["for_notebook"] else "py"
