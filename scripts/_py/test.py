"""Run tests in the project's subdirectories."""

import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import get_python_projects, run_command
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent))
    from _lib import run_command  # type: ignore

    HAD_TO_MODIFY_SYS_PATH = True


def run_tests(in_dir: Path) -> None:
    """Run tests in the specified directory.

    Parameters
    ----------
    in_dir : Path
        The directory to run the tests in.

    Raises
    ------
    FileNotFoundError
        If the test script or the coverage report is not found.
        or if no coverage report is generated.
    """
    test_py_script = in_dir / "scripts" / "test.py"
    if not test_py_script.exists():
        raise FileNotFoundError(f"test.py not found in {in_dir}")
    run_command([sys.executable, str(test_py_script)], cwd=in_dir)
    # also gather lcov.info in the coverage directory
    lcov_info = in_dir / "coverage" / "lcov.info"
    if not lcov_info.exists():
        raise FileNotFoundError(f"lcov.info not found in {in_dir}")
    # later: gather all lcov.info files and merge them (in root/coverage)


def main() -> None:
    """Run the tests."""
    for project_dir in get_python_projects():
        run_tests(project_dir)


if __name__ == "__main__":
    try:
        main()
    finally:
        if HAD_TO_MODIFY_SYS_PATH:
            sys.path.pop(0)
