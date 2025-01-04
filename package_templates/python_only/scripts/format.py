# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Run python formatters."""
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
    run_command([sys.executable, "-m", "isort", "."])


def run_autoflake() -> None:
    """Run autoflake."""
    ensure_command_exists("autoflake")
    run_command(
        [
            sys.executable,
            "-m",
            "autoflake",
            "--remove-all-unused-imports",
            "--remove-unused-variables",
            "--in-place",
            ".",
        ]
    )


def run_black() -> None:
    """Run black."""
    ensure_command_exists("black")
    run_command(
        [
            sys.executable,
            "-m",
            "black",
            "--config",
            "pyproject.toml",
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
            "format",
            "--config",
            "pyproject.toml",
            ".",
        ]
    )


def main() -> None:
    """Run python formatters."""
    ensure_dev_requirements()
    run_isort()
    run_autoflake()
    run_black()
    run_ruff()


if __name__ == "__main__":
    main()
