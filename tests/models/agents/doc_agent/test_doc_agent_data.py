# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pyright: reportCallIssue=false
# pylint: disable=missing-param-doc
"""Test waldiez.models.agents.doc_agent.doc_agent_data.*."""

from pathlib import Path
from typing import Any

from waldiez.models.agents.doc_agent.doc_agent_data import WaldiezDocAgentData
from waldiez.models.agents.doc_agent.rag_query_engine import (
    WaldiezDocAgentQueryEngine,
)


def test_waldiez_doc_agent_data_creation() -> None:
    """Test WaldiezDocAgentData creation with defaults."""
    # Given/When
    data = WaldiezDocAgentData()

    # Then
    assert data.collection_name is None
    assert data.reset_collection is False
    assert data.parsed_docs_path is not None
    assert data.query_engine is None


def test_waldiez_doc_agent_data_with_values(tmp_path: Path) -> None:
    """Test WaldiezDocAgentData creation with values."""
    # Given
    query_engine = WaldiezDocAgentQueryEngine(
        type="VectorChromaCitationQueryEngine",
        enable_query_citations=True,
        citation_chunk_size=1024,
    )

    # When
    data = WaldiezDocAgentData(
        collection_name="test_collection",
        reset_collection=True,
        parsed_docs_path=str(
            tmp_path / "test_waldiez_doc_agent_data_with_values"
        ),
        query_engine=query_engine,
    )

    # Then
    assert data.collection_name == "test_collection"
    assert data.reset_collection is True
    assert data.parsed_docs_path == str(
        tmp_path / "test_waldiez_doc_agent_data_with_values"
    )
    assert data.query_engine == query_engine


def test_waldiez_doc_agent_data_get_query_engine() -> None:
    """Test WaldiezDocAgentData get_query_engine method."""
    # Given
    data = WaldiezDocAgentData()

    # When
    query_engine = data.get_query_engine()

    # Then
    assert isinstance(query_engine, WaldiezDocAgentQueryEngine)
    assert data.query_engine is query_engine  # Should be cached

    # When (second call)
    query_engine2 = data.get_query_engine()

    # Then
    assert query_engine2 is query_engine  # Should return same instance


def test_waldiez_doc_agent_data_get_query_engine_with_existing() -> None:
    """Test WaldiezDocAgentData get_query_engine with existing query engine."""
    # Given
    existing_query_engine = WaldiezDocAgentQueryEngine(
        type="InMemoryQueryEngine",
        enable_query_citations=True,
    )
    data = WaldiezDocAgentData(query_engine=existing_query_engine)

    # When
    query_engine = data.get_query_engine()

    # Then
    assert query_engine is existing_query_engine


def test_waldiez_doc_agent_data_get_db_path() -> None:
    """Test WaldiezDocAgentData get_db_path method."""
    # Given
    data = WaldiezDocAgentData()

    # When
    db_path = data.get_db_path()

    # Then
    assert isinstance(db_path, str)
    assert len(db_path) > 0
    assert "chroma" in db_path.lower()


def test_waldiez_doc_agent_data_get_collection_name() -> None:
    """Test WaldiezDocAgentData get_collection_name method."""
    # Given
    data = WaldiezDocAgentData()

    # When
    collection_name = data.get_collection_name()

    # Then
    assert collection_name == "docling-parsed-docs"  # Default value

    # Given
    data.collection_name = "custom_collection"

    # When
    collection_name = data.get_collection_name()

    # Then
    assert collection_name == "custom_collection"


def test_waldiez_doc_agent_data_get_parsed_docs_path_default() -> None:
    """Test WaldiezDocAgentData get_parsed_docs_path with default path."""
    # Given
    data = WaldiezDocAgentData()

    # When
    parsed_docs_path = data.get_parsed_docs_path()

    # Then
    assert isinstance(parsed_docs_path, str)
    assert len(parsed_docs_path) > 0
    assert "parsed_docs" in parsed_docs_path
    assert data.parsed_docs_path == parsed_docs_path  # Should be cached


def test_waldiez_doc_agent_data_get_parsed_docs_path_custom(
    tmp_path: Path,
) -> None:
    """Test WaldiezDocAgentData get_parsed_docs_path with custom path."""
    # Given
    custom_path = tmp_path / "custom_parsed_docs"
    data = WaldiezDocAgentData(parsed_docs_path=custom_path)

    # When
    parsed_docs_path = data.get_parsed_docs_path()

    # Then
    assert parsed_docs_path == str(custom_path)
    assert Path(custom_path).exists()  # Should be created
    assert Path(custom_path).is_dir()


def test_waldiez_doc_agent_data_get_parsed_docs_path_relative(
    tmp_path: Path,
) -> None:
    """Test WaldiezDocAgentData get_parsed_docs_path with relative path."""
    # Given
    relative_path = tmp_path / "relative_docs"
    data = WaldiezDocAgentData(parsed_docs_path=relative_path)

    # When
    parsed_docs_path = data.get_parsed_docs_path()

    # Then
    assert Path(parsed_docs_path).is_absolute()
    assert Path(parsed_docs_path).exists()
    assert Path(parsed_docs_path).is_dir()
    assert data.parsed_docs_path == str(parsed_docs_path)


def test_waldiez_doc_agent_data_get_parsed_docs_path_creates_directory(
    tmp_path: Path,
) -> None:
    """Test get_parsed_docs_path creates missing directory."""
    # Given
    nonexistent_path = tmp_path / "nonexistent" / "parsed_docs"
    data = WaldiezDocAgentData(parsed_docs_path=nonexistent_path)

    # When
    parsed_docs_path = data.get_parsed_docs_path()

    # Then
    assert parsed_docs_path == str(nonexistent_path)
    assert Path(nonexistent_path).exists()
    assert Path(nonexistent_path).is_dir()


def test_waldiez_doc_agent_data_serialization(tmp_path: Path) -> None:
    """Test WaldiezDocAgentData serialization."""
    # Given
    query_engine = WaldiezDocAgentQueryEngine(
        type="VectorChromaCitationQueryEngine",
        enable_query_citations=True,
        citation_chunk_size=1024,
    )
    data = WaldiezDocAgentData(
        collection_name="test_collection",
        reset_collection=True,
        parsed_docs_path=str(
            tmp_path / "test_waldiez_doc_agent_data_serialization"
        ),
        query_engine=query_engine,
    )

    # When
    serialized = data.model_dump()

    # Then
    assert serialized["collectionName"] == "test_collection"
    assert serialized["resetCollection"] is True
    assert serialized["parsedDocsPath"] == str(
        tmp_path / "test_waldiez_doc_agent_data_serialization"
    )
    assert (
        serialized["queryEngine"]["type"] == "VectorChromaCitationQueryEngine"
    )
    assert serialized["queryEngine"]["enableQueryCitations"] is True
    assert serialized["queryEngine"]["citationChunkSize"] == 1024


def test_waldiez_doc_agent_data_deserialization(tmp_path: Path) -> None:
    """Test WaldiezDocAgentData deserialization."""
    # Given
    data: dict[str, Any] = {
        "collectionName": "test_collection",
        "resetCollection": True,
        "parsedDocsPath": str(
            tmp_path / "test_waldiez_doc_agent_data_deserialization"
        ),
        "queryEngine": {
            "type": "VectorChromaCitationQueryEngine",
            "enableQueryCitations": True,
            "citationChunkSize": 1024,
        },
    }

    # When
    doc_agent_data = WaldiezDocAgentData.model_validate(data)

    # Then
    assert doc_agent_data.collection_name == "test_collection"
    assert doc_agent_data.reset_collection is True
    assert doc_agent_data.parsed_docs_path == str(
        tmp_path / "test_waldiez_doc_agent_data_deserialization"
    )
    assert doc_agent_data.query_engine is not None
    assert doc_agent_data.query_engine.type == "VectorChromaCitationQueryEngine"
    assert doc_agent_data.query_engine.enable_query_citations is True
    assert doc_agent_data.query_engine.citation_chunk_size == 1024


def test_waldiez_doc_agent_data_partial_serialization() -> None:
    """Test WaldiezDocAgentData partial serialization."""
    # Given
    data = WaldiezDocAgentData(
        collection_name="test_collection",
        reset_collection=True,
    )

    # When
    serialized = data.model_dump()

    # Then
    assert serialized["collectionName"] == "test_collection"
    assert serialized["resetCollection"] is True
    assert serialized["parsedDocsPath"] is not None
    assert serialized["queryEngine"] is None


def test_waldiez_doc_agent_data_exclude_none_serialization() -> None:
    """Test WaldiezDocAgentData serialization with exclude_none."""
    # Given
    data = WaldiezDocAgentData(
        collection_name="test_collection",
        reset_collection=True,
    )

    # When
    serialized = data.model_dump(exclude_none=True)

    # Then
    assert serialized["collectionName"] == "test_collection"
    assert serialized["resetCollection"] is True
    assert "parsedDocsPath" in serialized
    assert "queryEngine" not in serialized


def test_waldiez_doc_agent_data_inheritance() -> None:
    """Test WaldiezDocAgentData inherits from WaldiezAgentData."""
    # Given
    data = WaldiezDocAgentData(
        collection_name="test_collection",
        system_message="You are a document agent.",
        model_ids=["model-1", "model-2"],
    )

    # When/Then
    assert data.collection_name == "test_collection"
    assert data.system_message == "You are a document agent."
    assert data.model_ids == ["model-1", "model-2"]
