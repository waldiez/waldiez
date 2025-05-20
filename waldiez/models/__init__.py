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
    WaldiezAgentHandoff,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentNestedChatMessage,
    WaldiezAgents,
    WaldiezAgentTerminationMessage,
    WaldiezAgentType,
    WaldiezAssistant,
    WaldiezAssistantData,
    WaldiezCaptainAgent,
    WaldiezCaptainAgentData,
    WaldiezCaptainAgentLibEntry,
    WaldiezGroupManager,
    WaldiezGroupManagerData,
    WaldiezGroupManagerSpeakers,
    WaldiezGroupManagerSpeakersSelectionMethod,
    WaldiezGroupManagerSpeakersSelectionMode,
    WaldiezGroupManagerSpeakersTransitionsType,
    WaldiezGroupOrNestedTarget,
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
    WaldiezChatNested,
    WaldiezChatSummary,
    WaldiezChatSummaryMethod,
)
from .flow import WaldiezAgentConnection, WaldiezFlow, WaldiezFlowData
from .model import (
    WaldiezModel,
    WaldiezModelAPIType,
    WaldiezModelData,
    WaldiezModelPrice,
)
from .tool import SHARED_TOOL_NAME, WaldiezTool, WaldiezToolData
from .waldiez import Waldiez

# pylint: disable=duplicate-code
__all__ = [
    "SHARED_TOOL_NAME",
    "Waldiez",
    "WaldiezAgent",
    "WaldiezAgentCodeExecutionConfig",
    "WaldiezAgentConnection",
    "WaldiezAgentData",
    "WaldiezAgentHandoff",
    "WaldiezAgentLinkedTool",
    "WaldiezAgentNestedChat",
    "WaldiezAgentNestedChatMessage",
    "WaldiezAgents",
    "WaldiezAgentTerminationMessage",
    "WaldiezAgentType",
    "WaldiezAssistant",
    "WaldiezAssistantData",
    "WaldiezCaptainAgent",
    "WaldiezCaptainAgentData",
    "WaldiezCaptainAgentLibEntry",
    "WaldiezChat",
    "WaldiezChatData",
    "WaldiezChatSummary",
    "WaldiezChatNested",
    "WaldiezChatSummaryMethod",
    "WaldiezFlow",
    "WaldiezFlowData",
    "WaldiezChatMessage",
    "WaldiezModel",
    "WaldiezModelAPIType",
    "WaldiezModelData",
    "WaldiezModelPrice",
    "WaldiezRagUserProxy",
    "WaldiezRagUserProxyData",
    "WaldiezReasoningAgent",
    "WaldiezReasoningAgentData",
    "WaldiezReasoningAgentReasonConfig",
    "WaldiezTool",
    "WaldiezToolData",
    "WaldiezUserProxy",
    "WaldiezUserProxyData",
    "WaldiezRagUserProxyRetrieveConfig",
    "WaldiezRagUserProxyTask",
    "WaldiezRagUserProxyChunkMode",
    "WaldiezRagUserProxyVectorDb",
    "WaldiezRagUserProxyVectorDbConfig",
    "WaldiezRagUserProxyModels",
    "WaldiezGroupManager",
    "WaldiezGroupManagerData",
    "WaldiezGroupManagerSpeakers",
    "WaldiezGroupManagerSpeakersSelectionMethod",
    "WaldiezGroupManagerSpeakersSelectionMode",
    "WaldiezGroupManagerSpeakersTransitionsType",
    "WaldiezGroupOrNestedTarget",
]
