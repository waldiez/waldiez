# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
"""Check for conflicts with 'autogen-agentchat' package."""

import sys
from importlib.metadata import PackageNotFoundError, version

__WALDIEZ_CHECKED_FOR_CONFLICTS = False


# fmt: off
def _check_conflicts() -> None:  # pragma: no cover
    """Check for conflicts with 'autogen-agentchat' package."""
    try:
        version("autogen-agentchat")
        print(
            "Conflict detected: 'autogen-agentchat' is installed "
            "in the current environment, \n"
            "which conflicts with 'ag2'.\n"
            "Please uninstall 'autogen-agentchat': \n"
            f"{sys.executable} -m pip uninstall -y autogen-agentchat" + "\n"
            "And install 'ag2' (and/or 'waldiez') again: \n"
            f"{sys.executable} -m pip install --force ag2 waldiez",
            file=sys.stderr,
        )
        sys.exit(1)
    except PackageNotFoundError:
        pass
# fmt: on


def check_conflicts() -> None:  # pragma: no cover
    """Check for conflicts with 'autogen-agentchat' package."""
    # pylint: disable=global-statement
    global __WALDIEZ_CHECKED_FOR_CONFLICTS
    if __WALDIEZ_CHECKED_FOR_CONFLICTS is False:
        _check_conflicts()
        __WALDIEZ_CHECKED_FOR_CONFLICTS = True
