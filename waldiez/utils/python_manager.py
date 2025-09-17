# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-try-statements,broad-exception-caught
"""Python manager class."""

import asyncio
import io
import json
import os
import platform
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Callable

WALDIEZ_SITE_PACKAGES = "WALDIEZ_SITE_PACKAGES"
WALDIEZ_APP_ROOT = "WALDIEZ_APP_ROOT"


# noinspection PyBroadException
class PythonManager:
    """Python manager."""

    _app_dir: Path | None

    def __init__(self) -> None:
        self.system = platform.system().lower()
        self.is_frozen = bool(getattr(sys, "frozen", False))
        self._app_dir = None

    @property
    def app_dir(self) -> Path:
        """Directory to read packaged resources from.

        Returns
        -------
        Path
            The path to the application installation directory.
        """
        return self._get_app_dir()

    @property
    def site_packages_directory(self) -> Path | None:
        """Determine the best location to install packages.

        Returns
        -------
        str | None
            The installation target directory, or None for default.
        """
        return self._get_site_packages_path()

    def get_python_executable(self) -> str:
        """Get the appropriate Python executable path.

        Returns
        -------
        str
            The path to the appropriate Python executable path.
        """
        if not self.is_frozen:
            return sys.executable
        # Check for bundled Python in installation directory
        app_dir = self.app_dir
        if self.system == "windows":
            candidates = [
                app_dir / "bundled_python" / "Scripts" / "python.exe",
                app_dir / "bundled_python" / "Scripts" / "python3.exe",
                app_dir / "bundled_python" / "python.exe",
            ]
        else:
            candidates = [
                app_dir / "bundled_python" / "bin" / "python3",
                app_dir / "bundled_python" / "bin" / "python",
                app_dir / "bundled_python" / "python3",
            ]

        for candidate in candidates:
            if candidate.exists():
                return str(candidate)
        # Fallback to system Python
        return sys.executable

    def list_installed_packages(self) -> list[dict[str, str]]:
        """List packages in our managed environment.

        Returns
        -------
        list[dict[str,str]]
            The locally installed packages.
        """
        python_exe = self.get_python_executable()

        env = os.environ.copy()
        if self.site_packages_directory:
            env["PYTHONPATH"] = str(self.site_packages_directory)

        cmd = [python_exe, "-m", "pip", "list", "--format=json"]
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                env=env,
                check=True,
            )
            if result.returncode == 0:
                return json.loads(result.stdout)
        except Exception:
            pass

        return []

    def get_debug_info(self) -> dict[str, Any]:
        """Get comprehensive debug information.

        Returns
        -------
        dict[str, Any]
            Debug info about the paths and the packages.
        """
        return {
            "system": self.system,
            "is_frozen": self.is_frozen,
            "site_packages_directory": (
                str(self.site_packages_directory)
                if self.site_packages_directory
                else None
            ),
            "python_executable": self.get_python_executable(),
            "python_version": sys.version,
            "in_virtualenv": self.in_virtualenv(),
            "sys_path": sys.path,
            "pythonpath": os.environ.get("PYTHONPATH", ""),
        }

    def pip_install(
        self,
        packages: set[str],
        upgrade: bool = False,
        printer: Callable[..., None] = print,
    ) -> None:
        """Install packages.

        Parameters
        ----------
        packages : set[str]
            The packages to install.
        upgrade : bool
            Upgrade existing or not.
        printer : Callable[..., None]
            The callable to use for printing the process' output
        """
        pip_install_cmd, break_system_packages = self._before_pip(
            packages, upgrade
        )
        try:
            with subprocess.Popen(
                pip_install_cmd,
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
                if return_code != 0:  # pragma: no cover
                    printer(
                        "Package installation failed "
                        f"with exit code {return_code}"
                    )

        except Exception as e:  # pragma: no cover
            printer(f"Failed to install requirements: {e}")
        finally:
            self._after_pip(break_system_packages)

    async def a_pip_install(
        self,
        packages: set[str],
        upgrade: bool = False,
        printer: Callable[..., None] = print,
    ) -> None:
        """Install packages asynchronously.

        Parameters
        ----------
        packages : set[str]
            The packages to install.
        upgrade : bool
            Upgrade existing or not.
        printer : Callable[..., None]
            The callable to use for printing the process' output
        """
        pip_install, break_system_packages = self._before_pip(
            packages, upgrade=upgrade
        )
        requirements_string = ", ".join(packages)
        printer(f"Installing requirements: {requirements_string}")
        try:
            proc = await asyncio.create_subprocess_exec(
                *pip_install,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            async def _pump_stream(stream: asyncio.StreamReader | None) -> None:
                if not stream:  # pragma: no cover
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
            if proc.returncode != 0:  # pragma: no cover
                printer(
                    "Package installation failed "
                    f"with exit code {proc.returncode}"
                )

        except Exception as e:
            printer(f"Failed to install requirements: {e}")
        finally:
            self._after_pip(break_system_packages)

    # noinspection TryExceptPass
    @staticmethod
    def _ensure_pip() -> None:  # pragma: no cover
        """Make sure `python -m pip` works (bootstrap if needed)."""
        # pylint: disable=import-outside-toplevel,unused-import
        try:
            import pip  # noqa: F401  # pyright: ignore

            return
        except Exception:
            pass
        try:
            import ensurepip

            ensurepip.bootstrap(upgrade=True)
        except Exception:
            # If bootstrap fails,
            # we'll still attempt `-m pip` and surface errors.
            pass

    def _get_app_dir(self) -> Path:
        if self._app_dir is None:
            from_env_str = os.environ.get(WALDIEZ_APP_ROOT, "")
            if from_env_str:
                from_env_path = Path(from_env_str).resolve()
                if from_env_path.is_dir():
                    self._app_dir = from_env_path
                    return self._app_dir
            if self.is_frozen and hasattr(sys, "_MEIPASS"):  # PyInstaller
                self._app_dir = Path(
                    getattr(sys, "_MEIPASS", Path(sys.executable).parent)
                )
                return self._app_dir
        # dev: package root
        self._app_dir = Path(__file__).parent.parent
        return self._app_dir

    def _get_site_packages_path(self) -> Path | None:
        from_env_str = os.environ.get(WALDIEZ_SITE_PACKAGES, "")
        if from_env_str:
            from_env_path = Path(from_env_str).resolve()
            if from_env_path.is_dir():
                return from_env_path
        if self.is_frozen:
            # Use the bundled site-packages if available
            bundled_sp = self.app_dir / "bundled_python" / "site-packages"
            if bundled_sp.exists():
                return bundled_sp
        return None

    def _before_pip(
        self,
        packages: set[str],
        upgrade: bool,
    ) -> tuple[list[str], str]:
        """Gather the pip command for installing requirements.

        Parameters
        ----------
        packages : set[str]
            The packages to install.
        upgrade : bool
            Whether to upgrade the packages.

        Returns
        -------
        tuple[list[str], str]
            The pip command, and the break_system_packages flag.
        """
        self._ensure_pip()
        pip_install = [
            self.get_python_executable(),
            "-m",
            "pip",
            "install",
            "--disable-pip-version-check",
            "--no-input",
        ]
        install_location = self.site_packages_directory
        break_system_packages = ""

        if install_location:
            pip_install += ["--target", str(install_location)]
        elif not self.in_virtualenv():  # pragma: no cover
            # it should, if not, let's try to install as user
            if not is_root():
                pip_install.append("--user")
            break_system_packages = os.environ.get(
                "PIP_BREAK_SYSTEM_PACKAGES", ""
            )
            os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"

        if upgrade:  # pragma: no cover
            pip_install.append("--upgrade")

        pip_install.extend(sorted(packages))
        return pip_install, break_system_packages

    def _after_pip(
        self,
        break_system_packages: str,
    ) -> None:
        """Restore environment variables after pip installation.

        Parameters
        ----------
        break_system_packages : str
            The original value of PIP_BREAK_SYSTEM_PACKAGES.
        """
        if (
            not self.site_packages_directory and not self.in_virtualenv()
        ):  # pragma: no cover
            # restore the old env var
            if break_system_packages:
                os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = break_system_packages
            else:
                # Use pop to avoid KeyError if the key doesn't exist
                os.environ.pop("PIP_BREAK_SYSTEM_PACKAGES", None)

    @staticmethod
    def in_virtualenv() -> bool:
        """Check if we are inside a virtualenv.

        Returns
        -------
        bool
            True if inside a virtualenv, False otherwise.
        """
        return hasattr(sys, "real_prefix") or (
            hasattr(sys, "base_prefix")
            and os.path.realpath(sys.base_prefix)
            != os.path.realpath(sys.prefix)
        )


def is_root() -> bool:  # pragma: no cover  # os specific
    """Check if the script is running as root/administrator.

    Returns
    -------
    bool
        True if running as root/administrator, False otherwise.
    """
    # pylint: disable=import-outside-toplevel,line-too-long,no-member
    if os.name == "nt":
        try:
            import ctypes

            return ctypes.windll.shell32.IsUserAnAdmin() != 0  # type: ignore[unused-ignore,attr-defined]  # noqa: E501
        except Exception:
            return False
    else:
        return os.getuid() == 0


def strip_ansi(text: str) -> str:
    """Remove ANSI escape sequences from text.

    Parameters
    ----------
    text : str
        The text to strip.

    Returns
    -------
    str
        The text without ANSI escape sequences.
    """
    ansi_pattern = re.compile(r"\x1b\[[0-9;]*m|\x1b\[.*?[@-~]")
    return ansi_pattern.sub("", text)
