# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportArgumentType=false,reportIncompatibleVariableOverride=false

"""Remote agent."""

from .remote_agent import WaldiezRemoteAgent
from .remote_agent_data import WaldiezRemoteAgentData

__all__ = [
    "WaldiezRemoteAgent",
    "WaldiezRemoteAgentData",
]
