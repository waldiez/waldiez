# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common utilities for the scripts folder."""

import os
import shutil
import subprocess  # nosemgrep # nosec
import sys
from importlib.metadata import version as package_version
from pathlib import Path
from typing import List

ROOT_DIR = Path(__file__).parent.parent

os.environ["PYTHONUNBUFFERED"] = "1"
os.environ["PYTHONUTF8"] = "1"


def prefer_uv() -> bool:
    """Check if we should prefer to use uv.

    Returns
    -------
    bool
        True if we should prefer to use uv, False otherwise.
    """
    if not shutil.which("uv"):
        return False
    return (ROOT_DIR / ".uv").is_file()


def ensure_venv() -> None:
    """Ensure the virtual environment executable exists."""
    if os.path.exists(ROOT_DIR / ".venv"):
        return
    if prefer_uv():
        print("Creating virtual environment with uv...")
        run_command(["uv", "venv", str(ROOT_DIR / ".venv")])
        run_command(["uv", "sync"])
        run_command(["uv", "pip", "install", "-U", "pip"])
    else:
        print("Creating virtual environment...")
        run_command([sys.executable, "-m", "venv", str(ROOT_DIR / ".venv")])
        run_command(
            [
                str(ROOT_DIR / ".venv" / "bin" / "python"),
                "-m",
                "pip",
                "install",
                "-U",
                "pip",
            ]
        )


def get_executable() -> str:
    """Get the path to the Python executable.

    Returns
    -------
    str
        The path to the Python executable.
    """
    if os.getenv("CI") == "true":
        return sys.executable
    if not os.path.exists(ROOT_DIR / ".venv"):
        ensure_venv()
    if sys.platform != "win32":
        if os.path.exists(ROOT_DIR / ".venv" / "bin" / "python"):
            return str(ROOT_DIR / ".venv" / "bin" / "python")
    if os.path.exists(ROOT_DIR / ".venv" / "Scripts" / "python.exe"):
        return str(ROOT_DIR / ".venv" / "Scripts" / "python.exe")
    return sys.executable


def run_command(args: List[str], cwd: Path = ROOT_DIR) -> None:
    """Run a command.

    Parameters
    ----------
    args : List[str]
        List of arguments to pass to the command.
    cwd : Path
        Directory to run the command in. Defaults to the root directory.

    Raises
    ------
    ValueError
        If the command is not valid.
    """
    use_uv = prefer_uv()
    if "pip" in args and ("install" in args or "uninstall" in args):
        pip_index = args.index("pip")
        if pip_index + 1 < len(args):
            if use_uv:
                args = ["uv", "pip"] + args[pip_index + 1 :]
            else:
                args = [get_executable(), "-m", "pip"] + args[pip_index + 1 :]
        else:
            raise ValueError("pip command requires an argument.")
    else:
        args = [get_executable(), "-m"] + args
    args_str = " ".join(args).replace(str(ROOT_DIR), ".")
    print(f"Running command: {args_str}")
    try:
        subprocess.run(  # nosemgrep # nosec
            args,
            cwd=cwd,
            stdout=sys.stdout,
            stderr=subprocess.STDOUT,
            check=True,
            env=os.environ,
        )
    except subprocess.CalledProcessError as e:
        print(e.output)
        sys.exit(e.returncode)


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
        # let's check in venv
        if os.path.exists(ROOT_DIR / ".venv"):
            if sys.platform != "win32":
                if os.path.exists(ROOT_DIR / ".venv" / "bin" / package_name):
                    return
            if os.path.exists(
                ROOT_DIR / ".venv" / "Scripts" / f"{package_name}.exe"
            ):
                return
        print(f"Package {package_name} not found. Installing...")
        run_command(["ensurepip"])
        run_command(["pip", "install", package_name])


def ensure_dev_requirements() -> None:
    """Ensure the development requirements are installed."""
    if "--no-deps" in sys.argv or os.getenv("CI") == "true":
        return
    requirements_file = ROOT_DIR / "requirements" / "dev.txt"
    run_command(["ensurepip"])
    run_command(
        [
            "pip",
            "install",
            "-r",
            str(requirements_file),
        ]
    )


def ensure_test_requirements() -> None:
    """Ensure the test requirements are installed."""
    if "--no-deps" in sys.argv or os.getenv("CI") == "true":
        return
    requirements_file = ROOT_DIR / "requirements" / "test.txt"
    run_command(["ensurepip"])
    run_command(["pip", "install", "--upgrade", "pip"])
    run_command(
        [
            "pip",
            "install",
            "-r",
            str(requirements_file),
        ]
    )


def ensure_docs_requirements() -> None:
    """Ensure the documentation requirements are installed."""
    if "--no-deps" in sys.argv:
        return
    requirements_file = ROOT_DIR / "requirements" / "docs.txt"
    run_command(["ensurepip"])
    run_command(
        [
            "pip",
            "install",
            "-r",
            str(requirements_file),
        ]
    )


def run_black(fix: bool, in_dir: Path = ROOT_DIR) -> None:
    """Run black.

    Parameters
    ----------
    in_dir : Path
        Directory to run black in.
    fix : bool
        Whether to fix the formatting.
    """
    ensure_package_exists("black")
    args = ["black", "--config", "pyproject.toml"]
    if not fix:
        args.append("--check")
    args.append(".")
    run_command(args, cwd=in_dir)


def run_mypy(in_dir: Path = ROOT_DIR) -> None:
    """Run mypy.

    Parameters
    ----------
    in_dir : Path
        Directory to run mypy in.
    """
    ensure_package_exists("mypy")
    run_command(
        ["mypy", "--config", "pyproject.toml", "."],
        cwd=in_dir,
    )


def run_flake8(in_dir: Path = ROOT_DIR) -> None:
    """Run flake8.

    Parameters
    ----------
    in_dir : Path
        Directory to run flake8 in.
    """
    ensure_package_exists("flake8")
    run_command(
        ["flake8", "--config", ".flake8", "."],
        cwd=in_dir,
    )


def run_bandit(in_dir: Path = ROOT_DIR) -> None:
    """Run bandit.

    Parameters
    ----------
    in_dir : Path
        Directory to run bandit in.
    """
    ensure_package_exists("bandit")
    run_command(
        ["bandit", "-r", "-c", "pyproject.toml", "."],
        cwd=in_dir,
    )


def run_yamllint(in_dir: Path = ROOT_DIR) -> None:
    """Run yamllint.

    Parameters
    ----------
    in_dir : Path
        Directory to run yamllint in.
    """
    ensure_package_exists("yamllint")
    run_command(
        ["yamllint", "-c", ".yamllint.yaml", "."],
        cwd=in_dir,
    )


def run_ruff(fix: bool, in_dir: Path = ROOT_DIR) -> None:
    """Run ruff.

    Parameters
    ----------
    in_dir : Path
        Directory to run ruff in.
    fix : bool
        Whether to fix the formatting.
    """
    ensure_package_exists("ruff")
    args = ["ruff"]
    if not fix:
        args.append("check")
        args.append("--fix")
    else:
        args.append("format")
    args.extend(["--config", "pyproject.toml", "."])
    run_command(args, cwd=in_dir)


def run_autoflake(in_dir: Path = ROOT_DIR) -> None:
    """Run autoflake.

    Parameters
    ----------
    in_dir : Path
        Directory to run autoflake in.
    """
    ensure_package_exists("autoflake")
    run_command(
        [
            "autoflake",
            "--remove-all-unused-imports",
            "--remove-unused-variables",
            "--in-place",
            ".",
        ],
        cwd=in_dir,
    )


def run_pylint(in_dir: Path = ROOT_DIR) -> None:
    """Run pylint.

    Parameters
    ----------
    in_dir : Path
        Directory to run pylint in.
    """
    ensure_package_exists("pylint")
    run_command(
        ["pylint", "--rcfile=pyproject.toml", "."],
        cwd=in_dir,
    )
