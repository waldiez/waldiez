# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Tests for waldiez.exporting.core.types.*."""

from waldiez.exporting.core.enums import (
    ContentOrder,
    ExportPosition,
    ImportPosition,
)
from waldiez.exporting.core.types import NoExtras


def test_import_position_enum() -> None:
    """Test ImportPosition enum values and names."""
    assert ImportPosition.BUILTINS.value == 0
    assert ImportPosition.THIRD_PARTY.name == "THIRD_PARTY"


def test_export_position_enum() -> None:
    """Test ExportPosition enum values and names."""
    assert ExportPosition.CHATS.value > 0


def test_content_order_enum() -> None:
    """Test ContentOrder enum values and names."""
    assert hasattr(ContentOrder, "MAIN_CONTENT")


def test_noextras_is_singleton() -> None:
    """Test that NoExtras is a singleton and has the correct type."""
    assert repr(NoExtras) == "<NoExtras>"
