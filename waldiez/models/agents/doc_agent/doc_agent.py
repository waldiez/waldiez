# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportArgumentType=false,reportIncompatibleVariableOverride=false

"""Document agent model."""

from typing import Literal

from pydantic import Field
from typing_extensions import Annotated

from waldiez.models.agents.doc_agent.rag_query_engine import (
    WaldiezDocAgentQueryEngine,
)

from ...model import WaldiezModel
from ..agent import WaldiezAgent
from .doc_agent_data import WaldiezDocAgentData


class WaldiezDocAgent(WaldiezAgent):
    """Document agent class.

    The agent for handling document-related tasks.
    Extends `WaldiezAgent`.
    """

    agent_type: Annotated[
        Literal["doc_agent"],
        Field(
            default="doc_agent",
            title="Agent type",
            description="The agent type: 'doc_agent' for a document agent",
            alias="agentType",
        ),
    ]
    data: Annotated[
        WaldiezDocAgentData,
        Field(
            title="Data",
            description="The document agent's data",
            default_factory=WaldiezDocAgentData,
        ),
    ]

    @property
    def reset_collection(self) -> bool:
        """Get whether to reset the collection for the document agent.

        Returns
        -------
        bool
            Whether to reset the collection for the document agent.
        """
        return self.data.reset_collection

    def get_collection_name(self) -> str:
        """Get the collection name for the document agent.

        Returns
        -------
        str
            The collection name for the document agent.
        """
        return self.data.get_collection_name()

    def get_query_engine(self) -> WaldiezDocAgentQueryEngine:
        """Get the query engine for the document agent.

        Returns
        -------
        WaldiezDocAgentQueryEngine
            The query engine for the document agent.
        """
        return self.data.get_query_engine()

    def get_db_path(self) -> str:
        """Get the database path for the query engine.

        Returns
        -------
        str
            The database path for the query engine.
        """
        return self.data.get_db_path()

    def get_parsed_docs_path(self) -> str:
        """Get the parsed documents path for the document agent.

        Returns
        -------
        str
            The parsed documents path for the document agent.
        """
        return self.data.get_parsed_docs_path()

    def get_llm_requirements(
        self,
        ag2_version: str,
        all_models: list[WaldiezModel],
    ) -> set[str]:
        """Get the LLM requirements for the document agent.

        Parameters
        ----------
        ag2_version : str
            The version of AG2 to use for the requirements.
        all_models : list[WaldiezModel]
            All the models in the flow.

        Returns
        -------
        set[str]
            The set of LLM requirements for the document agent.
        """
        requirements = {
            "llama-index",
            "llama-index-core",
            # f"ag2[rag]=={ag2_version}",
            "chromadb>=0.5,<2",
            "docling>=2.15.1,<3",
            "selenium>=4.28.1,<5",
            "webdriver-manager==4.0.2",
            "llama-index-embeddings-huggingface",
            "llama-index-llms-langchain",
            "llama-index-vector-stores-chroma",
        }
        if not self.data.model_ids:
            requirements.add("llama-index-llms-openai")
        else:
            for model_id in self.data.model_ids:
                model = next((m for m in all_models if m.id == model_id), None)
                if model:
                    return model.get_llm_requirements(ag2_version=ag2_version)
        return requirements
