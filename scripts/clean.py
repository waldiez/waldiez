# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Clean the project."""

import glob
import os
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT_DIR = HERE.parent

DIR_PATTERNS = [
    "__pycache__",
    ".cache",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "*.egg-info",
    os.path.join("coverage", "py"),
    "build",
    "site",
]


FILE_PATTERNS = [
    "*.pyc",
    "*.pyo",
    "*.pyc~",
    "*.py~",
    "*.mmd",
    "*~",
    ".*~",
    ".DS_Store",
    "._DS_Store",
    "._.DS_Store",
    ".coverage*",
]

SKIP_DIRS = [".venv", "node_modules"]


def _remove_dirs() -> None:
    for pattern in DIR_PATTERNS:
        for dirpath in glob.glob(f"./**/{pattern}", recursive=True):
            if any(
                f"{os.path.sep}{skip_dir}{os.path.sep}" in dirpath
                for skip_dir in SKIP_DIRS
            ):
                continue
            print(f"removing dir: {dirpath}")
            try:
                shutil.rmtree(dirpath)
            except BaseException:  # pylint: disable=broad-except
                print(f"failed to remove dir: {dirpath}", file=sys.stderr)


def _remove_files() -> None:
    for pattern in FILE_PATTERNS:
        for filepath in glob.glob(f"./**/{pattern}", recursive=True):
            if any(
                f"{os.path.sep}{skip_dir}{os.path.sep}" in filepath
                for skip_dir in SKIP_DIRS
            ):
                continue
            print(f"removing file: {filepath}")
            try:
                os.remove(filepath)
            except BaseException:  # pylint: disable=broad-except
                print(f"failed to remove file: {filepath}", file=sys.stderr)


def main() -> None:
    """Clean the project."""
    _remove_dirs()
    _remove_files()
    print("Clean done .")


if __name__ == "__main__":
    cwd = os.getcwd()
    if os.path.abspath(cwd) != os.path.abspath(ROOT_DIR):
        os.chdir(ROOT_DIR)
    try:
        main()
    finally:
        os.chdir(cwd)
