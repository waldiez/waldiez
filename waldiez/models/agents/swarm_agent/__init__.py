# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Swarm Agent."""

from .after_work import (
    CUSTOM_AFTER_WORK,
    CUSTOM_AFTER_WORK_ARGS,
    CUSTOM_AFTER_WORK_TYPES,
    WaldiezSwarmAfterWork,
    WaldiezSwarmAfterWorkOption,
    WaldiezSwarmAfterWorkRecipientType,
)
from .on_condition import WaldiezSwarmOnCondition
from .on_condition_available import (
    CUSTOM_ON_CONDITION_AVAILABLE,
    CUSTOM_ON_CONDITION_AVAILABLE_ARGS,
    CUSTOM_ON_CONDITION_AVAILABLE_TYPES,
    WaldiezSwarmOnConditionAvailable,
)
from .on_condition_target import WaldiezSwarmOnConditionTarget
from .swarm_agent import WaldiezSwarmAgent
from .swarm_agent_data import WaldiezSwarmAgentData, WaldiezSwarmHandoff
from .update_system_message import (
    CUSTOM_UPDATE_SYSTEM_MESSAGE,
    CUSTOM_UPDATE_SYSTEM_MESSAGE_ARGS,
    CUSTOM_UPDATE_SYSTEM_MESSAGE_TYPES,
    WaldiezSwarmUpdateSystemMessage,
)

__all__ = [
    "CUSTOM_AFTER_WORK",
    "CUSTOM_AFTER_WORK_ARGS",
    "CUSTOM_AFTER_WORK_TYPES",
    "CUSTOM_ON_CONDITION_AVAILABLE",
    "CUSTOM_ON_CONDITION_AVAILABLE_ARGS",
    "CUSTOM_ON_CONDITION_AVAILABLE_TYPES",
    "CUSTOM_UPDATE_SYSTEM_MESSAGE",
    "CUSTOM_UPDATE_SYSTEM_MESSAGE_ARGS",
    "CUSTOM_UPDATE_SYSTEM_MESSAGE_TYPES",
    "WaldiezSwarmAfterWork",
    "WaldiezSwarmAfterWorkOption",
    "WaldiezSwarmAgent",
    "WaldiezSwarmAgentData",
    "WaldiezSwarmAfterWorkRecipientType",
    "WaldiezSwarmHandoff",
    "WaldiezSwarmOnCondition",
    "WaldiezSwarmOnConditionTarget",
    "WaldiezSwarmOnConditionAvailable",
    "WaldiezSwarmUpdateSystemMessage",
]
