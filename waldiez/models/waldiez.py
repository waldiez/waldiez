# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=too-many-public-methods
"""Waldiez data class.

A Waldiez class contains all the information needed to generate
and run an autogen workflow. It has the model/LLM configurations, the agent
definitions and their optional additional tools to be used.
"""

import asyncio
import json
import tempfile
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import aiofiles
from packaging.requirements import Requirement

from .agents import (
    WaldiezAgent,
    WaldiezGroupManager,
    get_captain_agent_extra_requirements,
    get_retrievechat_extra_requirements,
)
from .common import get_autogen_version, safe_filename
from .flow import (
    WaldiezAgentConnection,
    WaldiezFlow,
    WaldiezFlowInfo,
    get_flow_data,
)
from .model import WaldiezModel, get_models_extra_requirements
from .tool import WaldiezTool, get_tools_extra_requirements


@dataclass(frozen=True, slots=True)
class Waldiez:
    """Waldiez data class.

    It contains all the information to generate and run an autogen workflow.
    """

    flow: WaldiezFlow

    @classmethod
    def default(cls) -> "Waldiez":
        """Create a default Waldiez instance.

        Returns
        -------
        Waldiez
            The default Waldiez instance.
        """
        flow = WaldiezFlow.default()
        return cls(flow=flow)

    @classmethod
    def from_dict(
        cls,
        data: dict[str, Any],
        flow_id: str | None = None,
        name: str | None = None,
        description: str | None = None,
        tags: list[str] | None = None,
        requirements: list[str] | None = None,
    ) -> "Waldiez":
        """Create a Waldiez from dict.

        Parameters
        ----------
        data : dict[str, Any]
            The data.
        flow_id : str | None, optional
            The flow id, by default None (retrieved from data or generated).
        name: str | None, optional
            The name, by default None (retrieved from data).
        description : str | None, optional
            The description, by default None (retrieved from data).
        tags: list[str] | None, optional
            The tags, by default None (retrieved from data).
        requirements: list[str] | None, optional
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
        validated = WaldiezFlow.model_validate(flow)
        return cls(flow=validated)

    @classmethod
    def load(
        cls,
        waldiez_file: str | Path,
        name: str | None = None,
        description: str | None = None,
        tags: list[str] | None = None,
        requirements: list[str] | None = None,
    ) -> "Waldiez":
        """Load a Waldiez from a file.

        Parameters
        ----------
        waldiez_file : Union[str, Path]
            The Waldiez file.
        name: str | None, optional
            The name, by default None (retrieved from data).
        description : str | None, optional
            The description, by default None (retrieved from data).
        tags: list[str] | None, optional
            The tags, by default None (retrieved from data).
        requirements: list[str] | None, optional
            The requirements, by default None (retrieved from data).

        Returns
        -------
        Waldiez
            The Waldiez.

        Raises
        ------
        ValueError
            If the file is not found or invalid JSON.
        """
        data: dict[str, Any] = {}
        if not Path(waldiez_file).exists():
            raise ValueError(f"File not found: {waldiez_file}")
        with open(waldiez_file, "r", encoding="utf-8", newline="\n") as file:
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

    @classmethod
    async def a_load(
        cls,
        waldiez_file: str | Path,
        name: str | None = None,
        description: str | None = None,
        tags: list[str] | None = None,
        requirements: list[str] | None = None,
    ) -> "Waldiez":
        """Load a Waldiez from a file.

        Parameters
        ----------
        waldiez_file : Union[str, Path]
            The Waldiez file.
        name: str | None, optional
            The name, by default None (retrieved from data).
        description : str | None, optional
            The description, by default None (retrieved from data).
        tags: list[str] | None, optional
            The tags, by default None (retrieved from data).
        requirements: list[str] | None, optional
            The requirements, by default None (retrieved from data).

        Returns
        -------
        Waldiez
            The Waldiez.

        Raises
        ------
        ValueError
            If the file is not found or invalid JSON.
        """
        data: dict[str, Any] = {}
        if not Path(waldiez_file).exists():
            raise ValueError(f"File not found: {waldiez_file}")
        async with aiofiles.open(
            waldiez_file, "r", encoding="utf-8", newline="\n"
        ) as file:
            try:
                contents = await file.read()
                data = json.loads(contents)
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
        self, by_alias: bool = True, indent: int | None = None
    ) -> str:
        """Get the model dump json.

        We use `by_alias=True` by default to use the alias (toCamel).

        Parameters
        ----------
        by_alias : bool, optional
            Use alias (toCamel), by default True.
        indent : int | None, optional
            The indent, by default None.

        Returns
        -------
        str
            The model dump json.
        """
        return self.flow.model_dump_json(by_alias=by_alias, indent=indent)

    @property
    def id(self) -> str:
        """Get the flow id."""
        return self.flow.id

    @property
    def has_rag_agents(self) -> bool:
        """Check if the flow has RAG agents."""
        return any(agent.is_rag_user for agent in self.agents)

    @property
    def has_doc_agents(self) -> bool:
        """Check if the flow has document agents."""
        return any(agent.is_doc_agent for agent in self.agents)

    @property
    def has_multimodal_agents(self) -> bool:
        """Check if the flow has multimodal agents."""
        return any(
            agent.data.is_multimodal
            for agent in self.flow.data.agents.assistantAgents
        )

    @property
    def has_remote_agents(self) -> bool:
        """Check if the flow has remote agents."""
        return any(agent.is_remote for agent in self.agents)

    @property
    def has_captain_agents(self) -> bool:
        """Check if the flow has captain agents."""
        return any(agent.is_captain for agent in self.agents)

    @property
    def initial_chats(
        self,
    ) -> list[WaldiezAgentConnection]:
        """Get the chats."""
        return self.flow.ordered_flow

    @property
    def is_group_pattern_based(
        self,
    ) -> bool:
        """Check if the group manager should use pattern strategy.

        Returns
        -------
        bool
            True if pattern strategy should be used, False otherwise.
        """
        if not self.initial_chats:
            return True

        first_chat = self.initial_chats[0]["chat"]
        return (
            isinstance(first_chat.data.message, str)
            or not first_chat.data.message.is_method()
        )

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
    def tools(self) -> Iterator[WaldiezTool]:
        """Get the flow tools.

        Yields
        ------
        WaldiezTool
            The tools.
        """
        yield from self.flow.data.tools

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
    def info(self) -> WaldiezFlowInfo:
        """Get the flow info."""
        return WaldiezFlowInfo.create(
            agents=self.agents,
            agent_names=self.flow.unique_names["agent_names"],
        )

    @property
    def name(self) -> str:
        """Get the flow name."""
        return self.flow.name or "Waldiez Flow"

    @property
    def description(self) -> str:
        """Get the flow description."""
        return self.flow.description or "Waldiez Flow description"

    @property
    def tags(self) -> list[str]:
        """Get the flow tags."""
        return self.flow.tags

    @property
    def is_async(self) -> bool:
        """Check if the flow is asynchronous."""
        return self.flow.is_async

    @property
    def cache_seed(self) -> int | None:
        """Get the cache seed."""
        return self.flow.cache_seed

    @property
    def is_single_agent_mode(self) -> bool:
        """Check if the flow is single agent mode."""
        return self.flow.is_single_agent_mode

    @property
    def skip_deps(self) -> bool:
        """Check if we should skip installing dependencies.

        This can be overridden later at the runner.
        """
        return self.flow.skip_deps is True

    @property
    def requirements(self) -> list[str]:
        """Get the flow requirements."""
        autogen_version = get_autogen_version()

        reqs: set[str] = set(self.flow.requirements)

        if self.has_rag_agents:  # pragma: no branch
            reqs.update(get_retrievechat_extra_requirements(list(self.agents)))

        if self.has_multimodal_agents:  # pragma: no branch
            reqs.add(
                f"ag2[lmm]=={autogen_version}"
            )  # ok to add; we'll normalize later

        if self.has_captain_agents:  # pragma: no branch
            reqs.update(get_captain_agent_extra_requirements())

        if self.has_remote_agents:
            reqs.add(f"ag2[a2a]=={autogen_version}")

        for doc_agent in self.flow.data.agents.docAgents:
            reqs.update(
                doc_agent.get_llm_requirements(
                    ag2_version=autogen_version,
                    all_models=list(self.models),
                )
            )

        reqs.update(
            get_models_extra_requirements(
                list(self.models), autogen_version=autogen_version
            )
        )
        reqs.update(
            get_tools_extra_requirements(
                list(self.tools), autogen_version=autogen_version
            )
        )
        reqs = self._finalize_requirements(
            reqs, autogen_version, always_ag2_extras={"openai"}
        )

        return sorted(reqs)

    @staticmethod
    def _finalize_requirements(
        reqs: set[str],
        autogen_version: str,
        always_ag2_extras: set[str] | None = None,
    ) -> set[str]:
        always_ag2_extras = always_ag2_extras or {"openai"}

        kept: set[str] = set()
        ag2_extras: set[str] = set()

        for raw in reqs:
            s = raw.strip()
            if not s:
                continue

            try:
                r = Requirement(s)
            except Exception:  # pylint: disable=broad-exception-caught
                kept.add(s)
                continue

            name = (r.name or "").lower()
            if name in {"ag2", "autogen"}:
                ag2_extras.update(r.extras)
                # drop it; we’ll re-add a single pinned ag2 later
                continue

            kept.add(s)

        merged_extras = set(always_ag2_extras) | ag2_extras
        extras_part = ",".join(sorted(merged_extras))
        kept.add(f"ag2[{extras_part}]=={autogen_version}")
        return kept

    def get_flow_env_vars(self) -> list[tuple[str, str]]:
        """Get the flow environment variables.

        Returns
        -------
        list[tuple[str, str]]
            The environment variables for the flow.
        """
        env_vars: list[tuple[str, str]] = []
        for tool in self.tools:
            for secret_key, secret_value in tool.secrets.items():
                env_vars.append((secret_key, secret_value))
        for model in self.models:
            api_env_key = model.api_key_env_key
            api_key = model.api_key
            if api_env_key and api_key:  # pragma: no branch
                env_vars.append((api_env_key, api_key))
        return env_vars

    def get_root_group_manager(self) -> WaldiezGroupManager:
        """Get the root group manager agent.

        Returns
        -------
        WaldiezGroupManager
            The root group manager agent.

        Raises
        ------
        ValueError
            If the root group manager agent is not found.
        """
        return self.flow.get_root_group_manager()

    def get_group_chat_members(self, agent: WaldiezAgent) -> list[WaldiezAgent]:
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
        if not agent.is_group_manager:
            return []
        return self.flow.get_group_chat_members(agent.id)

    def dump(self, to: str | Path | None = None) -> Path:
        """Dump waldiez flow to a file.

        Parameters
        ----------
        to : str | Path | None
            Optional output path to determine the directory to save the flow to.

        Returns
        -------
        Path
            The path to the generated file.
        """
        file_path = Path(to) if to else None
        if file_path:
            file_name = file_path.name
            if not file_name.endswith(".waldiez"):
                file_path.with_suffix(".waldiez")

        else:
            full_name = self.name
            file_name = safe_filename(full_name, "waldiez")
        file_dir: Path
        if file_path:
            file_dir = file_path if file_path.is_dir() else file_path.parent
        else:
            file_dir = Path(tempfile.mkdtemp())
        file_dir.mkdir(parents=True, exist_ok=True)
        output_path = file_dir / file_name
        with output_path.open(
            "w", encoding="utf-8", errors="replace", newline="\n"
        ) as f_open:
            f_open.write(self.model_dump_json())
        return output_path

    async def a_dump(self, to: str | Path | None = None) -> Path:
        """Dump waldiez flow to a file asynchronously.

        Parameters
        ----------
        to : str | Path | None
            Optional output path to determine the directory to save the flow to.

        Returns
        -------
        Path
            The path to the generated file.
        """
        file_path = Path(to) if to else None
        if file_path:
            file_name = file_path.name
            if not file_name.endswith(".waldiez"):
                file_path.with_suffix(".waldiez")
        else:
            full_name = self.name
            file_name = safe_filename(full_name, "waldiez")
        file_dir: Path
        if file_path:
            file_dir = file_path if file_path.is_dir() else file_path.parent
        else:
            tmp_dir = await asyncio.to_thread(tempfile.mkdtemp)
            file_dir = Path(tmp_dir)
        file_dir.mkdir(parents=True, exist_ok=True)
        output_path = file_dir / file_name
        async with aiofiles.open(
            output_path, "w", encoding="utf-8", errors="replace", newline="\n"
        ) as f_open:
            await f_open.write(self.model_dump_json())
        return output_path
