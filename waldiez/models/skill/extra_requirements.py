# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez skill extra requirements."""

from typing import Iterator, Set

from .skill import WaldiezSkill


def get_skills_extra_requirements(
    skills: Iterator[WaldiezSkill],
    autogen_version: str,
) -> Set[str]:
    """Get the skills extra requirements.

    Parameters
    ----------
    skills : List[WaldiezSkill]
        The skills.
    autogen_version : str
        The ag2 version.

    Returns
    -------
    List[str]
        The skills extra requirements.
    """
    skill_requirements: Set[str] = set()
    for skill in skills:
        if skill.skill_type == "langchain":
            skill_requirements.add(
                f"pyautogen[interop-langchain]=={autogen_version}"
            )
        if skill.skill_type == "crewai":
            skill_requirements.add(
                f"pyautogen[interop-crewai]=={autogen_version}"
            )
        for requirement in skill.requirements:
            skill_requirements.add(requirement)
    return skill_requirements
