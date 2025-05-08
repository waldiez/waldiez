# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=import-outside-toplevel,reimported
"""Environment related utilities."""

import importlib
import os
import site
import sys
import warnings
from typing import Dict, Generator, List, Tuple


def in_virtualenv() -> bool:
    """Check if we are inside a virtualenv.

    Returns
    -------
    bool
        True if inside a virtualenv, False otherwise.
    """
    return hasattr(sys, "real_prefix") or (
        hasattr(sys, "base_prefix")
        and os.path.realpath(sys.base_prefix) != os.path.realpath(sys.prefix)
    )


def is_root() -> bool:
    """Check if the script is running as root/administrator.

    Returns
    -------
    bool
        True if running as root/administrator, False otherwise.
    """
    # pylint: disable=import-outside-toplevel,line-too-long
    if os.name == "nt":
        try:
            import ctypes

            return ctypes.windll.shell32.IsUserAnAdmin() != 0  # type: ignore[unused-ignore,attr-defined]  # noqa: E501
        except Exception:  # pylint: disable=broad-exception-caught
            return False
    else:
        return os.getuid() == 0


def refresh_environment() -> None:
    """Refresh the environment."""
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            module="flaml",
            message="^.*flaml.automl is not available.*$",
        )
        from autogen.io import IOStream  # type: ignore

        default_io_stream = IOStream.get_default()
        site.main()
        # pylint: disable=import-outside-toplevel
        modules_to_reload = [mod for mod in sys.modules if "autogen" in mod]
        for mod in modules_to_reload:
            del sys.modules[mod]
        import autogen  # type: ignore
        from autogen.io import IOStream

        importlib.reload(autogen)
        # restore the default IOStream
        IOStream.set_global_default(default_io_stream)
        # reload any other modules that may have been affected
        for mod in modules_to_reload:
            if mod not in sys.modules:
                importlib.import_module(mod)
        # a swarm chat without a user agent
        # creates a new user (this has a default code execution with docker)
        # captain also generates new agents that also have
        # default code execution with docker
        # temp (until we handle/detect docker setup)
        os.environ["AUTOGEN_USE_DOCKER"] = "0"
        # we might get:
        # module 'numpy' has no attribute '_no_nep50_warning'
        # in autogen/agentchat/contrib/captainagent/tool_retriever.py
        os.environ["NEP50_DEPRECATION_WARNING"] = "0"
        os.environ["NEP50_DISABLE_WARNING"] = "1"
        os.environ["NPY_PROMOTION_STATE"] = "weak"
        import numpy as np

        if not hasattr(np, "_no_pep50_warning"):
            import contextlib

            @contextlib.contextmanager
            def _np_no_nep50_warning() -> Generator[None, None, None]:
                """Avoid no_nep50 warning.

                Yields
                ------
                None
                    Dummy value.
                """
                yield

            setattr(np, "_no_pep50_warning", _np_no_nep50_warning)  # noqa


def set_env_vars(flow_env_vars: List[Tuple[str, str]]) -> Dict[str, str]:
    """Set environment variables and return the old ones (if any).

    Parameters
    ----------
    flow_env_vars : List[Tuple[str, str]]
        The environment variables to set.

    Returns
    -------
    Dict[str, str]
        The old environment variables.
    """
    old_vars: Dict[str, str] = {}
    for var_key, var_value in flow_env_vars:
        if var_key:
            current = os.environ.get(var_key, "")
            old_vars[var_key] = current
            os.environ[var_key] = var_value
    return old_vars


def reset_env_vars(old_vars: Dict[str, str]) -> None:
    """Reset the environment variables.

    Parameters
    ----------
    old_vars : Dict[str, str]
        The old environment variables.
    """
    for var_key, var_value in old_vars.items():
        if not var_value:
            os.environ.pop(var_key, "")
        else:
            os.environ[var_key] = var_value
