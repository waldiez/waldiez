# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.tool.predefined.config."""

from waldiez.models.tool.predefined import PredefinedToolConfig

from .dummy_tool import DummyTool


def test_config_instantiation() -> None:
    """Test instantiation of PredefinedToolConfig."""
    config = PredefinedToolConfig(
        name="dummy",
        description="A test tool",
        required_secrets=["SECRET"],
        required_kwargs={"arg1": str},
        requirements=["some-lib"],
        tags=["test"],
        implementation=DummyTool(),
    )
    assert config.name == "dummy"
    assert config.implementation.name == "dummy"
