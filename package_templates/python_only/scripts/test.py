"""Run tests in the my_package package."""

# Requirement:
# The (final) coverage report must be in the `coverage` directory.
# It must be in the `lcov` format. (file `coverage/lcov.info`)

import os
import shutil
import subprocess  # nosemgrep # nosec
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
os.environ["PYTHONUNBUFFERED"] = "1"


def ensure_test_requirements() -> None:
    """Ensure the test requirements are installed."""
    requirements_file = ROOT_DIR / "requirements" / "test.txt"
    subprocess.run(  # nosemgrep # nosec
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "-r",
            str(requirements_file),
        ],
        check=True,
        cwd=ROOT_DIR,
    )


def run_pytest() -> None:
    """Run pytest."""
    coverage_dir = ROOT_DIR / "coverage"
    if coverage_dir.exists():
        shutil.rmtree(coverage_dir)
    coverage_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(  # nosemgrep # nosec
        [
            sys.executable,
            "-m",
            "pytest",
            "-c",
            "pyproject.toml",
            "--cov=my_package",
            "--cov-branch",
            "--cov-report=term-missing",
            "--cov-report",
            "lcov:coverage/lcov.info",
        ],
        check=True,
        cwd=ROOT_DIR,
    )
    print("Pytest done [my_package].")


def main() -> None:
    """Run the tests."""
    ensure_test_requirements()
    run_pytest()


if __name__ == "__main__":
    main()
