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
from typing import Callable

from waldiez.models import Waldiez

from .environment import in_virtualenv, is_root
from .utils import (
    ensure_pip,
    get_pip_install_location,
    get_python_executable,
    safe_filename,
    strip_ansi,
)


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
    ensure_pip()
    pip_install, break_system_packages, install_location = _before_pip(
        extra_requirements, upgrade
    )

    # pylint: disable=too-many-try-statements,broad-exception-caught
    try:
        with subprocess.Popen(
            pip_install,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        ) as proc:
            if proc.stdout:  # pragma: no branch
                for line in io.TextIOWrapper(proc.stdout, encoding="utf-8"):
                    stripped_line = strip_ansi(line.strip())
                    if stripped_line:  # Only print non-empty lines
                        printer(stripped_line)
            if proc.stderr:  # pragma: no branch
                for line in io.TextIOWrapper(proc.stderr, encoding="utf-8"):
                    stripped_line = strip_ansi(line.strip())
                    if stripped_line:  # Only print non-empty lines
                        printer(stripped_line)

            # Wait for process to complete and check return code
            return_code = proc.wait()
            if return_code != 0:
                printer(
                    f"Package installation failed with exit code {return_code}"
                )

    except Exception as e:
        printer(f"Failed to install requirements: {e}")
    finally:
        _after_pip(break_system_packages, install_location)


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
    pip_install, break_system_packages, install_location = _before_pip(
        extra_requirements, upgrade=upgrade
    )
    requirements_string = ", ".join(extra_requirements)
    printer(f"Installing requirements: {requirements_string}")
    # pylint: disable=too-many-try-statements,broad-exception-caught
    try:
        proc = await asyncio.create_subprocess_exec(
            *pip_install,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        async def _pump_stream(stream: asyncio.StreamReader | None) -> None:
            if not stream:
                return
            async for raw in stream:
                text = strip_ansi(raw.decode().rstrip())
                if text:
                    printer(text)

        # Create tasks for concurrent execution
        tasks: list[asyncio.Task[int | None]] = [
            asyncio.create_task(_pump_stream(proc.stdout)),
            asyncio.create_task(_pump_stream(proc.stderr)),
            asyncio.create_task(proc.wait()),
        ]
        await asyncio.gather(*tasks, return_exceptions=True)
        if proc.returncode != 0:
            printer(
                f"Package installation failed with exit code {proc.returncode}"
            )

    except Exception as e:
        printer(f"Failed to install requirements: {e}")
    finally:
        _after_pip(break_system_packages, install_location)


def _before_pip(
    packages: set[str],
    upgrade: bool,
) -> tuple[list[str], str, str | None]:
    """Gather the pip command for installing requirements.

    Parameters
    ----------
    packages : set[str]
        The packages to install.
    upgrade : bool
        Whether to upgrade the packages.

    Returns
    -------
    tuple[list[str], str, str | None]
        The pip command, break_system_packages flag, and install location.
    """
    ensure_pip()
    pip_install = [
        get_python_executable(),
        "-m",
        "pip",
        "install",
        "--disable-pip-version-check",
        "--no-input",
    ]
    install_location = get_pip_install_location()
    break_system_packages = ""

    if install_location:
        pip_install += ["--target", install_location]
    elif not in_virtualenv():  # it should  # pragma: no cover
        # if not, let's try to install as user
        # not sure if --break-system-packages is safe,
        # but it might fail if we don't
        break_system_packages = os.environ.get("PIP_BREAK_SYSTEM_PACKAGES", "")
        os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
        if not is_root():
            pip_install.append("--user")

    if upgrade:  # pragma: no cover
        pip_install.append("--upgrade")

    pip_install.extend(packages)
    return pip_install, break_system_packages, install_location


def _after_pip(
    break_system_packages: str, install_location: str | None
) -> None:
    """Restore environment variables after pip installation.

    Parameters
    ----------
    break_system_packages : str
        The original value of PIP_BREAK_SYSTEM_PACKAGES.
    install_location : str | None
        The install location used (None if default).
    """
    if install_location is None and not in_virtualenv():  # pragma: no cover
        # restore the old env var
        if break_system_packages:
            os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = break_system_packages
        else:
            # Use pop to avoid KeyError if the key doesn't exist
            os.environ.pop("PIP_BREAK_SYSTEM_PACKAGES", None)


def dump_waldiez(waldiez: Waldiez, output_path: str | Path | None) -> Path:
    """Dump waldiez flow to a file.

    Parameters
    ----------
    waldiez : Waldiez
        The waldiez instance to dump.
    output_path : str | Path | None
        Optional output path to determine the directory to save the flow to.

    Returns
    -------
    Path
        The path to the generated file.
    """
    file_path = Path(output_path) if output_path else None
    if file_path:
        file_name = file_path.name
        if not file_name.endswith(".waldiez"):
            file_path.with_suffix(".waldiez")

    else:
        full_name = waldiez.name
        file_name = safe_filename(full_name, "waldiez")
    file_dir: Path
    if file_path:
        file_dir = file_path if file_path.is_dir() else file_path.parent
    else:
        file_dir = Path(tempfile.mkdtemp())
    file_dir.mkdir(parents=True, exist_ok=True)
    output_path = file_dir / file_name
    with output_path.open(
        "w", encoding="utf-8", errors="replace", newline="\n"
    ) as f_open:
        f_open.write(waldiez.model_dump_json())
    return output_path
