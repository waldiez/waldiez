# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Read the version from the version file."""

from pathlib import Path


def get_waldiez_version() -> (
    str
):  # pragma: no cover  # depends on file existence
    """Read the version from the version file.

    Returns
    -------
    str
        The version.
    """
    here = Path(__file__).parent  # waldiez/models/common
    package_dir = here.parent.parent  # waldiez/models -> waldiez
    version_file = package_dir / "_version.py"
    if not version_file.exists():
        return "0.0.0"  # dev / ignored
    with version_file.open() as f:
        for line in f:
            if line.startswith("__version__"):
                version = line.split("=")[1].strip().strip('"').strip("'")
                # send version without "v" prefix
                if version.startswith("v"):
                    version = version[1:]
                # make sure it is a valid semver
                if not version or not all(
                    part.isdigit() for part in version.split(".")
                ):
                    return "0.0.0"
                return version
    return "0.0.0"  # fallback if not found
