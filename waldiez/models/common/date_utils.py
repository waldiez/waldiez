# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Date utilities."""

from datetime import datetime, timezone


def now() -> str:
    """Get the current date and time in UTC.

    Returns
    -------
    str
        The current date and time in UTC.
    """
    return (
        datetime.now(tz=timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )
