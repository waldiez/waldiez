# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Document agent data model."""

from pathlib import Path

from platformdirs import user_data_dir
from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ...common import WaldiezBase


class WaldiezDocAgentQueryEngine(WaldiezBase):
    """RAG Query Engine class.

    The data for a RAG query engine.
    """

    type: Annotated[
        Literal[
            "VectorChromaQueryEngine",
            "VectorChromaCitationQueryEngine",
            "InMemoryQueryEngine",
        ]
        | None,
        "RAG Query Engine type",
    ] = "VectorChromaQueryEngine"
    db_path: Annotated[
        str | Path | None,
        Field(
            title="Database Path",
            description="The path to the database for the query engine.",
            default=None,
            alias="dbPath",
        ),
    ]
    enable_query_citations: Annotated[
        bool,
        Field(
            title="Enable Query Citations",
            description=(
                "Whether to enable query citations for the query engine."
            ),
            default=False,
            alias="enableQueryCitations",
        ),
    ]
    citation_chunk_size: Annotated[
        int,
        Field(
            title="Citation Chunk Size",
            description="The size of the citation chunks for the query engine.",
            default=512,
            alias="citationChunkSize",
        ),
    ]

    @model_validator(mode="after")
    def validate_db_path(self) -> Self:
        """Validate the db_path field.

        Ensure the db_path is set and is a directory.

        Returns
        -------
        Self
            The instance of WaldiezDocAgentQueryEngine with validated db_path.
        """
        if not self.type:
            self.type = "VectorChromaQueryEngine"
        self.db_path = ensure_db_path(self.db_path)
        return self

    def get_db_path(self) -> str:
        """Get the database path for the query engine.

        Returns
        -------
        str
            The database path for the query engine.
        """
        db_path = self.db_path or ensure_db_path(self.db_path)
        return str(db_path)


def ensure_db_path(db_path: str | Path | None) -> str:
    """Get the database path for the query engine.

    Ensure the database path is set and is a directory.

    Parameters
    ----------
    db_path : str | Path | None
        The database path to validate.

    Returns
    -------
    str
        The database path for the query engine.

    Raises
    ------
    ValueError
        If the database path is not set or is not a directory.
    """
    if not db_path:
        data_dir = user_data_dir(
            appname="waldiez",
            appauthor="waldiez",
        )
        data_dir_path = Path(data_dir) / "rag"
        data_dir_path.mkdir(parents=True, exist_ok=True)
        db_path_to_resolve = data_dir_path / "chroma"
        db_path_to_resolve.mkdir(parents=True, exist_ok=True)
        return str(db_path_to_resolve)

    resolved = Path(db_path).resolve()
    if not resolved.is_absolute():
        resolved = (Path.cwd() / db_path).resolve()
    if not resolved.exists():
        resolved.mkdir(parents=True, exist_ok=True)
    if not resolved.is_dir():
        raise ValueError(f"The path {resolved} is not a directory.")
    return str(resolved)
