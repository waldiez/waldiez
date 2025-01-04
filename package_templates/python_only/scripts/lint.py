# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Lint Python source code in the my_package and tests directories."""
import shutil
import subprocess  # nosemgrep # nosec
import sys
from pathlib import Path
from typing import List

# pylint: disable=duplicate-code  # also in ./lint.py
ROOT_DIR = Path(__file__).resolve().parent.parent


def run_command(args: List[str]) -> None:
    """Run a command.

    Parameters
    ----------
    args : List[str]
        List of arguments to pass to the command.
    """
    args_str = " ".join(args).replace(str(ROOT_DIR), ".")
    print(f"Running command: {args_str}")
    subprocess.run(  # nosemgrep # nosec
        args,
        cwd=ROOT_DIR,
        stdout=sys.stdout,
        stderr=subprocess.STDOUT,
        check=True,
    )


def ensure_dev_requirements() -> None:
    """Ensure the development requirements are installed."""
    requirements_file = ROOT_DIR / "requirements" / "dev.txt"
    run_command(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "-r",
            str(requirements_file),
        ]
    )


def ensure_command_exists(command: str) -> None:
    """Ensure a command exists.

    Parameters
    ----------
    command : str
        Command to check.
    """
    if not shutil.which(command):
        run_command([sys.executable, "-m", "pip", "install", command])


def run_isort() -> None:
    """Run isort."""
    ensure_command_exists("isort")
    run_command([sys.executable, "-m", "isort", "--check-only", "."])


def run_black() -> None:
    """Run black."""
    ensure_command_exists("black")
    run_command(
        [
            sys.executable,
            "-m",
            "black",
            "--check",
            "--config",
            "pyproject.toml",
            ".",
        ]
    )


def run_mypy() -> None:
    """Run mypy."""
    ensure_command_exists("mypy")
    run_command(
        [
            sys.executable,
            "-m",
            "mypy",
            "--config",
            "pyproject.toml",
            ".",
        ]
    )


def run_flake8() -> None:
    """Run flake8."""
    ensure_command_exists("flake8")
    run_command([sys.executable, "-m", "flake8", "--config=.flake8"])


def run_pydocstyle() -> None:
    """Run pydocstyle."""
    ensure_command_exists("pydocstyle")
    run_command(
        [
            sys.executable,
            "-m",
            "pydocstyle",
            "--config",
            "pyproject.toml",
            ".",
        ]
    )


def run_bandit() -> None:
    """Run bandit."""
    ensure_command_exists("bandit")
    run_command(
        [
            sys.executable,
            "-m",
            "bandit",
            "-r",
            "-c",
            "pyproject.toml",
            ".",
        ]
    )


def run_yamllint() -> None:
    """Run yamllint."""
    ensure_command_exists("yamllint")
    run_command(
        [
            sys.executable,
            "-m",
            "yamllint",
            "-c",
            ".yamllint.yaml",
            ".",
        ]
    )


def run_ruff() -> None:
    """Run ruff."""
    ensure_command_exists("ruff")
    run_command(
        [
            sys.executable,
            "-m",
            "ruff",
            "check",
            "--config",
            "pyproject.toml",
            ".",
        ]
    )


def run_pylint() -> None:
    """Run pylint."""
    ensure_command_exists("pylint")
    run_command(
        [sys.executable, "-m", "pylint", "--rcfile=pyproject.toml", "."]
    )


def main() -> None:
    """Run linters."""
    ensure_dev_requirements()
    run_isort()
    run_black()
    run_mypy()
    run_flake8()
    run_pydocstyle()
    run_bandit()
    run_yamllint()
    run_ruff()
    run_pylint()


if __name__ == "__main__":
    main()
