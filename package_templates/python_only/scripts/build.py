# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Build the `my_project` python package."""
import shutil
import subprocess  # nosemgrep # nosec
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent


def install_dependencies() -> None:
    """Install the dependencies for building the package."""
    subprocess.run(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "--upgrade",
            "pip",
            "build",
            "twine",
        ],
        check=True,
        cwd=ROOT_DIR,
    )


def build_package() -> None:
    """Build the package."""
    build_dir = ROOT_DIR / "build"
    if build_dir.exists():
        shutil.rmtree(build_dir)
    dist_dir = ROOT_DIR / "dist"
    if "--output" in sys.argv:
        entry_index = sys.argv.index("--output")
        if entry_index + 1 < len(sys.argv):
            dist_dir = Path(sys.argv[entry_index + 1])
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    build_dir.mkdir(parents=True, exist_ok=True)
    dist_dir.mkdir(parents=True, exist_ok=True)
    install_dependencies()
    subprocess.run(  # nosemgrep # nosec
        [
            sys.executable,
            "-m",
            "build",
            "--sdist",
            "--wheel",
            "--outdir",
            str(dist_dir),
        ],
        check=True,
        cwd=ROOT_DIR,
    )
    subprocess.run(  # nosemgrep # nosec
        [
            sys.executable,
            "-m",
            "twine",
            "check",
            f"{dist_dir}/*.whl",
            f"{dist_dir}/*.tar.gz",
        ],
        check=True,
        cwd=ROOT_DIR,
    )
    if "--publish" in sys.argv or "--upload" in sys.argv:
        # subprocess.run(  # nosemgrep # nosec
        #     [
        #         sys.executable,
        #         "-m",
        #         "twine",
        #         "upload",
        #         f"{dist_dir}/*",
        #     ],
        #     check=True,
        #     cwd=ROOT_DIR,
        # )
        print("Let's say we uploaded the package.")
    print("Build done [my_package].")


def main() -> None:
    """Build the package."""
    build_package()


if __name__ == "__main__":
    main()
