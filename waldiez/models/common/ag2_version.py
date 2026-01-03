# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportMissingTypeStubs=false
"""Get the autogen version."""

import warnings
from functools import cache


@cache
def get_autogen_version() -> str:
    """Get the autogen version.

    Returns
    -------
    str
        The autogen version.

    Raises
    ------
    ValueError
        If ag2 is not installed.
    """
    # pylint: disable=import-outside-toplevel
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        try:
            from autogen.version import __version__ as ag2  # type: ignore
        except ImportError as error:  # pragma: no cover
            raise ValueError("ag2 is not installed.") from error
        return ag2
