# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.predefined.protocol*."""

from waldiez.models.tool.predefined import PredefinedTool

from .dummy_tool import DummyTool


def test_tool_conforms_to_protocol() -> None:
    """Test that the DummyTool conforms to the PredefinedTool protocol."""
    tool = DummyTool()
    assert isinstance(tool, PredefinedTool)
    assert tool.name == "dummy"
