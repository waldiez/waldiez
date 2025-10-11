# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
# pyright: reportReturnType=false
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

    def validate(self, content: Any) -> ValidationResult:
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

    def serialize(self, obj: Any, **kwargs: Any) -> str:
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

    def resolve(self, path: str) -> str:
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

    def is_local(self, path: str) -> bool:
        """Check if the given path is a local path.

        Parameters
        ----------
        path : str
            The path to check.

        Returns
        -------
        bool
            True if the path is a local path, False otherwise.
        """


class ContentGenerator(Protocol):
    """Protocol for generating content."""

    def generate(
        self,
        merged_result: ExportResult,
        is_async: bool,
        after_run: str,
        skip_logging: bool,
        **kwargs: Any,
    ) -> str:
        """Generate content based on provided parameters.

        Parameters
        ----------
        merged_result : ExportResult
            The merged export result containing all content.
        is_async : bool
            Whether to generate async content.
        after_run : str
            Additional content to add after the main flow execution.
        skip_logging : bool
            Whether to skip logging setup.
        **kwargs : Any
            Parameters to influence content generation.

        Returns
        -------
        str
            The generated content.


        Raises
        ------
        ExporterContentError
            If exporting fails.
        """
