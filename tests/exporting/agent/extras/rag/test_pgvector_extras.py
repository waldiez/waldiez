# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
"""Test waldiez.exporting.agent.extras.rag.pgvector_extras.*."""

from waldiez.exporting.agent.extras.rag.pgvector_extras import (
    get_pgvector_db_args,
)
from waldiez.models import (
    WaldiezAgentTerminationMessage,
    WaldiezRagUserProxy,
    WaldiezRagUserProxyData,
    WaldiezRagUserProxyRetrieveConfig,
    WaldiezRagUserProxyVectorDbConfig,
)


def test_get_pgvector_db_args() -> None:
    """Test get_pgvector_db_args."""
    # Given
    rag_user = WaldiezRagUserProxy(
        id="wa-1",
        type="agent",
        name="rag_user",
        description="description",
        agent_type="rag_user",
        created_at="2024-01-01T00:00:00Z",
        requirements=["requirement1", "requirement2"],
        tags=["tag1", "tag2"],
        updated_at="2024-01-01T00:00:00Z",
        data=WaldiezRagUserProxyData(
            termination=WaldiezAgentTerminationMessage(type="none"),
            retrieve_config=WaldiezRagUserProxyRetrieveConfig(
                docs_path="docs_path",
                vector_db="pgvector",
                collection_name="collection_name",
                db_config=WaldiezRagUserProxyVectorDbConfig(
                    connection_url="http://localhost:5432",
                    use_local_storage=True,
                    local_storage_path="local_storage_path",
                    model="model",
                ),
                use_custom_embedding=False,
            ),
        ),
    )
    agent_name = "rag_user"
    # When
    kwargs, imports, embeddings_func = get_pgvector_db_args(
        rag_user, agent_name
    )
    # Then
    assert kwargs == (
        '            client=psycopg.connect("http://localhost:5432"),\n'
        '            embedding_function=SentenceTransformer("model").encode,\n'
    )
    assert imports == {
        "import psycopg",
        "from sentence_transformers import SentenceTransformer",
    }
    assert embeddings_func == ""


def test_get_pgvector_db_args_custom_embeddings() -> None:
    """Test get_pgvector_db_args with custom embeddings."""
    # Given
    custom_embedding = (
        "def custom_embedding_function():\n"
        '    return SentenceTransformer("model").encode\n'
    )
    rag_user = WaldiezRagUserProxy(
        id="wa-1",
        type="agent",
        name="rag_user",
        description="description",
        agent_type="rag_user",
        tags=["tag1", "tag2"],
        requirements=["requirement1", "requirement2"],
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        data=WaldiezRagUserProxyData(
            termination=WaldiezAgentTerminationMessage(type="none"),
            retrieve_config=WaldiezRagUserProxyRetrieveConfig(
                docs_path="docs_path",
                collection_name="collection_name",
                vector_db="pgvector",
                db_config=WaldiezRagUserProxyVectorDbConfig(
                    connection_url="http://localhost:5432",
                    use_local_storage=True,
                    local_storage_path="local_storage_path",
                    model="model",
                ),
                use_custom_embedding=True,
                embedding_function=custom_embedding,
            ),
        ),
    )
    agent_name = "rag_user"
    # When
    kwargs, imports, embeddings_func = get_pgvector_db_args(
        rag_user, agent_name
    )
    # Then
    assert kwargs == (
        '            client=psycopg.connect("http://localhost:5432"),\n'
        "            embedding_function=custom_embedding_function_rag_user,\n"
    )
    assert imports == {
        "import psycopg",
    }
    assert embeddings_func == (
        "\ndef custom_embedding_function_rag_user() -> Callable[..., Any]:\n"
        '    return SentenceTransformer("model").encode\n'
    )
