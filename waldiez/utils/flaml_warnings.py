# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Try to suppress the warning about flaml.automl not being available."""

import logging

__waldiez_checked_flaml_warnings = False  # pylint: disable=invalid-name


def check_flaml_warnings() -> None:  # pragma: no cover
    """Check for flaml warnings once."""
    # pylint: disable=global-statement
    global __waldiez_checked_flaml_warnings
    if __waldiez_checked_flaml_warnings is False:
        flam_logger = logging.getLogger("flaml")
        flam_logger.setLevel(logging.ERROR)
        __waldiez_checked_flaml_warnings = True
