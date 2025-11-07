# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez package."""

from .exporter import WaldiezExporter
from .models import Waldiez
from .runner import WaldiezRunner
from .utils import check_conflicts, patch_ag2

# flake8: noqa: F401
# pylint: disable=import-error,line-too-long
# pyright: reportMissingImports=false,reportUnknownVariableType=false
try:
    # noqa: I001
    from ._version import __version__  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]  # noqa
except ImportError:  # pragma: no cover
    import warnings

    warnings.warn(
        "Importing __version__ failed. Using 'dev' as version.",
        stacklevel=2,
    )
    __version__ = "dev"

# pylint: disable=invalid-name
__waldiez_initialized = False

if not __waldiez_initialized:
    __waldiez_initialized = True
    check_conflicts()
    patch_ag2()

__all__ = [
    "Waldiez",
    "WaldiezExporter",
    "WaldiezRunner",
    "__version__",
]
