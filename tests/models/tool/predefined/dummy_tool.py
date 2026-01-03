# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-function-docstring,missing-docstring
# pylint: disable=missing-param-doc,missing-return-doc,unused-argument
"""Dummy tool for testing purposes."""

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

    def get_content(
        self,
        secrets: dict[str, str],
        runtime_kwargs: dict[str, Any] | None = None,
    ) -> str:
        """Get the content for the tool."""
        return "Dummy content based on secrets."
