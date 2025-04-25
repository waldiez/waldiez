# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.rag_user.rag_user_data.*."""

from waldiez.models.agents.rag_user.rag_user_data import WaldiezRagUserData


def test_waldiez_rag_user_data() -> None:
    """Test WaldiezRagUserData."""
    rag_user_data = WaldiezRagUserData()
    assert rag_user_data.retrieve_config
    # assert defaults
    assert rag_user_data.retrieve_config.task == "default"
    assert rag_user_data.retrieve_config.vector_db == "chroma"
    assert rag_user_data.retrieve_config.db_config
    assert rag_user_data.retrieve_config.docs_path is None
    assert rag_user_data.retrieve_config.new_docs
    assert rag_user_data.retrieve_config.model is None
    assert rag_user_data.retrieve_config.chunk_token_size is None
    assert rag_user_data.retrieve_config.context_max_tokens is None
    assert rag_user_data.retrieve_config.chunk_mode == "multi_lines"
    assert rag_user_data.retrieve_config.must_break_at_empty_line
    assert not rag_user_data.retrieve_config.use_custom_embedding
    assert rag_user_data.retrieve_config.embedding_function is None
    assert rag_user_data.retrieve_config.embedding_function_string is None
    assert rag_user_data.retrieve_config.customized_prompt is None
    assert rag_user_data.retrieve_config.customized_answer_prefix == ""
    assert rag_user_data.retrieve_config.update_context
    assert rag_user_data.retrieve_config.collection_name == "autogen-docs"
    assert not rag_user_data.retrieve_config.get_or_create
    assert not rag_user_data.retrieve_config.overwrite
    assert not rag_user_data.retrieve_config.use_custom_token_count
    assert rag_user_data.retrieve_config.custom_token_count_function is None
    assert rag_user_data.retrieve_config.token_count_function_string is None
    assert not rag_user_data.retrieve_config.use_custom_text_split
    assert rag_user_data.retrieve_config.custom_text_split_function is None
    assert rag_user_data.retrieve_config.text_split_function_string is None
