# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.rag_user.vector_db_config.*."""

import os

import pytest
from waldiez.models.agents.rag_user.vector_db_config import (
    WaldiezRagUserVectorDbConfig,
)


def test_waldiez_rag_user_vector_db_config() -> None:
    """Test WaldiezRagUserVectorDbConfig."""
    vector_db_config = WaldiezRagUserVectorDbConfig(
        model="all-MiniLM-L6-v2",
        use_memory=True,
        use_local_storage=False,
        local_storage_path=None,
        connection_url=None,
        wait_until_index_ready=None,
        wait_until_document_ready=None,
        metadata={},
    )
    assert vector_db_config.model == "all-MiniLM-L6-v2"
    assert vector_db_config.use_memory
    assert not vector_db_config.use_local_storage
    assert vector_db_config.local_storage_path is None
    assert vector_db_config.connection_url is None
    assert vector_db_config.wait_until_index_ready is None
    assert vector_db_config.wait_until_document_ready is None
    assert vector_db_config.metadata == {}


def test_waldiez_rag_user_vector_db_config_local_storage() -> None:
    """Test WaldiezRagUserVectorDbConfig with local storage."""
    vector_db_config = WaldiezRagUserVectorDbConfig(
        model="all-MiniLM-L6-v2",
        use_memory=False,
        use_local_storage=True,
        local_storage_path="docs",
        connection_url=None,
        wait_until_index_ready=None,
        wait_until_document_ready=None,
        metadata={},
    )
    assert vector_db_config.model == "all-MiniLM-L6-v2"
    assert not vector_db_config.use_memory
    assert vector_db_config.use_local_storage
    assert vector_db_config.local_storage_path == os.path.join(
        os.getcwd(), "docs"
    )
    assert vector_db_config.connection_url is None
    assert vector_db_config.wait_until_index_ready is None
    assert vector_db_config.wait_until_document_ready is None
    assert vector_db_config.metadata == {}

    with pytest.raises(ValueError):
        WaldiezRagUserVectorDbConfig(
            model="all-MiniLM-L6-v2",
            use_memory=False,
            use_local_storage=True,
            local_storage_path=None,
            connection_url=None,
            wait_until_index_ready=None,
            wait_until_document_ready=None,
            metadata={},
        )
