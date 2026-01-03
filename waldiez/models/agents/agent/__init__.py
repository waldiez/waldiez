# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Base agent class to be inherited by all other agents."""

from .agent import WaldiezAgent
from .agent_data import WaldiezAgentData
from .agent_type import WaldiezAgentType
from .code_execution import WaldiezAgentCodeExecutionConfig
from .human_input_mode import WaldiezAgentHumanInputMode
from .linked_tool import WaldiezAgentLinkedTool
from .nested_chat import WaldiezAgentNestedChat, WaldiezAgentNestedChatMessage
from .termination_message import (
    IS_TERMINATION_MESSAGE,
    IS_TERMINATION_MESSAGE_ARGS,
    IS_TERMINATION_MESSAGE_TYPES,
    WaldiezAgentTerminationMessage,
)
from .update_system_message import (
    WaldiezAgentUpdateFunctionType,
    WaldiezAgentUpdateSystemMessage,
)

__all__ = [
    "IS_TERMINATION_MESSAGE",
    "IS_TERMINATION_MESSAGE_ARGS",
    "IS_TERMINATION_MESSAGE_TYPES",
    "WaldiezAgent",
    "WaldiezAgentCodeExecutionConfig",
    "WaldiezAgentData",
    "WaldiezAgentLinkedTool",
    "WaldiezAgentNestedChat",
    "WaldiezAgentNestedChatMessage",
    "WaldiezAgentTerminationMessage",
    "WaldiezAgentType",
    "WaldiezAgentUpdateSystemMessage",
    "WaldiezAgentUpdateFunctionType",
    "WaldiezAgentHumanInputMode",
]
