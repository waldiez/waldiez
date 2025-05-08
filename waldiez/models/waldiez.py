# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez data class.

A Waldiez class contains all the information that is needed to generate
and run an autogen workflow. It has the model/LLM configurations, the agent
definitions and their optional additional skills to be used.
"""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Tuple, Union

from .agents import WaldiezAgent, get_retrievechat_extra_requirements
from .chat import WaldiezChat
from .common import get_autogen_version
from .flow import WaldiezFlow, get_flow_data
from .model import WaldiezModel, get_models_extra_requirements
from .skill import WaldiezSkill, get_skills_extra_requirements


@dataclass(frozen=True, slots=True)
class Waldiez:
    """Waldiez data class.

    It contains all the information to generate and run an autogen workflow.
    """

    flow: WaldiezFlow

    @classmethod
    def from_dict(
        cls,
        data: Dict[str, Any],
        flow_id: Optional[str] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        requirements: Optional[List[str]] = None,
    ) -> "Waldiez":
        """Create a Waldiez from dict.

        Parameters
        ----------
        data : Dict[str, Any]
            The data.
        flow_id : Optional[str], optional
            The flow id, by default None (retrieved from data or generated).
        name : Optional[str], optional
            The name, by default None (retrieved from data).
        description : Optional[str], optional
            The description, by default None (retrieved from data).
        tags : Optional[List[str]], optional
            The tags, by default None (retrieved from data).
        requirements : Optional[List[str]], optional
            The requirements, by default None (retrieved from data).

        Returns
        -------
        Waldiez
            The Waldiez.
        """
        flow = get_flow_data(
            data,
            flow_id=flow_id,
            name=name,
            description=description,
            tags=tags,
            requirements=requirements,
        )
        return cls(flow=WaldiezFlow.model_validate(flow))

    @classmethod
    def load(
        cls,
        waldiez_file: Union[str, Path],
        name: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        requirements: Optional[List[str]] = None,
    ) -> "Waldiez":
        """Load a Waldiez from a file.

        Parameters
        ----------
        waldiez_file : Union[str, Path]
            The Waldiez file.
        name : Optional[str], optional
            The name, by default None.
        description : Optional[str], optional
            The description, by default None.
        tags : Optional[List[str]], optional
            The tags, by default None.
        requirements : Optional[List[str]], optional
            The requirements, by default None.

        Returns
        -------
        Waldiez
            The Waldiez.

        Raises
        ------
        ValueError
            If the file is not found or invalid JSON.
        """
        data: Dict[str, Any] = {}
        if not Path(waldiez_file).exists():
            raise ValueError(f"File not found: {waldiez_file}")
        with open(waldiez_file, "r", encoding="utf-8") as file:
            try:
                data = json.load(file)
            except json.decoder.JSONDecodeError as error:
                raise ValueError(f"Invalid JSON: {waldiez_file}") from error
        return cls.from_dict(
            data,
            name=name,
            description=description,
            tags=tags,
            requirements=requirements,
        )

    def model_dump_json(
        self, by_alias: bool = True, indent: Optional[int] = None
    ) -> str:
        """Get the model dump json.

        We use `by_alias=True` by default to use the alias (toCamel).

        Parameters
        ----------
        by_alias : bool, optional
            Use alias (toCamel), by default True.
        indent : Optional[int], optional
            The indent, by default None.

        Returns
        -------
        str
            The model dump json.
        """
        return self.flow.model_dump_json(by_alias=by_alias, indent=indent)

    @property
    def has_rag_agents(self) -> bool:
        """Check if the flow has RAG agents."""
        return any(agent.agent_type == "rag_user" for agent in self.agents)

    @property
    def has_multimodal_agents(self) -> bool:
        """Check if the flow has multimodal agents."""
        return any(agent.data.is_multimodal for agent in self.agents)

    @property
    def has_captain_agents(self) -> bool:
        """Check if the flow has captain agents."""
        return any(agent.agent_type == "captain" for agent in self.agents)

    @property
    def chats(self) -> List[Tuple[WaldiezChat, WaldiezAgent, WaldiezAgent]]:
        """Get the chats."""
        return self.flow.ordered_flow

    @property
    def agents(self) -> Iterator[WaldiezAgent]:
        """Get the agents.

        Yields
        ------
        WaldiezAgent
            The flow agents.
        """
        yield from self.flow.data.agents.members

    @property
    def skills(self) -> Iterator[WaldiezSkill]:
        """Get the flow skills.

        Yields
        ------
        WaldiezSkill
            The skills.
        """
        yield from self.flow.data.skills

    @property
    def models(self) -> Iterator[WaldiezModel]:
        """Get the models.

        Yields
        ------
        WaldiezModel
            The flow models.
        """
        yield from self.flow.data.models

    @property
    def name(self) -> str:
        """Get the flow name."""
        return self.flow.name or "Waldiez Flow"

    @property
    def description(self) -> str:
        """Get the flow description."""
        return self.flow.description or "Waldiez Flow description"

    @property
    def tags(self) -> List[str]:
        """Get the flow tags."""
        return self.flow.tags

    @property
    def is_async(self) -> bool:
        """Check if the flow is asynchronous."""
        return self.flow.is_async

    @property
    def cache_seed(self) -> Optional[int]:
        """Get the cache seed."""
        return self.flow.cache_seed

    @property
    def is_single_agent_mode(self) -> bool:
        """Check if the flow is single agent mode."""
        return self.flow.is_single_agent_mode

    @property
    def requirements(self) -> List[str]:
        """Get the flow requirements."""
        autogen_version = get_autogen_version()
        requirements_list = filter(
            # we use the fixed "ag2=={autogen_version}" below
            lambda requirement: not (
                # cspell:disable-next-line
                requirement.startswith("pyautogen")
                or requirement.startswith("ag2")
                or requirement.startswith("autogen")
            ),
            self.flow.requirements,
        )
        requirements = set(requirements_list)
        requirements.add(f"ag2[openai]=={autogen_version}")
        if self.has_rag_agents:
            rag_extras = get_retrievechat_extra_requirements(self.agents)
            requirements.update(rag_extras)
        if self.has_multimodal_agents:
            requirements.add(f"ag2[lmm]=={autogen_version}")
        if self.has_captain_agents:
            # pysqlite3-binary might not get installed on windows
            captain_extras = [
                "chromadb",
                "sentence-transformers",
                "huggingface-hub",
                # tools:
                "pillow",
                "markdownify",
                "arxiv",
                "pymupdf",
                "wikipedia-api",
                "easyocr",
                "python-pptx",
                "openai-whisper",
                "pandas",
                "scipy",
            ]
            requirements.update(captain_extras)
        requirements.update(
            get_models_extra_requirements(
                self.models,
                autogen_version=autogen_version,
            )
        )
        requirements.update(
            get_skills_extra_requirements(
                self.skills,
                autogen_version=autogen_version,
            )
        )
        return sorted(requirements)

    def get_flow_env_vars(self) -> List[Tuple[str, str]]:
        """Get the flow environment variables.

        Returns
        -------
        List[Tuple[str, str]]
            The environment variables for the flow.
        """
        env_vars: List[Tuple[str, str]] = []
        for skill in self.skills:
            for secret_key, secret_value in skill.secrets.items():
                env_vars.append((secret_key, secret_value))
        return env_vars

    def get_group_chat_members(self, agent: WaldiezAgent) -> List[WaldiezAgent]:
        """Get the chat members that connect to a group chat manager agent.

        Parameters
        ----------
        agent : WaldiezAgent
            The agent (group chat manager).

        Returns
        -------
        List[WaldiezAgent]
            The group chat members.
        """
        if agent.agent_type != "manager":
            return []
        return self.flow.get_group_chat_members(agent.id)

    def get_swarm_members(
        self, initial_agent: WaldiezAgent
    ) -> Tuple[List[WaldiezAgent], Optional[WaldiezAgent]]:
        """Get the chat members that connect to a swarm agent.

        Parameters
        ----------
        initial_agent : WaldiezAgent
            The initial agent.

        Returns
        -------
        Tuple[List[WaldiezAgent], Optional[WaldiezAgent]]
            The swarm agents and the user agent.
        """
        return self.flow.get_swarm_chat_members(initial_agent)
