# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.core.extras.base.*."""

from waldiez.exporting.core import (
    BaseExtras,
    ExportResult,
    ImportPosition,
    ImportStatement,
)


class SimpleExtras(BaseExtras):
    """A simple extras class for testing."""

    def has_specific_content(self) -> bool:
        """Check if specific content is present.

        Returns
        -------
        bool
            Always returns False for this simple implementation.
        """
        return False


def test_base_extras_import_and_content() -> None:
    """Test BaseExtras for adding imports and content."""
    extras = SimpleExtras(instance_id="test_instance")
    extras.add_import(
        ImportStatement(
            statement="import json", position=ImportPosition.BUILTINS
        )
    )
    extras.append_before_agent("foo = 1")
    extras.append_after_agent("bar = 2")
    result = ExportResult()
    extras.contribute_to_export(result)
    found = [c.content for c in result.positioned_content]
    assert any("foo" in item for item in found)
    assert any("bar" in item for item in found)
    assert any("json" in imp.statement for imp in result.imports)
