# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez package."""

from .exporter import WaldiezExporter
from .models import Waldiez
from .runner import WaldiezRunner
from .utils import check_conflicts, check_flaml_warnings, check_rpds_py

# flake8: noqa: F401
# pylint: disable=import-error,line-too-long
# pyright: reportMissingImports=false
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

__WALDIEZ_INITIALIZED = False

if not __WALDIEZ_INITIALIZED:
    __WALDIEZ_INITIALIZED = True
    check_conflicts()
    check_flaml_warnings()
    check_rpds_py()

__all__ = [
    "Waldiez",
    "WaldiezExporter",
    "WaldiezRunner",
    "__version__",
]
