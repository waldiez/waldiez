# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez models.

- Agents (Users, Assistants, Group Managers, etc.).
- Chats (Messages, Summaries, etc.).
- Models (LLM config, API type, etc.).
- Tools (Tools to be registered).
- Flow (Flow of the conversation).
- Methods (Method names, arguments, hints, etc.).
- Waldiez (Main class to hold the flow).
"""

from .agents import (
    WaldiezAgent,
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentNestedChatMessage,
    WaldiezAgents,
    WaldiezAgentTerminationMessage,
    WaldiezAgentType,
    WaldiezAgentUpdateFunctionType,
    WaldiezAgentUpdateSystemMessage,
    WaldiezAssistant,
    WaldiezAssistantData,
    WaldiezCaptainAgent,
    WaldiezCaptainAgentData,
    WaldiezCaptainAgentLibEntry,
    WaldiezDocAgent,
    WaldiezDocAgentData,
    WaldiezDocAgentQueryEngine,
    WaldiezGroupManager,
    WaldiezGroupManagerData,
    WaldiezGroupManagerSpeakers,
    WaldiezGroupManagerSpeakersSelectionMethod,
    WaldiezGroupManagerSpeakersSelectionMode,
    WaldiezGroupManagerSpeakersTransitionsType,
    WaldiezRagUserProxy,
    WaldiezRagUserProxyChunkMode,
    WaldiezRagUserProxyData,
    WaldiezRagUserProxyModels,
    WaldiezRagUserProxyRetrieveConfig,
    WaldiezRagUserProxyTask,
    WaldiezRagUserProxyVectorDb,
    WaldiezRagUserProxyVectorDbConfig,
    WaldiezReasoningAgent,
    WaldiezReasoningAgentData,
    WaldiezReasoningAgentReasonConfig,
    WaldiezUserProxy,
    WaldiezUserProxyData,
)
from .chat import (
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatMessageType,
    WaldiezChatNested,
    WaldiezChatSummary,
    WaldiezChatSummaryMethod,
    WaldiezChatType,
)
from .common import (
    MAX_VARIABLE_LENGTH,
    WaldiezAgentTarget,
    WaldiezContextBasedCondition,
    WaldiezContextBasedTransition,
    WaldiezContextStrLLMCondition,
    WaldiezDefaultCondition,
    WaldiezExpressionContextCondition,
    WaldiezGroupOrNestedTarget,
    WaldiezHandoff,
    WaldiezHandoffCondition,
    WaldiezHandoffTransition,
    WaldiezLLMBasedCondition,
    WaldiezLLMBasedTransition,
    WaldiezRandomAgentTarget,
    WaldiezSimpleTarget,
    WaldiezStringContextCondition,
    WaldiezStringLLMCondition,
    WaldiezTransitionAvailability,
    WaldiezTransitionTarget,
    get_autogen_version,
    get_valid_instance_name,
    get_valid_python_variable_name,
)
from .flow import (
    WaldiezAgentConnection,
    WaldiezAgentInfo,
    WaldiezFlow,
    WaldiezFlowData,
    WaldiezFlowInfo,
    WaldiezUniqueNames,
    ensure_unique_names,
)
from .model import (
    DEFAULT_BASE_URLS,
    WaldiezModel,
    WaldiezModelAPIType,
    WaldiezModelAWS,
    WaldiezModelData,
    WaldiezModelPrice,
)
from .tool import (
    SHARED_TOOL_NAME,
    WaldiezTool,
    WaldiezToolData,
    WaldiezToolType,
)
from .waldiez import Waldiez

# pylint: disable=duplicate-code
__all__ = [
    "MAX_VARIABLE_LENGTH",
    "SHARED_TOOL_NAME",
    "DEFAULT_BASE_URLS",
    "ensure_unique_names",
    "get_autogen_version",
    "get_valid_instance_name",
    "get_valid_python_variable_name",
    "Waldiez",
    "WaldiezAgent",
    "WaldiezAgentCodeExecutionConfig",
    "WaldiezAgentConnection",
    "WaldiezAgentData",
    "WaldiezAgentHumanInputMode",
    "WaldiezAgentInfo",
    "WaldiezAgentLinkedTool",
    "WaldiezAgentNestedChat",
    "WaldiezAgentNestedChatMessage",
    "WaldiezAgentTarget",
    "WaldiezAgentTerminationMessage",
    "WaldiezAgentType",
    "WaldiezAgentUpdateFunctionType",
    "WaldiezAgentUpdateSystemMessage",
    "WaldiezAgents",
    "WaldiezAssistant",
    "WaldiezAssistantData",
    "WaldiezCaptainAgent",
    "WaldiezCaptainAgentData",
    "WaldiezCaptainAgentLibEntry",
    "WaldiezChat",
    "WaldiezChatData",
    "WaldiezChatMessage",
    "WaldiezChatMessageType",
    "WaldiezChatNested",
    "WaldiezChatSummary",
    "WaldiezChatSummaryMethod",
    "WaldiezChatType",
    "WaldiezContextBasedCondition",
    "WaldiezContextBasedTransition",
    "WaldiezContextStrLLMCondition",
    "WaldiezDefaultCondition",
    "WaldiezDocAgent",
    "WaldiezDocAgentData",
    "WaldiezExpressionContextCondition",
    "WaldiezFlow",
    "WaldiezFlowData",
    "WaldiezFlowInfo",
    "WaldiezGroupManager",
    "WaldiezGroupManagerData",
    "WaldiezGroupManagerSpeakers",
    "WaldiezGroupManagerSpeakersSelectionMethod",
    "WaldiezGroupManagerSpeakersSelectionMode",
    "WaldiezGroupManagerSpeakersTransitionsType",
    "WaldiezGroupOrNestedTarget",
    "WaldiezHandoff",
    "WaldiezHandoffCondition",
    "WaldiezHandoffTransition",
    "WaldiezLLMBasedCondition",
    "WaldiezLLMBasedTransition",
    "WaldiezModel",
    "WaldiezModelAPIType",
    "WaldiezModelAWS",
    "WaldiezModelData",
    "WaldiezModelPrice",
    "WaldiezDocAgentQueryEngine",
    "WaldiezRagUserProxy",
    "WaldiezRagUserProxyChunkMode",
    "WaldiezRagUserProxyData",
    "WaldiezRagUserProxyModels",
    "WaldiezRagUserProxyRetrieveConfig",
    "WaldiezRagUserProxyTask",
    "WaldiezRagUserProxyVectorDb",
    "WaldiezRagUserProxyVectorDbConfig",
    "WaldiezRandomAgentTarget",
    "WaldiezReasoningAgent",
    "WaldiezReasoningAgentData",
    "WaldiezReasoningAgentReasonConfig",
    "WaldiezSimpleTarget",
    "WaldiezStringContextCondition",
    "WaldiezStringLLMCondition",
    "WaldiezTool",
    "WaldiezToolData",
    "WaldiezToolType",
    "WaldiezTransitionAvailability",
    "WaldiezTransitionTarget",
    "WaldiezUniqueNames",
    "WaldiezUserProxy",
    "WaldiezUserProxyData",
]
