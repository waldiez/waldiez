# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""RAG user proxy agent configuration processor."""

from waldiez.models import (
    WaldiezAgent,
    WaldiezRagUserProxy,
    WaldiezRagUserProxyModels,
    WaldiezRagUserProxyRetrieveConfig,
)

from ...core import (
    DefaultPathResolver,
    DefaultSerializer,
    ImportPosition,
    ImportStatement,
    InstanceArgument,
    PathResolver,
    Serializer,
)
from ...core.extras.agent_extras import RAGUserExtras
from .rag import VectorDBExtras, get_vector_db_extras


# pylint: disable=too-few-public-methods
class RagUserProxyAgentProcessor:
    """Processor for RAG user proxy agent configuration."""

    _before_agent: str = ""

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_name: str,
        model_names: dict[str, str],
        path_resolver: PathResolver | None = None,
        serializer: Serializer | None = None,
    ):
        """Initialize the processor.

        Parameters
        ----------
        agent : WaldiezAgent
            The Waldiez RAG user proxy agent to process.
        model_names : dict[str, str]
            A mapping from model id to model name.
        path_resolver : PathResolver | None
            Optional path resolver for resolving paths.
            Defaults to DefaultPathResolver if not provided.
        serializer : Serializer | None
            Optional serializer for the RAG configuration.
            Defaults to DefaultSerializer if not provided.
        """
        self.agent = agent
        self.agent_name = agent_name
        self.model_names = model_names
        self.path_resolver = path_resolver or DefaultPathResolver()
        self.serializer = serializer or DefaultSerializer()

    def process(self) -> RAGUserExtras:
        """Process RAG user proxy agent configuration.

        Returns
        -------
        RAGConfig
            The processed result containing extra arguments, before content,
            imports, and environment variables.
        """
        result = RAGUserExtras(self.agent.id)
        if not self.agent.is_rag_user or not isinstance(
            self.agent, WaldiezRagUserProxy
        ):
            return result
        # Get the extra args
        vector_db_extras = get_vector_db_extras(
            agent=self.agent, agent_name=self.agent_name
        )
        before_agent, arg_value = self._get_retrieve_config(vector_db_extras)
        if before_agent:
            self._before_agent += before_agent
        if arg_value:
            retrieve_arg = InstanceArgument(
                instance_id=self.agent.id,
                name="retrieve_config",
                value=arg_value,
                tabs=1,
            )
            result.add_arg(retrieve_arg)
        for import_statement in vector_db_extras.imports:
            result.add_import(
                ImportStatement(
                    statement=import_statement,
                    position=ImportPosition.THIRD_PARTY,
                )
            )
        if self._before_agent:
            result.prepend_before_agent(self._before_agent)
        return result

    def _get_retrieve_config(
        self, vector_db_extras: VectorDBExtras
    ) -> tuple[str, str]:
        """Get the retrieve config argument for the agent.

        Returns
        -------
        InstanceArgument | None
            The retrieve config argument if applicable, otherwise None.
        """
        if not isinstance(self.agent, WaldiezRagUserProxy):
            return "", ""
        retrieve_config: WaldiezRagUserProxyRetrieveConfig = (
            self.agent.retrieve_config
        )
        if not retrieve_config:
            return "", ""  # pyright: ignore[reportUnreachable]
        args_dict = self._get_args_dict()
        if not args_dict:
            return "", ""
        before_agent = vector_db_extras.before_arg
        if self.agent.retrieve_config.use_custom_token_count:
            function_content, token_count_arg_name = (
                retrieve_config.get_custom_token_count_function(
                    name_suffix=self.agent_name
                )
            )
            args_dict["custom_token_count_function"] = token_count_arg_name
            before_agent += "\n" + function_content + "\n"
        if self.agent.retrieve_config.use_custom_text_split:
            function_content, text_split_arg_name = (
                retrieve_config.get_custom_text_split_function(
                    name_suffix=self.agent_name
                )
            )
            args_dict["custom_text_split_function"] = text_split_arg_name
            before_agent += "\n" + function_content + "\n"
        if before_agent.strip() and not before_agent.endswith("\n"):
            before_agent += "\n"
        return before_agent, self._get_args_string(
            args_dict,
            vector_db_extras,
            before_agent,
        )

    def _get_args_string(
        self,
        args_dict: dict[str, str | list[str]],
        vector_db_extras: VectorDBExtras,
        before_agent: str,
    ) -> str:
        if not isinstance(self.agent, WaldiezRagUserProxy):
            return ""
        args_content = self.serializer.serialize(args_dict)
        # get the last line (where the dict ends)
        args_parts = args_content.split("\n")
        before_vector_db = args_parts[:-1]
        closing_arg = args_parts[-1]
        args_content = "\n".join(before_vector_db)
        # add the vector_db arg
        args_content += (
            ",\n"
            + f'        "vector_db": {vector_db_extras.vector_db_arg},'
            + "\n"
        )
        # we should not need to include the client, but let's do it
        # to avoid later issues (with telemetry or other client settings)
        # https://github.com/ag2ai/ag2/blob/main/autogen/agentchat/\
        #   contrib/retrieve_user_proxy_agent.py#L265-L266
        if (
            f"{self.agent_name}_client" in before_agent
            and self.agent.retrieve_config.vector_db == "chroma"
        ):
            args_content += (
                f'        "client": {self.agent_name}_client,' + "\n"
            )
        args_content += closing_arg
        return args_content

    def _get_model_arg(
        self,
    ) -> str:
        if not isinstance(self.agent, WaldiezRagUserProxy):
            return ""
        if self.agent.data.model_ids:
            model_name = self.model_names[self.agent.data.model_ids[0]]
            new_model_name = f"{model_name}"
            return f"{new_model_name}"
        if self.agent.retrieve_config.model in self.model_names:
            selected_model = self.model_names[self.agent.retrieve_config.model]
            new_model_name = f"{selected_model}"
            return f"{new_model_name}"
        return WaldiezRagUserProxyModels[self.agent.retrieve_config.vector_db]

    def _get_args_dict(self) -> dict[str, str | list[str]]:
        if not isinstance(self.agent, WaldiezRagUserProxy):
            return {}
        model_arg = self._get_model_arg()
        args_dict: dict[str, str | list[str]] = {
            "task": self.agent.retrieve_config.task,
            "model": model_arg,
        }
        optional_args = [
            "chunk_token_size",
            "context_max_tokens",
            "customized_prompt",
            "customized_answer_prefix",
        ]
        for arg in optional_args:
            arg_value = getattr(self.agent.retrieve_config, arg)
            if arg_value is not None:
                args_dict[arg] = arg_value
                args_dict[arg] = getattr(self.agent.retrieve_config, arg)
        docs_path: str | list[str] = []
        if self.agent.retrieve_config.docs_path:
            doc_paths = (
                self.agent.retrieve_config.docs_path
                if isinstance(self.agent.retrieve_config.docs_path, list)
                else [self.agent.retrieve_config.docs_path]
            )
            docs_path = [
                item
                for item in [
                    self.path_resolver.resolve(path) for path in doc_paths
                ]
                if item
            ]
            args_dict["docs_path"] = docs_path
        if docs_path:
            args_dict["docs_path"] = docs_path
        non_optional_args = [
            "new_docs",
            "update_context",
            "get_or_create",
            "overwrite",
            "recursive",
            "chunk_mode",
            "must_break_at_empty_line",
            "collection_name",
            "distance_threshold",
        ]
        for arg in non_optional_args:
            args_dict[arg] = getattr(self.agent.retrieve_config, arg)
        return args_dict
