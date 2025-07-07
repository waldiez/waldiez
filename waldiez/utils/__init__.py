# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Utils to call on init."""

from .conflict_checker import check_conflicts
from .version import get_waldiez_version, is_testing

__all__ = [
    "check_conflicts",
    "get_waldiez_version",
    "is_testing",
]
