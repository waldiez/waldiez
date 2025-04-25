# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez package."""

from .exporter import WaldiezExporter
from .models import Waldiez
from .runner import WaldiezRunner
from .utils import check_conflicts, check_flaml_warnings

# flake8: noqa: F401
# pylint: disable=import-error,line-too-long
# pyright: reportMissingImports=false
try:
    from ._version import (  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]  # noqa
        __version__,
    )
except ImportError:  # pragma: no cover
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode:
    # https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings

    warnings.warn("Importing __version__ failed. Using 'dev' as version.")
    __version__ = "dev"


__WALDIEZ_INITIALIZED = False

if not __WALDIEZ_INITIALIZED:
    check_conflicts()
    check_flaml_warnings()
    # let's skip the one below
    # check_pysqlite3()
    # and use it only if needed:
    #   captain_agent dependency:
    #   before calling pip install pyautogen[captainagent]
    #   we should have pysqlite3 installed (at least on windows)
    # before running a flow
    __WALDIEZ_INITIALIZED = True

__all__ = [
    "Waldiez",
    "WaldiezExporter",
    "WaldiezRunner",
    "__version__",
]
