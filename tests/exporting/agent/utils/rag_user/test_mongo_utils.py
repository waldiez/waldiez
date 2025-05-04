# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.agents.rag_user.mongo_utils.*."""

from waldiez.exporting.agent.utils.rag_user.mongo_utils import (
    get_mongodb_db_args,
)
from waldiez.models import (
    WaldiezRagUserProxy,
    WaldiezRagUserProxyData,
    WaldiezRagUserProxyRetrieveConfig,
    WaldiezRagUserProxyVectorDbConfig,
)


def test_get_mongodb_db_args() -> None:
    """Test get_mongodb_db_args."""
    # Given
    rag_user = WaldiezRagUserProxy(
        id="wa-1",
        name="rag_user",
        type="agent",
        agent_type="rag_user",
        description="description",
        tags=["tag1"],
        requirements=["requirement1", "requirement2"],
        data=WaldiezRagUserProxyData(
            retrieve_config=WaldiezRagUserProxyRetrieveConfig(
                docs_path="docs_path",
                collection_name="collection_name",
                vector_db="mongodb",
                db_config=WaldiezRagUserProxyVectorDbConfig(
                    connection_url="http://localhost:27017",
                    use_local_storage=True,
                    local_storage_path="local_storage_path",
                    model="model",
                    wait_until_document_ready=10,
                    wait_until_index_ready=20,
                ),
                use_custom_embedding=False,
            ),
        ),
    )
    agent_name = "rag_user"
    # When
    kwargs, imports, embeddings_func = get_mongodb_db_args(rag_user, agent_name)
    # Then
    assert kwargs == (
        '            connection_string="http://localhost:27017",\n'
        '            embedding_function=SentenceTransformer("model").encode,\n'
        "            wait_until_document_ready=10.0,\n"
        "            wait_until_index_ready=20.0,\n"
    )
    assert embeddings_func == ""
    assert imports == {
        "from sentence_transformers import SentenceTransformer",
    }


def test_get_mongodb_db_custom_embeddings() -> None:
    """Test get_mongodb_db_args with custom embeddings."""
    # Given
    custom_embedding = (
        "def custom_embedding_function():\n"
        '    return SentenceTransformer("model").encode\n'
    )
    rag_user = WaldiezRagUserProxy(
        id="wa-1",
        name="rag_user",
        description="rag user description",
        tags=["tag2"],
        type="agent",
        agent_type="rag_user",
        requirements=["requirement2"],
        data=WaldiezRagUserProxyData(
            retrieve_config=WaldiezRagUserProxyRetrieveConfig(
                docs_path="docs_path",
                collection_name="collection_name",
                vector_db="mongodb",
                db_config=WaldiezRagUserProxyVectorDbConfig(
                    connection_url="http://localhost:27017",
                    use_local_storage=True,
                    local_storage_path="local_storage_path",
                    model="model",
                    wait_until_document_ready=10,
                    wait_until_index_ready=20,
                ),
                use_custom_embedding=True,
                embedding_function=custom_embedding,
            ),
        ),
    )
    agent_name = "rag_user"
    # When
    kwargs, imports, embeddings_func = get_mongodb_db_args(rag_user, agent_name)
    # Then
    assert kwargs == (
        '            connection_string="http://localhost:27017",\n'
        "            embedding_function=custom_embedding_function_rag_user,\n"
        "            wait_until_document_ready=10.0,\n"
        "            wait_until_index_ready=20.0,\n"
    )
    assert embeddings_func == (
        "\ndef custom_embedding_function_rag_user() -> Callable[..., Any]:\n"
        '    return SentenceTransformer("model").encode\n'
    )
    assert imports == set()
