# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.core.errors."""

import pytest

from waldiez.exporting.core.errors import (
    ExporterContentError,
    ExporterError,
    ExporterInitializationError,
    ExporterValidationError,
)


def test_exporter_error_hierarchy() -> None:
    """Test the hierarchy of exporter errors."""
    assert issubclass(ExporterInitializationError, ExporterError)
    assert issubclass(ExporterValidationError, ExporterError)
    assert issubclass(ExporterContentError, ExporterError)


# pylint: disable=missing-raises-doc
def test_exporter_error_raising() -> None:
    """Test raising exporter errors."""
    with pytest.raises(ExporterInitializationError):
        raise ExporterInitializationError("Init failed!")
    with pytest.raises(ExporterValidationError):
        raise ExporterValidationError("Validation failed!")
    with pytest.raises(ExporterContentError):
        raise ExporterContentError("Content failed!")
