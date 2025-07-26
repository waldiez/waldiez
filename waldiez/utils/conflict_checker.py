# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long, broad-exception-caught,invalid-name
# pylint: disable=too-many-try-statements
"""Check for conflicts between Waldiez and other packages."""

import sys
from importlib.metadata import PackageNotFoundError, version

# Global variable to track if conflicts have been checked
__waldiez_checked_conflicts = False


# fmt: off
def _check_autogen_agentchat() -> None:  # pragma: no cover
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


def _check_conflicts() -> None:  # pragma: no cover
    """Check for conflicts."""
    _check_autogen_agentchat()


def check_conflicts() -> None:  # pragma: no cover
    """Check for conflicts."""
    # pylint: disable=global-statement
    global __waldiez_checked_conflicts
    if not __waldiez_checked_conflicts:
        __waldiez_checked_conflicts = True
        _check_conflicts()
