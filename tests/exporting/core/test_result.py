# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.core.result."""

from waldiez.exporting.core.enums import (
    ContentOrder,
    ExportPosition,
    ImportPosition,
)
from waldiez.exporting.core.result import ExportResult


def test_add_import_and_content() -> None:
    """Test adding imports and content to ExportResult."""
    res = ExportResult()
    res.add_import("import os", ImportPosition.BUILTINS)
    assert any("os" in imp.statement for imp in res.imports)

    res.add_content(
        "print('hello')", ExportPosition.TOP, order=ContentOrder.EARLY_SETUP
    )
    assert any("hello" in c.content for c in res.positioned_content)


def test_merge_export_results() -> None:
    """Test merging two ExportResult instances."""
    r1 = ExportResult()
    r2 = ExportResult()
    r1.add_import("import sys")
    r2.add_import("import os")
    r1.merge(r2)
    imports = [imp.statement for imp in r1.imports]
    assert "import sys" in imports and "import os" in imports
