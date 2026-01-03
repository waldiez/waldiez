# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Tool types."""

from typing_extensions import Literal

WaldiezToolType = Literal[
    "shared", "custom", "langchain", "crewai", "predefined"
]
"""Possible types of a Waldiez Tool."""
