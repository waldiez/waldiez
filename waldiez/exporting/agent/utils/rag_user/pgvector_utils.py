# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Get pgvector related content and imports."""

from typing import Set, Tuple

from waldiez.models import WaldiezRagUser


def _get_pgvector_client_string(agent: WaldiezRagUser) -> Tuple[str, str]:
    """Get the PGVectorDB client string.

    Parameters
    ----------
    agent : WaldiezRagUser
        The agent.

    Returns
    -------
    Tuple[str, str]
        The 'client' and what to import.
    """
    to_import = "import psycopg"
    client_str = "psycopg."
    connection_url = agent.retrieve_config.db_config.connection_url
    client_str += f'connect("{connection_url}")'
    return client_str, to_import


def _get_pgvector_embedding_function_string(
    agent: WaldiezRagUser, agent_name: str
) -> Tuple[str, str, str]:
    """Get the PGVectorDB embedding function string.

    Parameters
    ----------
    agent : WaldiezRagUser
        The agent.
    agent_name : str
        The agent's name.

    Returns
    -------
    Tuple[str, str, str]
        The 'embedding_function', the import and the custom_embedding_function.
    """
    to_import = ""
    embedding_function_arg = ""
    embedding_function_content = ""
    if agent.retrieve_config.use_custom_embedding:
        embedding_function_arg = f"custom_embedding_function_{agent_name}"
        embedding_function_content, embedding_function_arg = (
            agent.retrieve_config.get_custom_embedding_function(
                name_suffix=agent_name
            )
        )
        embedding_function_content = "\n" + embedding_function_content
    else:
        to_import = "from sentence_transformers import SentenceTransformer"
        embedding_function_arg = "SentenceTransformer("
        embedding_function_arg += (
            f'"{agent.retrieve_config.db_config.model}").encode'
        )
    return embedding_function_arg, to_import, embedding_function_content


def get_pgvector_db_args(
    agent: WaldiezRagUser, agent_name: str
) -> Tuple[str, Set[str], str]:
    """Get the kwargs to use for PGVectorDB.

    Parameters
    ----------
    agent : WaldiezRagUser
        The agent.
    agent_name : str
        The agent's name.

    Returns
    -------
    Tuple[str, Set[str], str]
        The kwargs to use, what to import and the custom_embedding_function.
    """
    client_str, to_import_client = _get_pgvector_client_string(agent)
    embedding_function_arg, to_import_embedding, embedding_function_body = (
        _get_pgvector_embedding_function_string(agent, agent_name)
    )
    to_import = (
        {to_import_client, to_import_embedding}
        if to_import_embedding
        else {to_import_client}
    )
    kwarg_str = (
        f"            client={client_str}," + "\n"
        f"            embedding_function={embedding_function_arg}," + "\n"
    )
    return kwarg_str, to_import, embedding_function_body
