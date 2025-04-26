# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
"""Test waldiez.exporting.agents.rag_user.chroma_utils.*."""

import os

from waldiez.exporting.agent.utils.rag_user.chroma_utils import (
    get_chroma_db_args,
)
from waldiez.models import (
    WaldiezRagUser,
    WaldiezRagUserData,
    WaldiezRagUserRetrieveConfig,
    WaldiezRagUserVectorDbConfig,
)

# pylint: disable=line-too-long


def test_get_chroma_db_args() -> None:
    """Test get_chroma_db_args."""
    # Given
    rag_user = WaldiezRagUser(
        id="wa-1",
        name="rag_user",
        type="agent",
        agent_type="rag_user",
        description="description",
        tags=["tag1"],
        requirements=["requirement1"],
        data=WaldiezRagUserData(
            retrieve_config=WaldiezRagUserRetrieveConfig(
                docs_path="docs_path",
                collection_name="collection_name",
                get_or_create=True,
                vector_db="chroma",
                db_config=WaldiezRagUserVectorDbConfig(
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
    kwargs, imports, embeddings_func, before = get_chroma_db_args(
        rag_user, agent_name
    )
    # Then
    local_path = os.path.join(os.getcwd(), "local_storage_path")
    assert kwargs == (
        "            client=rag_user_client,\n"
        "            embedding_function="
        'SentenceTransformerEmbeddingFunction(model_name="model"),\n'
    )
    assert embeddings_func == ""
    assert imports == {
        "import chromadb",
        "from chromadb.config import Settings",
        "from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction",
    }
    assert before == (
        "rag_user_client = chromadb.PersistentClient(\n"
        f'    path=r"{local_path}",'
        "\n    settings=Settings(anonymized_telemetry=False),"
        "\n)\n"
        'rag_user_client.get_or_create_collection("collection_name")'
        "\n"
    )


def test_get_chroma_db_args_no_local() -> None:
    """Test get_chroma_db_args with no local storage."""
    # Given
    rag_user = WaldiezRagUser(
        id="wa-1",
        name="rag_user",
        type="agent",
        agent_type="rag_user",
        description="description of rag_user",
        tags=["tag3"],
        requirements=["requirement4", "requirement5"],
        data=WaldiezRagUserData(
            retrieve_config=WaldiezRagUserRetrieveConfig(
                docs_path="docs_path",
                collection_name="collection_name",
                vector_db="chroma",
                db_config=WaldiezRagUserVectorDbConfig(
                    use_local_storage=False,
                    local_storage_path=None,
                    model="model",
                ),
                use_custom_embedding=False,
            ),
        ),
    )
    agent_name = "rag_user"
    # When
    kwargs, imports, embeddings_func, _ = get_chroma_db_args(
        rag_user, agent_name
    )
    # Then
    assert kwargs == (
        "            client=rag_user_client,\n"
        '            embedding_function=SentenceTransformerEmbeddingFunction(model_name="model"),\n'
    )
    assert embeddings_func == ""
    assert imports == {
        "import chromadb",
        "from chromadb.config import Settings",
        "from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction",
    }


def test_get_chroma_db_custom_embeddings() -> None:
    """Test get_chroma_db_args with custom embeddings."""
    # Given
    custom_embedding = (
        "def custom_embedding_function():\n"
        '    return SentenceTransformerEmbeddingFunction(model_name="model")\n'
    )
    rag_user = WaldiezRagUser(
        id="wa-1",
        name="rag_user",
        type="agent",
        agent_type="rag_user",
        description="description",
        tags=["tag2"],
        requirements=["requirement4"],
        data=WaldiezRagUserData(
            retrieve_config=WaldiezRagUserRetrieveConfig(
                docs_path="docs_path",
                collection_name="collection_name",
                vector_db="chroma",
                db_config=WaldiezRagUserVectorDbConfig(
                    use_local_storage=False,
                    local_storage_path=None,
                    model="model",
                ),
                use_custom_embedding=True,
                embedding_function=custom_embedding,
            ),
        ),
    )
    agent_name = "rag_user"
    # When
    kwargs, imports, embeddings_func, _ = get_chroma_db_args(
        rag_user, agent_name
    )
    # Then
    assert kwargs == (
        "            client=rag_user_client,\n"
        "            embedding_function=custom_embedding_function_rag_user,\n"
    )
    assert embeddings_func == (
        "\ndef custom_embedding_function_rag_user() -> Callable[..., Any]:\n"
        '    return SentenceTransformerEmbeddingFunction(model_name="model")\n'
    )
    assert imports == {
        "import chromadb",
        "from chromadb.config import Settings",
    }
