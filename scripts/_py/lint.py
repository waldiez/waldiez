"""Run python linters.

This script runs the following linters:
- isort
- black
- mypy
- flake8
- pydocstyle
- bandit
- yamllint
- ruff
- pylint
- eclint (if installed)
"""

import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import (
        ROOT_DIR,
        get_python_projects,
        run_bandit,
        run_black,
        run_command,
        run_eclint,
        run_flake8,
        run_isort,
        run_mypy,
        run_pydocstyle,
        run_pylint,
        run_ruff,
        run_yamllint,
    )
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent))
    from _lib import (  # type: ignore
        ROOT_DIR,
        get_python_projects,
        run_bandit,
        run_black,
        run_command,
        run_eclint,
        run_flake8,
        run_isort,
        run_mypy,
        run_pydocstyle,
        run_pylint,
        run_ruff,
        run_yamllint,
    )

    HAD_TO_MODIFY_SYS_PATH = True


def lint_root() -> None:
    """Run linters in the root directory."""
    run_isort(in_dir=ROOT_DIR, fix=False)
    run_black(in_dir=ROOT_DIR, fix=False)
    run_mypy(in_dir=ROOT_DIR)
    run_flake8(in_dir=ROOT_DIR)
    run_pydocstyle(in_dir=ROOT_DIR)
    run_bandit(in_dir=ROOT_DIR)
    run_yamllint(in_dir=ROOT_DIR)
    run_ruff(in_dir=ROOT_DIR, fix=False)
    run_pylint(in_dir=ROOT_DIR)
    if "--eclint" in sys.argv:
        run_eclint()


def lint_package(package_dir: Path) -> None:
    """Run linters in a package directory.

    Parameters
    ----------
    package_dir : Path
        The package directory.

    Raises
    ------
    FileNotFoundError
        If the lint script is not found
    """
    lint_script = package_dir / "scripts" / "lint.py"
    if not lint_script.exists():
        raise FileNotFoundError(f"Lint script not found in {package_dir}")
    run_command([sys.executable, str(lint_script)])


def main() -> None:
    """Run the linters."""
    lint_root()
    for package_dir in get_python_projects():
        lint_package(package_dir)


if __name__ == "__main__":
    try:
        main()
    finally:
        if HAD_TO_MODIFY_SYS_PATH:
            sys.path.pop(0)
