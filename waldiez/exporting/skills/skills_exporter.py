# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Skills/tools related string generation functions.

Functions
---------
get_agent_skill_registration
    Get an agent's skill registration string.
export_skills
    Get the skills content and secrets.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

from waldiez.models import WaldiezAgent, WaldiezSkill

from ..base import (
    AgentPosition,
    AgentPositions,
    BaseExporter,
    ExporterMixin,
    ExporterReturnType,
    ExportPosition,
    ImportPosition,
)
from .utils import export_skills, get_agent_skill_registrations


class SkillsExporter(BaseExporter, ExporterMixin):
    """Skill exporter."""

    def __init__(
        self,
        flow_name: str,
        agents: List[WaldiezAgent],
        agent_names: Dict[str, str],
        skills: List[WaldiezSkill],
        skill_names: Dict[str, str],
        output_dir: Optional[Union[str, Path]] = None,
    ) -> None:
        """Initialize the skill exporter.

        Parameters
        ----------
        flow_name : str
            The name of the flow.
        agents : List[WaldiezAgent]
            The agents.
        agent_names : Dict[str, str]
            The agent names.
        skills : List[WaldiezSkill]
            The skills.
        skill_names : Dict[str, str]
            The skill names.
        output_dir : Optional[Union[str, Path]], optional
            The output directory if any, by default None
        """
        self.flow_name = flow_name
        self.agents = agents
        self.agent_names = agent_names
        self.skills = skills
        self.skill_names = skill_names
        self.output_dir = output_dir
        self.skill_imports, self.skill_secrets, self.skills_contents = (
            export_skills(
                flow_name=flow_name,
                skills=skills,
                skill_names=skill_names,
                output_dir=output_dir,
            )
        )

    def get_environment_variables(self) -> List[Tuple[str, str]]:
        """Get the environment variables to set.

        Returns
        -------
        List[Tuple[str, str]]
            The environment variables to set.
        """
        return self.skill_secrets

    def get_imports(self) -> List[Tuple[str, ImportPosition]]:
        """Generate the imports string.

        Returns
        -------
        Tuple[str, int]
            The exported imports and the position of the imports.
        """
        imports: List[Tuple[str, ImportPosition]] = []
        if not self.skill_imports:
            return imports
        # standard imports
        for import_statement in self.skill_imports[0]:
            imports.append((import_statement, ImportPosition.BUILTINS))
        # third party imports
        for import_statement in self.skill_imports[1]:
            imports.append((import_statement, ImportPosition.THIRD_PARTY))
        # secrets/local imports
        for import_statement in self.skill_imports[2]:
            imports.append((import_statement, ImportPosition.LOCAL))
        return imports

    def get_before_export(
        self,
    ) -> Optional[List[Tuple[str, Union[ExportPosition, AgentPosition]]]]:
        """Generate the content before the main export.

        Returns
        -------
        Optional[List[Tuple[str, Union[ExportPosition, AgentPosition]]]]
            The exported content before the main export and its position.
        """

    def generate(self) -> Optional[str]:
        """Generate the main export.

        Returns
        -------
        Optional[str]
            The exported content.
        """
        return self.skills_contents

    def get_after_export(
        self,
    ) -> Optional[List[Tuple[str, Union[ExportPosition, AgentPosition]]]]:
        """Generate the content after the main export.

        Returns
        -------
        Optional[List[Tuple[str, Union[ExportPosition, AgentPosition]]]]
            The exported content after the main export and its position.
        """
        agent_registrations: List[
            Tuple[str, Union[ExportPosition, AgentPosition]]
        ] = []
        for agent in self.agents:
            agent_registration = get_agent_skill_registrations(
                agent=agent,
                agent_names=self.agent_names,
                all_skills=self.skills,
                skill_names=self.skill_names,
                string_escape=self.string_escape,
            )
            if agent_registration:
                # after all agents since we use the executor
                # (it might not yet be defined)
                position = AgentPosition(None, AgentPositions.AFTER_ALL, 1)
                agent_registrations.append((agent_registration, position))
        return agent_registrations

    def export(self) -> ExporterReturnType:
        """Export the skills.

        Returns
        -------
        ExporterReturnType
            The exported skills content, the imports,
            the before export strings, the after export strings,
            and the environment variables.
        """
        content = self.generate()
        imports = self.get_imports()
        after_export = self.get_after_export()
        environment_variables = self.get_environment_variables()
        result: ExporterReturnType = {
            "content": content,
            "imports": imports,
            "before_export": None,
            "after_export": after_export,
            "environment_variables": environment_variables,
        }
        return result
