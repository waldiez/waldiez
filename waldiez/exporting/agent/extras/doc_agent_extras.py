# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=too-few-public-methods,no-self-use
# pyright: reportUninitializedInstanceVariable=false

# before agent: query engine initialization
# agent extra args:
#   parsed_docs_path: Optional[Union[str, Path]] = None, # (we use str)
#   collection_name: Optional[str] = None,  # (we use str)
#   query_engine: Optional[RAGQueryEngine] = None,  # (we use RAGQueryEngine)

"""Document Agent Extras."""

# import shutil
import shutil
from pathlib import Path

from waldiez.exporting.core.extras.path_resolver import DefaultPathResolver
from waldiez.exporting.core.protocols import PathResolver
from waldiez.exporting.core.utils.llm_config import get_agent_llm_config_arg
from waldiez.models import (
    WaldiezAgent,
    WaldiezDocAgent,
    WaldiezDocAgentQueryEngine,
    WaldiezModel,
)

from ...core import (
    CodeExecutionConfig,
    DefaultSerializer,
    ImportPosition,
    ImportStatement,
    InstanceArgument,
    Serializer,
    SystemMessageConfig,
    TerminationConfig,
)
from ...core.extras.agent_extras import StandardExtras


class DocAgentProcessor:
    """Process document agent requests."""

    extras: StandardExtras

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_names: dict[str, str],
        model_names: dict[str, str],
        all_models: list[WaldiezModel],
        cache_seed: int | None = None,
        serializer: Serializer | None = None,
        path_resolver: PathResolver | None = None,
        output_dir: Path | None = None,
    ):
        self.agent = agent
        self.agent_name = agent_names.get(agent.id, agent.name)
        self.output_dir = output_dir
        self.model_names = model_names
        self.all_models = all_models
        self.cache_seed = cache_seed
        self.path_resolver = path_resolver or DefaultPathResolver()
        self.serializer = serializer or DefaultSerializer()

    def process(
        self,
        code_execution_config: CodeExecutionConfig | None = None,
        termination_config: TerminationConfig | None = None,
        system_message_config: SystemMessageConfig | None = None,
    ) -> StandardExtras:
        """Process the document agent configuration.

        Parameters
        ----------
        code_execution_config : CodeExecutionConfig, optional
            Configuration for code execution, if applicable.
        termination_config : TerminationConfig, optional
            Configuration for termination, if applicable.
        system_message_config : SystemMessageConfig, optional
            Configuration for system messages, if applicable.

        Returns
        -------
        DocExtras
            The document agent extras.
        """
        self.extras = StandardExtras(
            instance_id=self.agent.id,
            code_execution_config=code_execution_config,
            termination_config=termination_config,
            system_message_config=system_message_config,
        )
        if not self.agent.is_doc_agent or not isinstance(
            self.agent, WaldiezDocAgent
        ):
            return self.extras
        parsed_docs_path = self.get_parsed_docs_path()
        self.extras.add_arg(
            InstanceArgument(
                instance_id=self.agent.id,
                name="parsed_docs_path",
                value=parsed_docs_path,
                tabs=1,
            )
        )
        self._get_query_engine_extras()
        if self.extras.before_agent:
            self.extras.add_arg(
                InstanceArgument(
                    instance_id=self.agent.id,
                    name="query_engine",
                    value=f"{self.agent_name}_query_engine",
                    tabs=1,
                )
            )
            self.extras.prepend_before_agent(self.extras.before_agent)
        return self.extras

    def _get_query_engine_extras(self) -> None:
        if not isinstance(self.agent, WaldiezDocAgent):
            return
        query_engine = self.agent.get_query_engine()
        if query_engine.type == "InMemoryQueryEngine":
            self.get_in_memory_query_engine_extras()
        elif query_engine.type == "VectorChromaQueryEngine":
            self.get_vector_chroma_query_engine_extras(
                self.agent.data.get_collection_name(),
            )
        elif (
            query_engine.type == "VectorChromaCitationQueryEngine"
        ):  # pragma: no branch
            self.get_vector_chroma_citation_query_engine_extras(
                query_engine,
                self.agent.data.get_collection_name(),
            )

    def get_in_memory_query_engine_extras(self) -> None:
        """Get the in-memory query engine extras."""
        # InMemoryQueryEngine(llm_config=llm_config)
        self.extras.add_import(
            ImportStatement(
                statement=(
                    "from autogen.agents.experimental.document_agent."
                    "inmemory_query_engine import InMemoryQueryEngine"
                )
            )
        )
        llm_config_arg = get_agent_llm_config_arg(
            agent=self.agent,
            tabs=1,
            model_names=self.model_names,
            all_models=self.all_models,
            cache_seed=self.cache_seed,
        )
        self.extras.before_agent = (
            f"{self.agent_name}_query_engine = "
            f"InMemoryQueryEngine(\n{llm_config_arg}\n)"
        )

    def get_vector_chroma_query_engine_extras(
        self,
        collection_name: str,
    ) -> None:
        """Get the vector Chroma query engine extras.

        Parameters
        ----------
        collection_name : str
            The name of the collection to use.
        """
        # VectorChromaQueryEngine(
        #   db_path: Optional[str] = None,
        #   embedding_function: "Optional[EmbeddingFunction[Any]]" = None,
        #   metadata: Optional[dict[str, Any]] = None,
        #   llm: Optional["LLM"] = None,
        #   collection_name: Optional[str] = None,
        # )
        self.extras.add_import(
            ImportStatement(
                statement=(
                    "from autogen.agents.experimental.document_agent."
                    "chroma_query_engine import VectorChromaQueryEngine"
                )
            )
        )
        llm_arg, before = self.get_llm_arg()
        db_path = self.get_db_path()
        self.extras.before_agent = before + "\n"
        q_engine_init = (
            f"{self.agent_name}_query_engine = "
            f"VectorChromaQueryEngine(\n    {llm_arg}"
        )
        if db_path:  # pragma: no branch
            q_engine_init += f",\n    db_path={db_path}"
        if collection_name:  # pragma: no branch
            q_engine_init += f',\n    collection_name="{collection_name}"'
        q_engine_init += ",\n)"
        self.extras.before_agent += q_engine_init

    def get_vector_chroma_citation_query_engine_extras(
        self,
        query_engine: WaldiezDocAgentQueryEngine,
        collection_name: str,
    ) -> None:
        """Get the vector Chroma citation query engine extras.

        Parameters
        ----------
        query_engine : WaldiezDocAgentQueryEngine
            The vector Chroma citation query engine to process.
        collection_name : str
            The name of the collection to use.
        """
        # VectorChromaCitationQueryEngine(
        #   llm: Optional["LLM"] = None,
        #   collection_name: Optional[str] = None,
        #   enable_query_citations: bool = False,
        #   citation_chunk_size: int = 512,
        # )
        self.extras.add_import(
            ImportStatement(
                statement=(
                    "from autogen.agents.experimental.document_agent."
                    "chroma_query_engine import VectorChromaCitationQueryEngine"
                )
            )
        )
        db_path = self.get_db_path()
        llm_arg, before = self.get_llm_arg()
        self.extras.before_agent = before + "\n"
        q_engine_init = (
            f"{self.agent_name}_query_engine = "
            f"VectorChromaCitationQueryEngine({llm_arg}"
        )
        if db_path:  # pragma: no branch
            q_engine_init += f",\n    db_path={db_path}"
        if collection_name:  # pragma: no branch
            q_engine_init += f',\n    collection_name="{collection_name}"'
        enable_query_citations = query_engine.enable_query_citations
        chunk_size = query_engine.citation_chunk_size or 512
        q_engine_init += (
            f",\n    enable_query_citations={enable_query_citations}"
            f",\n    citation_chunk_size={chunk_size}"
        )
        q_engine_init += ",\n)"
        self.extras.before_agent += q_engine_init

    def get_llm_arg(self) -> tuple[str, str]:
        """Get the LLM argument for the agent and any content before it.

        Returns
        -------
        str
            The LLM argument for the agent and any content before it.
        """
        agent_model = get_agent_model(
            agent=self.agent,
            all_models=self.all_models,
        )
        if not agent_model:
            # ag2's default
            self.extras.add_import(
                ImportStatement(
                    statement="from llama_index.llms.openai import OpenAI",
                )
            )
            return 'llm=OpenAI(model="gpt-4o", temperature=0.0)', ""
        arg, before = agent_model.get_llm_arg()
        for import_stmt in agent_model.get_llm_imports():
            self.extras.add_import(
                ImportStatement(
                    statement=import_stmt,
                    position=ImportPosition.THIRD_PARTY,
                )
            )
        return f"llm={arg}", before

    def get_db_path(self) -> str:
        """Get the database path for the document agent.

        Returns
        -------
        str
            The database path for the document agent.

        Raises
        ------
        TypeError
            If the agent is not a WaldiezDocAgent instance.
        """
        if not isinstance(self.agent, WaldiezDocAgent):  # pragma: no cover
            raise TypeError("Agent must be a WaldiezDocAgent instance.")
        query_engine = self.agent.get_query_engine()
        if query_engine.get_db_path():
            db_path_str = query_engine.get_db_path()
        else:
            if self.output_dir:
                chroma_dir = self.output_dir / "chroma"
                chroma_dir.mkdir(parents=True, exist_ok=True)
                db_path_str = str(chroma_dir)
            else:
                db_path_str = query_engine.get_db_path()
        if self.agent.data.reset_collection:
            shutil.rmtree(db_path_str, ignore_errors=True)
            Path(db_path_str).mkdir(parents=True, exist_ok=True)
        return self.path_resolver.resolve(db_path_str)

    def get_parsed_docs_path(self) -> str:
        """Get the parsed documents path for the document agent.

        Returns
        -------
        str
            The parsed documents path for the document agent.

        Raises
        ------
        TypeError
            If the agent is not a WaldiezDocAgent instance.
        """
        if not isinstance(self.agent, WaldiezDocAgent):
            raise TypeError("Agent must be a WaldiezDocAgent instance.")
        parsed_docs_path = self.agent.data.parsed_docs_path or ""
        if not parsed_docs_path:
            if self.output_dir:
                parsed_docs_path = str(self.output_dir / "parsed_docs")
            else:
                parsed_docs_path = self.agent.get_parsed_docs_path()
        resolved = Path(parsed_docs_path).resolve()
        if not resolved.is_absolute():
            parsed_docs_path = str(Path.cwd() / parsed_docs_path)
        if not Path(parsed_docs_path).is_dir():
            Path(parsed_docs_path).mkdir(parents=True, exist_ok=True)
        if self.agent.data.reset_collection:
            shutil.rmtree(parsed_docs_path, ignore_errors=True)
            Path(parsed_docs_path).mkdir(parents=True, exist_ok=True)
        return self.path_resolver.resolve(str(parsed_docs_path))


def get_agent_model(
    agent: WaldiezAgent,
    all_models: list[WaldiezModel],
) -> WaldiezModel | None:
    """Get the first model of the agent.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    all_models : list[WaldiezModel]
        All the models in the flow.

    Returns
    -------
    WaldiezModel | None
        The first model of the agent, or None if not found.
    """
    if not agent.data.model_ids:
        return None
    for model_id in agent.data.model_ids:
        model = next((m for m in all_models if m.id == model_id), None)
        if model is not None:
            return model
    return None
