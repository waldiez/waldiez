# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Try to suppress the warning about flaml.automl not being available."""

import logging

__WALDIEZ_CHECKED_FLAML_WARNINGS = False


def check_flaml_warnings() -> None:  # pragma: no cover
    """Check for flaml warnings once."""
    # pylint: disable=global-statement
    global __WALDIEZ_CHECKED_FLAML_WARNINGS
    if __WALDIEZ_CHECKED_FLAML_WARNINGS is False:
        flam_logger = logging.getLogger("flaml")
        flam_logger.setLevel(logging.ERROR)
        __WALDIEZ_CHECKED_FLAML_WARNINGS = True
