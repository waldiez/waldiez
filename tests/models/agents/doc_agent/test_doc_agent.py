# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pyright: reportCallIssue=false
# pylint: disable=missing-param-doc
"""Test waldiez.models.agents.doc_agent.doc_agent.*."""

from pathlib import Path
from typing import Any

from waldiez.models.agents.doc_agent.doc_agent import WaldiezDocAgent
from waldiez.models.agents.doc_agent.doc_agent_data import WaldiezDocAgentData
from waldiez.models.agents.doc_agent.rag_query_engine import (
    WaldiezDocAgentQueryEngine,
)
from waldiez.models.model import WaldiezModel, WaldiezModelData


# noinspection PyArgumentList
def test_waldiez_doc_agent_creation() -> None:
    """Test WaldiezDocAgent creation."""
    # Given/When
    doc_agent = WaldiezDocAgent(id="da-1", name="doc_agent")

    # Then
    assert doc_agent.id == "da-1"
    assert doc_agent.name == "doc_agent"
    assert doc_agent.agent_type == "doc_agent"
    assert isinstance(doc_agent.data, WaldiezDocAgentData)


# noinspection PyArgumentList
def test_waldiez_doc_agent_with_data(tmp_path: Path) -> None:
    """Test WaldiezDocAgent with custom data."""
    # Given
    data = WaldiezDocAgentData(
        collection_name="test_collection",
        reset_collection=True,
        parsed_docs_path=str(tmp_path / "test_waldiez_doc_agent_with_data"),
    )

    # When
    doc_agent = WaldiezDocAgent(
        id="da-1",
        name="doc_agent",
        data=data,
    )

    # Then
    assert doc_agent.data.collection_name == "test_collection"
    assert doc_agent.data.reset_collection is True
    assert doc_agent.data.parsed_docs_path == str(
        tmp_path / "test_waldiez_doc_agent_with_data"
    )


# noinspection PyArgumentList
def test_waldiez_doc_agent_reset_collection_property() -> None:
    """Test WaldiezDocAgent reset_collection property."""
    # Given
    data = WaldiezDocAgentData(reset_collection=True)
    doc_agent = WaldiezDocAgent(id="da-1", name="doc_agent", data=data)

    # When/Then
    assert doc_agent.reset_collection is True

    # Given
    data.reset_collection = False

    # When/Then
    assert doc_agent.reset_collection is False


# noinspection PyArgumentList
def test_waldiez_doc_agent_get_collection_name() -> None:
    """Test WaldiezDocAgent get_collection_name method."""
    # Given
    doc_agent = WaldiezDocAgent(id="da-1", name="doc_agent")

    # When
    collection_name = doc_agent.get_collection_name()

    # Then
    assert collection_name == "docling-parsed-docs"  # Default value

    # Given
    doc_agent.data.collection_name = "custom_collection"

    # When
    collection_name = doc_agent.get_collection_name()

    # Then
    assert collection_name == "custom_collection"


# noinspection PyArgumentList
def test_waldiez_doc_agent_get_query_engine() -> None:
    """Test WaldiezDocAgent get_query_engine method."""
    # Given
    doc_agent = WaldiezDocAgent(id="da-1", name="doc_agent")

    # When
    query_engine = doc_agent.get_query_engine()

    # Then
    assert isinstance(query_engine, WaldiezDocAgentQueryEngine)
    assert query_engine.type == "VectorChromaQueryEngine"
    assert query_engine.enable_query_citations is False
    assert query_engine.citation_chunk_size == 512


# noinspection PyArgumentList
def test_waldiez_doc_agent_get_db_path() -> None:
    """Test WaldiezDocAgent get_db_path method."""
    # Given
    doc_agent = WaldiezDocAgent(id="da-1", name="doc_agent")

    # When
    db_path = doc_agent.get_db_path()

    # Then
    assert isinstance(db_path, str)
    assert len(db_path) > 0
    assert "chroma" in db_path.lower()


# noinspection PyArgumentList
def test_waldiez_doc_agent_get_parsed_docs_path() -> None:
    """Test WaldiezDocAgent get_parsed_docs_path method."""
    # Given
    doc_agent = WaldiezDocAgent(id="da-1", name="doc_agent")

    # When
    parsed_docs_path = doc_agent.get_parsed_docs_path()

    # Then
    assert isinstance(parsed_docs_path, str)
    assert len(parsed_docs_path) > 0
    assert "parsed_docs" in parsed_docs_path


# noinspection PyArgumentList
def test_waldiez_doc_agent_get_llm_requirements_no_models() -> None:
    """Test WaldiezDocAgent get_llm_requirements with no models."""
    # Given
    doc_agent = WaldiezDocAgent(id="da-1", name="doc_agent")
    all_models: list[WaldiezModel] = []

    # When
    requirements = doc_agent.get_llm_requirements(
        all_models=all_models,
        ag2_version="0.1.0",
    )

    # Then
    expected = {
        "llama-index",
        "llama-index-core",
        "llama-index-llms-openai",
        "llama-index-embeddings-huggingface",
        "llama-index-vector-stores-chroma",
        "llama-index-llms-langchain",
        "chromadb>=0.5,<2",
        "docling>=2.15.1,<3",
        "selenium>=4.28.1,<5",
        "webdriver-manager==4.0.2",
        # "ag2[rag]==0.1.0",
    }
    assert requirements == expected


# noinspection PyArgumentList
def test_waldiez_doc_agent_get_llm_requirements_with_models() -> None:
    """Test WaldiezDocAgent get_llm_requirements with models."""
    # Given
    model = WaldiezModel(
        id="wm-1",
        name="gpt-4",
        description="OpenAI GPT-4",
        data=WaldiezModelData(api_type="openai"),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    doc_agent = WaldiezDocAgent(
        id="da-1",
        name="doc_agent",
        data=WaldiezDocAgentData(model_ids=["wm-1"]),
    )
    all_models = [model]

    # When
    requirements = doc_agent.get_llm_requirements(
        all_models=all_models,
        ag2_version="0.1.0",
    )

    # Then
    expected = {
        "llama-index",
        "llama-index-core",
        "llama-index-llms-openai",
        "llama-index-embeddings-huggingface",
        "llama-index-vector-stores-chroma",
        "llama-index-llms-langchain",
        "chromadb>=0.5,<2",
        "docling>=2.15.1,<3",
        "selenium>=4.28.1,<5",
        "webdriver-manager==4.0.2",
        # "ag2[rag]==0.1.0",
    }
    assert requirements == expected


# noinspection PyArgumentList
def test_waldiez_doc_agent_get_llm_requirements_with_nonexistent_model() -> (
    None
):
    """Test WaldiezDocAgent get_llm_requirements with non-existent model."""
    # Given
    doc_agent = WaldiezDocAgent(
        id="da-1",
        name="doc_agent",
        data=WaldiezDocAgentData(model_ids=["nonexistent-model"]),
    )
    all_models: list[WaldiezModel] = []

    # When
    requirements = doc_agent.get_llm_requirements(
        all_models=all_models,
        ag2_version="0.1.0",
    )
    # Then
    # expected = {"llama-index", "llama-index-core", "ag2[rag]==0.1.0"}
    expected = {
        "llama-index",
        "llama-index-core",
        "llama-index-embeddings-huggingface",
        "llama-index-vector-stores-chroma",
        "llama-index-llms-langchain",
        "chromadb>=0.5,<2",
        "docling>=2.15.1,<3",
        "selenium>=4.28.1,<5",
        "webdriver-manager==4.0.2",
        # "ag2[rag]==0.1.0",
    }
    assert requirements == expected


# noinspection PyArgumentList
def test_waldiez_doc_agent_serialization(tmp_path: Path) -> None:
    """Test WaldiezDocAgent serialization."""
    # Given
    data = WaldiezDocAgentData(
        collection_name="test_collection",
        reset_collection=True,
        parsed_docs_path=str(tmp_path / "test_waldiez_doc_agent_serialization"),
    )
    doc_agent = WaldiezDocAgent(
        id="da-1",
        name="doc_agent",
        description="Test document agent",
        data=data,
    )

    # When
    serialized = doc_agent.model_dump()

    # Then
    assert serialized["id"] == "da-1"
    assert serialized["name"] == "doc_agent"
    assert serialized["description"] == "Test document agent"
    assert serialized["agentType"] == "doc_agent"
    assert serialized["data"]["collectionName"] == "test_collection"
    assert serialized["data"]["resetCollection"] is True
    assert serialized["data"]["parsedDocsPath"] == str(
        tmp_path / "test_waldiez_doc_agent_serialization"
    )


def test_waldiez_doc_agent_deserialization(tmp_path: Path) -> None:
    """Test WaldiezDocAgent deserialization."""
    # Given
    data: dict[str, Any] = {
        "id": "da-1",
        "name": "doc_agent",
        "description": "Test document agent",
        "agentType": "doc_agent",
        "data": {
            "collectionName": "test_collection",
            "resetCollection": True,
            "parsedDocsPath": str(
                tmp_path / "test_waldiez_doc_agent_deserialization"
            ),
        },
    }

    # When
    doc_agent = WaldiezDocAgent.model_validate(data)

    # Then
    assert doc_agent.id == "da-1"
    assert doc_agent.name == "doc_agent"
    assert doc_agent.description == "Test document agent"
    assert doc_agent.agent_type == "doc_agent"
    assert doc_agent.data.collection_name == "test_collection"
    assert doc_agent.data.reset_collection is True
    assert doc_agent.data.parsed_docs_path == str(
        tmp_path / "test_waldiez_doc_agent_deserialization"
    )
