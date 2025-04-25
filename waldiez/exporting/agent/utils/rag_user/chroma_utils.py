# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Get chroma db related imports and content."""

from pathlib import Path
from typing import Set, Tuple

from waldiez.models import WaldiezRagUser


def _get_chroma_client_string(agent: WaldiezRagUser) -> Tuple[str, str]:
    """Get the ChromaVectorDB client string.

    Parameters
    ----------
    agent : WaldiezRagUser
        The agent.
    agent_name : str
        The agent's name.

    Returns
    -------
    Tuple[str, str]
        The 'client' and what to import.
    """
    # TODO: also check `connection_url` (chroma in client-server mode)
    to_import = "import chromadb"
    client_str = "chromadb."
    if (
        agent.retrieve_config.db_config.use_local_storage
        and agent.retrieve_config.db_config.local_storage_path is not None
    ):
        # on windows, we might get:
        # SyntaxError: (unicode error) 'unicodeescape' codec can't decode bytes
        # in position 2-3: truncated \UXXXXXXXX escape
        local_path = Path(agent.retrieve_config.db_config.local_storage_path)
        client_str += (
            "PersistentClient(\n"
            f'    path=r"{local_path}",' + "\n"
            "    settings=Settings(anonymized_telemetry=False),\n"
            ")"
        )
    else:
        client_str += "Client(Settings(anonymized_telemetry=False))"
    return client_str, to_import


def _get_chroma_embedding_function_string(
    agent: WaldiezRagUser, agent_name: str
) -> Tuple[str, str, str]:
    """Get the ChromaVectorDB embedding function string.

    Parameters
    ----------
    agent : WaldiezRagUser
        The agent.
    agent_name : str
        The agent's name.

    Returns
    -------
    Tuple[str, str, str]
        The 'embedding_function', the import and the custom embedding function.
    """
    to_import = ""
    embedding_function_arg = ""
    embedding_function_content = ""
    vector_db_model = agent.retrieve_config.db_config.model
    if not agent.retrieve_config.use_custom_embedding:
        to_import = (
            "from chromadb.utils.embedding_functions "
            "import SentenceTransformerEmbeddingFunction"
        )
        embedding_function_arg = "SentenceTransformerEmbeddingFunction("
        embedding_function_arg += f'model_name="{vector_db_model}")'
    else:
        embedding_function_content, embedding_function_arg = (
            agent.retrieve_config.get_custom_embedding_function(
                name_suffix=agent_name
            )
        )
        embedding_function_content = "\n" + embedding_function_content
    return embedding_function_arg, to_import, embedding_function_content


def get_chroma_db_args(
    agent: WaldiezRagUser, agent_name: str
) -> Tuple[str, Set[str], str, str]:
    """Get the 'kwargs to use for ChromaVectorDB.

    Parameters
    ----------
    agent : WaldiezRagUser
        The agent.
    agent_name : str
        The agent's name.

    Returns
    -------
    Tuple[str, Set[str], str]

        - The 'kwargs' string.
        - What to import.
        - The custom embedding function.
        - Any additional content to be used before the `kwargs` string.
    """
    client_str, client_to_import = _get_chroma_client_string(agent)
    embedding_function_arg, to_import_embedding, embedding_function_body = (
        _get_chroma_embedding_function_string(agent, agent_name)
    )
    to_import = {client_to_import, "from chromadb.config import Settings"}
    if to_import_embedding:
        to_import.add(to_import_embedding)
    kwarg_string = (
        f"            client={agent_name}_client," + "\n"
        f"            embedding_function={embedding_function_arg}," + "\n"
    )
    # The RAG example:
    # https://ag2ai.github.io/ag2/docs/notebooks/agentchat_groupchat_RAG/
    # raises `InvalidCollectionException`: Collection groupchat does not exist.
    # https://github.com/chroma-core/chroma/issues/861
    # https://github.com/microsoft/autogen/issues/3551#issuecomment-2366930994
    # manually initializing the collection before running the flow,
    # might be a workaround.
    content_before = f"{agent_name}_client = {client_str}" + "\n"
    collection_name = agent.retrieve_config.collection_name
    get_or_create = agent.retrieve_config.get_or_create
    if collection_name:
        if get_or_create:
            content_before += (
                f"{agent_name}_client.get_or_create_collection("
                f'"{collection_name}")' + "\n"
            )
        else:
            content_before += (
                "try:\n"
                f'    {agent_name}_client.get_collection("{collection_name}")'
                + "\n"
                "except ValueError:\n"
                f"    {agent_name}_client.create_collection("
                f'"{collection_name}")' + "\n"
            )
    return kwarg_string, to_import, embedding_function_body, content_before
