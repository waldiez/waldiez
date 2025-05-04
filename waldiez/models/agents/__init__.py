# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Agent models."""

from .agent import (
    IS_TERMINATION_MESSAGE,
    IS_TERMINATION_MESSAGE_ARGS,
    IS_TERMINATION_MESSAGE_TYPES,
    WaldiezAgent,
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentLinkedSkill,
    WaldiezAgentNestedChat,
    WaldiezAgentNestedChatMessage,
    WaldiezAgentTerminationMessage,
    WaldiezAgentType,
)
from .agents import WaldiezAgents
from .assistant import WaldiezAssistant, WaldiezAssistantData
from .captain_agent import (
    WaldiezCaptainAgent,
    WaldiezCaptainAgentData,
    WaldiezCaptainAgentLibEntry,
)
from .extra_requirements import (
    get_captain_agent_extra_requirements,
    get_retrievechat_extra_requirements,
)
from .rag_user_proxy import (
    CUSTOM_EMBEDDING_FUNCTION,
    CUSTOM_EMBEDDING_FUNCTION_ARGS,
    CUSTOM_EMBEDDING_FUNCTION_TYPES,
    CUSTOM_TEXT_SPLIT_FUNCTION,
    CUSTOM_TEXT_SPLIT_FUNCTION_ARGS,
    CUSTOM_TEXT_SPLIT_FUNCTION_TYPES,
    CUSTOM_TOKEN_COUNT_FUNCTION,
    CUSTOM_TOKEN_COUNT_FUNCTION_ARGS,
    CUSTOM_TOKEN_COUNT_FUNCTION_TYPES,
    WaldiezRagUserProxy,
    WaldiezRagUserProxyChunkMode,
    WaldiezRagUserProxyData,
    WaldiezRagUserProxyModels,
    WaldiezRagUserProxyRetrieveConfig,
    WaldiezRagUserProxyTask,
    WaldiezRagUserProxyVectorDb,
    WaldiezRagUserProxyVectorDbConfig,
)
from .reasoning import (
    WaldiezReasoningAgent,
    WaldiezReasoningAgentData,
    WaldiezReasoningAgentReasonConfig,
)
from .user_proxy import WaldiezUserProxy, WaldiezUserProxyData

__all__ = [
    "get_retrievechat_extra_requirements",
    "get_captain_agent_extra_requirements",
    "IS_TERMINATION_MESSAGE",
    "IS_TERMINATION_MESSAGE_ARGS",
    "IS_TERMINATION_MESSAGE_TYPES",
    "CUSTOM_EMBEDDING_FUNCTION",
    "CUSTOM_EMBEDDING_FUNCTION_ARGS",
    "CUSTOM_EMBEDDING_FUNCTION_TYPES",
    "CUSTOM_TEXT_SPLIT_FUNCTION",
    "CUSTOM_TEXT_SPLIT_FUNCTION_ARGS",
    "CUSTOM_TEXT_SPLIT_FUNCTION_TYPES",
    "CUSTOM_TOKEN_COUNT_FUNCTION",
    "CUSTOM_TOKEN_COUNT_FUNCTION_ARGS",
    "CUSTOM_TOKEN_COUNT_FUNCTION_TYPES",
    "WaldiezAgent",
    "WaldiezAgentType",
    "WaldiezAgents",
    "WaldiezAssistant",
    "WaldiezAssistantData",
    "WaldiezAgentCodeExecutionConfig",
    "WaldiezAgentData",
    "WaldiezAgentLinkedSkill",
    "WaldiezAgentNestedChat",
    "WaldiezAgentNestedChatMessage",
    "WaldiezAgentTerminationMessage",
    "WaldiezCaptainAgent",
    "WaldiezCaptainAgentData",
    "WaldiezCaptainAgentLibEntry",
    "WaldiezRagUserProxy",
    "WaldiezRagUserProxyData",
    "WaldiezRagUserProxyModels",
    "WaldiezReasoningAgent",
    "WaldiezReasoningAgentData",
    "WaldiezReasoningAgentReasonConfig",
    "WaldiezUserProxy",
    "WaldiezUserProxyData",
    "WaldiezRagUserProxyRetrieveConfig",
    "WaldiezRagUserProxyTask",
    "WaldiezRagUserProxyChunkMode",
    "WaldiezRagUserProxyVectorDb",
    "WaldiezRagUserProxyVectorDbConfig",
]
