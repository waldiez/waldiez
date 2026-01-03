# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Pin waldiez-extras.

waldiez has as extras:
- waldiez[jupyter]
- waldiez[studio]
- waldiez[runner]

Each of them, depend on the latest version of waldiez.
So when we bump the core version, we need to bump the extras versions too
`uv sync` will complain if the extras are not yet released.
So let's pin them before we release waldiez (in CI).
"""

# flake8: noqa: E501
# pylint: disable=import-error,import-outside-toplevel,too-few-public-methods
# pylint: disable=broad-exception-caught
# isort: skip_file
import json
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent

EXTRAS_TO_PIN = [
    "waldiez_studio",
    "waldiez_jupyter",
    "waldiez_runner",
]


def get_waldiez_version() -> str:
    """Get the version of waldiez.

    It's in package.json

    Returns
    -------
    str
        The current version of waldiez.

    Raises
    ------
    FileNotFoundError
        If the package.json file does not exist.
    """
    package_json = ROOT_DIR / "package.json"
    if not package_json.exists():
        raise FileNotFoundError(f"File not found: {package_json}")
    with open(package_json, "r", encoding="utf-8") as f:
        data = json.load(f)
    version = data["version"]
    return version


def main() -> None:
    """Pin the version of waldiez-extras.

    Raises
    ------
    FileNotFoundError
        If the pyproject.toml file does not exist.
    """
    waldiez_version = get_waldiez_version()
    py_project_toml = ROOT_DIR / "pyproject.toml"
    if not py_project_toml.exists():
        raise FileNotFoundError(f"File not found: {py_project_toml}")
    data = ""
    with open(py_project_toml, "r", encoding="utf-8") as f:
        data = f.read()
    for extra in EXTRAS_TO_PIN:
        # find the line with the extra
        # e.g.
        # waldiez_jupyter==x.y.z or
        # "waldiez_runner==0.4.4; python_version >= '3.11'",
        pattern = re.compile(rf"{extra}==\d+\.\d+\.\d+")
        match = pattern.search(data)
        if not match:
            pattern = re.compile(rf'"{extra}==\d+\.\d+\.\d+"')
            match = pattern.search(data)
        if not match:
            print(f"Could not find {extra} in {py_project_toml}")
            sys.exit(1)
        # # replace the version with the new one
        new_version = f"{extra}=={waldiez_version}"
        # # if the extra is in quotes, replace it with the new one
        if match.group(0).startswith('"'):
            new_version = f'"{new_version}"'
        data = pattern.sub(new_version, data)

    # write the file
    with open(py_project_toml, "w", encoding="utf-8") as f:
        f.write(data)
    print(f"Pinned {EXTRAS_TO_PIN} to {waldiez_version} in {py_project_toml}")


if __name__ == "__main__":
    main()
