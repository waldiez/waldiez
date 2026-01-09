# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Test waldiez.models.agents.rag_user.rag_user.*."""

from waldiez.models.agents.rag_user_proxy.rag_user_proxy import (
    WaldiezRagUserProxy,
)


def test_waldiez_rag_user() -> None:
    """Test WaldiezRagUserProxy."""
    # noinspection PyArgumentList
    rag_user = WaldiezRagUserProxy(id="wa-1", name="rag_user")
    assert rag_user.agent_type == "rag_user_proxy"
    assert rag_user.data.human_input_mode == "ALWAYS"
    assert rag_user.retrieve_config
    assert rag_user.data.human_input_mode == "ALWAYS"
    assert rag_user.retrieve_config
