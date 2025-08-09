# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Custom exceptions for Waldiez runners."""


class StopRunningException(Exception):
    """Exception to stop the running process."""

    reason: str = "Execution stopped by user"
