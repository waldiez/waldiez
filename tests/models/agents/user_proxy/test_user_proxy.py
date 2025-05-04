# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.user_proxy.user_proxy.*."""

from waldiez.models.agents.user_proxy.user_proxy import WaldiezUserProxy


def test_waldiez_user_proxy() -> None:
    """Test WaldiezUserProxy."""
    user_proxy = WaldiezUserProxy(id="wa-1", name="user")
    assert user_proxy.data.human_input_mode == "ALWAYS"
    assert user_proxy.agent_type == "user_proxy"
