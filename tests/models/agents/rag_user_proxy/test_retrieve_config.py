# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
"""Test waldiez.models.agents.rag_user.retrieve_config.*."""

import os
import shutil
from pathlib import Path

import pytest

from waldiez.models.agents.rag_user_proxy.retrieve_config import (
    WaldiezRagUserProxyRetrieveConfig,
)
from waldiez.models.agents.rag_user_proxy.vector_db_config import (
    WaldiezRagUserProxyVectorDbConfig,
)


def test_waldiez_rag_user_retrieve_config() -> None:
    """Test WaldiezRagUserProxyRetrieveConfig."""
    retrieve_config = WaldiezRagUserProxyRetrieveConfig(
        task="default",
        vector_db="chroma",
        db_config=WaldiezRagUserProxyVectorDbConfig(
            model="all-MiniLM-L6-v2",
            use_memory=True,
            use_local_storage=False,
            local_storage_path=None,
            connection_url=None,
            wait_until_index_ready=None,
            wait_until_document_ready=None,
            metadata={},
        ),
        docs_path="folder",
        new_docs=True,
        model=None,
        chunk_token_size=None,
        context_max_tokens=None,
        chunk_mode="multi_lines",
        must_break_at_empty_line=True,
        use_custom_embedding=False,
        embedding_function=None,
        customized_prompt=None,
        customized_answer_prefix="",
        update_context=True,
        collection_name="autogen-docs",
        get_or_create=False,
        overwrite=False,
        use_custom_token_count=False,
        custom_token_count_function=None,
        use_custom_text_split=False,
        custom_text_split_function=None,
        custom_text_types=None,
        recursive=False,
        distance_threshold=-1.0,
        n_results=-1,
    )
    assert retrieve_config.embedding_function_string is None
    assert retrieve_config.text_split_function_string is None
    assert retrieve_config.token_count_function_string is None


def test_waldiez_rag_user_retrieve_config_custom_embedding() -> None:
    """Test WaldiezRagUserProxyRetrieveConfig with custom embedding."""
    embedding_function = """
def custom_embedding_function():
    return list
"""
    retrieve_config = WaldiezRagUserProxyRetrieveConfig(
        use_custom_embedding=True,
        embedding_function=embedding_function,
    )
    assert retrieve_config.embedding_function_string is not None
    assert retrieve_config.embedding_function_string == "    return list"
    assert retrieve_config.text_split_function_string is None
    assert retrieve_config.token_count_function_string is None

    with pytest.raises(ValueError):
        WaldiezRagUserProxyRetrieveConfig(
            use_custom_embedding=True,
            embedding_function=None,
        )

    with pytest.raises(ValueError):
        WaldiezRagUserProxyRetrieveConfig(
            use_custom_embedding=True,
            embedding_function="def something():\n   return list",
        )


def test_waldiez_rag_user_retrieve_config_custom_token_count() -> None:
    """Test WaldiezRagUserProxyRetrieveConfig with custom token count."""
    token_count_function = """
def custom_token_count_function(text, model):
    return 0
"""  # nosemgrep # nosec
    retrieve_config = WaldiezRagUserProxyRetrieveConfig(
        use_custom_token_count=True,
        custom_token_count_function=token_count_function,
    )
    assert retrieve_config.token_count_function_string is not None
    assert (
        retrieve_config.token_count_function_string
        == "    return 0"  # nosemgrep # nosec
    )
    assert retrieve_config.embedding_function_string is None
    assert retrieve_config.text_split_function_string is None

    with pytest.raises(ValueError):
        WaldiezRagUserProxyRetrieveConfig(
            use_custom_token_count=True,
            custom_token_count_function=None,
        )

    with pytest.raises(ValueError):
        WaldiezRagUserProxyRetrieveConfig(  # nosemgrep # nosec
            use_custom_token_count=True,
            custom_token_count_function="def something():\n    return 0",
        )


# pylint: disable=line-too-long
def test_waldiez_rag_user_retrieve_config_custom_text_split() -> None:
    """Test WaldiezRagUserProxyRetrieveConfig with custom text split."""
    text_split_function = """
def custom_text_split_function(text, max_tokens, chunk_mode, must_break_at_empty_line, overlap):
    return [text]
"""
    retrieve_config = WaldiezRagUserProxyRetrieveConfig(
        use_custom_text_split=True,
        custom_text_split_function=text_split_function,
    )
    assert retrieve_config.text_split_function_string is not None
    assert retrieve_config.text_split_function_string == "    return [text]"
    assert retrieve_config.embedding_function_string is None
    assert retrieve_config.token_count_function_string is None

    with pytest.raises(ValueError):
        WaldiezRagUserProxyRetrieveConfig(
            use_custom_text_split=True,
            custom_text_split_function=None,
        )

    with pytest.raises(ValueError):
        WaldiezRagUserProxyRetrieveConfig(
            use_custom_text_split=True,
            custom_text_split_function="def something():\n    return []",
        )


def test_not_resolved_path() -> None:
    """Test not resolved path."""
    with pytest.raises(ValueError):
        WaldiezRagUserProxyRetrieveConfig(
            task="default",
            vector_db="chroma",
            docs_path="/path/to/not_resolved_path.txt",
        )


def test_with_file_as_doc_path(tmp_path: Path) -> None:
    """Test with file as doc path (resolved).

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    docs_file = tmp_path / "test_with_file_as_doc_path.txt"
    docs_file.touch()
    config = WaldiezRagUserProxyRetrieveConfig(
        task="default",
        vector_db="chroma",
        docs_path=[str(docs_file)],
    )
    assert config.docs_path == [f'r"{docs_file}"']
    docs_file.unlink()


def test_with_folder_as_doc_path(tmp_path: Path) -> None:
    """Test with folder as doc path.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    # not ending with os.sep (we check if is_dir)
    docs_dir = tmp_path / "test_with_folder_as_doc_path"
    docs_dir.mkdir(exist_ok=True)
    config = WaldiezRagUserProxyRetrieveConfig(
        task="default",
        vector_db="chroma",
        docs_path=[str(docs_dir)],
    )
    assert config.docs_path == [f'r"{docs_dir}"']
    shutil.rmtree(docs_dir, ignore_errors=True)
    # ending with os.sep we assume it is a folder
    docs_dir.mkdir(exist_ok=True)
    doc_path = str(docs_dir) + os.path.sep
    config = WaldiezRagUserProxyRetrieveConfig(
        task="default",
        vector_db="chroma",
        docs_path=[doc_path],
    )
    assert config.docs_path == [f'r"{doc_path}"']
    shutil.rmtree(docs_dir, ignore_errors=True)


def test_get_custom_embedding_function() -> None:
    """Test get_custom_embedding_function."""
    config = WaldiezRagUserProxyRetrieveConfig(
        use_custom_embedding=True,
        embedding_function="def custom_embedding_function():\n    return list",
    )
    custom_embedding_function = config.get_custom_embedding_function(
        name_prefix="pre",
        name_suffix="post",
    )
    assert custom_embedding_function[1] == "pre_custom_embedding_function_post"
    assert custom_embedding_function[0] == (
        "def pre_custom_embedding_function_post() -> Callable[..., Any]:\n"
        "    return list\n"
    )
    custom_embedding_function = config.get_custom_embedding_function()
    assert custom_embedding_function[1] == "custom_embedding_function"
    custom_embedding_function = config.get_custom_embedding_function(
        name_prefix="pre",
    )
    assert custom_embedding_function[1] == "pre_custom_embedding_function"


def test_get_custom_token_count_function() -> None:
    """Test get_custom_token_count_function."""
    config = WaldiezRagUserProxyRetrieveConfig(
        use_custom_token_count=True,
        custom_token_count_function=(
            "def custom_token_count_function(text, model):\n    return 0"  # nosemgrep # nosec
        ),
    )
    custom_token_count_function = config.get_custom_token_count_function(
        name_prefix="pre",
        name_suffix="post",
    )
    assert (
        custom_token_count_function[1] == "pre_custom_token_count_function_post"
    )
    assert custom_token_count_function[0] == (
        "def pre_custom_token_count_function_post(\n"
        "    text: str,\n"
        "    model: str,\n"
        ") -> int:\n"
        "    return 0\n"
    )
    custom_token_count_function = config.get_custom_token_count_function()
    assert custom_token_count_function[1] == "custom_token_count_function"
    custom_token_count_function = config.get_custom_token_count_function(
        name_prefix="pre",
    )
    assert custom_token_count_function[1] == "pre_custom_token_count_function"


def test_get_custom_text_split_function() -> None:
    """Test get_custom_text_split_function."""
    config = WaldiezRagUserProxyRetrieveConfig(
        use_custom_text_split=True,
        custom_text_split_function="def custom_text_split_function(text, max_tokens, chunk_mode, must_break_at_empty_line, overlap):\n    return [text]",
    )
    custom_text_split_function = config.get_custom_text_split_function(
        name_prefix="pre",
        name_suffix="post",
    )
    assert (
        custom_text_split_function[1] == "pre_custom_text_split_function_post"
    )
    assert custom_text_split_function[0] == (
        "def pre_custom_text_split_function_post(\n"
        "    text: str,\n"
        "    max_tokens: int,\n"
        "    chunk_mode: str,\n"
        "    must_break_at_empty_line: bool,\n"
        "    overlap: int,\n"
        ") -> list[str]:\n"
        "    return [text]\n"
    )
    custom_text_split_function = config.get_custom_text_split_function()
    assert custom_text_split_function[1] == "custom_text_split_function"
    custom_text_split_function = config.get_custom_text_split_function(
        name_prefix="pre",
    )
    assert custom_text_split_function[1] == "pre_custom_text_split_function"


def test_validate_docs_path() -> None:
    """Test validate_docs_path."""
    this_file = Path(__file__)
    config = WaldiezRagUserProxyRetrieveConfig(
        task="default",
        vector_db="chroma",
        docs_path=[
            "file:///path/to/docs",
            "/path/to/docs",
            "/path/to/folder/one",
            'r"file:///path/to/the/docs"',
            "r'/path/to/folder'",
            "r'file:///path/to/docs/two/'",
            "https://www.example.com/one",
            'r"https://www.example.com/two"',
            "https://www.example.com/two",
            "r'https://www.example.com/three'",
            str(this_file),
            f'r"{this_file}"',
            f"r'{this_file}'",
        ],
    )
    assert config.docs_path == [
        'r"/path/to/docs"',
        'r"/path/to/folder/one"',
        'r"/path/to/the/docs"',
        "r'/path/to/folder'",
        'r"/path/to/docs/two/"',
        'r"https://www.example.com/one"',
        'r"https://www.example.com/two"',
        "r'https://www.example.com/three'",
        f'r"{this_file}"',
    ]
