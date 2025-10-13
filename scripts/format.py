# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=invalid-name
# pyright: reportConstantRedefinition=false
# pyright: reportImplicitRelativeImport=false

"""Format the Python code."""

import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import ensure_dev_requirements, run_autoflake, run_black, run_ruff
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    # fmt: off
    from _lib import ensure_dev_requirements  # type: ignore # noqa: I001
    from _lib import run_autoflake, run_black, run_ruff  # noqa: I001

    # fmt: on
    HAD_TO_MODIFY_SYS_PATH = True


def main() -> None:
    """Run python formatters."""
    ensure_dev_requirements()
    run_autoflake()
    run_black(True)
    run_ruff(True)


if __name__ == "__main__":
    try:
        main()
    except BaseException as error:  # pylint: disable=broad-exception-caught
        print(f"An error occurred while formatting the code: {error}")
        sys.exit(1)
    finally:
        if HAD_TO_MODIFY_SYS_PATH or sys.path[0] == str(
            Path(__file__).resolve().parent
        ):
            sys.path.pop(0)
