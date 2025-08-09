# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Actions to perform before running the flow."""

import asyncio
import io
import os
import subprocess
import sys
from typing import Callable

from waldiez.models import Waldiez

from .environment import in_virtualenv, is_root
from .utils import strip_ansi


class RequirementsMixin:
    """Mixin class to handle requirements installation."""

    _waldiez: Waldiez
    _called_install_requirements: bool

    def gather_requirements(self) -> set[str]:
        """Gather extra requirements to install before running the flow.

        Returns
        -------
        set[str]
            A set of requirements that are not already installed and do not
            include 'waldiez' in their name.
        """
        extra_requirements = {
            req
            for req in self._waldiez.requirements
            if req not in sys.modules and "waldiez" not in req
        }
        if "python-dotenv" not in extra_requirements:  # pragma: no branch
            extra_requirements.add("python-dotenv")
        return extra_requirements

    def install_requirements(self) -> None:
        """Install the requirements for the flow."""
        if not self._called_install_requirements:  # pragma: no branch
            self._called_install_requirements = True
            extra_requirements = self.gather_requirements()
            if extra_requirements:  # pragma: no branch
                install_requirements(extra_requirements)

    async def a_install_requirements(self) -> None:
        """Install the requirements for the flow asynchronously."""
        if not self._called_install_requirements:  # pragma: no branch
            self._called_install_requirements = True
            extra_requirements = self.gather_requirements()
            if extra_requirements:  # pragma: no branch
                await a_install_requirements(extra_requirements)


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
    if not in_virtualenv():  # it should  # pragma: no cover
        # if not, let's try to install as user
        # not sure if --break-system-packages is safe,
        # but it might fail if we don't
        break_system_packages = os.environ.get("PIP_BREAK_SYSTEM_PACKAGES", "")
        os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
        if not is_root():
            pip_install.append("--user")
    if upgrade:  # pragma: no cover
        pip_install.append("--upgrade")
    pip_install.extend(extra_requirements)
    # pylint: disable=too-many-try-statements
    try:
        with subprocess.Popen(
            pip_install,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        ) as proc:
            if proc.stdout:  # pragma: no branch
                for line in io.TextIOWrapper(proc.stdout, encoding="utf-8"):
                    printer(strip_ansi(line.strip()))
            if proc.stderr:  # pragma: no branch
                for line in io.TextIOWrapper(proc.stderr, encoding="utf-8"):
                    printer(strip_ansi(line.strip()))
    finally:
        if not in_virtualenv():  # pragma: no cover
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
    if not in_virtualenv():  # pragma: no cover
        break_system_packages = os.environ.get("PIP_BREAK_SYSTEM_PACKAGES", "")
        os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
        if not is_root():
            pip_install.extend(["--user"])
    if upgrade:  # pragma: no cover
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
        if not in_virtualenv():  # pragma: no cover
            if break_system_packages:
                os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = break_system_packages
            else:
                del os.environ["PIP_BREAK_SYSTEM_PACKAGES"]
