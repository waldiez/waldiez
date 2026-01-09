# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=import-outside-toplevel,reimported,line-too-long
# flake8: noqa: E501, F401
# pyright: reportUnusedImport=false, reportMissingTypeStubs=false
# pyright: reportMissingImports=false

"""Environment related utilities."""

import importlib
import os
import site
import sys
from collections.abc import Generator


def refresh_environment() -> None:
    """Refresh the environment."""
    # a group chat without a user agent
    # creates a new user (this has a default code execution with docker)
    # captain also generates new agents that also have
    # default code execution with docker
    # temp (until we handle/detect docker setup)
    os.environ["AUTOGEN_USE_DOCKER"] = "0"
    os.environ["ANONYMIZED_TELEMETRY"] = "False"
    os.environ["TOGETHER_NO_BANNER"] = "1"
    try_handle_the_np_thing()
    reload_autogen()
    reload_chroma_if_needed()


# pylint: disable=too-complex,too-many-try-statements,unused-import
# noinspection TryExceptPass
def reload_autogen() -> None:  # noqa: C901  # pragma: no cover
    """Reload the autogen package.

    Try to avoid "please install package x" errors
    when we already have the package installed
    (but autogen is imported before it).

    Raises
    ------
    ImportError
        If the autogen package cannot be reloaded.
    AttributeError
        If the autogen package cannot be reloaded due to missing attributes.
    TypeError
        If the autogen package cannot be reloaded due to type errors.
    Exception
        If any other error occurs during the reload process.
    """
    site.main()

    # Store IOStream state before deletion (if it exists)
    default_io_stream = None
    try:
        from autogen.io import IOStream  # type: ignore

        default_io_stream = IOStream.get_default()
    except (ImportError, AttributeError):
        pass
    autogen_modules = sorted(
        [
            name
            for name in sys.modules
            if name.startswith("autogen.")
            and not name.startswith(("autogen.io", "autogen.tools"))
        ],
        key=len,
        reverse=True,  # Longer names (deeper modules) first
    )
    try:
        # Remove autogen modules in reverse dependency order
        for mod_name in autogen_modules:
            if mod_name in sys.modules:
                del sys.modules[mod_name]

        if "autogen" in sys.modules:
            del sys.modules["autogen"]
        site.main()  # Rebuild the site module cache
        # Re-import autogen
        # pylint: disable=unused-import
        import autogen

        for mod_name in sorted(autogen_modules, key=len, reverse=False):
            # Re-import each module
            try:
                importlib.import_module(mod_name)
            except ImportError as e:
                # If a module fails to import, we can log it or handle it
                print(f"Failed to re-import {mod_name}: {e}", file=sys.stderr)

        # Restore IOStream state if we had it
        if default_io_stream is not None:
            try:
                from autogen.io import IOStream

                IOStream.set_default(default_io_stream)
            except (ImportError, AttributeError, TypeError):
                # If the old IOStream instance is incompatible, ignore
                pass

    except Exception as e:
        # If reload fails, at least try to re-import autogen
        # noinspection PyBroadException
        try:
            import autogen  # type: ignore  # noqa: F401

            for mod_name in sorted(autogen_modules, key=len, reverse=False):
                # Re-import each module
                try:
                    importlib.import_module(mod_name)
                except ImportError as err:
                    # If a module fails to import, we can log it or handle it
                    print(
                        f"Failed to re-import {mod_name}: {err}",
                        file=sys.stderr,
                    )
        except Exception:  # pylint: disable=broad-exception-caught
            pass
        raise e


def reload_chroma_if_needed() -> None:  # pragma: no cover
    """Reload the chroma package if it is installed."""
    chromadb_modules = [
        name
        for name in sys.modules
        if name.startswith("chromadb.") or name == "chromadb"
    ]
    if not chromadb_modules:
        return

    for mod_name in sorted(chromadb_modules, key=len, reverse=True):
        # Remove chromadb modules in reverse dependency order
        if mod_name in sys.modules:
            del sys.modules[mod_name]
    try:
        import chromadb  # type: ignore[unused-ignore, import-not-found, import-untyped]
    except ImportError:
        # If chromadb is not installed, we can ignore this
        return


# noinspection DuplicatedCode
def try_handle_the_np_thing() -> None:
    """Try to handle the numpy deprecation warning."""
    # we might get:
    # module 'numpy' has no attribute '_no_nep50_warning'
    # (sentence_transformers?)
    # in autogen/agentchat/contrib/captainagent/tool_retriever.py
    os.environ["NEP50_DEPRECATION_WARNING"] = "0"
    os.environ["NEP50_DISABLE_WARNING"] = "1"
    os.environ["NPY_PROMOTION_STATE"] = "weak"
    import numpy as np

    if not hasattr(np, "_no_pep50_warning"):  # pragma: no branch
        import contextlib

        @contextlib.contextmanager
        def _np_no_nep50_warning() -> Generator[None, None, None]:
            """Avoid no_nep50 warning.

            Yields
            ------
            None
                Nothing.
            """
            yield  # pragma: no cover

        setattr(np, "_no_pep50_warning", _np_no_nep50_warning)  # noqa


def set_env_vars(flow_env_vars: list[tuple[str, str]]) -> dict[str, str]:
    """Set environment variables and return the old ones (if any).

    Parameters
    ----------
    flow_env_vars : list[tuple[str, str]]
        The environment variables to set.

    Returns
    -------
    dict[str, str]
        The old environment variables.
    """
    old_vars: dict[str, str] = {}
    for var_key, var_value in flow_env_vars:
        if var_key:
            current = os.environ.get(var_key, "")
            old_vars[var_key] = current
            os.environ[var_key] = var_value
    return old_vars


def reset_env_vars(old_vars: dict[str, str]) -> None:
    """Reset the environment variables.

    Parameters
    ----------
    old_vars : dict[str, str]
        The old environment variables.
    """
    for var_key, var_value in old_vars.items():
        if not var_value:
            os.environ.pop(var_key, "")
        else:
            os.environ[var_key] = var_value
