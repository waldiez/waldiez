# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Try to get the Waldiez version."""

import json
from functools import cache
from importlib.metadata import version
from pathlib import Path


def _get_waldiez_version_from_importlib() -> str | None:
    """Get the Waldiez version from the version package."""
    try:
        return version("waldiez")
    except Exception:  # pylint: disable=broad-exception-caught
        return None


def _get_waldiez_version_from_package_json() -> str | None:
    """Get the Waldiez version from package.json."""
    package_json_path = Path(__file__).parent.parent.parent / "package.json"
    if package_json_path.exists():
        with open(package_json_path, "r", encoding="utf-8") as f:
            package_data = json.load(f)
            return package_data.get("version", None)
    return None


def _get_waldiez_version_from_version_py() -> str | None:
    """Get the Waldiez version from _version.py."""
    version_py_path = Path(__file__).parent.parent / "_version.py"
    if version_py_path.exists():
        with open(version_py_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("__version__"):
                    return line.split('"')[1]
    return None


@cache
def get_waldiez_version() -> str:
    """Get the Waldiez version.

    Returns
    -------
    str
        The Waldiez version, or "dev" if not found.
    """
    w_version = _get_waldiez_version_from_importlib()
    if not w_version:
        w_version = _get_waldiez_version_from_version_py()
    if not w_version:
        w_version = _get_waldiez_version_from_package_json()
    if not w_version:
        w_version = "dev"
    return w_version


if __name__ == "__main__":
    print(get_waldiez_version())
