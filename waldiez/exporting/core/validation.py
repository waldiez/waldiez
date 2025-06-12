# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Validation types and results for Waldiez exporting core."""

from dataclasses import dataclass, field
from typing import Optional


# Validation Types
@dataclass
class ValidationError:
    """Represents a validation error."""

    message: str
    severity: str = "error"  # error, warning, info
    location: Optional[str] = None
    suggestion: Optional[str] = None


@dataclass
class ValidationResult:
    """Result of validation operations."""

    is_valid: bool
    errors: list[ValidationError] = field(
        default_factory=list[ValidationError],
    )
    warnings: list[ValidationError] = field(
        default_factory=list[ValidationError],
    )

    def add_error(
        self,
        message: str,
        location: Optional[str] = None,
        suggestion: Optional[str] = None,
    ) -> None:
        """Add a validation error.

        Parameters
        ----------
        message : str
            The error message to add.
        location : Optional[str], optional
            The location in the code where the error occurred, by default None
        suggestion : Optional[str], optional
            A suggestion for fixing the error, by default None
        """
        self.errors.append(
            ValidationError(message, "error", location, suggestion)
        )
        self.is_valid = False

    def add_warning(self, message: str, location: Optional[str] = None) -> None:
        """Add a validation warning.

        Parameters
        ----------
        message : str
            The warning message to add.
        location : Optional[str], optional
            The location in the code where the warning occurred, by default None
        """
        self.warnings.append(ValidationError(message, "warning", location))

    def has_errors(self) -> bool:
        """Check if there are any errors.

        Returns
        -------
        bool
            True if there are validation errors, otherwise False.
        """
        return len(self.errors) > 0

    def has_warnings(self) -> bool:
        """Check if there are any warnings.

        Returns
        -------
        bool
            True if there are validation warnings, otherwise False.
        """
        return len(self.warnings) > 0

    def merge(self, other: "ValidationResult") -> None:
        """Merge another ValidationResult into this one.

        Parameters
        ----------
        other : ValidationResult
            The other validation result to merge.
        """
        self.is_valid = self.is_valid and other.is_valid
        self.errors.extend(other.errors)
        self.warnings.extend(other.warnings)
