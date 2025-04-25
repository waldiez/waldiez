# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.swarm.on_condition_target."""

import pytest
from waldiez.models.agents.swarm_agent.on_condition_target import (
    WaldiezSwarmOnConditionTarget,
)


def test_waldiez_swarm_on_condition_target() -> None:
    """Test WaldiezSwarmOnConditionTarget."""
    on_condition_target = WaldiezSwarmOnConditionTarget(id="target", order=1)
    assert on_condition_target.id == "target"
    assert on_condition_target.order == 1

    with pytest.raises(ValueError):
        WaldiezSwarmOnConditionTarget(id="target", order="a")  # type: ignore
