# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Handle the version of the package."""
# > - `scripts/version.py`: the script to update the version
# >    The script should expect the arguments `--set` or `--get`
# >    and it should either return `x.y.z` or set the version to `x.y.z`.

import argparse
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent

try:
    from my_package._version import __version__
except ImportError:
    sys.path.append(str(ROOT_DIR))
    from my_package._version import __version__


def set_version(version_string: str) -> None:
    """Set the version to the given value.

    Parameters
    ----------
    version_string : str
        The version string in the format x.y.z

    Raises
    ------
    ValueError
        If the version string is not in the format x.y.z
        If the version string was not found in the _version.py file
    FileNotFoundError
        If the _version.py file was not found
    """
    try:
        major_str, minor_str, patch_str = version_string.split(".")
        major, minor, patch = int(major_str), int(minor_str), int(patch_str)
    except BaseException as error:
        raise ValueError(
            "The version string must be in the format x.y.z"
        ) from error
    new_version = f"{major}.{minor}.{patch}"
    version_py_path = ROOT_DIR / "my_package" / "_version.py"
    if not version_py_path.exists():
        raise FileNotFoundError("The _version.py file was not found")
    with open(version_py_path, "r", encoding="utf-8") as file:
        lines = file.readlines()
    found_version = False
    for index, line in enumerate(lines):
        if line.startswith("__version__"):
            lines[index] = f'__version__ = "{new_version}"\n'
            found_version = True
            break
    if not found_version:
        raise ValueError(
            "The version string was not found in the _version.py file"
        )
    with open(version_py_path, "w", encoding="utf-8", newline="\n") as file:
        file.writelines(lines)


def main() -> None:
    """Handle the command line arguments."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--set", help="Set the version to the given value in the format x.y.z"
    )
    parser.add_argument(
        "--get", action="store_true", help="Get the current version"
    )
    args, _ = parser.parse_known_args()

    if args.set:
        set_version(args.set)
    elif args.get:
        print(__version__)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
