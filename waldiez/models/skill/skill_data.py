# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Skill model."""

from typing import Dict

from pydantic import Field
from typing_extensions import Annotated

from ..common import WaldiezBase
from .skill_type import WaldiezSkillType


class WaldiezSkillData(WaldiezBase):
    """Waldiez Skill Data.

    Attributes
    ----------
    skill_type : WaldiezSkillType
        The type of the skill: shared, custom, langchain, crewai.
    content : str
        The content (source code) of the skill.
    secrets : Dict[str, str]
        The secrets (environment variables) of the skill.
    """

    skill_type: Annotated[
        WaldiezSkillType,
        Field(
            "custom",
            alias="skillType",
            title="Skill Type",
            description=(
                "The type of the skill: shared, custom, langchain, crewai."
            ),
        ),
    ] = "custom"
    content: Annotated[
        str,
        Field(
            ...,
            title="Content",
            description="The content (source code) of the skill.",
        ),
    ]
    secrets: Annotated[
        Dict[str, str],
        Field(
            default_factory=dict,
            title="Secrets",
            description="The secrets (environment variables) of the skill.",
        ),
    ]
