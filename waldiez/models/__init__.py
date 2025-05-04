# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez models.

- Agents (Users, Assistants, Group Managers, etc.).
- Chat (Messages, Summaries, etc.).
- Model (LLM config, API type, etc.).
- Skill (Skills/Tools to be registered).
- Flow (Flow of the conversation).
- Methods (Method names, arguments, hints, etc.).
- Waldiez (Main class to hold the flow).
"""

from .agents import (
    WaldiezAgent,
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentLinkedSkill,
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
from .flow import WaldiezFlow, WaldiezFlowData
from .model import (
    WaldiezModel,
    WaldiezModelAPIType,
    WaldiezModelData,
    WaldiezModelPrice,
)
from .skill import SHARED_SKILL_NAME, WaldiezSkill, WaldiezSkillData
from .waldiez import Waldiez

# pylint: disable=duplicate-code
__all__ = [
    "SHARED_SKILL_NAME",
    "Waldiez",
    "WaldiezAgent",
    "WaldiezAgentCodeExecutionConfig",
    "WaldiezAgentData",
    "WaldiezAgentLinkedSkill",
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
    "WaldiezSkill",
    "WaldiezSkillData",
    "WaldiezUserProxy",
    "WaldiezUserProxyData",
    "WaldiezRagUserProxyRetrieveConfig",
    "WaldiezRagUserProxyTask",
    "WaldiezRagUserProxyChunkMode",
    "WaldiezRagUserProxyVectorDb",
    "WaldiezRagUserProxyVectorDbConfig",
    "WaldiezRagUserProxyModels",
]
