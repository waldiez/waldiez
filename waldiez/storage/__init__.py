# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Storage module for Waldiez."""

from ._local import WaldiezLocalStorage
from ._protocol import WaldiezStorage


def get_waldiez_storage() -> WaldiezStorage:
    """Get the storage implementation.

    Returns
    -------
    WaldiezStorage
        The storage instance.
    """
    return WaldiezLocalStorage()


__all__ = [
    "WaldiezLocalStorage",
    "WaldiezStorage",
    "get_waldiez_storage",
]
