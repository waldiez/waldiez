# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Waldiez run results module."""

from typing import Any, TypedDict


class WaldiezRunResults(TypedDict):
    """Results of the Waldiez run."""

    results: list[dict[str, Any]]
    exception: BaseException | None
    completed: bool
