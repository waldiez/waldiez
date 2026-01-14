# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportImportCycles=false

"""Agent models."""

from .agent import (
    IS_TERMINATION_MESSAGE,
    IS_TERMINATION_MESSAGE_ARGS,
    IS_TERMINATION_MESSAGE_TYPES,
    WaldiezAgent,
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentNestedChatMessage,
    WaldiezAgentTerminationMessage,
    WaldiezAgentType,
    WaldiezAgentUpdateFunctionType,
    WaldiezAgentUpdateSystemMessage,
)
from .agents import WaldiezAgents
from .assistant import WaldiezAssistant, WaldiezAssistantData
from .captain import (
    WaldiezCaptainAgent,
    WaldiezCaptainAgentData,
    WaldiezCaptainAgentLibEntry,
)
from .doc_agent import (
    WaldiezDocAgent,
    WaldiezDocAgentData,
    WaldiezDocAgentQueryEngine,
)
from .extra_requirements import (
    get_captain_agent_extra_requirements,
    get_retrievechat_extra_requirements,
)
from .group_manager import (
    CUSTOM_SPEAKER_SELECTION,
    CUSTOM_SPEAKER_SELECTION_ARGS,
    CUSTOM_SPEAKER_SELECTION_TYPES,
    WaldiezGroupManager,
    WaldiezGroupManagerData,
    WaldiezGroupManagerSpeakers,
    WaldiezGroupManagerSpeakersSelectionMethod,
    WaldiezGroupManagerSpeakersSelectionMode,
    WaldiezGroupManagerSpeakersTransitionsType,
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
from .remote import (
    WaldiezRemoteAgent,
    WaldiezRemoteAgentData,
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
    "CUSTOM_SPEAKER_SELECTION",
    "CUSTOM_SPEAKER_SELECTION_ARGS",
    "CUSTOM_SPEAKER_SELECTION_TYPES",
    "WaldiezAgent",
    "WaldiezAgentType",
    "WaldiezAgents",
    "WaldiezAssistant",
    "WaldiezAssistantData",
    "WaldiezAgentCodeExecutionConfig",
    "WaldiezAgentData",
    "WaldiezAgentHumanInputMode",
    "WaldiezAgentLinkedTool",
    "WaldiezAgentNestedChat",
    "WaldiezAgentNestedChatMessage",
    "WaldiezAgentTerminationMessage",
    "WaldiezCaptainAgent",
    "WaldiezCaptainAgentData",
    "WaldiezCaptainAgentLibEntry",
    "WaldiezDocAgent",
    "WaldiezDocAgentData",
    "WaldiezRagUserProxy",
    "WaldiezRagUserProxyData",
    "WaldiezRagUserProxyModels",
    "WaldiezReasoningAgent",
    "WaldiezReasoningAgentData",
    "WaldiezReasoningAgentReasonConfig",
    "WaldiezRemoteAgent",
    "WaldiezRemoteAgentData",
    "WaldiezUserProxy",
    "WaldiezUserProxyData",
    "WaldiezDocAgentQueryEngine",
    "WaldiezRagUserProxyRetrieveConfig",
    "WaldiezRagUserProxyTask",
    "WaldiezRagUserProxyChunkMode",
    "WaldiezRagUserProxyVectorDb",
    "WaldiezRagUserProxyVectorDbConfig",
    "WaldiezGroupManager",
    "WaldiezGroupManagerData",
    "WaldiezGroupManagerSpeakers",
    "WaldiezGroupManagerSpeakersSelectionMethod",
    "WaldiezGroupManagerSpeakersSelectionMode",
    "WaldiezGroupManagerSpeakersTransitionsType",
    "WaldiezAgentUpdateSystemMessage",
    "WaldiezAgentUpdateFunctionType",
]
