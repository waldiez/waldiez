# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Flow Exporter class.

- We gather all the exports (models, tools, agents, chats).

- We first add all the imports from the above exports.
- If we have tools, we include their imports.
    (their files were generated when exporting the tools).
- Then, we write the all model configs.
- Next, we write the agent definitions
    (using the `llm_config=...` argument from the model exports).
- If additional (nested_chats) are defined,
    we write their registrations after all agents are defined.
- Next, we write the chat definitions
    (using the agent names from the agent exports).
- If exporting to py,
    we add the `run` function and the `def main()` to call the run function.
- If the flow is async, the `run` function is async.
"""

# flake8: noqa: E501
# pylint: disable=line-too-long

from functools import partial
from pathlib import Path
from typing import Optional, Union

from waldiez.models import Waldiez, WaldiezAgent

from ..agent import AgentExporter
from ..base import (
    AgentPosition,
    AgentPositions,
    BaseExporter,
    ExporterMixin,
    ExporterReturnType,
    ExportPosition,
    ExportPositions,
    ImportPosition,
)
from ..chats import ChatsExporter
from ..models import ModelsExporter
from ..tools import ToolsExporter
from .utils import (
    add_after_agent_content,
    add_after_chat_content,
    add_before_agent_content,
    ensure_unique_names,
    gather_agent_outputs,
    gather_imports,
    get_after_run_content,
    get_def_main,
    get_ipynb_content_start,
    get_np_no_nep50_handle,
    get_py_content_start,
    get_sqlite_out,
    get_start_logging,
    get_stop_logging,
    get_the_imports_string,
)


# pylint: disable=too-many-instance-attributes
class FlowExporter(BaseExporter, ExporterMixin):
    """Flow exporter."""

    _initialized = False

    def __init__(
        self,
        waldiez: Waldiez,
        for_notebook: bool,
        output_dir: Optional[Union[str, Path]] = None,
    ) -> None:
        """Initialize the flow exporter."""
        self.waldiez = waldiez
        self.for_notebook = for_notebook
        if output_dir is not None and not isinstance(output_dir, Path):
            output_dir = Path(output_dir).resolve()
        self.output_dir = output_dir
        self.initialize()

    def initialize(
        self,
    ) -> None:
        """Get all the names in the flow.

        We need to make sure that no duplicate names are used,
        and that the names can be used as python variables.
        """
        unique_names = ensure_unique_names(
            self.waldiez,
            self.get_valid_instance_name,
        )
        self.flow_name = unique_names["flow_name"]
        self.agents = unique_names["agents"]
        self.models = unique_names["models"]
        self.tools = unique_names["tools"]
        self.chats = unique_names["chats"]
        self.agent_names = unique_names["agent_names"]
        self.model_names = unique_names["model_names"]
        self.tool_names = unique_names["tool_names"]
        self.chat_names = unique_names["chat_names"]

    def export_flow(self) -> ExporterReturnType:
        """Export the flow.

        Returns
        -------
        ExporterReturnType
            The exported flow.
        """
        models_output = self.export_models()
        tools_output = self.export_tools()
        chats_output = self.export_chats()
        env_vars = self.gather_environment_variables(
            model_env_vars=models_output["environment_variables"],
            tool_env_vars=tools_output["environment_variables"],
            chat_env_vars=chats_output["environment_variables"],
        )
        before_export = self.gather_exports(
            model_export=models_output["before_export"],
            tool_export=tools_output["before_export"],
            chat_export=chats_output["before_export"],
        )
        after_export = self.gather_exports(
            model_export=models_output["after_export"],
            tool_export=tools_output["after_export"],
            chat_export=chats_output["after_export"],
        )
        # agents last (to make sure we have any needed arguments)
        # like `llm_config=...` from the models
        agents_output = self.export_agents(
            before_export=before_export,
            after_export=after_export,
        )
        imports = gather_imports(
            model_imports=models_output["imports"],
            tool_imports=tools_output["imports"],
            chat_imports=chats_output["imports"],
            agent_imports=agents_output["imports"],
        )
        if agents_output["environment_variables"]:
            env_vars.extend(agents_output["environment_variables"])
        if agents_output["before_export"]:
            before_export.extend(agents_output["before_export"])
        if agents_output["after_export"]:
            after_export.extend(agents_output["after_export"])
        all_imports = (
            get_the_imports_string(imports, is_async=self.waldiez.is_async),
            ImportPosition.LOCAL,
        )
        before_chats_export = chats_output["before_export"] or []
        content_before_chats = [
            x[0]
            for x in before_chats_export
            if isinstance(x[1], ExportPosition)
            and x[1].position == ExportPositions.CHATS
        ]
        before_chats = "\n".join(content_before_chats)
        content = self.merge_exports(
            imports=all_imports,
            models_output=models_output["content"] or "",
            tools_output=tools_output["content"] or "",
            agents_content=agents_output["content"] or "",
            chats_content=chats_output["content"] or "",
            before_chats=before_chats,
        )
        return {
            "content": content,
            "imports": [all_imports],
            "after_export": after_export,
            "before_export": before_export,
            "environment_variables": env_vars,
        }

    def merge_exports(
        self,
        imports: tuple[str, ImportPosition],
        models_output: str,
        tools_output: str,
        agents_content: str,
        chats_content: str,
        before_chats: str,
    ) -> str:
        """Merge all the export contents.

        Parameters
        ----------
        imports : tuple[str, ImportPosition]
            The imports.
        models_output : str
            The models output.
        tools_output : str
            The tools output.
        agents_content : str
            The agents content.
        chats_content : str
            The chats content.
        before_chats : str

        Returns
        -------
        str
            The merged export contents.
        """
        is_async = self.waldiez.is_async
        cache_seed = self.waldiez.cache_seed
        content = (
            get_py_content_start(self.waldiez)
            if not self.for_notebook
            else get_ipynb_content_start(self.waldiez, comment=self.comment)
        )
        content += self.get_comment("imports", self.for_notebook) + "\n"
        content += imports[0] + "\n"
        content += (
            ModelsExporter.get_api_key_loader_script(self.flow_name) + "\n"
        )
        content += get_np_no_nep50_handle() + "\n"
        content += self.get_comment("logging", self.for_notebook) + "\n"
        content += get_start_logging(is_async=is_async, tabs=0) + "\n"
        content += "start_logging()\n\n"
        if models_output:
            content += self.get_comment("models", self.for_notebook) + "\n"
            content += models_output + "\n"
        if tools_output:
            content += self.get_comment("tools", self.for_notebook) + "\n"
            content += tools_output + "\n"
        if agents_content:
            content += self.get_comment("agents", self.for_notebook) + "\n"
            content += agents_content + "\n"
        if before_chats:
            content += before_chats + "\n"
        content += get_sqlite_out(is_async=is_async) + "\n"
        content += get_stop_logging(tabs=0, is_async=is_async) + "\n"
        content += self.get_comment("run", self.for_notebook) + "\n"
        after_run = get_after_run_content(
            waldiez=self.waldiez,
            agent_names=self.agent_names,
            tabs=0 if self.for_notebook else 1,
        )
        if self.for_notebook is False:
            content += get_def_main(
                chats_content,
                after_run=after_run,
                is_async=self.waldiez.is_async,
                cache_seed=cache_seed,
            )
        else:
            if chats_content.startswith("\n"):
                chats_content = chats_content[1:]
            content += (
                "\n" + f"with Cache.disk(cache_seed={cache_seed}) as cache:"
                "\n" + chats_content + "\n"
            )
            if is_async:
                content += "await stop_logging()"
            else:
                content += "stop_logging()"
                content += after_run
        content = content.replace("\n\n\n\n", "\n\n\n")
        return content

    @staticmethod
    def gather_environment_variables(
        model_env_vars: Optional[list[tuple[str, str]]],
        tool_env_vars: Optional[list[tuple[str, str]]],
        chat_env_vars: Optional[list[tuple[str, str]]],
    ) -> list[tuple[str, str]]:
        """
        Gather all the environment variables.

        Parameters
        ----------
        model_env_vars : Optional[list[tuple[str, str]]]
            The model environment variables.
        tool_env_vars : Optional[list[tuple[str, str]]]
            The tool environment variables.
        chat_env_vars : Optional[list[tuple[str, str]]]
            The chat environment variables.

        Returns
        -------
        list[tuple[str, str]]
            The gathered environment variables.
        """
        all_env_vars: list[tuple[str, str]] = []
        if model_env_vars:
            all_env_vars.extend(model_env_vars)
        if tool_env_vars:
            all_env_vars.extend(tool_env_vars)
        if chat_env_vars:
            all_env_vars.extend(chat_env_vars)
        return all_env_vars

    @staticmethod
    def gather_exports(
        model_export: Optional[
            list[tuple[str, Union[ExportPosition, AgentPosition]]]
        ],
        tool_export: Optional[
            list[tuple[str, Union[ExportPosition, AgentPosition]]]
        ],
        chat_export: Optional[
            list[tuple[str, Union[ExportPosition, AgentPosition]]]
        ],
    ) -> list[tuple[str, Union[ExportPosition, AgentPosition]]]:
        """Gather all (but agents) the before or after exports.

        Parameters
        ----------
        model_export : Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]
            The model exports.
        tool_export : Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]
            The tool exports.
        chat_export : Optional[list[tuple[str, Union[ExportPosition, AgentPosition]]]]
            The chat exports.

        Returns
        -------
        list[tuple[str, Union[ExportPosition, AgentPosition]]]
            The gathered exports.
        """
        all_exports: list[tuple[str, Union[ExportPosition, AgentPosition]]] = []
        if model_export:
            all_exports.extend(model_export)
        if tool_export:
            all_exports.extend(tool_export)
        if chat_export:
            all_exports.extend(chat_export)
        return all_exports

    def export_models(self) -> ExporterReturnType:
        """Export the models.

        Returns
        -------
        str
            The exported models.
        """
        exporter = ModelsExporter(
            flow_name=self.flow_name,
            agents=self.agents,
            agent_names=self.agent_names,
            models=self.models,
            model_names=self.model_names,
            for_notebook=self.for_notebook,
            output_dir=self.output_dir,
            cache_seed=self.waldiez.cache_seed,
        )
        return exporter.export()

    def export_tools(self) -> ExporterReturnType:
        """Export the tools.

        Returns
        -------
        str
            The exported tools.
        """
        exporter = ToolsExporter(
            flow_name=self.flow_name,
            agents=self.agents,
            agent_names=self.agent_names,
            tools=self.tools,
            tool_names=self.tool_names,
            output_dir=self.output_dir,
        )
        return exporter.export()

    @staticmethod
    def gather_agent_arguments(
        before_export: list[tuple[str, Union[ExportPosition, AgentPosition]]],
        after_export: list[tuple[str, Union[ExportPosition, AgentPosition]]],
    ) -> list[tuple[str, AgentPosition]]:
        """Gather the agent arguments.

        Parameters
        ----------
        before_export : list[tuple[str, Union[ExportPosition, AgentPosition]]]
            The before export.
        after_export : list[tuple[str, Union[ExportPosition, AgentPosition]]]
            The after export.

        Returns
        -------
        list[tuple[str, AgentPosition]]
            The gathered agent arguments.
        """
        exported_with_agent_arg: list[tuple[str, AgentPosition]] = []
        for before in before_export:
            position = before[1]
            if (
                isinstance(position, AgentPosition)
                and position.position == AgentPositions.AS_ARGUMENT
            ):
                exported_with_agent_arg.append((before[0], position))
        for after in after_export:
            position = after[1]
            if (
                isinstance(position, AgentPosition)
                and position.position == AgentPositions.AS_ARGUMENT
            ):
                exported_with_agent_arg.append((after[0], position))
        return exported_with_agent_arg

    def export_agents(
        self,
        before_export: list[tuple[str, Union[ExportPosition, AgentPosition]]],
        after_export: list[tuple[str, Union[ExportPosition, AgentPosition]]],
    ) -> ExporterReturnType:
        """Export the agents.

        Parameters
        ----------
        before_export : list[tuple[str, Union[ExportPosition, AgentPosition]]]
            The before export.
        after_export : list[tuple[str, Union[ExportPosition, AgentPosition]]]
            The after export.

        Returns
        -------
        str
            The exported agents.
        """
        agent_outputs: list[ExporterReturnType] = []
        for agent in self.agents:
            exported_with_agent_arg = self.gather_agent_arguments(
                before_export, after_export
            )
            arguments_resolver = partial(
                self.agent_arguments_resolver,
                exported_with_agent_arg,
            )
            exporter = AgentExporter(
                agent=agent,
                agent_names=self.agent_names,
                models=(self.models, self.model_names),
                chats=(self.chats, self.chat_names),
                initial_chats=self.waldiez.initial_chats,
                tool_names=self.tool_names,
                is_async=self.waldiez.is_async,
                for_notebook=self.for_notebook,
                group_chat_members=self.waldiez.get_group_chat_members(agent),
                output_dir=self.output_dir,
                arguments_resolver=arguments_resolver,
            )
            agent_output = exporter.export()
            agent_content = agent_output["content"] or ""
            after_agent_export = agent_output["after_export"]
            if after_agent_export:
                after_export.extend(after_agent_export)
            before_agent_export = agent_output["before_export"]
            if before_agent_export:
                before_export.extend(before_agent_export)
            # if agent_content:
            agent_content = add_before_agent_content(
                agent_content,
                before_export,
                agent,
            )
            agent_content = add_after_agent_content(
                agent_content,
                after_export,
                agent,
            )
            agent_output["content"] = agent_content
            agent_outputs.append(agent_output)
        return gather_agent_outputs(
            before_export=before_export,
            after_export=after_export,
            agent_outputs=agent_outputs,
        )

    @staticmethod
    def agent_arguments_resolver(
        additional_exports: list[tuple[str, AgentPosition]], agent: WaldiezAgent
    ) -> list[str]:
        """Resolve the arguments for the agent.

        Parameters
        ----------
        additional_exports : list[tuple[str, AgentPosition]]
            The additional exports.
        agent : WaldiezAgent
            The agent.

        Returns
        -------
        list[str]
            The arguments for the agent.
        """
        return [x[0] for x in additional_exports if x[1].agent == agent]

    def export_chats(self) -> ExporterReturnType:
        """Export the chats.

        Returns
        -------
        str
            The exported chats.
        """
        exporter = ChatsExporter(
            all_agents=self.agents,
            agent_names=self.agent_names,
            all_chats=self.chats,
            chat_names=self.chat_names,
            main_chats=self.waldiez.initial_chats,
            for_notebook=self.for_notebook,
            is_async=self.waldiez.is_async,
        )
        output = exporter.export()
        chat_contents = output["content"] or ""
        after_chats = output["after_export"]
        if chat_contents and after_chats:
            chat_contents = add_after_chat_content(
                chat_contents,
                after_chats,
            )
        output["content"] = chat_contents
        return output

    def export(self) -> ExporterReturnType:
        """Export the flow.

        Returns
        -------
        SubExporterReturnType
            The exported flow.
        """
        return self.export_flow()
