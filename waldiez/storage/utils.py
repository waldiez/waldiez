# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

"""Utility functions for storage operations."""

import builtins
import getpass
import os
import platform
import re
import shutil
import stat
import subprocess
import sys
from collections.abc import Iterable
from functools import lru_cache
from pathlib import Path


def symlink(
    link_path: Path,
    target_path: Path,
    *,
    overwrite: bool = False,
    make_parents: bool = True,
    windows_junction_fallback: bool = True,
) -> None:
    """Create/update a symbolic link.

    Parameters
    ----------
    link_path : Path
        Where the link will be created.
    target_path : Path
        What the link should point to. Can exist or not.
    overwrite : bool
        If True, replace an existing file/dir/link at `link_path`.
        Defaults to False.
    make_parents : bool
        Create parent directories for `link_path` if needed.
        Defaults to True.
    windows_junction_fallback : bool
        If True, on Windows and directory target, use `mklink /J` when
        symlink creation fails. Defaults to True.

    Raises
    ------
    FileExistsError
        If something exists at `link_path` and `overwrite=False`.
    OSError
        For OS-level failures.
    """
    if make_parents:
        link_path.parent.mkdir(parents=True, exist_ok=True)
    abs_target = target_path.resolve()
    should_continue = _pre_link(
        link_path=link_path, link_target=abs_target, overwrite=overwrite
    )
    if not should_continue:
        return
    try:
        os.symlink(
            abs_target, link_path, target_is_directory=abs_target.is_dir()
        )
        return
    except (OSError, NotImplementedError) as e:  # pragma: no cover
        is_windows = platform.system() == "Windows"
        winerror = getattr(e, "winerror", None)

        if not is_windows:
            msg = (
                "Failed to create a symlink from"
                f" {link_path} to {abs_target}: {e}"
            )
            raise OSError(msg) from e

        # On Windows, optionally fall back to a junction for directories
        if windows_junction_fallback and abs_target.is_dir():
            try:
                subprocess.run(  # nosec
                    [
                        "cmd",
                        "/c",
                        "mklink",
                        "/J",
                        str(link_path),
                        str(abs_target),
                    ],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                return
            except subprocess.CalledProcessError as je:
                msg = (
                    je.stderr
                    or je.stdout
                    or (
                        "Failed to create directory junction. "
                        "On Windows, creating symlinks/junctions may "
                        "require Administrator privileges "
                        "or enabling Developer Mode."
                    )
                )
                raise OSError(msg) from e

        if winerror == 1314:
            msg = (
                "Symlink creation failed: "
                "'A required privilege is not held by the client'. "
                "Enable Developer Mode or run as Administrator."
            )
            raise OSError(msg) from e

        raise OSError(
            f"Failed to create a symlink from {link_path} to {abs_target}"
        ) from e


@lru_cache
def is_installed_package() -> bool:
    """Check if running from an installed package (not editable/dev mode).

    Returns
    -------
    bool
        True if detected as installed, False otherwise.
    """
    # noinspection PyBroadException
    try:
        # Check if running from site-packages
        module_path = Path(__file__).resolve()
        site_packages = any("site-packages" in str(p) for p in sys.path)
        return site_packages and "site-packages" in str(module_path)
    except Exception:  # pylint: disable=broad-exception-caught
        return False


@lru_cache
def is_frozen() -> bool:
    """Check if we are inside a compiled app.

    Returns
    -------
    bool
        True if detected frozen.
    """
    # noinspection PyBroadException
    try:
        compiled = getattr(builtins, "__compiled__", False)
    except Exception:  # pylint: disable=broad-exception-caught
        compiled = False

    return bool(
        getattr(sys, "frozen", False) or hasattr(sys, "_MEIPASS") or compiled
    )


@lru_cache
def get_root_dir(user_id: str | None = None) -> Path:
    """Get the root directory for flows, user uploads, etc.

    Parameters
    ----------
    user_id : str
        The user ID (if using multi-user mode)

    Returns
    -------
    Path
        The root waldiez directory
    """
    if not user_id:
        user_id = getpass.getuser()
    if is_frozen() or is_installed_package():  # pragma: no cover
        root_dir = Path.home()
        # if current user is "waldiez", let's skip dupe
        if root_dir.name.lower() != "waldiez":
            root_dir = root_dir / "waldiez"
        root_dir = root_dir / "workspace" / "waldiez_checkpoints"
        root_dir.mkdir(parents=True, exist_ok=True)
        return root_dir
    files_root = (
        Path(__file__).parent.parent.parent
        / "workspace"
        / "waldiez_checkpoints"
    )
    root_dir = files_root / user_id
    is_testing_env = os.environ.get("WALDIEZ_TESTING", "False").lower()
    is_testing = (
        is_testing_env[0] in ("t", "y", "1") if is_testing_env else False
    )
    # WALDIEZ_TESTING=true/yes/on/1
    if is_testing_env == "on":
        is_testing = True
    if is_testing:
        # allow overriding for tests
        root_dir = (
            Path(os.environ.get("WALDIEZ_ROOT_DIR", str(files_root))) / user_id
        )
    root_dir.mkdir(parents=True, exist_ok=True)
    return root_dir.resolve(True)


def safe_name(
    name: str, max_length: int = 255, fallback: str = "invalid_name"
) -> str:
    """Return a filesystem-safe version of a name.

    Parameters
    ----------
    name : str
        The original name.
    max_length : int
        The new name's max length.
    fallback : str
        A fallback name to use.

    Returns
    -------
    str
        The safe version of the name
    """
    safe = name.strip()

    if not safe:
        return fallback
    safe = re.sub(r"[^a-zA-Z0-9_.-]+", "_", safe)
    safe = re.sub(r"_+", "_", safe)
    safe = re.sub(r"\.{2,}", "_", safe)
    safe = safe.strip("._")
    safe = safe[:max_length].rstrip("._")
    return safe or fallback


def _is_windows_junction(p: Path) -> bool:
    """Heuristically detect a Windows directory junction."""
    if platform.system() != "Windows":
        return False
    if not p.exists() or not p.is_dir():
        return False
    try:
        st = os.stat(p, follow_symlinks=False)
        return bool(
            getattr(st, "st_file_attributes", 0)
            & stat.FILE_ATTRIBUTE_REPARSE_POINT
        )
    except OSError:
        return False


def _normalize_link_target(link_path: Path, raw_target: Path) -> Path:
    """Make a link target absolute relative to the link's parent if needed."""
    return (
        raw_target
        if raw_target.is_absolute()
        else (link_path.parent / raw_target).resolve()
    )


# pylint: disable=too-complex
def _pre_link(
    link_path: Path,
    link_target: Path,
    overwrite: bool,
) -> bool:  # noqa: C901
    """Prepare for creating a link; return False if no-op, True to proceed."""
    if link_path == link_target:
        return False
    is_link = link_path.is_symlink() or _is_windows_junction(link_path)
    if is_link:
        # pylint: disable=too-many-try-statements
        try:
            # For junctions, we need a different approach to read the target
            if _is_windows_junction(link_path):
                # Resolve the junction and compare
                current = link_path.resolve()
            else:
                current_raw = link_path.readlink()
                current = _normalize_link_target(link_path, current_raw)

            if current == link_target:
                return False
        except OSError:
            pass

    if link_path.exists() or is_link:
        if not overwrite:
            raise FileExistsError(
                f"{link_path} already exists; set overwrite=True to replace it."
            )

        if is_link or link_path.is_file():
            if _is_windows_junction(link_path):
                os.rmdir(link_path)  # removes the junction itself
            else:
                link_path.unlink(missing_ok=True)
        else:
            shutil.rmtree(link_path)

    return True


# pylint: disable=too-complex
# noinspection TryExceptPass,PyBroadException
def copy_results(
    temp_dir: Path,
    output_file: Path,
    destination_dir: Path,
    *,
    promote_to_output: Iterable[str] = (
        "tree_of_thoughts.png",
        "reasoning_tree.json",
    ),
    ignore_names: Iterable[str] = (".cache", ".env"),
) -> None:
    """Copy the results to the output directory, merge-safe.

    Parameters
    ----------
    temp_dir : Path
        Directory containing run artifacts.
    output_file : Path
        The original output target
        used to determine output_dir and special handling for .waldiez/.py.
    destination_dir : Path
        Where the run artifacts should be copied (e.g., public link target).
    promote_to_output : Iterable[str]
        File names (exact matches) to also copy into output_dir.
    ignore_names : Iterable[str]
        Directory/file names to skip entirely.
    """
    # pylint: disable=broad-exception-caught
    temp_dir.mkdir(parents=True, exist_ok=True)
    destination_dir.mkdir(parents=True, exist_ok=True)

    output_dir = output_file.parent
    for item in temp_dir.iterdir():
        # skip cache files / dirs
        if (
            item.name == "__pycache__"
            or item.suffix in (".pyc", ".pyo", ".pyd")
            or item.name in ignore_names
        ):
            continue

        if item.is_file():
            if item.name in promote_to_output:
                try:
                    shutil.copy2(item, output_dir / item.name)
                except Exception:
                    pass
            try:
                shutil.copy2(item, destination_dir / item.name)
            except Exception:
                pass
        else:
            try:
                shutil.copytree(
                    item, destination_dir / item.name, dirs_exist_ok=True
                )
            except Exception:
                pass
    _copy_output_file(
        src_root=temp_dir,
        output_file_path=output_file,
        destination_dir=destination_dir,
        output_dir=output_dir,
    )


def _copy_output_file(
    *,
    src_root: Path,
    output_file_path: Path,
    destination_dir: Path,
    output_dir: Path,
) -> None:
    """Place the generated source (.py) next to outputs (and avoid dupes)."""
    if output_file_path.is_file():
        out_path = (
            output_file_path.with_suffix(".py")
            if output_file_path.suffix == ".waldiez"
            else output_file_path
        )
        src = src_root / out_path.name
        if src.exists():
            dst = destination_dir / out_path.name
            # noinspection TryExceptPass,PyBroadException
            try:
                if dst.exists():
                    dst.unlink()
                shutil.copyfile(src, output_dir / out_path.name)
            except BaseException:  # pylint: disable=broad-exception-caught
                pass
