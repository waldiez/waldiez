# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Cleanup."""

# pylint: disable=duplicate-code,broad-except
import glob
import os
import shutil
import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import ROOT_DIR, get_python_projects, run_command
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent))
    from _lib import ROOT_DIR, get_python_projects, run_command  # type: ignore

    HAD_TO_MODIFY_SYS_PATH = True

DIR_PATTERNS = [
    "__pycache__",
    ".cache",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "*.egg-info",
    "htmlcov",
    "reports",
    "coverage",
    "build",
    "logs",
    "site",
]

FILE_PATTERNS = [
    "*.pyc",
    "*.pyo",
    "*.pyc~",
    "*.py~",
    "*~",
    ".*~",
    ".DS_Store",
    "._DS_Store",
    "._.DS_Store",
    ".coverage*",
]


SKIP_DIRS = [
    "node_modules",
    ".venv",
    "package_templates",
    "packages",  # let packages/* handle it
]


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
            except BaseException:
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
            except BaseException:
                print(f"failed to remove file: {filepath}", file=sys.stderr)


def cleanup_root_dir() -> None:
    """Cleanup the root directory."""
    _remove_dirs()
    _remove_files()


def cleanup_package_dir(package_dir: Path) -> None:
    """Cleanup a package directory.

    Parameters
    ----------
    package_dir : Path
        The package directory.

    Raises
    ------
    FileNotFoundError
        If the clean script is not found in the package directory
    """
    clean_py_script = package_dir / "scripts" / "clean.py"
    if not clean_py_script.exists():
        raise FileNotFoundError(f"Clean script not found in {package_dir}")
    run_command([sys.executable, str(clean_py_script)], cwd=package_dir)


def main() -> None:
    """Cleanup unnecessary files and directories."""
    _cwd = os.getcwd()
    os.chdir(ROOT_DIR)
    cleanup_root_dir()
    for package_dir in get_python_projects():
        cleanup_package_dir(package_dir)
    if os.getcwd() != _cwd:
        os.chdir(_cwd)


if __name__ == "__main__":
    try:
        main()
    finally:
        if HAD_TO_MODIFY_SYS_PATH:
            del sys.path[0]
