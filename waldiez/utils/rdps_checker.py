# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""
Check for rpds-py on Windows ARM64.

Since we cannot use direct git dependency for `rpds-py` in `pyproject.toml`,
let's check it here.

NOTE: We should regularly check if this is still needed.
"""
# pylint: disable=import-outside-toplevel,unused-import

# "rpds-py @ git+https://github.com/crate-py/rpds.git@v0.24.0 ;
# sys_platform == "win32" and platform_machine == "AARCH64"",

import os
import platform
import subprocess
import sys

PIP = [os.path.normpath(sys.executable), "-m", "pip"]
RDPS_PY_VERSION = "0.24.0"
RDPS_PY_URL = f"git+https://github.com/crate-py/rpds.git@{RDPS_PY_VERSION}"


def is_windows_arm64() -> bool:
    """Check if the current platform is Windows ARM64.

    Returns
    -------
    bool
        True if the platform is Windows ARM64, False otherwise.
    """
    return sys.platform == "win32" and platform.machine().lower() in [
        "arm64",
        "aarch64",
    ]


def is_rpds_py_installed() -> bool:
    """Check if `rpds-py` is installed.

    Returns
    -------
    bool
        True if `rpds-py` is installed, False otherwise.
    """
    try:
        import rpds  # noqa: F401

        return True
    except ImportError:
        return False


def is_root() -> bool:
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
        except Exception:  # pylint: disable=broad-exception-caught
            return False
    else:
        return os.getuid() == 0


def in_virtualenv() -> bool:
    """Check if the current environment is a virtual environment.

    Returns
    -------
    bool
        True if in a virtual environment, False otherwise.
    """
    return hasattr(sys, "real_prefix") or (
        hasattr(sys, "base_prefix")
        and os.path.realpath(sys.base_prefix) != os.path.realpath(sys.prefix)
    )


def install_rpds_py() -> None:
    """Install `rpds-py`."""
    command = PIP + ["install", "-qq"]
    if not in_virtualenv():
        break_system_packages = os.environ.get("PIP_BREAK_SYSTEM_PACKAGES", "")
        os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
        if not is_root():
            command.append("--user")
    command.append(RDPS_PY_URL)
    try:
        subprocess.check_call(command)
    except subprocess.CalledProcessError as e:
        print(f"Failed to install rpds-py: {e}")
    finally:
        if not in_virtualenv():
            # restore the old env var
            if break_system_packages:
                os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = break_system_packages
            else:
                del os.environ["PIP_BREAK_SYSTEM_PACKAGES"]


def check_rpds_py() -> None:
    """Check if `rpds-py` is installed on Windows ARM64."""
    if not is_windows_arm64():
        return
    if is_rpds_py_installed():
        return
    install_rpds_py()


if __name__ == "__main__":
    check_rpds_py()
