# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportConstantRedefinition=false
# pyright: reportImplicitRelativeImport=false

"""Build the waldiez package."""

import shutil
import subprocess  # nosemgrep # nosec
import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import ROOT_DIR, get_executable, prefer_uv
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from _lib import ROOT_DIR, get_executable, prefer_uv  # type: ignore

    HAD_TO_MODIFY_SYS_PATH = True


def get_caller() -> list[str]:
    """Get the caller to use for a command.

    Returns
    -------
    list[str]
        The caller to use for a command.
    """
    if prefer_uv():
        return ["uv"]
    return [get_executable(), "-m"]


def ensure_dependencies() -> None:
    """Install the dependencies for building the package."""
    args = [
        *get_caller(),
        "pip",
        "install",
        "--upgrade",
        "pip",
        "build",
        "twine",
    ]
    subprocess.run(  # nosemgrep # nosec
        args,
        check=True,
        cwd=ROOT_DIR,
    )


def build_package() -> None:
    """Build the package."""
    build_dir = ROOT_DIR / "build"
    if build_dir.exists():
        shutil.rmtree(build_dir)
    dist_dir = ROOT_DIR / "out" / "dist"
    if "--output" in sys.argv:
        entry_index = sys.argv.index("--output")
        if entry_index + 1 < len(sys.argv):
            dist_dir = Path(sys.argv[entry_index + 1])
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    build_dir.mkdir(parents=True, exist_ok=True)
    dist_dir.mkdir(parents=True, exist_ok=True)
    ensure_dependencies()
    args = get_caller()
    build_args = args + [
        "build",
        "--sdist",
        "--wheel",
    ]
    if prefer_uv():
        build_args.append("--out-dir")
    else:
        build_args.append("--outdir")
    build_args.append(str(dist_dir))
    subprocess.run(  # nosemgrep # nosec
        build_args,
        check=True,
        cwd=ROOT_DIR,
    )
    check_args = [
        "twine",
        "check",
        f"{dist_dir}/*.whl",
        f"{dist_dir}/*.tar.gz",
    ]
    subprocess.run(  # nosemgrep # nosec
        check_args,
        check=True,
        cwd=ROOT_DIR,
    )
    print("Build done.")


def main() -> None:
    """Build the package."""
    try:
        build_package()
    except BaseException as error:  # pylint: disable=broad-exception-caught
        print(f"An error occurred while formatting the code: {error}")
        sys.exit(1)
    finally:
        if HAD_TO_MODIFY_SYS_PATH:
            sys.path.pop(0)


if __name__ == "__main__":
    main()
