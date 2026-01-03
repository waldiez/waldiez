# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.assistant.assistant.*."""

from waldiez.models.agents.assistant.assistant import WaldiezAssistant


def test_waldiez_assistant() -> None:
    """Test WaldiezAssistant."""
    # noinspection PyArgumentList
    assistant = WaldiezAssistant(id="wa-1", name="assistant")
    assert assistant.data.human_input_mode == "NEVER"
    assert assistant.agent_type == "assistant"
