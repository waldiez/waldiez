# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Core exporting protocols."""

from typing import Any, Protocol, runtime_checkable

from .result import ExportResult
from .validation import ValidationResult


# Protocol for extras that can contribute to exports
@runtime_checkable
class ExportContributor(Protocol):
    """Protocol for objects that can contribute to exports."""

    def contribute_to_export(self, result: ExportResult) -> None:
        """Contribute content to the export result.

        Parameters
        ----------
        result : ExportResult
            The export result to contribute to.
        """


# Protocol for validation
class Validator(Protocol):
    """Protocol for validation components."""

    def validate(self, content: Any) -> ValidationResult:  # pyright: ignore
        """Validate content and return result.

        Parameters
        ----------
        content : Any
            The content to validate.

        Returns
        -------
        ValidationResult
            The validation result.
        """


# Protocol for serialization
class Serializer(Protocol):
    """Protocol for serialization components."""

    def serialize(self, obj: Any, **kwargs: Any) -> str:  # pyright: ignore
        """Serialize an object to string representation.

        Parameters
        ----------
        obj : Any
            The object to serialize.
        **kwargs : Any
            Additional keyword arguments for serialization.

        Returns
        -------
        str
            The serialized representation.
        """


# Protocol for resolving a path
class PathResolver(Protocol):
    """Protocol for resolving a path."""

    def resolve(self, path: str) -> str:  # pyright: ignore
        """Resolve a path.

        Parameters
        ----------
        path : str
            The path to resolve.

        Returns
        -------
        str
            The resolved path.

        Raises
        ------
        ValueError
            If the path cannot be resolved.
        """


class ContentGenerator(Protocol):
    """Protocol for generating content."""

    def generate(
        self,
        merged_result: ExportResult,
        is_async: bool,
        after_run: str,
        **kwargs: Any,
    ) -> str:  # pyright: ignore
        """Generate content based on provided parameters.

        Parameters
        ----------
        merged_result : ExportResult
            The merged export result containing all content.
        is_async : bool
            Whether to generate async content.
        after_run : str
            Additional content to add after the main flow execution.
        **kwargs : Any
            Parameters to influence content generation.

        Returns
        -------
        str
            The generated content.
        """


@runtime_checkable
class ExportingLogger(Protocol):
    """Protocol for logging during exporting."""

    def log(
        self, message: Any, *args: Any, level: str = "info", **kwargs: Any
    ) -> None:
        """Log a message with the specified level.

        Parameters
        ----------
        message : Any
            The message to log or message template for formatting.
        level : str, optional
            The logging level to use (e.g., "debug", "info", "warning", "error",
            "critical"). Defaults to "info".
        *args : Any
            Arguments to format into the message using % formatting.
        **kwargs : Any
            Keyword arguments to format into the message using str.format().
        """

    def error(self, message: Any, *args: Any, **kwargs: Any) -> None:
        """Log an error message.

        Parameters
        ----------
        message : Any
            The error message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Keyword arguments to format into the message using str.format().
        """

    def warning(self, message: Any, *args: Any, **kwargs: Any) -> None:
        """Log a warning message.

        Parameters
        ----------
        message : Any
            The warning message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Keyword arguments to format into the message using str.format().
        """

    def info(self, message: Any, *args: Any, **kwargs: Any) -> None:
        """Log an informational message.

        Parameters
        ----------
        message : Any
            The informational message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Keyword arguments to format into the message using str.format().
        """

    def success(self, message: Any, *args: Any, **kwargs: Any) -> None:
        """Log a success message.

        Parameters
        ----------
        message : Any
            The success message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Keyword arguments to format into the message using str.format().
        """

    def debug(self, message: Any, *args: Any, **kwargs: Any) -> None:
        """Log a debug message.

        Parameters
        ----------
        message : Any
            The debug message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Keyword arguments to format into the message using str.format().
        """
        self.log(message, *args, level="debug", **kwargs)

    def critical(self, message: Any, *args: Any, **kwargs: Any) -> None:
        """Log a critical error message.

        Parameters
        ----------
        message : Any
            The critical error message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Keyword arguments to format into the message using str.format().
        """
        self.log(message, *args, level="critical", **kwargs)

    def exception(self, message: Any, *args: Any, **kwargs: Any) -> None:
        """Log an exception message.

        Parameters
        ----------
        message : Any
            The exception message to log or message template.
        *args : Any
            Arguments to format into the message.
        **kwargs : Any
            Keyword arguments to format into the message using str.format().
        """
        self.log(message, *args, level="exception", **kwargs)

    def set_level(self, level: str) -> None:
        """Set the logging level.

        Parameters
        ----------
        level : str
            The logging level to set
            (e.g., "debug", "info", "warning", "error", "critical").

        Raises
        ------
        ValueError
            If the provided level is invalid.
        """

    def get_level(self) -> str:  # pyright: ignore
        """Get the current logging level.

        Returns
        -------
        str
            The current logging level.
        """
