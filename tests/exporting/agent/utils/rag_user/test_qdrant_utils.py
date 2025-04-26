# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
"""Test waldiez.exporting.agents.rag_user.qdrant_utils.*."""

import os

from waldiez.exporting.agent.utils.rag_user.qdrant_utils import (
    get_qdrant_db_args,
)
from waldiez.models import (
    WaldiezRagUser,
    WaldiezRagUserData,
    WaldiezRagUserRetrieveConfig,
    WaldiezRagUserVectorDbConfig,
)

# pylint: disable=line-too-long


def test_get_qdrant_db_args() -> None:
    """Test get_qdrant_db_args."""
    # Given
    rag_user = WaldiezRagUser(
        id="wa-1",
        name="rag_user",
        type="agent",
        agent_type="rag_user",
        description="the description of rag_user",
        tags=[],
        requirements=["requirement101", "requirement212"],
        data=WaldiezRagUserData(
            retrieve_config=WaldiezRagUserRetrieveConfig(
                docs_path="docs_path",
                collection_name="collection_name",
                vector_db="qdrant",
                db_config=WaldiezRagUserVectorDbConfig(
                    local_storage_path="local_storage_path",
                    model="model",
                    connection_url=None,
                    use_memory=True,
                    use_local_storage=True,
                ),
                use_custom_embedding=False,
            ),
        ),
    )
    agent_name = "rag_user"
    # When
    kwargs, imports, embeddings_func = get_qdrant_db_args(rag_user, agent_name)
    # Then
    assert kwargs == (
        '            client=QdrantClient(location=":memory:"),\n'
        '            embedding_function=FastEmbedEmbeddingFunction(model_name="model"),\n'
    )
    assert embeddings_func == ""
    assert imports == {
        "from autogen.agentchat.contrib.vectordb.qdrant import FastEmbedEmbeddingFunction",
        "from qdrant_client import QdrantClient",
    }


def test_get_qdrant_db_args_local_storage() -> None:
    """Test get_qdrant_db_args with local storage."""
    # Given
    rag_user = WaldiezRagUser(
        id="wa-1",
        name="rag_user",
        type="agent",
        agent_type="rag_user",
        description="description",
        tags=["tag2"],
        requirements=["requirement2"],
        data=WaldiezRagUserData(
            retrieve_config=WaldiezRagUserRetrieveConfig(
                docs_path="docs_path",
                collection_name="collection_name",
                vector_db="qdrant",
                db_config=WaldiezRagUserVectorDbConfig(
                    connection_url=None,
                    use_memory=False,
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
    kwargs, imports, embeddings_func = get_qdrant_db_args(rag_user, agent_name)
    # Then
    local_path = os.path.join(os.getcwd(), "local_storage_path")
    assert kwargs == (
        f'            client=QdrantClient(location=r"{local_path}"),'
        '\n            embedding_function=FastEmbedEmbeddingFunction(model_name="model"),\n'
    )
    assert embeddings_func == ""
    assert imports == {
        "from autogen.agentchat.contrib.vectordb.qdrant import FastEmbedEmbeddingFunction",
        "from qdrant_client import QdrantClient",
    }


def test_get_qdrant_db_args_with_connection_url() -> None:
    """Test get_qdrant_db_args with connection url."""
    # Given
    rag_user = WaldiezRagUser(
        id="wa-1",
        name="rag_user",
        type="agent",
        agent_type="rag_user",
        description="user description",
        tags=["tag12"],
        requirements=["requirement"],
        data=WaldiezRagUserData(
            retrieve_config=WaldiezRagUserRetrieveConfig(
                docs_path="docs_path",
                collection_name="collection_name",
                vector_db="qdrant",
                db_config=WaldiezRagUserVectorDbConfig(
                    connection_url="http://localhost:6333",
                    use_memory=False,
                    use_local_storage=False,
                    local_storage_path="local_storage_path",
                    model="model",
                ),
                use_custom_embedding=False,
            ),
        ),
    )
    agent_name = "rag_user"
    # When
    kwargs, imports, embeddings_func = get_qdrant_db_args(rag_user, agent_name)
    # Then
    assert kwargs == (
        '            client=QdrantClient(location="http://localhost:6333"),\n'
        '            embedding_function=FastEmbedEmbeddingFunction(model_name="model"),\n'
    )
    assert embeddings_func == ""
    assert imports == {
        "from autogen.agentchat.contrib.vectordb.qdrant import FastEmbedEmbeddingFunction",
        "from qdrant_client import QdrantClient",
    }


def test_get_qdrant_db_args_custom_embeddings() -> None:
    """Test get_qdrant_db_args with custom embeddings."""
    # Given
    custom_embedding = (
        "def custom_embedding_function():\n"
        "    # pylint: disable=import-outside-toplevel\n"
        "    from sentence_transformers import SentenceTransformer\n"
        '    return SentenceTransformer("model").encode\n'
    )
    rag_user = WaldiezRagUser(
        id="wa-1",
        name="rag_user",
        type="agent",
        agent_type="rag_user",
        description="description of rag_user",
        tags=["tag"],
        requirements=["requirement25"],
        data=WaldiezRagUserData(
            retrieve_config=WaldiezRagUserRetrieveConfig(
                docs_path="docs_path",
                collection_name="collection_name",
                vector_db="qdrant",
                db_config=WaldiezRagUserVectorDbConfig(
                    connection_url=None,
                    use_memory=False,
                    use_local_storage=False,
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
    kwargs, imports, embeddings_func = get_qdrant_db_args(rag_user, agent_name)
    # Then
    assert kwargs == (
        '            client=QdrantClient(location=":memory:"),\n'
        "            embedding_function=custom_embedding_function_rag_user,\n"
    )
    assert embeddings_func == (
        "\ndef custom_embedding_function_rag_user() -> Callable[..., Any]:\n"
        "    # pylint: disable=import-outside-toplevel\n"
        "    from sentence_transformers import SentenceTransformer\n"
        '    return SentenceTransformer("model").encode\n'
    )

    assert imports == {
        "from qdrant_client import QdrantClient",
    }
