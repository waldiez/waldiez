# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Waldiez run results module."""

from typing import TYPE_CHECKING, TypedDict, Union

if TYPE_CHECKING:
    from autogen import ChatResult  # type: ignore[import-untyped]


class WaldiezRunResults(TypedDict):
    """Results of the Waldiez run."""

    results: Union[
        "ChatResult",
        list["ChatResult"],
        dict[int, "ChatResult"],
        None,
    ]
    exception: Exception | None
