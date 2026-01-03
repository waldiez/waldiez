# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Utility functions for generating agent related strings."""

from .after_work import AfterWorkProcessor, AfterWorkResult
from .handoff import HandoffProcessor, HandoffResult
from .target import (
    TargetResult,
    TransitionTargetProcessor,
)

__all__ = [
    "AfterWorkProcessor",
    "AfterWorkResult",
    "HandoffProcessor",
    "HandoffResult",
    "TargetResult",
    "TransitionTargetProcessor",
]
