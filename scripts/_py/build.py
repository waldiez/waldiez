# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Build python packages."""

import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import ROOT_DIR, get_python_projects, run_command
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent))
    from _lib import ROOT_DIR, get_python_projects, run_command  # type: ignore

    HAD_TO_MODIFY_SYS_PATH = True


def build_package(package_dir: Path) -> None:
    """Build the python package.

    Parameters
    ----------
    package_dir : Path
        The package directory.
    """
    docs_py_script = package_dir / "scripts" / "build.py"
    if not docs_py_script.exists():
        print(f"Build script not found in {package_dir}, skipping ...")
        return
    # base_url = {this.repo_url}/{package_dir.name}
    print(f"Building python package in {package_dir} ...")
    output_dir = ROOT_DIR / "dist" / package_dir.name
    run_command(
        [sys.executable, str(docs_py_script), "--output", str(output_dir)],
        cwd=package_dir,
    )


def main() -> None:
    """Build the python packages."""
    for project in get_python_projects():
        build_package(project)


if __name__ == "__main__":
    try:
        main()
    finally:
        if HAD_TO_MODIFY_SYS_PATH:
            sys.path.pop(0)
