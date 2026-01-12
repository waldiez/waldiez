# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Flow export orchestrator."""

from typing import Any, Callable

from waldiez.models import Waldiez, WaldiezAgent, WaldiezGroupManager

from ..agent import AgentExporter, create_agent_exporter
from ..chats import ChatsExporter, create_chats_exporter
from ..core import (
    AgentPosition,
    ContentOrder,
    ExporterContext,
    ExportPosition,
    ExportResult,
    ImportPosition,
)
from ..models import ModelsExporter, create_models_exporter
from ..tools import ToolsExporter, create_tools_exporter
from .merger import ContentMerger
from .utils import (
    generate_header,
    get_after_run_content,
    get_common_env_var_setup,
    get_np_no_nep50_handle,
    get_sqlite_out,
    get_start_logging,
    get_stop_logging,
    get_the_imports_string,
)


# pylint: disable=no-self-use,too-many-instance-attributes
# noinspection PyMethodMayBeStatic
class ExportOrchestrator:
    """Coordinates the export process."""

    def __init__(
        self,
        waldiez: Waldiez,
        context: ExporterContext,
    ) -> None:
        """Initialize the export orchestrator.

        Parameters
        ----------
        waldiez : Waldiez
            The Waldiez instance containing the flow to export.
        context : ExporterContext
            The exporter context containing dependencies and configuration.
        """
        self.waldiez = waldiez
        self.context = context
        self.config = context.get_config()
        self._tools_exporter: ToolsExporter | None = None
        self._models_exporter: ModelsExporter | None = None
        self._chats_exporter: ChatsExporter | None = None
        self.logger = context.get_logger()
        self._initialize()

    def _initialize(self) -> None:
        """Initialize the orchestrator with necessary configurations."""
        unique_names = self.waldiez.flow.unique_names
        self.flow_name = unique_names["flow_name"]
        self.agents = unique_names["agents"]
        self.models = unique_names["models"]
        self.tools = unique_names["tools"]
        self.chats = unique_names["chats"]
        self.agent_names = unique_names["agent_names"]
        self.model_names = unique_names["model_names"]
        self.tool_names = unique_names["tool_names"]
        self.chat_names = unique_names["chat_names"]

    def orchestrate(self) -> ExportResult:
        """Orchestrate the export process.

        Returns
        -------
        ExportResult
            The result of the export process,
            containing the generated script and any additional metadata.
        """
        results: list[ExportResult] = []
        agent_arguments: dict[str, list[str]] = {}

        # 1. Tools first (needed by agents)
        if self.waldiez.tools:
            self.logger.info("Exporting tools ...")
            tools_result = self._get_tools_exporter().export()
            # Extract tool arguments for agents
            tool_arguments = self._extract_agent_arguments_from_result(
                tools_result
            )
            # Merge tool arguments into agent arguments
            self._merge_agent_arguments(
                source=tool_arguments,
                target=agent_arguments,
            )
            results.append(tools_result)
            self.logger.debug("Exported %s", tools_result)

        # 2. Models second (needed by agents)
        if self.waldiez.models:
            self.logger.info("Exporting models ...")
            models_result = self._get_models_exporter().export()
            # Extract model arguments for agents
            model_arguments = self._extract_agent_arguments_from_result(
                models_result
            )
            # Merge model arguments into agent arguments
            self._merge_agent_arguments(
                source=model_arguments,
                target=agent_arguments,
            )
            results.append(models_result)
            self.logger.debug("Exported %s", models_result)
        # 3. Chats third (agents might need agent chat registrations)
        # we always have at least one chat (already validated in Waldiez init)
        self.logger.info("Exporting chats ...")
        chats_result = self._get_chats_exporter().export()
        self.logger.debug("Exported %s", chats_result)
        # Extract chat arguments for agents
        chat_arguments = self._extract_agent_arguments_from_result(chats_result)
        # Merge chat arguments into agent arguments
        self._merge_agent_arguments(
            source=chat_arguments,
            target=agent_arguments,
        )
        results.append(chats_result)

        # 4. Agents last
        # we always have at least one agent (already validated in Waldiez init)
        self.logger.info("Exporting agents ...")
        agent_results = self._export_all_agents(agent_arguments)
        results.extend(agent_results)

        # 5. Merge everything
        merger = ContentMerger(self.context)
        merged_result = merger.merge_results(results)
        # Check for issues
        stats = merger.get_merge_statistics()
        if stats.conflicts_found:
            self.logger.warning(
                "Resolved %d merge conflicts", len(stats.conflicts_found)
            )
        self.logger.debug("Merged result: %s", merged_result)
        return self._finalize_export(merged_result)

    def _finalize_export(self, merged_result: ExportResult) -> ExportResult:
        """Finalize the export result with additional content.

        Parameters
        ----------
        merged_result : ExportResult
            The merged export result containing all content.

        Returns
        -------
        ExportResult
            The finalized export result with additional content.
        """
        merged_result.add_content(
            generate_header(
                name=self.waldiez.name,
                description=self.waldiez.description,
                requirements=self.waldiez.requirements,
                tags=self.waldiez.tags,
                for_notebook=self.config.for_notebook,
            ),
            position=ExportPosition.TOP,  # before everything
            order=ContentOrder.EARLY_SETUP,
        )
        merged_result.add_content(
            get_common_env_var_setup(),
            position=ExportPosition.IMPORTS,  # after imports (need os)
            order=ContentOrder.CLEANUP,
        )
        merged_result.add_content(
            get_np_no_nep50_handle(),
            position=ExportPosition.IMPORTS,  # after imports (need np)
            order=ContentOrder.CLEANUP.value + 1,
        )
        if not self.should_skip_logging():
            merged_result.add_content(
                get_start_logging(
                    is_async=self.waldiez.is_async,
                    for_notebook=self.config.for_notebook,
                ),
                position=ExportPosition.IMPORTS,  # after imports, before models
                order=ContentOrder.CLEANUP.value + 2,  # after imports and np
                skip_strip=True,  # keep newlines
            )
        # merged_result.add_content
        merged_result.add_content(
            get_sqlite_out(is_async=self.waldiez.is_async),
            position=ExportPosition.AGENTS,
            order=ContentOrder.LATE_CLEANUP.value + 1,  # after all agents
        )
        merged_result.add_content(
            get_stop_logging(is_async=self.waldiez.is_async),
            position=ExportPosition.AGENTS,
            order=ContentOrder.LATE_CLEANUP.value
            + 2,  # before def main (chats)
        )
        all_imports: list[tuple[str, ImportPosition]] = [
            (item.statement, item.position)
            for item in merged_result.get_sorted_imports()
        ]
        import_string = get_the_imports_string(
            all_imports=all_imports,
            is_async=self.waldiez.is_async,
        )
        merged_result.add_content(
            import_string,
            position=ExportPosition.IMPORTS,  # imports section
            order=ContentOrder.EARLY_SETUP,  # top position
        )
        known_agents_string = self._get_the_known_agents_string()
        merged_result.add_content(
            known_agents_string,
            position=ExportPosition.AGENTS,
            order=ContentOrder.POST_CONTENT.value + 100,
        )
        return merged_result

    def get_after_run_content(self) -> str:
        """Get the content to be executed after the main flow run.

        Returns
        -------
        str
            The content to be executed after the main flow run.
        """
        return get_after_run_content(
            waldiez=self.waldiez,
            agent_names=self.agent_names,
            tabs=1,
        )

    def _get_the_known_agents_string(self) -> str:
        """Get the _get_known_agents method."""
        content: str = """

def _check_for_extra_agents(agent: ConversableAgent) -> list[ConversableAgent]:
    _extra_agents: list[ConversableAgent] = []
    _agent_cls_name = agent.__class__.__name__
    if _agent_cls_name == "CaptainAgent":
        _assistant_agent = getattr(agent, "assistant", None)
        if _assistant_agent and _assistant_agent not in _extra_agents:
            _extra_agents.append(_assistant_agent)
        _executor_agent = getattr(agent, "executor", None)
        if _executor_agent and _executor_agent not in _extra_agents:
            _extra_agents.append(_executor_agent)
    return _extra_agents


def _check_for_group_members(agent: ConversableAgent) -> list[ConversableAgent]:
    _extra_agents: list[ConversableAgent] = []
    _group_chat = getattr(agent, "_groupchat", None)
    if _group_chat:
        _chat_agents = getattr(_group_chat, "agents", [])
        if isinstance(_chat_agents, list):
            for _group_member in _chat_agents:
                if _group_member not in _extra_agents:
                    _extra_agents.append(_group_member)
    _manager = getattr(agent, "_group_manager", None)
    if _manager:
        if _manager not in _extra_agents:
            _extra_agents.append(_manager)
        for _group_member in _check_for_group_members(_manager):
            if _group_member not in _extra_agents:
                _extra_agents.append(_group_member)
    return _extra_agents


def _get_known_agents() -> list[ConversableAgent]:
    _known_agents: list[ConversableAgent] = []"""
        # group_manager: WaldiezGroupManager | None = None
        for agent in self.waldiez.agents:
            if (
                isinstance(agent, WaldiezGroupManager)
                and self.waldiez.is_group_pattern_based
            ):
                # not defined in agents
                # we'll get it from "._group_manager"
                # if found in the rest of the agents.
                continue
            agent_name = self.agent_names.get(agent.id)
            if agent_name:
                content += f"""
    if {agent_name} not in _known_agents:
        _known_agents.append({agent_name})
    _known_agents.append({agent_name})
    for _group_member in _check_for_group_members({agent_name}):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents({agent_name}):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)
"""
        content += "    return _known_agents\n\n"
        return content

    def _get_tools_exporter(self) -> ToolsExporter:
        """Get or create tools exporter."""
        if self._tools_exporter is None:
            self._tools_exporter = create_tools_exporter(
                flow_name=self.flow_name,
                agents=self.agents,
                agent_names=self.agent_names,
                tools=self.tools,
                tool_names=self.tool_names,
                is_async=self.waldiez.is_async,
                output_dir=self.config.output_directory,
                context=self.context,
            )
        return self._tools_exporter

    def _get_models_exporter(self) -> ModelsExporter:
        """Get or create models exporter."""
        if self._models_exporter is None:
            self._models_exporter = create_models_exporter(
                flow_name=self.flow_name,
                agents=self.agents,
                agent_names=self.agent_names,
                models=self.models,
                model_names=self.model_names,
                for_notebook=self.config.for_notebook,
                cache_seed=self.config.cache_seed,
                output_dir=self.config.output_directory,
                context=self.context,
            )
        return self._models_exporter

    def _get_chats_exporter(self) -> ChatsExporter:
        """Get or create chats exporter."""
        if self._chats_exporter is None:
            # noinspection PyTypeChecker
            self._chats_exporter = create_chats_exporter(
                waldiez=self.waldiez,
                all_agents=self.agents,
                agent_names=self.agent_names,
                models=self.models,
                model_names=self.model_names,
                tools=self.tools,
                tool_names=self.tool_names,
                all_chats=self.chats,
                main_chats=self.waldiez.initial_chats,
                chat_names=self.chat_names,
                output_dir=self.config.output_directory,
                context=self.context,
            )
        return self._chats_exporter

    # pylint: disable=no-self-use
    def _create_agent_arguments_resolver(
        self, exported_arguments: dict[str, Any]
    ) -> Callable[[WaldiezAgent], list[str]]:
        """Create an arguments resolver function for a specific agent.

        Parameters
        ----------
        exported_arguments : dict[str, Any]
            A dictionary containing exported arguments for agents,
            models, and tools.

        Returns
        -------
        Callable[[WaldiezAgent], list[str]]
            A function that takes a WaldiezAgent and returns a list of
            arguments to be used for that agent.
        """

        def arguments_resolver(target_agent: WaldiezAgent) -> list[str]:
            """Resolve arguments for the target agent.

            Parameters
            ----------
            target_agent : WaldiezAgent
                The agent for which to resolve arguments.

            Returns
            -------
            list[str]
                A list of arguments to be used for the agent.
            """
            # Extract arguments from exported_arguments
            return exported_arguments.get(target_agent.id, [])

        return arguments_resolver

    def _create_agent_exporter(
        self,
        agent: WaldiezAgent,
        agent_arguments: dict[str, list[str]],
    ) -> AgentExporter:
        """Create an exporter for a specific agent."""
        # noinspection PyTypeChecker
        return create_agent_exporter(
            agent=agent,
            agent_names=self.agent_names,
            models=(self.models, self.model_names),
            chats=(self.chats, self.chat_names),
            initial_chats=self.waldiez.initial_chats,
            tool_names=self.tool_names,
            cache_seed=self.waldiez.cache_seed,
            is_async=self.waldiez.is_async,
            for_notebook=self.config.for_notebook,
            output_dir=self.config.output_directory,
            context=self.context,
            group_chat_members=self.waldiez.get_group_chat_members(agent),
            arguments_resolver=self._create_agent_arguments_resolver(
                exported_arguments=agent_arguments,
            ),
        )

    # noinspection PyMethodMayBeStatic
    def _extract_agent_arguments_from_result(
        self, result: ExportResult
    ) -> dict[str, list[str]]:
        """Extract agent-specific arguments from an export result."""
        agent_args: dict[str, list[str]] = {}

        for content in result.positioned_content:
            # Look for content positioned as agent arguments
            if (
                content.position == ExportPosition.AGENTS
                and content.agent_position == AgentPosition.AS_ARGUMENT
                and content.agent_id
            ):
                if content.agent_id not in agent_args:
                    agent_args[content.agent_id] = []

                # The content itself is the argument string
                strip_content = content.content.strip()
                if strip_content:
                    # Add the content as an argument for the agent
                    agent_args[content.agent_id].append(f"    {strip_content}")

        return agent_args

    def _merge_agent_arguments(
        self, target: dict[str, list[str]], source: dict[str, list[str]]
    ) -> None:
        """Merge agent arguments from source into target."""
        for agent_id, args in source.items():
            if agent_id not in target:
                target[agent_id] = []
            target[agent_id].extend(args)

    def _gather_agent_arguments(self) -> dict[str, Any]:
        """Gather exported arguments from all agents, models, and tools.

        Returns
        -------
        dict[str, Any]
            A dictionary containing exported arguments for agents,
            models, and tools.
        """
        exported_arguments: dict[str, Any] = {}
        return exported_arguments

    def _export_all_agents(
        self, exported_arguments: dict[str, Any]
    ) -> list[ExportResult]:
        """Export all agents in dependency order.

        Parameters
        ----------
        exported_arguments : dict[str, Any]
            A dictionary containing exported arguments for agents,
            models, and tools.

        Returns
        -------
        list[ExportResult]
            A list of export results for each agent.
        """
        results: list[ExportResult] = []
        for agent in self.waldiez.agents:
            agent_exporter = self._create_agent_exporter(
                agent, exported_arguments
            )
            agent_result = agent_exporter.export()
            results.append(agent_result)
        return results

    def should_skip_logging(self) -> bool:
        """Determine if logging should be skipped.

        In case there is any compatibility issue with logging
        we can skip logging entirely (until handled/fixed).

        e.g:
        return self.waldiez.has_doc_agents
        or:
        if self.waldiez.flow.is_group_chat:
            return any(tool.is_predefined for tool in self.waldiez.tools)

        Returns
        -------
        bool
            True if logging should be skipped, False otherwise.
        """
        return self.config.is_waat
