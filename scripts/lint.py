# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=invalid-name
# pyright: reportConstantRedefinition=false
# pyright: reportImplicitRelativeImport=false
"""Lint Python source code in the my_package and tests directories."""

import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import (
        ensure_dev_requirements,
        ensure_test_requirements,
        run_bandit,
        run_black,
        run_flake8,
        run_mypy,
        run_pylint,
        run_pyright,
        run_ruff,
        run_yamllint,
    )
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from _lib import ensure_dev_requirements  # type: ignore # noqa: I001
    from _lib import ensure_test_requirements
    from _lib import (
        run_bandit,
        run_black,
        run_flake8,
        run_mypy,
        run_pyright,
        run_pylint,
        run_ruff,
        run_yamllint,
    )

    HAD_TO_MODIFY_SYS_PATH = True


def run_all() -> None:
    """Run all actions."""
    run_black(False)
    run_mypy()
    run_pyright()
    run_flake8()
    run_bandit()
    run_yamllint()
    run_ruff(False)
    run_pylint()


def main() -> None:
    """Run linters."""
    ensure_dev_requirements()
    ensure_test_requirements()  # mypy might complain about pytest
    single_action = False
    if "black" in sys.argv or "--black" in sys.argv:
        single_action = True
        run_black(False)
    if "mypy" in sys.argv or "--mypy" in sys.argv:
        single_action = True
        run_mypy()
    if "pyright" in sys.argv or "--pyright" in sys.argv:
        single_action = True
        run_pyright()
    if "flake8" in sys.argv or "--flake8" in sys.argv:
        single_action = True
        run_flake8()
    if "bandit" in sys.argv or "--bandit" in sys.argv:
        single_action = True
        run_bandit()
    if "ruff" in sys.argv or "--ruff" in sys.argv:
        single_action = True
        run_ruff(False)
    if "pylint" in sys.argv or "--pylint" in sys.argv:
        single_action = True
        run_pylint()
    if not single_action:
        run_all()


if __name__ == "__main__":
    try:
        main()
    except BaseException as error:  # pylint: disable=broad-exception-caught
        print(f"An error occurred while linting matting the code: {error}")
        sys.exit(1)
    finally:
        if HAD_TO_MODIFY_SYS_PATH or sys.path[0] == str(
            Path(__file__).resolve().parent
        ):
            sys.path.pop(0)
