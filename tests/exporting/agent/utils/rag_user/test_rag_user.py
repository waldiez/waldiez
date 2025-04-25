# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# fmt: off
# flake8: noqa: E501
"""Test waldiez.exporting.agents.rag_user.rag_user.*."""

import os
from typing import Optional, Tuple

from waldiez.exporting.agent.utils.rag_user.rag_user import (
    get_rag_user_extras,
    get_rag_user_retrieve_config_str,
)
from waldiez.exporting.base import ExporterMixin

from waldiez.models import (
    WaldiezRagUser,
    WaldiezRagUserData,
    WaldiezRagUserRetrieveConfig,
    WaldiezRagUserVectorDbConfig,
)

# pylint: disable=line-too-long


def _get_a_doc_path() -> Tuple[str, str]:
    """Get a doc path."""
    path = "/home/username/Documents/ A New Folder"
    if os.name == "nt":
        path = r"C:\Users\username\Documents\ A New Folder"
    expecting = f'r"{path}"'
    return path, expecting


def _get_rag_user(
    doc_path: str,
    local_path: Optional[str] = None,
    custom_embedding: Optional[str] = None,
    custom_token_count: Optional[str] = None,
    custom_text_split: Optional[str] = None,
) -> WaldiezRagUser:
    """Get a RAG user agent."""
    return WaldiezRagUser(
        id="wa-1",
        name="rag_user",
        description="A RAG user agent.",
        type="agent",
        agent_type="rag_user",
        tags=[],
        requirements=[],
        data=WaldiezRagUserData(
            model_ids=["wm-1"],
            retrieve_config=WaldiezRagUserRetrieveConfig(
                vector_db="chroma",
                docs_path=[
                    doc_path,
                    "https://example.com/file.txt",
                    r"https://example.com/file1.txt",
                    r"file:///home/username/Documents/ New Folder",
                    "file:///home/username/Documents/ New Folder1",
                ],
                db_config=WaldiezRagUserVectorDbConfig(
                    use_local_storage=local_path is not None,
                    local_storage_path=local_path,
                ),
                use_custom_text_split=custom_text_split is not None,
                custom_text_split_function=custom_text_split,
                use_custom_token_count=custom_token_count is not None,
                custom_token_count_function=custom_token_count,
                use_custom_embedding=custom_embedding is not None,
                embedding_function=custom_embedding,
            ),
        ),
    )


def test_get_rag_user_extras() -> None:
    """Test get_rag_user_extras()."""
    doc_path, expected_path = _get_a_doc_path()
    rag_user = _get_rag_user(doc_path)
    agent_name = "rag_user"
    model_names = {"wm-1": "model_1"}
    before_agent_string, retrieve_arg, db_imports = get_rag_user_extras(
        agent=rag_user,
        agent_name=agent_name,
        model_names=model_names,
        path_resolver=ExporterMixin.path_resolver,
        serializer=ExporterMixin.serializer,
    )
    assert (
        before_agent_string
        == (
            "\nrag_user_client = chromadb.Client(Settings(anonymized_telemetry=False))\n"  # noqa: E501
            "try:\n"
            '    rag_user_client.get_collection("autogen-docs")\n'
            "except ValueError:\n"
            '    rag_user_client.create_collection("autogen-docs")\n'
        )
    )
    assert (
        retrieve_arg
        == """
    retrieve_config={
        "task": "default",
        "model": "model_1",
        "customized_answer_prefix": "",
        "docs_path": ["""
        + f"""
            {expected_path},"""
        + """
            r"https://example.com/file.txt",
            r"https://example.com/file1.txt",
            r"/home/username/Documents/ New Folder",
            r"/home/username/Documents/ New Folder1"
        ],
        "new_docs": True,
        "update_context": True,
        "get_or_create": False,
        "overwrite": False,
        "recursive": True,
        "chunk_mode": "multi_lines",
        "must_break_at_empty_line": True,
        "collection_name": "autogen-docs",
        "distance_threshold": -1,
        "vector_db": ChromaVectorDB(
            client=rag_user_client,
            embedding_function=SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2"),
        ),
        "client": rag_user_client,
    },"""
    )
    assert db_imports == {
        "from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction",
        "import chromadb",
        "from chromadb.config import Settings",
        "from autogen.agentchat.contrib.vectordb.chromadb import ChromaVectorDB",
    }


def test_get_rag_user_extras_with_custom_embedding_function() -> None:
    """Test get_rag_user_extras() with custom embedding function."""
    custom_embedding_function = """
def custom_embedding_function():
    return text.split
"""
    doc_path, expected_path = _get_a_doc_path()
    rag_user = _get_rag_user(
        doc_path, custom_embedding=custom_embedding_function
    )
    agent_name = "rag_user"
    model_names = {"wm-1": "model_1"}
    before_agent_string, retrieve_arg, db_imports = get_rag_user_extras(
        agent=rag_user,
        agent_name=agent_name,
        model_names=model_names,
        path_resolver=ExporterMixin.path_resolver,
        serializer=ExporterMixin.serializer,
    )
    assert (
        before_agent_string
        == """
rag_user_client = chromadb.Client(Settings(anonymized_telemetry=False))
try:
    rag_user_client.get_collection("autogen-docs")
except ValueError:
    rag_user_client.create_collection("autogen-docs")


def custom_embedding_function_rag_user() -> Callable[..., Any]:
    return text.split

"""
    )
    assert (
        retrieve_arg
        == """
    retrieve_config={
        "task": "default",
        "model": "model_1",
        "customized_answer_prefix": "",
        "docs_path": ["""
        + f"""
            {expected_path},"""
        + """
            r"https://example.com/file.txt",
            r"https://example.com/file1.txt",
            r"/home/username/Documents/ New Folder",
            r"/home/username/Documents/ New Folder1"
        ],
        "new_docs": True,
        "update_context": True,
        "get_or_create": False,
        "overwrite": False,
        "recursive": True,
        "chunk_mode": "multi_lines",
        "must_break_at_empty_line": True,
        "collection_name": "autogen-docs",
        "distance_threshold": -1,
        "vector_db": ChromaVectorDB(
            client=rag_user_client,
            embedding_function=custom_embedding_function_rag_user,
        ),
        "client": rag_user_client,
    },"""
    )
    assert db_imports == {
        "import chromadb",
        "from chromadb.config import Settings",
        "from autogen.agentchat.contrib.vectordb.chromadb import ChromaVectorDB",
    }


def test_get_rag_user_retrieve_config_str() -> None:
    """Test get_rag_user_retrieve_config_str()."""
    custom_token_count_function = """
def custom_token_count_function(text, model):
    return len(text.split())
"""  # nosemgrep  # nosec
    custom_text_split_function = """
def custom_text_split_function(text, max_tokens, chunk_mode, must_break_at_empty_line, overlap):
    return text.split()
"""
    custom_embedding_function = """
def custom_embedding_function():
    return text.split
"""
    doc_path, expected_path = _get_a_doc_path()
    rag_user = _get_rag_user(
        doc_path,
        local_path="data",
        custom_embedding=custom_embedding_function,
        custom_token_count=custom_token_count_function,
        custom_text_split=custom_text_split_function,
    )
    agent_name = "rag_user"
    model_names = {"wm-1": "model_1"}
    rag_content_before_agent, retrieve_arg, db_imports = (
        get_rag_user_retrieve_config_str(
            agent=rag_user,
            agent_name=agent_name,
            model_names=model_names,
            path_resolver=ExporterMixin.path_resolver,
            serializer=ExporterMixin.serializer,
        )
    )
    local_path = os.path.join(os.getcwd(), "data")
    assert (
        retrieve_arg
        == """{
        "task": "default",
        "model": "model_1",
        "customized_answer_prefix": "",
        "docs_path": ["""
        + f"""
            {expected_path},"""
        + """
            r"https://example.com/file.txt",
            r"https://example.com/file1.txt",
            r"/home/username/Documents/ New Folder",
            r"/home/username/Documents/ New Folder1"
        ],
        "new_docs": True,
        "update_context": True,
        "get_or_create": False,
        "overwrite": False,
        "recursive": True,
        "chunk_mode": "multi_lines",
        "must_break_at_empty_line": True,
        "collection_name": "autogen-docs",
        "distance_threshold": -1,
        "custom_token_count_function": "custom_token_count_function_rag_user",
        "custom_text_split_function": "custom_text_split_function_rag_user",
        "vector_db": ChromaVectorDB(
            client=rag_user_client,
            embedding_function=custom_embedding_function_rag_user,
        ),
        "client": rag_user_client,
    }"""
    )
    assert db_imports == {
        "import chromadb",
        "from chromadb.config import Settings",
        "from autogen.agentchat.contrib.vectordb.chromadb import ChromaVectorDB",
    }
    local_path = os.path.join(os.getcwd(), "data")
    assert (
        rag_content_before_agent
        == f"""
rag_user_client = chromadb.PersistentClient(
    path=r"{local_path}",
    settings=Settings(anonymized_telemetry=False),
)
try:
    rag_user_client.get_collection("autogen-docs")
except ValueError:
    rag_user_client.create_collection("autogen-docs")


def custom_embedding_function_rag_user() -> Callable[..., Any]:
    return text.split


def custom_token_count_function_rag_user(
    text: str,
    model: str,
) -> int:
    return len(text.split())


def custom_text_split_function_rag_user(
    text: str,
    max_tokens: int,
    chunk_mode: str,
    must_break_at_empty_line: bool,
    overlap: int,
) -> List[str]:
    return text.split()

"""
)

# fmt: on
