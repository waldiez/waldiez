# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Document agent data model."""

from pathlib import Path
from typing import Optional, Union

from platformdirs import user_data_dir
from pydantic import Field, model_validator
from typing_extensions import Annotated, Self

from ..agent import WaldiezAgentData
from .rag_query_engine import WaldiezDocAgentQueryEngine


class WaldiezDocAgentData(WaldiezAgentData):
    """Document agent data class.

    The data for a document agent.
    Extends `WaldiezAgentData`.
    Extra attributes:
    - `collection_name`: Optional string, the name of the collection.
    - `reset_collection`: Optional boolean, whether to reset the collection.
    - `parsed_docs_path`: Optional string, the path to the parsed documents.
    - `query_engine`: Optional `RAGQueryEngine`, the query engine to use.
    """

    collection_name: Annotated[
        Optional[str],
        Field(
            title="Collection Name",
            description="The name of the collection for the document agent.",
            default=None,
            alias="collectionName",
        ),
    ] = None
    reset_collection: Annotated[
        bool,
        Field(
            title="Reset Collection",
            description=(
                "Whether to reset the collection for the document agent."
            ),
            default=False,
            alias="resetCollection",
        ),
    ] = False
    parsed_docs_path: Annotated[
        Optional[Union[str, Path]],
        Field(
            title="Parsed Documents Path",
            description=(
                "The path to the parsed documents for the document agent."
            ),
            default=None,
            alias="parsedDocsPath",
        ),
    ] = None
    query_engine: Annotated[
        Optional[WaldiezDocAgentQueryEngine],
        Field(
            title="Query Engine",
            description="The query engine to use for the document agent.",
            default=None,
            alias="queryEngine",
        ),
    ] = None

    @model_validator(mode="after")
    def validate_parsed_docs_path(self) -> Self:
        """Ensure the parsed documents path is set and is a directory.

        If not set, create a default path in the user data directory.

        Returns
        -------
        Self
            The instance with validated `parsed_docs_path`.
        """
        if not self.parsed_docs_path:
            data_dir = user_data_dir(
                appname="waldiez",
                appauthor="waldiez",
            )
            parsed_docs_path = Path(data_dir) / "parsed_docs"
            parsed_docs_path.mkdir(parents=True, exist_ok=True)
            self.parsed_docs_path = str(parsed_docs_path.resolve())
        resolved = Path(self.parsed_docs_path).resolve()
        if not resolved.is_absolute():
            self.parsed_docs_path = str(Path.cwd() / self.parsed_docs_path)
        if not Path(self.parsed_docs_path).is_dir():
            Path(self.parsed_docs_path).mkdir(parents=True, exist_ok=True)
        self.parsed_docs_path = str(Path(self.parsed_docs_path).resolve())
        return self

    def get_query_engine(self) -> WaldiezDocAgentQueryEngine:
        """Get the query engine for the document agent.

        Returns
        -------
        WaldiezDocAgentQueryEngine
            The query engine for the document agent.
        """
        if not self.query_engine:
            self.query_engine = WaldiezDocAgentQueryEngine()
        return self.query_engine

    def get_db_path(self) -> str:
        """Get the database path for the query engine.

        Returns
        -------
        str
            The database path for the query engine.
        """
        return self.get_query_engine().get_db_path()

    def get_collection_name(self) -> str:
        """Get the collection name for the document agent.

        Returns
        -------
        str
            The collection name for the document agent.
        """
        return self.collection_name or "docling-parsed-docs"

    def get_parsed_docs_path(self) -> str:
        """Get the parsed documents path for the document agent.

        Returns
        -------
        str
            The parsed documents path for the document agent.
        """
        if not self.parsed_docs_path:
            data_dir = user_data_dir(
                appname="waldiez",
                appauthor="waldiez",
            )
            parsed_docs_path = Path(data_dir) / "parsed_docs"
            parsed_docs_path.mkdir(parents=True, exist_ok=True)
            self.parsed_docs_path = str(parsed_docs_path.resolve())
        resolved = Path(self.parsed_docs_path).resolve()
        if not resolved.is_absolute():
            self.parsed_docs_path = str(Path.cwd() / self.parsed_docs_path)
        if not Path(self.parsed_docs_path).is_dir():
            Path(self.parsed_docs_path).mkdir(parents=True, exist_ok=True)
        return str(self.parsed_docs_path)
