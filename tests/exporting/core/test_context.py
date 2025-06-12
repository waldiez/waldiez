# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.core.context."""

from waldiez.exporting.core.context import (
    create_exporter_context,
    get_default_exporter_context,
)
from waldiez.exporting.core.extras.serializer import DefaultSerializer


def test_singleton_default_context() -> None:
    """Test that the default exporter context is a singleton."""
    ctx1 = get_default_exporter_context()
    ctx2 = get_default_exporter_context()
    assert ctx1 is ctx2
    assert isinstance(ctx1.serializer, DefaultSerializer)


def test_create_custom_context() -> None:
    """Test creating a custom exporter context."""
    ctx = create_exporter_context()
    assert ctx is not None
    assert ctx.serializer is None or isinstance(
        ctx.serializer, DefaultSerializer
    )
