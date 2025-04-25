# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Get qdrant db related imports and content."""

from pathlib import Path
from typing import Set, Tuple

from waldiez.models import WaldiezRagUser


def _get_qdrant_client_string(agent: WaldiezRagUser) -> Tuple[str, str]:
    """Get the QdrantVectorDB client string.

    Parameters
    ----------
    agent : WaldiezRagUser
        The agent.
    agent_name : str
        The agent's name.

    Returns
    -------
    Tuple[str, str, str]
        The 'client' argument, and the module to import.
    """
    to_import: str = "from qdrant_client import QdrantClient"
    client_str = "QdrantClient("
    if agent.retrieve_config.db_config.use_memory:
        client_str += 'location=":memory:")'
    elif (
        agent.retrieve_config.db_config.use_local_storage
        and agent.retrieve_config.db_config.local_storage_path
    ):
        local_path = Path(agent.retrieve_config.db_config.local_storage_path)
        client_str += f'location=r"{local_path}")'
    elif agent.retrieve_config.db_config.connection_url:
        client_str += (
            f'location="{agent.retrieve_config.db_config.connection_url}")'
        )
    else:
        # fallback to memory
        client_str += 'location=":memory:")'
    return client_str, to_import


def _get_qdrant_embedding_function_string(
    agent: WaldiezRagUser, agent_name: str
) -> Tuple[str, str, str]:
    """Get the QdrantVectorDB embedding function string.

    Parameters
    ----------
    agent : WaldiezRagUser
        The agent.
    agent_name : str
        The agent's name.

    Returns
    -------
    Tuple[str, str, str]
        The 'embedding_function', the module to import
        and the custom_embedding_function if used.
    """
    to_import = ""
    embedding_function_arg = ""
    embedding_function_content = ""
    vector_db_model = agent.retrieve_config.db_config.model
    if not agent.retrieve_config.use_custom_embedding:
        to_import = (
            "from autogen.agentchat.contrib.vectordb.qdrant "
            "import FastEmbedEmbeddingFunction"
        )
        embedding_function_arg = "FastEmbedEmbeddingFunction("
        embedding_function_arg += f'model_name="{vector_db_model}")'
    else:
        embedding_function_content, embedding_function_arg = (
            agent.retrieve_config.get_custom_embedding_function(
                name_suffix=agent_name
            )
        )
        embedding_function_content = "\n" + embedding_function_content
    return embedding_function_arg, to_import, embedding_function_content


def get_qdrant_db_args(
    agent: WaldiezRagUser, agent_name: str
) -> Tuple[str, Set[str], str]:
    """Get the kwargs to use for QdrantVectorDB.

    Parameters
    ----------
    agent : WaldiezRagUser
        The agent.
    agent_name : str
        The agent's name.

    Returns
    -------
    Tuple[str, Set[str], str]
        The kwargs to use, the imports and the embedding function body if used.
    """
    client_str, to_import_client = _get_qdrant_client_string(agent)
    embedding_function_arg, to_import_embedding, embedding_function_body = (
        _get_qdrant_embedding_function_string(agent, agent_name)
    )
    to_import = (
        {to_import_client, to_import_embedding}
        if to_import_embedding
        else {to_import_client}
    )
    kwarg_string = (
        f"            client={client_str}," + "\n"
        f"            embedding_function={embedding_function_arg}," + "\n"
    )
    return kwarg_string, to_import, embedding_function_body
