# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Actions to perform before running the flow."""

import asyncio
import io
import os
import subprocess
import sys
from typing import Callable

from .environment import in_virtualenv, is_root
from .utils import strip_ansi


# noinspection PyUnresolvedReferences
def install_requirements(
    extra_requirements: set[str],
    upgrade: bool = False,
    printer: Callable[..., None] = print,
) -> None:
    """Install the requirements.

    Parameters
    ----------
    extra_requirements : set[str]
        The extra requirements.
    upgrade : bool, optional
        Whether to upgrade the requirements, by default False.
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
    if upgrade:
        pip_install.append("--upgrade")
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
    upgrade: bool = False,
    printer: Callable[..., None] = print,
) -> None:
    """Install the requirements asynchronously.

    Parameters
    ----------
    extra_requirements : set[str]
        The extra requirements.
    upgrade : bool, optional
        Whether to upgrade the requirements, by default False.
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
    if upgrade:
        pip_install.append("--upgrade")
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


def install_waldiez(
    upgrade: bool = True,
    printer: Callable[..., None] = print,
) -> None:
    """Install Waldiez.

    Parameters
    ----------
    upgrade : bool, optional
        Whether to upgrade Waldiez, by default True.
    printer : Callable[..., None]
        The printer function to use, defaults to print.
    """
    install_requirements({"waldiez"}, upgrade, printer)


async def a_install_waldiez(
    upgrade: bool = True,
    printer: Callable[..., None] = print,
) -> None:
    """Install Waldiez asynchronously.

    Parameters
    ----------
    upgrade : bool, optional
        Whether to upgrade Waldiez, by default True.
    printer : Callable[..., None]
        The printer function to use, defaults to print.
    """
    await a_install_requirements({"waldiez"}, upgrade, printer)
