# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Test waldiez.exporting.core.extras.tool_extras."""

from waldiez.exporting.core.extras.tool_extras import ToolExtras
from waldiez.exporting.core.result import ExportResult


def test_tool_extras_content_contribution() -> None:
    """Test ToolExtras content contribution."""
    extras = ToolExtras("test_tool_extras")
    extras.add_function_content("def tool(): pass")
    extras.add_registration_content("register_tool(tool)")
    result = ExportResult()
    extras.contribute_to_export(result)
    contents = [c.content for c in result.positioned_content]
    assert any("def tool()" in c for c in contents)
    assert any("register_tool" in c for c in contents)
