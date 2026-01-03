# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez package."""

import os

from .exporter import WaldiezExporter
from .models import Waldiez
from .runner import WaldiezRunner
from .utils import check_conflicts, patch_ag2

# pylint: disable=invalid-name
__waldiez_initialized = False

# flake8: noqa: F401
# pylint: disable=import-error,line-too-long
# pyright: reportMissingImports=false,reportUnknownVariableType=false
try:
    # noqa: I001
    from ._version import __version__  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]  # noqa
except ImportError:  # pragma: no cover
    if not __waldiez_initialized and os.environ.get(
        "WALDIEZ_TESTING", "false"
    ).lower() not in ("true", "on", "yes", "1"):
        import warnings

        warnings.warn(
            "Importing __version__ failed. Using 'dev' as version.",
            stacklevel=2,
        )
    __version__ = "dev"

if not __waldiez_initialized:
    __waldiez_initialized = True
    os.environ["NEP50_DISABLE_WARNING"] = "1"
    os.environ["AUTOGEN_USE_DOCKER"] = "0"
    os.environ["TOGETHER_NO_BANNER"] = "1"
    check_conflicts()
    patch_ag2()

__all__ = [
    "Waldiez",
    "WaldiezExporter",
    "WaldiezRunner",
    "__version__",
]
