# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# Requirement:
# The (final) coverage report must be in the `coverage` directory.
# It must be in the `lcov` format. (file `coverage/lcov.info`)

# pyright: reportConstantRedefinition=false
# pyright: reportImplicitRelativeImport=false
"""Run the tests."""

import os
import shutil
import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import (
        ROOT_DIR,
        ensure_dev_requirements,
        ensure_test_requirements,
        run_command,
    )
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from _lib import (  # type: ignore
        ROOT_DIR,
        ensure_dev_requirements,
        ensure_test_requirements,
        run_command,
    )

    HAD_TO_MODIFY_SYS_PATH = True


def run_pytest() -> None:
    """Run pytest."""
    coverage_dir = ROOT_DIR / "coverage" / "py"
    if coverage_dir.exists():
        shutil.rmtree(coverage_dir)
    coverage_dir.mkdir(parents=True, exist_ok=True)
    lcov = os.path.join("coverage", "py", "lcov.info")
    html = os.path.join("coverage", "py", "html")
    xml = os.path.join("coverage", "py", "coverage.xml")
    xunit = os.path.join("coverage", "py", "xunit.xml")
    run_command(  # nosemgrep # nosec
        [
            "pytest",
            "-c",
            "pyproject.toml",
            "--cov=waldiez",
            "--cov-branch",
            "--cov-report=term-missing",
            "--cov-report",
            f"lcov:{lcov}",
            "--cov-report",
            f"html:{html}",
            "--cov-report",
            f"xml:{xml}",
            f"--junitxml={xunit}",
            "tests",
        ]
    )
    print("Pytest done.")


def main() -> None:
    """Run the tests."""
    ensure_test_requirements()
    ensure_dev_requirements()
    run_pytest()


if __name__ == "__main__":
    try:
        main()
    except BaseException as error:  # pylint: disable=broad-exception-caught
        print(f"An error occurred while running pytest: {error}")
        sys.exit(1)
    finally:
        if HAD_TO_MODIFY_SYS_PATH:
            sys.path.pop(0)
