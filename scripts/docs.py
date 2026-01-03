# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=invalid-name
# pyright: reportConstantRedefinition=false
# pyright: reportImplicitRelativeImport=false

"""Build the documentation."""

import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import (
        ROOT_DIR,
        ensure_dev_requirements,
        ensure_docs_requirements,
        run_command,
    )
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from _lib import (  # type: ignore
        ROOT_DIR,
        ensure_dev_requirements,
        ensure_docs_requirements,
        run_command,
    )

    HAD_TO_MODIFY_SYS_PATH = True


def build_docs(output_dir: Path) -> None:
    """Build the documentation.

    Parameters
    ----------
    output_dir : Path
        The output directory.
    """
    command = [
        "mkdocs",
        "build",
        "-d",
        str(output_dir),
    ]
    if "--clean" in sys.argv:
        command.append("--clean")
    if "--site-dir" in sys.argv:
        entry_index = sys.argv.index("--site-dir")
        if entry_index + 1 < len(sys.argv):
            command.append(sys.argv[entry_index + 1])
    run_command(command)


def main() -> None:
    """Build the documentation."""
    output = ROOT_DIR / "site"
    if "--output" in sys.argv:
        idx = sys.argv.index("--output")
        if idx + 1 < len(sys.argv):
            output = Path(sys.argv[idx + 1])
    ensure_dev_requirements()
    ensure_docs_requirements()
    build_docs(output)


if __name__ == "__main__":
    try:
        main()
    finally:
        if HAD_TO_MODIFY_SYS_PATH or sys.path[0] == str(
            Path(__file__).resolve().parent
        ):
            sys.path.pop(0)
