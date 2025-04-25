# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.skill.skill_data.*."""

import pytest
from waldiez.models.skill import WaldiezSkillData


def test_waldiez_skill_data() -> None:
    """Test WaldiezSkillData."""
    # Given
    content = "print('hello, world')"
    secrets = {"API_KEY": "api_key"}
    # When
    skill_data = WaldiezSkillData(content=content, secrets=secrets)
    # Then
    assert skill_data.content == content
    assert skill_data.secrets == secrets

    # Given
    skill_data = WaldiezSkillData(content=content)
    # Then
    assert skill_data.content == content
    assert not skill_data.secrets

    with pytest.raises(ValueError):
        skill_data = WaldiezSkillData()
