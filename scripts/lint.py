# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

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
        run_isort,
        run_mypy,
        run_pydocstyle,
        run_pylint,
        run_ruff,
        run_yamllint,
    )
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from _lib import (  # type: ignore
        ensure_dev_requirements,
        ensure_test_requirements,
        run_bandit,
        run_black,
        run_flake8,
        run_isort,
        run_mypy,
        run_pydocstyle,
        run_pylint,
        run_ruff,
        run_yamllint,
    )

    HAD_TO_MODIFY_SYS_PATH = True


def main() -> None:
    """Run linters."""
    ensure_dev_requirements()
    ensure_test_requirements()
    run_isort(False)
    run_black(False)
    run_mypy()
    run_flake8()
    run_pydocstyle()
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
