# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Exporter core exceptions module."""


class ExporterError(Exception):
    """Base exception for exporter errors."""


class ExporterInitializationError(ExporterError):
    """Exception raised when exporter initialization fails."""


class ExporterValidationError(ExporterError):
    """Exception raised when export validation fails."""


class ExporterContentError(ExporterError):
    """Exception raised when content generation fails."""
