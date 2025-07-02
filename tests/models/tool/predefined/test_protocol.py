# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-function-docstring,missing-docstring
# pylint: disable=missing-param-doc,missing-return-doc,unused-argument
"""Test waldiez.models.tool.predefined.protocol*."""

from typing import Any

from waldiez.models.tool.predefined import PredefinedTool


class DummyTool(PredefinedTool):
    """A dummy tool for testing purposes."""

    required_secrets = ["SECRET"]
    required_kwargs = {"arg1": str}

    @property
    def name(self) -> str:
        """Return the name of the tool."""
        return "dummy"

    @property
    def description(self) -> str:
        """Return a description of the tool."""
        return "A dummy tool for testing purposes."

    @property
    def requirements(self) -> list[str]:
        """Return the requirements for the tool."""
        return ["some-lib"]

    @property
    def tags(self) -> list[str]:
        """Return the tags associated with the tool."""
        return ["test"]

    @property
    def tool_imports(self) -> list[str]:
        """Return the imports required for the tool implementation."""
        return ["import os"]

    def validate_kwargs(self, kwargs: dict[str, Any]) -> list[str]:
        """Validate the provided keyword arguments."""
        return []

    def validate_secrets(self, secrets: dict[str, str]) -> list[str]:
        """Validate the provided secrets."""
        return []

    def get_content(self, secrets: dict[str, str]) -> str:  # noqa: D102
        return "Dummy content based on secrets."


def test_tool_conforms_to_protocol() -> None:
    """Test that the DummyTool conforms to the PredefinedTool protocol."""
    tool = DummyTool()
    assert isinstance(tool, PredefinedTool)
    assert tool.name == "dummy"
