# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez agent connection model."""

from typing import TypedDict

from ..agents import (
    WaldiezAgent,
)
from ..chat import WaldiezChat


class WaldiezAgentConnection(TypedDict):
    """Agent connection."""

    source: WaldiezAgent
    target: WaldiezAgent
    chat: WaldiezChat
