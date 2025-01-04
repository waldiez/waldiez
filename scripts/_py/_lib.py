# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common functions for the python scripts in this folder.

This module contains common functions used by the python scripts in this folder.

Attributes
----------
ROOT_DIR : Path
    Root directory of the repository.

Functions
---------
run_command(args: List[str], cwd: Path = ROOT_DIR) -> None
    Run a command.
ensure_command_exists(command: str) -> None
    Ensure a command exists.
"""

import json
import os
import subprocess  # nosemgrep # nosec
import sys
from functools import cache
from importlib.metadata import version as package_version
from pathlib import Path
from typing import Generator, List, NamedTuple

ROOT_DIR = Path(__file__).parent.parent.parent
os.environ["PYTHONUNBUFFERED"] = "1"
os.environ["PYTHONUTF8"] = "1"


def run_command(args: List[str], cwd: Path = ROOT_DIR) -> None:
    """Run a command.

    Parameters
    ----------
    args : List[str]
        List of arguments to pass to the command.
    cwd : Path
        Current working directory.
    """
    args_str = " ".join(args).replace(str(ROOT_DIR), ".")
    print(f"Running command: {args_str}")
    try:
        subprocess.run(  # nosemgrep # nosec
            args,
            cwd=cwd,
            check=True,
            stdout=sys.stdout,
            stderr=subprocess.STDOUT,
            env=os.environ,
            encoding="utf-8",
        )
    except subprocess.CalledProcessError as e:
        print(e.output)
        sys.exit(e.returncode)


@cache
def get_python_projects() -> Generator[Path, None, None]:
    """Get all python projects in the repository.

    Yields
    ------
    Path
        Path to the python project.

    Raises
    ------
    FileNotFoundError
        If the package.json or if a package directory does not exist.
    """
    # read package.json instead
    package_json_path = ROOT_DIR / "package.json"
    if not package_json_path.exists():
        raise FileNotFoundError(f"{package_json_path} does not exist.")
    with open(package_json_path, "r", encoding="utf-8") as file:
        package_json = json.load(file)
    packages = package_json.get("packages", {}).get("py", [])
    for package in packages:
        package_dir = ROOT_DIR / package
        if not package_dir.exists():
            raise FileNotFoundError(f"{package_dir} does not exist.")
        yield package_dir


def ensure_package_exists(package_name: str) -> None:
    """Ensure a package exists.

    Parameters
    ----------
    package_name : str
        Name of the package to ensure exists.
    """
    try:
        package_version(package_name)
    except BaseException:  # pylint: disable=broad-except
        run_command([sys.executable, "-m", "pip", "install", package_name])


def run_isort(in_dir: Path, fix: bool) -> None:
    """Run isort.

    Parameters
    ----------
    in_dir : Path
        Directory to run isort in.
    fix : bool
        Whether to fix the imports.
    """
    ensure_package_exists("isort")
    args = [sys.executable, "-m", "isort"]
    if not fix:
        args.append("--check-only")
    args.append(".")
    run_command(args, cwd=in_dir)


def run_black(in_dir: Path, fix: bool) -> None:
    """Run black.

    Parameters
    ----------
    in_dir : Path
        Directory to run black in.
    fix : bool
        Whether to fix the formatting.
    """
    ensure_package_exists("black")
    args = [sys.executable, "-m", "black", "--config", "pyproject.toml"]
    if not fix:
        args.append("--check")
    args.append(".")
    run_command(args, cwd=in_dir)


def run_mypy(in_dir: Path) -> None:
    """Run mypy.

    Parameters
    ----------
    in_dir : Path
        Directory to run mypy in.
    """
    ensure_package_exists("mypy")
    run_command(
        [sys.executable, "-m", "mypy", "--config", "pyproject.toml", "."],
        cwd=in_dir,
    )


def run_flake8(in_dir: Path) -> None:
    """Run flake8.

    Parameters
    ----------
    in_dir : Path
        Directory to run flake8 in.
    """
    ensure_package_exists("flake8")
    run_command(
        [sys.executable, "-m", "flake8", "--config", ".flake8", "."],
        cwd=in_dir,
    )


def run_pydocstyle(in_dir: Path) -> None:
    """Run pydocstyle.

    Parameters
    ----------
    in_dir : Path
        Directory to run pydocstyle in.
    """
    ensure_package_exists("pydocstyle")
    run_command(
        [sys.executable, "-m", "pydocstyle", "--config", "pyproject.toml", "."],
        cwd=in_dir,
    )


def run_bandit(in_dir: Path) -> None:
    """Run bandit.

    Parameters
    ----------
    in_dir : Path
        Directory to run bandit in.
    """
    ensure_package_exists("bandit")
    run_command(
        [sys.executable, "-m", "bandit", "-r", "-c", "pyproject.toml", "."],
        cwd=in_dir,
    )


def run_yamllint(in_dir: Path) -> None:
    """Run yamllint.

    Parameters
    ----------
    in_dir : Path
        Directory to run yamllint in.
    """
    ensure_package_exists("yamllint")
    run_command(
        [sys.executable, "-m", "yamllint", "-c", ".yamllint.yaml", "."],
        cwd=in_dir,
    )


def run_ruff(in_dir: Path, fix: bool) -> None:
    """Run ruff.

    Parameters
    ----------
    in_dir : Path
        Directory to run ruff in.
    fix : bool
        Whether to fix the formatting.
    """
    ensure_package_exists("ruff")
    args = [sys.executable, "-m", "ruff"]
    if not fix:
        args.append("check")
        args.append("--fix")
    else:
        args.append("format")
    args.extend(["--config", "pyproject.toml", "."])
    run_command(args, cwd=in_dir)


def run_autoflake(in_dir: Path) -> None:
    """Run autoflake.

    Parameters
    ----------
    in_dir : Path
        Directory to run autoflake in.
    """
    ensure_package_exists("autoflake")
    run_command(
        [
            sys.executable,
            "-m",
            "autoflake",
            "--remove-all-unused-imports",
            "--remove-unused-variables",
            "--in-place",
            ".",
        ],
        cwd=in_dir,
    )


def run_pylint(in_dir: Path) -> None:
    """Run pylint.

    Parameters
    ----------
    in_dir : Path
        Directory to run pylint in.
    """
    ensure_package_exists("pylint")
    run_command(
        [sys.executable, "-m", "pylint", "--rcfile=pyproject.toml", "."],
        cwd=in_dir,
    )


class ImageConfig(NamedTuple):
    """Python image configuration."""

    name: str
    file: Path
    platforms: List[str]


def get_py_image_configs() -> Generator[ImageConfig, None, None]:
    """Get all python images configurations.

    Yields
    ------
    ImageConfig
        Python image configuration.

    Raises
    ------
    FileNotFoundError
        If the package.json or the container files do not exist.
    """
    package_json_path = ROOT_DIR / "package.json"
    if not package_json_path.exists():
        raise FileNotFoundError(f"{package_json_path} does not exist.")
    with open(package_json_path, "r", encoding="utf-8") as file:
        package_json = json.load(file)
    images = package_json.get("images", {}).get("py", [])
    for image in images:
        container_file_path = ROOT_DIR / image["file"]
        if not container_file_path.exists():
            raise FileNotFoundError(f"{container_file_path} does not exist.")
        yield ImageConfig(
            name=image["name"],
            file=container_file_path,
            platforms=image["platforms"],
        )
