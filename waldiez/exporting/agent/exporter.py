# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-arguments,too-many-positional-arguments
# pylint: disable=too-many-return-statements,too-many-instance-attributes
# pyright: reportUnusedParameter=false
"""Export agents."""

from pathlib import Path
from typing import Any, Callable

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentConnection,
    WaldiezChat,
    WaldiezModel,
)

from ..core import (
    ContentOrder,
    Exporter,
    ExporterContext,
    ExportPosition,
    StandardExtras,
)
from .code_execution import CodeExecutionProcessor
from .extras.captain_agent_extras import CaptainAgentProcessor
from .extras.doc_agent_extras import DocAgentProcessor
from .extras.group_manager_agent_extras import GroupManagerProcessor
from .extras.group_member_extras import GroupMemberAgentProcessor
from .extras.rag_user_proxy_agent_extras import RagUserProxyAgentProcessor
from .extras.reasoning_agent_extras import ReasoningAgentProcessor
from .processor import AgentProcessor
from .system_message import SystemMessageProcessor
from .termination import TerminationProcessor


class AgentExporter(Exporter[StandardExtras]):
    """Agent exporter with standard extras."""

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_names: dict[str, str],
        models: tuple[list[WaldiezModel], dict[str, str]],
        chats: tuple[list[WaldiezChat], dict[str, str]],
        tool_names: dict[str, str],
        is_async: bool = False,
        for_notebook: bool = False,
        cache_seed: int | None = None,
        initial_chats: list[WaldiezAgentConnection] | None = None,
        group_chat_members: list[WaldiezAgent] | None = None,
        arguments_resolver: Callable[[WaldiezAgent], list[str]] | None = None,
        output_dir: str | Path | None = None,
        context: ExporterContext | None = None,
        **kwargs: Any,
    ):
        """Initialize the agent exporter.

        Parameters
        ----------
        agent : WaldiezAgent
            The agent to export.
        agent_names : dict[str, str]
            Mapping of agent IDs to names.
        models : tuple[list[WaldiezModel], dict[str, str]]
            All models and model names mapping.
        chats : tuple[list[WaldiezChat], dict[str, str]]
            All chats and chat names mapping.
        tool_names : dict[str, str]
            Mapping of tool IDs to names.
        is_async : bool, optional
            Whether the flow is async, by default False
        for_notebook : bool, optional
            Whether exporting for notebook, by default False
        cache_seed : int, optional
            Cache seed if any, by default None
        initial_chats : list[WaldiezAgentConnection], optional
            Initial chats for group managers, by default None
        group_chat_members : list[WaldiezAgent], optional
            Group chat members if group manager, by default None
        arguments_resolver : Callable, optional
            Function to resolve additional arguments, by default None
        output_dir : str | Path, optional
            Output directory for generated files, by default None
        context : ExporterContext, optional
            Exporter context with dependencies, by default None
        **kwargs : Any
            Additional keyword arguments.
        """
        super().__init__(context, **kwargs)

        self.agent = agent
        self.agent_names = agent_names
        self.models = models[0]
        self.model_names = models[1]
        self.all_chats = chats[0]
        self.chat_names = chats[1]
        self.tool_names = tool_names
        self.is_async = is_async
        self.for_notebook = for_notebook
        self.cache_seed = cache_seed
        self.initial_chats = initial_chats or []
        self.group_chat_members = group_chat_members or []
        self.arguments_resolver = arguments_resolver or fallback_args_resolver
        self.output_dir = Path(output_dir) if output_dir else None

        # Initialize extras based on agent type
        self._extras = self._create_agent_extras()

    @property
    def extras(self) -> StandardExtras:
        """Get the agent extras."""
        return self._extras

    def _create_agent_extras(self) -> StandardExtras:
        """Create and populate agent extras based on agent type."""
        # Determine the appropriate extras type
        if self.agent.is_group_manager:
            return self._create_group_manager_extras()
        if self.agent.is_group_member:
            return self._create_group_member_extras()
        if self.agent.is_captain:
            return self._create_captain_extras()
        if self.agent.is_reasoning:
            return self.create_reasoning_extras()
        if self.agent.is_rag_user:
            return self._create_rag_user_extras()
        if self.agent.is_doc_agent:
            return self._create_doc_agent_extras()
        return self._create_standard_extras()

    def _create_standard_extras(self) -> StandardExtras:
        """Create standard agent extras."""
        extras = StandardExtras(self.agent.id)

        # Process code execution
        if self.agent.data.code_execution_config is not False:
            code_processor = CodeExecutionProcessor(
                agent=self.agent,
                agent_name=self.agent_names[self.agent.id],
                tool_names=self.tool_names,
            )
            code_config = code_processor.process()
            extras.set_code_execution(code_config)

        # Process termination message
        termination_processor = TerminationProcessor(
            agent=self.agent,
            agent_name=self.agent_names[self.agent.id],
        )
        termination_config = termination_processor.process()
        extras.set_termination_config(termination_config)

        # Process system message
        system_message_processor = SystemMessageProcessor(
            agent=self.agent,
        )
        system_message_config = system_message_processor.process()
        extras.set_system_message_config(system_message_config)

        return extras

    def _create_group_manager_extras(self) -> StandardExtras:
        """Create group manager agent extras."""
        # Start with standard extras
        standard_extras = self._create_standard_extras()

        # Add group manager specific processing
        group_manager_processor = GroupManagerProcessor(
            agent=self.agent,
            agent_names=self.agent_names,
            all_models=self.models,
            model_names=self.model_names,
            initial_chats=self.initial_chats,
            group_chat_members=self.group_chat_members,
            serializer=self.context.get_serializer().serialize,
        )

        group_manager_extras = group_manager_processor.process(
            system_message_config=standard_extras.system_message_config,
            termination_config=standard_extras.termination_config,
            code_execution_config=standard_extras.code_execution_config,
        )
        self.agent_names = group_manager_processor.agent_names
        return group_manager_extras

    def _create_group_member_extras(self) -> StandardExtras:
        """Create group member agent extras."""
        # Start with standard extras
        extras = self._create_standard_extras()
        # Add group member specific processing
        group_member_processor = GroupMemberAgentProcessor(
            agent=self.agent,
            agent_names=self.agent_names,
            tool_names=self.tool_names,
            chat_names=self.chat_names,
            all_chats=self.all_chats,
            serializer=self.context.get_serializer().serialize,
        )
        group_member_results = group_member_processor.process()
        if group_member_results.before_agent:
            extras.append_before_agent(group_member_results.before_agent)
        # Add group member specific arguments
        for arg in group_member_results.extra_arguments:
            extras.add_arg(arg)
        # Add group member specific imports
        for import_stmt in group_member_results.extra_imports:
            extras.add_import(import_stmt)
        if group_member_results.after_agent:
            extras.append_after_agent(group_member_results.after_agent)
        return extras

    def _create_rag_user_extras(self) -> StandardExtras:
        """Create RAG user agent extras."""
        # Start with standard extras
        extras = self._create_standard_extras()

        rag_processor = RagUserProxyAgentProcessor(
            agent=self.agent,
            agent_name=self.agent_names[self.agent.id],
            model_names=self.model_names,
        )
        rag_result = rag_processor.process()
        # Add RAG user specific arguments
        for arg in rag_result.extra_args:
            extras.add_arg(arg)
        # Add RAG user specific imports
        extras.add_imports(rag_result.extra_imports)
        if rag_result.before_agent:
            extras.prepend_before_agent(rag_result.before_agent)
        return extras

    def _create_doc_agent_extras(self) -> StandardExtras:
        """Create doc agent extras."""
        # Start with standard extras
        extras = self._create_standard_extras()

        doc_processor = DocAgentProcessor(
            agent=self.agent,
            agent_names=self.agent_names,
            model_names=self.model_names,
            all_models=self.models,
            output_dir=self.output_dir,
            cache_seed=self.cache_seed,
            serializer=(
                self.context.get_serializer()
                if self.context.serializer
                else None
            ),
        )
        doc_extras = doc_processor.process(
            system_message_config=extras.system_message_config,
            termination_config=extras.termination_config,
            code_execution_config=extras.code_execution_config,
        )
        # Add doc agent specific arguments
        for arg in doc_extras.extra_args:
            extras.add_arg(arg)
        # Add doc agent specific imports
        extras.add_imports(doc_extras.extra_imports)
        if doc_extras.before_agent:
            extras.prepend_before_agent(doc_extras.before_agent)
        if doc_extras.after_agent:
            extras.append_after_agent(doc_extras.after_agent)

        return extras

    def _create_captain_extras(self) -> StandardExtras:
        """Create captain agent extras."""
        # Start with standard extras
        extras = self._create_standard_extras()

        # Add captain specific processing
        captain_processor = CaptainAgentProcessor(
            agent=self.agent,
            agent_names=self.agent_names,
            all_models=self.models,
            serializer=(
                self.context.get_serializer()
                if self.context.serializer
                else None
            ),
            output_dir=self.output_dir,
        )

        captain_result = captain_processor.process(
            system_message_config=extras.system_message_config,
            termination_config=extras.termination_config,
            code_execution_config=extras.code_execution_config,
        )

        # # Add captain arguments
        for arg in captain_result.extra_args:
            extras.add_arg(arg)

        # # Add captain imports
        extras.add_imports(captain_result.extra_imports)

        # # Add any captain-specific before content
        if captain_result.before_agent:
            extras.append_before_agent(captain_result.before_agent)

        if captain_result.after_agent:
            extras.append_after_agent(captain_result.after_agent)

        return extras

    def create_reasoning_extras(self) -> StandardExtras:
        """Create reasoning-specific extras for the agent.

        Returns
        -------
        StandardExtras
            The reasoning-specific extras.
        """
        # Start with standard extras
        extras = self._create_standard_extras()

        reasoning_processor = ReasoningAgentProcessor(
            agent=self.agent,
            serializer=(
                self.context.get_serializer()
                if self.context.serializer
                else None
            ),
        )
        # Process reasoning-specific content
        reason_extras = reasoning_processor.process(
            code_execution_config=extras.code_execution_config,
            termination_config=extras.termination_config,
            system_message_config=extras.system_message_config,
        )
        # Add reasoning arguments
        for arg in reason_extras.extra_args:
            extras.add_arg(arg)

        return reason_extras

    def generate_main_content(self) -> str | None:
        """Generate the main agent definition.

        Returns
        -------
        Optional[str]
            The main agent definition content, or None if not applicable.
        """
        # Use AgentProcessor to generate the main definition
        agent_processor = AgentProcessor(
            agent=self.agent,
            agent_names=self.agent_names,
            arguments_resolver=self.arguments_resolver,
            extras=self.extras,
        )
        result = agent_processor.process().content
        if result:
            order = (
                ContentOrder.MAIN_CONTENT
                if not self.agent.is_group_manager
                else ContentOrder.LATE_CLEANUP
            )
            # Add the main agent definition content
            agent_name = self.agent_names[self.agent.id]
            if agent_name:
                result += f'\n\n__AGENTS__["{agent_name}"] = {agent_name}\n\n'
            self.add_content(
                result,
                ExportPosition.AGENTS,
                order=order,
            )
            self.extras.append_after_all_agents(result)
        return result

    def _add_default_imports(self) -> None:
        """Add default imports for agents."""
        # Add default agent imports
        if hasattr(self.agent, "ag2_imports"):
            for import_stmt in self.agent.ag2_imports:
                self.add_import(import_stmt)

        # Add tools import if agent has tools
        if self.agent.data.tools:
            self.add_import("from autogen import register_function")


# pylint: disable=unused-argument
# noinspection PyUnusedLocal
def fallback_args_resolver(agent: WaldiezAgent) -> list[str]:
    """Fallback resolver for agent arguments.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent for which to resolve arguments.

    Returns
    -------
    list[str]
        An empty list (no extra args).
    """
    return []
