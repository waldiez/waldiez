# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=missing-param-doc,no-self-use
"""Test waldiez.models.agents.doc_agent.rag_query_engine.*."""

import os
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest
from typing_extensions import Literal

from waldiez.models.agents.doc_agent.rag_query_engine import (
    WaldiezDocAgentQueryEngine,
    ensure_db_path,
)


def test_waldiez_rag_query_engine_creation() -> None:
    """Test WaldiezDocAgentQueryEngine creation with defaults."""
    # Given/When
    query_engine = WaldiezDocAgentQueryEngine()

    # Then
    assert query_engine.type == "VectorChromaQueryEngine"
    assert query_engine.enable_query_citations is False
    assert query_engine.citation_chunk_size == 512
    assert query_engine.db_path is not None  # Should be set by validator


def test_waldiez_rag_query_engine_with_values(tmp_path: Path) -> None:
    """Test WaldiezDocAgentQueryEngine creation with values."""
    # Given
    db_path = tmp_path / "custom_db"
    os.makedirs(db_path, exist_ok=True)

    # When
    query_engine = WaldiezDocAgentQueryEngine(
        type="VectorChromaCitationQueryEngine",
        db_path=str(db_path),
        enable_query_citations=True,
        citation_chunk_size=1024,
    )

    # Then
    assert query_engine.type == "VectorChromaCitationQueryEngine"
    assert query_engine.db_path == str(db_path)
    assert query_engine.enable_query_citations is True
    assert query_engine.citation_chunk_size == 1024


def test_waldiez_rag_query_engine_inmemory_type() -> None:
    """Test WaldiezDocAgentQueryEngine with InMemoryQueryEngine type."""
    # Given/When
    query_engine = WaldiezDocAgentQueryEngine(type="InMemoryQueryEngine")

    # Then
    assert query_engine.type == "InMemoryQueryEngine"
    assert query_engine.enable_query_citations is False
    assert query_engine.citation_chunk_size == 512


def test_waldiez_rag_query_engine_get_db_path() -> None:
    """Test WaldiezDocAgentQueryEngine get_db_path method."""
    # Given
    query_engine = WaldiezDocAgentQueryEngine()

    # When
    db_path = query_engine.get_db_path()

    # Then
    assert isinstance(db_path, str)
    assert len(db_path) > 0
    assert "chroma" in db_path.lower()


def test_waldiez_rag_query_engine_get_db_path_with_custom_path(
    tmp_path: Path,
) -> None:
    """Test WaldiezDocAgentQueryEngine get_db_path with custom path."""
    # Given
    custom_db_path = tmp_path / "custom_db"
    os.makedirs(custom_db_path, exist_ok=True)
    query_engine = WaldiezDocAgentQueryEngine(db_path=str(custom_db_path))

    # When
    db_path = query_engine.get_db_path()

    # Then
    assert db_path == str(custom_db_path)


def test_waldiez_rag_query_engine_serialization(tmp_path: Path) -> None:
    """Test WaldiezDocAgentQueryEngine serialization."""
    # Given
    db_path = tmp_path / "test_db"
    os.makedirs(db_path, exist_ok=True)
    query_engine = WaldiezDocAgentQueryEngine(
        type="VectorChromaCitationQueryEngine",
        db_path=str(db_path),
        enable_query_citations=True,
        citation_chunk_size=1024,
    )

    # When
    serialized = query_engine.model_dump()

    # Then
    assert serialized["type"] == "VectorChromaCitationQueryEngine"
    assert serialized["dbPath"] == str(db_path)
    assert serialized["enableQueryCitations"] is True
    assert serialized["citationChunkSize"] == 1024


def test_waldiez_rag_query_engine_deserialization(tmp_path: Path) -> None:
    """Test WaldiezDocAgentQueryEngine deserialization."""
    # Given
    db_path = tmp_path / "test_db"
    os.makedirs(db_path, exist_ok=True)
    data: dict[str, Any] = {
        "type": "VectorChromaCitationQueryEngine",
        "dbPath": str(db_path),
        "enableQueryCitations": True,
        "citationChunkSize": 1024,
    }

    # When
    query_engine = WaldiezDocAgentQueryEngine.model_validate(data)

    # Then
    assert query_engine.type == "VectorChromaCitationQueryEngine"
    assert query_engine.db_path == str(db_path)
    assert query_engine.enable_query_citations is True
    assert query_engine.citation_chunk_size == 1024


def test_waldiez_rag_query_engine_partial_data() -> None:
    """Test WaldiezDocAgentQueryEngine with partial data."""
    # Given/When
    query_engine = WaldiezDocAgentQueryEngine(
        type="InMemoryQueryEngine",
        enable_query_citations=True,
    )

    # Then
    assert query_engine.type == "InMemoryQueryEngine"
    assert query_engine.enable_query_citations is True
    assert query_engine.citation_chunk_size == 512  # Default value
    assert query_engine.db_path is not None  # Should be set by validator


def test_waldiez_rag_query_engine_exclude_none_serialization() -> None:
    """Test WaldiezDocAgentQueryEngine serialization with exclude_none."""
    # Given
    query_engine = WaldiezDocAgentQueryEngine(
        type="VectorChromaQueryEngine",
        enable_query_citations=True,
    )

    # When
    serialized = query_engine.model_dump(exclude_none=True)

    # Then
    assert serialized["type"] == "VectorChromaQueryEngine"
    assert serialized["enableQueryCitations"] is True
    assert serialized["citationChunkSize"] == 512
    assert "dbPath" in serialized  # Should be set by validator


class TestEnsureDBPath:
    """Test ensure_db_path function."""

    def test_ensure_db_path_with_none(self) -> None:
        """Test ensure_db_path with None input."""
        # Given/When
        db_path = ensure_db_path(None)

        # Then
        assert isinstance(db_path, str)
        assert len(db_path) > 0
        assert "rag" in db_path.lower()
        assert "chroma" in db_path.lower()
        assert Path(db_path).exists()
        assert Path(db_path).is_dir()

    def test_ensure_db_path_with_empty_string(self) -> None:
        """Test ensure_db_path with empty string."""
        # Given/When
        db_path = ensure_db_path("")

        # Then
        assert isinstance(db_path, str)
        assert len(db_path) > 0
        assert "rag" in db_path.lower()
        assert "chroma" in db_path.lower()
        assert Path(db_path).exists()
        assert Path(db_path).is_dir()

    def test_ensure_db_path_with_absolute_path(self, tmp_path: Path) -> None:
        """Test ensure_db_path with absolute path."""
        # Given
        absolute_path = os.path.join(tmp_path, "test_db")

        # When
        db_path = ensure_db_path(absolute_path)

        # Then
        assert db_path == absolute_path
        assert Path(db_path).exists()
        assert Path(db_path).is_dir()

    def test_ensure_db_path_with_relative_path(self, tmp_path: Path) -> None:
        """Test ensure_db_path with relative path."""
        # Given
        cwd = os.getcwd()
        os.chdir(tmp_path)
        relative_path = "relative_db"

        # When
        db_path = ensure_db_path(relative_path)

        # Then
        expected_path = str(Path.cwd() / relative_path)
        assert db_path == expected_path
        assert Path(db_path).exists()
        assert Path(db_path).is_dir()
        os.chdir(cwd)  # Restore original working directory

    def test_ensure_db_path_creates_missing_directory(
        self, tmp_path: Path
    ) -> None:
        """Test ensure_db_path creates missing directory."""
        # Given
        nonexistent_path = os.path.join(tmp_path, "nonexistent", "db")

        # When
        db_path = ensure_db_path(nonexistent_path)

        # Then
        assert db_path == nonexistent_path
        assert Path(db_path).exists()
        assert Path(db_path).is_dir()

    def test_ensure_db_path_with_file_raises_error(
        self, tmp_path: Path
    ) -> None:
        """Test ensure_db_path raises error when path is a file."""
        # Given
        file_path = os.path.join(tmp_path, "test_file.txt")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write("test content")

        # When/Then
        with pytest.raises(ValueError, match="is not a directory"):
            ensure_db_path(file_path)

    def test_ensure_db_path_with_existing_directory(
        self, tmp_path: Path
    ) -> None:
        """Test ensure_db_path with existing directory."""
        # Given
        existing_dir = os.path.join(tmp_path, "existing_db")
        os.makedirs(existing_dir)

        # When
        db_path = ensure_db_path(existing_dir)

        # Then
        assert db_path == existing_dir
        assert Path(db_path).exists()
        assert Path(db_path).is_dir()

    @patch("waldiez.models.agents.doc_agent.rag_query_engine.user_data_dir")
    def test_ensure_db_path_with_mocked_user_data_dir(
        self,
        mock_user_data_dir: Any,
        tmp_path: Path,
    ) -> None:
        """Test ensure_db_path with mocked user_data_dir."""
        # Given
        mock_user_data_dir.return_value = tmp_path

        # When
        db_path = ensure_db_path(None)

        # Then
        expected_path = tmp_path / "rag" / "chroma"
        assert db_path == str(expected_path)
        assert expected_path.exists()
        assert expected_path.is_dir()
        mock_user_data_dir.assert_called_once_with(
            appname="waldiez",
            appauthor="waldiez",
        )

    def test_ensure_db_path_nested_directory_creation(
        self, tmp_path: Path
    ) -> None:
        """Test ensure_db_path creates nested directories."""
        # Given
        nested_path = os.path.join(tmp_path, "level1", "level2", "level3", "db")

        # When
        db_path = ensure_db_path(nested_path)

        # Then
        assert db_path == nested_path
        assert Path(db_path).exists()
        assert Path(db_path).is_dir()
        # Verify all parent directories were created
        assert Path(tmp_path, "level1").exists()
        assert Path(tmp_path, "level1", "level2").exists()
        assert Path(tmp_path, "level1", "level2", "level3").exists()


class TestWaldiezDocAgentQueryEngineValidation:
    """Test WaldiezDocAgentQueryEngine validation."""

    def test_db_path_validator_with_none(self) -> None:
        """Test db_path validator with None."""
        # Given/When
        query_engine = WaldiezDocAgentQueryEngine(db_path=None)

        # Then
        assert query_engine.db_path is not None
        assert isinstance(query_engine.db_path, str)
        assert len(query_engine.db_path) > 0
        assert Path(query_engine.db_path).exists()
        assert Path(query_engine.db_path).is_dir()

    def test_db_path_validator_with_valid_path(self, tmp_path: Path) -> None:
        """Test db_path validator with valid path."""
        # Given
        valid_path = os.path.join(tmp_path, "valid_db")
        os.makedirs(valid_path)

        # When
        query_engine = WaldiezDocAgentQueryEngine(db_path=valid_path)

        # Then
        assert query_engine.db_path == valid_path

    def test_db_path_validator_creates_missing_path(
        self, tmp_path: Path
    ) -> None:
        """Test db_path validator creates missing path."""
        # Given
        missing_path = os.path.join(tmp_path, "missing_db")

        # When
        query_engine = WaldiezDocAgentQueryEngine(db_path=missing_path)

        # Then
        assert query_engine.db_path == missing_path
        assert Path(missing_path).exists()
        assert Path(missing_path).is_dir()

    def test_citation_chunk_size_validation(self) -> None:
        """Test citation_chunk_size field validation."""
        # Given/When
        query_engine = WaldiezDocAgentQueryEngine(citation_chunk_size=2048)

        # Then
        assert query_engine.citation_chunk_size == 2048

    def test_enable_query_citations_validation(self) -> None:
        """Test enable_query_citations field validation."""
        # Given/When
        query_engine = WaldiezDocAgentQueryEngine(enable_query_citations=True)

        # Then
        assert query_engine.enable_query_citations is True

    def test_type_validation_with_valid_types(self) -> None:
        """Test type field validation with valid types."""
        # Given
        valid_types: list[
            Literal[
                "VectorChromaQueryEngine",
                "VectorChromaCitationQueryEngine",
                "InMemoryQueryEngine",
            ]
        ] = [
            "VectorChromaQueryEngine",
            "VectorChromaCitationQueryEngine",
            "InMemoryQueryEngine",
        ]

        # When/Then
        for query_type in valid_types:
            query_engine = WaldiezDocAgentQueryEngine(type=query_type)
            assert query_engine.type == query_type

    def test_type_validation_with_none(self) -> None:
        """Test type field validation with None (uses default)."""
        # Given/When
        query_engine = WaldiezDocAgentQueryEngine(type=None)

        # Then
        assert query_engine.type == "VectorChromaQueryEngine"  # Default value
