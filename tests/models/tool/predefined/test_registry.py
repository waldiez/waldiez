# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Test waldiez.models.tool.predefined.registry.*."""

# noinspection PyProtectedMember
from waldiez.models.tool.predefined._config import PredefinedToolConfig
from waldiez.models.tool.predefined.registry import PREDEFINED_TOOLS


def test_registry_integrity() -> None:
    """Test the integrity of the predefined tools registry."""
    assert isinstance(PREDEFINED_TOOLS, dict)
    assert len(PREDEFINED_TOOLS) > 0

    for name, config in PREDEFINED_TOOLS.items():
        assert isinstance(config, PredefinedToolConfig)
        assert config.name == name
        assert hasattr(config.implementation, "name")
        assert hasattr(config.implementation, "required_secrets")
        assert hasattr(config.implementation, "required_kwargs") or hasattr(
            config.implementation, "kwargs_types"
        )
