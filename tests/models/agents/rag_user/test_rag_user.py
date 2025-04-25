# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.rag_user.rag_user.*."""

from waldiez.models.agents.rag_user.rag_user import WaldiezRagUser


def test_waldiez_rag_user() -> None:
    """Test WaldiezRagUser."""
    rag_user = WaldiezRagUser(id="wa-1", name="rag_user")
    assert rag_user.agent_type == "rag_user"
    assert rag_user.data.human_input_mode == "ALWAYS"
    assert rag_user.retrieve_config
