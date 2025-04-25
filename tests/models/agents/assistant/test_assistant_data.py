# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.assistant.assistant_data.*."""

from waldiez.models.agents.assistant.assistant_data import WaldiezAssistantData


def test_waldiez_assistant_data() -> None:
    """Test WaldiezAssistantData."""
    assistant_data = WaldiezAssistantData()
    assert assistant_data.human_input_mode == "NEVER"
