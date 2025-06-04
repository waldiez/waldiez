# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=line-too-long
"""Vector DB exporting utils for RAG user agents."""

from dataclasses import dataclass, field
from typing import Any

from waldiez.models import WaldiezRagUserProxy

from .chroma_extras import get_chroma_db_args
from .mongo_extras import get_mongodb_db_args
from .pgvector_extras import get_pgvector_db_args
from .qdrant_extras import get_qdrant_db_args


@dataclass
class VectorDBExtras:
    """Vector DB exporting extras for RAG user agents."""

    before_arg: str
    vector_db_arg: str
    imports: set[str] = field(default_factory=set[str])


def get_vector_db_extras(
    agent: WaldiezRagUserProxy,
    agent_name: str,
) -> VectorDBExtras:
    """Get the RAG user vector db string.

    The vector db can be one of the following:
    "vector_db": ChromaVectorDB(....)
    "vector_db": QdrantVectorDB(....)
    "vector_db": MongoDBAtlasVectorDB(....)
    "vector_db": PGVectorDB(....)

    If a custom embedding function is to be used,
    it's name will be in the arg and its definition will be before the arg.

    Parameters
    ----------
    agent : WaldiezRagUserProxy
        The agent.
    agent_name : str
        The agent's name.

    Returns
    -------
    tuple[str, str, Set[str]]
        The content before the arg if any, the arg and the related imports.
    """
    before = ""
    imports: set[str] = set()
    ef_body: str = ""
    db_imports: set[str] = set()
    kwarg_string = ""
    content_before = ""
    vdb_class = "ChromaVectorDB"
    if agent.retrieve_config.vector_db == "chroma":
        imports.add(
            "from autogen.agentchat.contrib.vectordb.chromadb import ChromaVectorDB"
        )
        kwarg_string, db_imports, ef_body, content_before = get_chroma_db_args(
            agent, agent_name
        )
    if agent.retrieve_config.vector_db == "qdrant":
        vdb_class = "QdrantVectorDB"
        imports.add(
            "from autogen.agentchat.contrib.vectordb.qdrant import QdrantVectorDB"
        )
        kwarg_string, db_imports, ef_body = get_qdrant_db_args(
            agent, agent_name
        )
    if agent.retrieve_config.vector_db == "mongodb":
        vdb_class = "MongoDBAtlasVectorDB"
        imports.add(
            "from autogen.agentchat.contrib.vectordb.mongodb import MongoDBAtlasVectorDB"
        )
        kwarg_string, db_imports, ef_body = get_mongodb_db_args(
            agent, agent_name
        )
    if agent.retrieve_config.vector_db == "pgvector":
        imports.add(
            "from autogen.agentchat.contrib.vectordb.pgvectordb import PGVectorDB"
        )
        vdb_class = "PGVectorDB"
        kwarg_string, db_imports, ef_body = get_pgvector_db_args(
            agent, agent_name
        )
    if content_before:
        before += "\n" + f"{content_before}"
    if ef_body:
        before += "\n" + f"{ef_body}" + "\n"
    if db_imports:
        imports.update(db_imports)
    kwarg_string += _get_metadata_arg(agent)
    vdb_arg = f"{vdb_class}(" + "\n"
    vdb_arg += kwarg_string + "        )"
    return VectorDBExtras(
        before_arg=before,
        vector_db_arg=vdb_arg,
        imports=imports,
    )


def _get_metadata_arg(
    agent: WaldiezRagUserProxy,
) -> str:
    """Get the metadata arg.

    Parameters
    ----------
    agent : WaldiezRagUserProxy
        The agent.

    Returns
    -------
    str
        The metadata arg.
    """
    metadata_arg = ""
    if agent.retrieve_config.db_config.metadata:
        tab = "    "
        indent = tab * 3
        metadata_arg += f"{indent}metadata={{" + "\n"
        for key, value in agent.retrieve_config.db_config.metadata.items():
            value_string: Any = f'"{value}"'
            if str(value).isdigit():
                value_string = int(value)
            elif str(value).replace(".", "").isdigit():
                value_string = float(value)
            metadata_arg += f'{indent}    "{key}": {value_string},' + "\n"
        metadata_arg += f"{indent}}}," + "\n"
    return metadata_arg
