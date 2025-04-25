# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Get mongodb related content and imports."""

from typing import Set, Tuple

from waldiez.models import WaldiezRagUser


def _get_mongodb_embedding_function_string(
    agent: WaldiezRagUser, agent_name: str
) -> Tuple[str, str, str]:
    """Get the MongoDBAtlasVectorDB embedding function string.

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
    if not agent.retrieve_config.use_custom_embedding:
        to_import = "from sentence_transformers import SentenceTransformer"
        embedding_function_arg = (
            "SentenceTransformer("
            f'"{agent.retrieve_config.db_config.model}"'
            ").encode"
        )
    else:
        embedding_function_content, embedding_function_arg = (
            agent.retrieve_config.get_custom_embedding_function(
                name_suffix=agent_name
            )
        )
        embedding_function_content = "\n" + embedding_function_content
    return embedding_function_arg, to_import, embedding_function_content


def get_mongodb_db_args(
    agent: WaldiezRagUser, agent_name: str
) -> Tuple[str, Set[str], str]:
    """Get the kwargs to use for MongoDBAtlasVectorDB.

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
    embedding_function_arg, to_import_embedding, embedding_function_body = (
        _get_mongodb_embedding_function_string(agent, agent_name)
    )
    to_import: Set[str] = (
        set() if not to_import_embedding else {to_import_embedding}
    )
    tab = " " * 12
    db_config = agent.retrieve_config.db_config
    kwarg_string = (
        f'{tab}connection_string="{db_config.connection_url}",' + "\n"
        f"{tab}embedding_function={embedding_function_arg}," + "\n"
    )
    wait_until_document_ready = db_config.wait_until_document_ready
    wait_until_index_ready = db_config.wait_until_index_ready
    if wait_until_document_ready is not None:
        kwarg_string += (
            f"{tab}wait_until_document_ready={wait_until_document_ready},"
            + "\n"
        )
    if wait_until_index_ready is not None:
        kwarg_string += (
            f"{tab}wait_until_index_ready={wait_until_index_ready}," + "\n"
        )
    return kwarg_string, to_import, embedding_function_body
