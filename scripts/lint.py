# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

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
    from _lib import ensure_test_requirements  # noqa: I001
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


def main() -> None:
    """Run linters."""
    ensure_dev_requirements()
    ensure_test_requirements()
    run_black(False)
    run_mypy()
    run_pyright()
    run_flake8()
    run_bandit()
    run_yamllint()
    run_ruff(False)
    run_pylint()


if __name__ == "__main__":
    try:
        main()
    except BaseException as error:  # pylint: disable=broad-exception-caught
        print(f"An error occurred while linting matting the code: {error}")
        sys.exit(1)
    finally:
        if HAD_TO_MODIFY_SYS_PATH:
            sys.path.pop(0)
            sys.path.pop(0)
