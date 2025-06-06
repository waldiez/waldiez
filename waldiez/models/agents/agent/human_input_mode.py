# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Agent human input modes."""

from typing_extensions import Literal

WaldiezAgentHumanInputMode = Literal["ALWAYS", "NEVER", "TERMINATE"]
"""Possible human input modes for agents: ALWAYS, NEVER, TERMINATE."""
