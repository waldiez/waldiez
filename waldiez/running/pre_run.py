# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Actions to perform before running the flow."""

import asyncio
import io
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Callable, Optional, Union

from .environment import in_virtualenv, is_root
from .util import strip_ansi


def before_run(
    output_path: Optional[Union[str, Path]],
    uploads_root: Optional[Union[str, Path]],
) -> str:
    """Actions to perform before running the flow.

    Parameters
    ----------
    output_path : Optional[Union[str, Path]]
        The output path.
    uploads_root : Optional[Union[str, Path]]
        The runtime uploads root.

    Returns
    -------
    str
        The file name.
    """
    if not uploads_root:
        uploads_root = Path(tempfile.mkdtemp())
    else:
        uploads_root = Path(uploads_root)
    if not uploads_root.exists():
        uploads_root.mkdir(parents=True)
    output_dir = Path.cwd()
    if output_path and isinstance(output_path, str):
        output_path = Path(output_path)
    if output_path:
        if output_path.is_dir():
            output_dir = output_path
        else:
            output_dir = output_path.parent if output_path else Path.cwd()
    if not output_dir.exists():
        output_dir.mkdir(parents=True, exist_ok=True)
    file_name = Path(output_path).name if output_path else "waldiez_flow.py"
    if file_name.endswith((".json", ".waldiez")):
        file_name = file_name.replace(".json", ".py").replace(".waldiez", ".py")
    if not file_name.endswith(".py"):
        file_name += ".py"
    return file_name


def install_requirements(
    extra_requirements: set[str],
    printer: Callable[..., None] = print,
) -> None:
    """Install the requirements.

    Parameters
    ----------
    extra_requirements : set[str]
        The extra requirements.
    printer : Callable[..., None]
        The printer function to use, defaults to print.
    """
    requirements_string = ", ".join(extra_requirements)
    printer(f"Installing requirements: {requirements_string}")
    pip_install = [sys.executable, "-m", "pip", "install"]
    break_system_packages = ""
    if not in_virtualenv():  # it should
        # if not, let's try to install as user
        # not sure if --break-system-packages is safe,
        # but it might fail if we don't
        break_system_packages = os.environ.get("PIP_BREAK_SYSTEM_PACKAGES", "")
        os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
        if not is_root():
            pip_install.append("--user")
    pip_install.extend(extra_requirements)
    # pylint: disable=too-many-try-statements
    try:
        with subprocess.Popen(
            pip_install,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        ) as proc:
            if proc.stdout:
                for line in io.TextIOWrapper(proc.stdout, encoding="utf-8"):
                    printer(strip_ansi(line.strip()))
            if proc.stderr:
                for line in io.TextIOWrapper(proc.stderr, encoding="utf-8"):
                    printer(strip_ansi(line.strip()))
    finally:
        if not in_virtualenv():
            # restore the old env var
            if break_system_packages:
                os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = break_system_packages
            else:
                del os.environ["PIP_BREAK_SYSTEM_PACKAGES"]


async def a_install_requirements(
    extra_requirements: set[str],
    printer: Callable[..., None] = print,
) -> None:
    """Install the requirements asynchronously.

    Parameters
    ----------
    extra_requirements : set[str]
        The extra requirements.
    printer : Callable[..., None]
        The printer function to use, defaults to print.
    """
    requirements_string = ", ".join(extra_requirements)
    printer(f"Installing requirements: {requirements_string}")
    pip_install = [sys.executable, "-m", "pip", "install"]
    break_system_packages = ""
    if not in_virtualenv():
        break_system_packages = os.environ.get("PIP_BREAK_SYSTEM_PACKAGES", "")
        os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
        if not is_root():
            pip_install.extend(["--user"])
    pip_install.extend(extra_requirements)
    # pylint: disable=too-many-try-statements
    try:
        proc = await asyncio.create_subprocess_exec(
            *pip_install,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        if proc.stdout:
            async for line in proc.stdout:
                printer(strip_ansi(line.decode().strip()))
        if proc.stderr:
            async for line in proc.stderr:
                printer(strip_ansi(line.decode().strip()))
    finally:
        if not in_virtualenv():
            if break_system_packages:
                os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = break_system_packages
            else:
                del os.environ["PIP_BREAK_SYSTEM_PACKAGES"]
