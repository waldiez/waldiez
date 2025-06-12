# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Tool types."""

from typing_extensions import Literal

WaldiezToolType = Literal["shared", "custom", "langchain", "crewai"]
"""Possible types of a Waldiez Tool."""
