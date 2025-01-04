# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Format python code using isort, autoflake, black and ruff.

This script formats python code using isort, autoflake, black and ruff.

Functions
---------
run_isort()
    Run isort.
run_autoflake()
    Run autoflake.
run_black()
    Run black.
run_ruff()
    Run ruff.
"""

import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import (
        ROOT_DIR,
        get_python_projects,
        run_autoflake,
        run_black,
        run_command,
        run_isort,
        run_ruff,
    )
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent))
    from _lib import (  # type: ignore
        ROOT_DIR,
        get_python_projects,
        run_autoflake,
        run_black,
        run_command,
        run_isort,
        run_ruff,
    )

    HAD_TO_MODIFY_SYS_PATH = True


def format_root() -> None:
    """Format the root directory."""
    run_isort(in_dir=ROOT_DIR, fix=True)
    run_autoflake(in_dir=ROOT_DIR)
    run_black(in_dir=ROOT_DIR, fix=True)
    run_ruff(in_dir=ROOT_DIR, fix=True)


def format_package(package_dir: Path) -> None:
    """Format a package directory.

    Parameters
    ----------
    package_dir : Path
        The package directory.

    Raises
    ------
    FileNotFoundError
        If the format script is not found in the package directory
    """
    format_script = package_dir / "scripts" / "format.py"
    if not format_script.exists():
        raise FileNotFoundError(f"Format script not found in {package_dir}")
    run_command([sys.executable, str(format_script)])


def main() -> None:
    """Run python formatters."""
    format_root()
    for package_dir in get_python_projects():
        format_package(package_dir)


if __name__ == "__main__":
    try:
        main()
    finally:
        if HAD_TO_MODIFY_SYS_PATH:
            sys.path.pop(0)
