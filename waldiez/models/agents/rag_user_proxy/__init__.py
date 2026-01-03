# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""It extends a user agent and has RAG related parameters."""

from .rag_user_proxy import WaldiezRagUserProxy
from .rag_user_proxy_data import WaldiezRagUserProxyData
from .retrieve_config import (
    CUSTOM_EMBEDDING_FUNCTION,
    CUSTOM_EMBEDDING_FUNCTION_ARGS,
    CUSTOM_EMBEDDING_FUNCTION_TYPES,
    CUSTOM_TEXT_SPLIT_FUNCTION,
    CUSTOM_TEXT_SPLIT_FUNCTION_ARGS,
    CUSTOM_TEXT_SPLIT_FUNCTION_TYPES,
    CUSTOM_TOKEN_COUNT_FUNCTION,
    CUSTOM_TOKEN_COUNT_FUNCTION_ARGS,
    CUSTOM_TOKEN_COUNT_FUNCTION_TYPES,
    WaldiezRagUserProxyChunkMode,
    WaldiezRagUserProxyModels,
    WaldiezRagUserProxyRetrieveConfig,
    WaldiezRagUserProxyTask,
    WaldiezRagUserProxyVectorDb,
)
from .vector_db_config import WaldiezRagUserProxyVectorDbConfig

__all__ = [
    "CUSTOM_EMBEDDING_FUNCTION",
    "CUSTOM_EMBEDDING_FUNCTION_ARGS",
    "CUSTOM_EMBEDDING_FUNCTION_TYPES",
    "CUSTOM_TEXT_SPLIT_FUNCTION",
    "CUSTOM_TEXT_SPLIT_FUNCTION_ARGS",
    "CUSTOM_TEXT_SPLIT_FUNCTION_TYPES",
    "CUSTOM_TOKEN_COUNT_FUNCTION",
    "CUSTOM_TOKEN_COUNT_FUNCTION_ARGS",
    "CUSTOM_TOKEN_COUNT_FUNCTION_TYPES",
    "WaldiezRagUserProxy",
    "WaldiezRagUserProxyData",
    "WaldiezRagUserProxyModels",
    "WaldiezRagUserProxyVectorDb",
    "WaldiezRagUserProxyChunkMode",
    "WaldiezRagUserProxyRetrieveConfig",
    "WaldiezRagUserProxyTask",
    "WaldiezRagUserProxyVectorDbConfig",
]
