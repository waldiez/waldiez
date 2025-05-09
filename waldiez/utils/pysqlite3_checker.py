# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=import-error
# flake8: noqa: E501
"""Try to install pysqlite3-binary.

Highly recommended to be run in a virtual environment.
'setuptools' and 'wheel' will also be installed if not already installed.
"""

import contextlib
import io
import os
import platform
import shutil
import site
import subprocess
import sys
import tempfile
import urllib.request
import zipfile

PYSQLITE3_VERSION = "0.5.4"
SQLITE_URL = "https://www.sqlite.org/2025/sqlite-amalgamation-3480000.zip"
PYSQLITE3_URL = f"https://github.com/coleifer/pysqlite3/archive/refs/tags/{PYSQLITE3_VERSION}.zip"  # pylint: disable=line-too-long

PIP = [sys.executable, "-m", "pip"]


def run_command(command: list[str], cwd: str = ".") -> None:
    """Run a command.

    Parameters
    ----------
    command : str
        The command to run.
    cwd : str
        The current working directory.
    """
    if cwd == ".":
        cwd = os.getcwd()
    try:
        subprocess.run(  # nosemgrep  # nosec
            command,
            check=True,
            cwd=cwd,
            env=os.environ,
            encoding="utf-8",
        )
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        sys.exit(1)


def in_virtualenv() -> bool:
    """Check if the script is running in a virtual environment.

    Returns
    -------
    bool
        True if in a virtual environment, False otherwise.
    """
    return hasattr(sys, "real_prefix") or (
        hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix
    )


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


def pip_install(*package_names: str, cwd: str = ".") -> None:
    """Install packages using pip.

    Parameters
    ----------
    *package_names : tuple[str, ...]
        The package names or paths to install.
    cwd : str
        The current working directory.
    """
    args = ["install", "-qq"]
    break_system_packages = ""
    if not in_virtualenv():
        break_system_packages = os.environ.get("PIP_BREAK_SYSTEM_PACKAGES", "")
        os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
        if not is_root():
            args.append("--user")
    run_command(PIP + args + list(package_names), cwd)
    if not in_virtualenv():
        if break_system_packages:
            os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = break_system_packages
        else:
            os.environ.pop("PIP_BREAK_SYSTEM_PACKAGES", None)


def pip_uninstall(*package_names: str, cwd: str = ".") -> None:
    """Uninstall packages using pip.

    Parameters
    ----------
    *package_names : tuple[str, ...]
        The package names to uninstall.
    cwd : str
        The current working directory.
    """
    args = ["uninstall", "-qq", "--yes"]
    break_system_packages = ""
    if not in_virtualenv():
        break_system_packages = os.environ.get("PIP_BREAK_SYSTEM_PACKAGES", "")
        os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
    run_command(PIP + args + list(package_names), cwd)
    if not in_virtualenv():
        if break_system_packages:
            os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = break_system_packages
        else:
            os.environ.pop("PIP_BREAK_SYSTEM_PACKAGES", None)


def download_sqlite_amalgamation() -> str:
    """Download the SQLite amalgamation source code.

    Returns
    -------
    str
        The path to the extracted SQLite source code.
    """
    zip_path = "sqlite_amalgamation.zip"
    extract_path = "sqlite_amalgamation"

    # Download the SQLite source code
    print("Downloading SQLite amalgamation source code...")
    urllib.request.urlretrieve(SQLITE_URL, zip_path)  # nosec

    # Extract the SQLite source code
    print("Extracting SQLite source code...")
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_path)

    # Clean up the zip file
    os.remove(zip_path)

    # Return the path to the extracted source code
    folder_name = SQLITE_URL.rsplit("/", 1)[-1].split(".")[0]
    return os.path.join(extract_path, folder_name)


def rename_package_name(pysqlite3_dir: str) -> None:
    """Rename the package name in the setup.py file.

    Parameters
    ----------
    pysqlite3_dir : str
        The path to the pysqlite3 directory.
    """
    setup_file = os.path.join(pysqlite3_dir, "setup.py")
    with open(setup_file, "r", encoding="utf-8") as file:
        setup_py = file.read()
    # sed -i "s|name='pysqlite3-binary'|name=PACKAGE_NAME|g" setup.py
    setup_py = setup_py.replace(
        "name='pysqlite3'", "name='pysqlite3-binary'"
    ).replace("name=PACKAGE_NAME,", "name='pysqlite3-binary',")
    with open(setup_file, "w", encoding="utf-8", newline="\n") as file:
        file.write(setup_py)


def prepare_pysqlite3(sqlite_amalgamation_path: str) -> str:
    """Prepare pysqlite3 using the SQLite amalgamation source code.

    Parameters
    ----------
    sqlite_amalgamation_path : str
        The path to the SQLite amalgamation source code.

    Returns
    -------
    str
        The path to the pysqlite3 directory.
    """
    pysqlite3_zip = "pysqlite3.zip"
    pysqlite3_extract = "pysqlite3"
    urllib.request.urlretrieve(PYSQLITE3_URL, pysqlite3_zip)  # nosec
    with zipfile.ZipFile(pysqlite3_zip, "r") as zip_ref:
        zip_ref.extractall(pysqlite3_extract)
    os.remove(pysqlite3_zip)
    sqlite3_c = os.path.join(sqlite_amalgamation_path, "sqlite3.c")
    sqlite3_h = os.path.join(sqlite_amalgamation_path, "sqlite3.h")
    pysqlite3_dir = os.path.join(
        pysqlite3_extract, f"pysqlite3-{PYSQLITE3_VERSION}"
    )
    shutil.copy(sqlite3_c, pysqlite3_dir)
    shutil.copy(sqlite3_h, pysqlite3_dir)
    rename_package_name(pysqlite3_dir)
    return pysqlite3_dir


def install_pysqlite3(sqlite_amalgamation_path: str) -> None:
    """Install pysqlite3 using the SQLite amalgamation source code.

    Parameters
    ----------
    sqlite_amalgamation_path : str
        The path to the SQLite amalgamation source code.
    """
    # pylint: disable=too-many-try-statements
    try:
        pysqlite3_dir = prepare_pysqlite3(sqlite_amalgamation_path)
        pip_install("setuptools")
        run_command([sys.executable, "setup.py", "build_static"], pysqlite3_dir)
        pip_install("wheel")
        run_command(
            PIP + ["wheel", ".", "-w", "dist"],
            pysqlite3_dir,
        )
        wheel_file = os.listdir(os.path.join(pysqlite3_dir, "dist"))[0]
        wheel_path = os.path.join("dist", wheel_file)
        pip_install(wheel_path, cwd=pysqlite3_dir)
    except BaseException as e:  # pylint: disable=broad-except
        print(f"Failed to install pysqlite3: {e}")
        sys.exit(1)


def check_pysqlite3() -> None:
    """Check the installation of pysqlite3."""
    # pylint: disable=unused-import, import-outside-toplevel, line-too-long
    try:
        import pysqlite3  # type: ignore[unused-ignore, import-untyped, import-not-found]  # noqa
    except ImportError:
        print("pysqlite3 not found or cannot be imported.")
        # and not arm64
        is_arm = "arm" in platform.machine().lower()
        if not is_arm and platform.system() == "Linux":
            pip_install("pysqlite3-binary")
        else:
            # Uninstall pysqlite3-binary if it is already installed
            pip_uninstall("pysqlite3", "pysqlite3-binary")
            cwd = os.getcwd()
            tmpdir = tempfile.mkdtemp()
            os.chdir(tmpdir)
            source_path = download_sqlite_amalgamation()
            install_pysqlite3(source_path)
            os.chdir(cwd)
            shutil.rmtree(tmpdir)
        site.main()
        # Re-import pysqlite3 as sqlite3
        import pysqlite3  # type: ignore[unused-ignore, import-untyped, import-not-found]  # noqa

        sys.modules["sqlite3"] = sys.modules["pysqlite3"]


def test_sqlite_usage() -> None:
    """Test the usage of the sqlite3 module."""
    # pylint: disable=import-outside-toplevel, unused-import, line-too-long
    import pysqlite3  # type: ignore[unused-ignore, import-untyped, import-not-found]  # noqa

    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")
    import sqlite3  # noqa

    print(sqlite3.__file__)
    # it should be sth like: /path/to/site-packages/pysqlite3/__init__.py
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
    cursor.execute("INSERT INTO test (name) VALUES ('test')")
    cursor.execute("SELECT * FROM test")
    rows = cursor.fetchall()
    print(rows)
    conn.close()


def main() -> None:
    """Run the check."""
    if "--force" in sys.argv:
        pip_uninstall("pysqlite3", "pysqlite3-binary")
    cwd = os.getcwd()
    tmpdir = tempfile.mkdtemp()
    os.chdir(tmpdir)
    # let's try to suppress logs
    with (
        contextlib.redirect_stderr(io.StringIO()),
        contextlib.redirect_stdout(io.StringIO()),
    ):
        check_pysqlite3()
    os.chdir(cwd)
    shutil.rmtree(tmpdir)
    test_sqlite_usage()


if __name__ == "__main__":
    main()
