# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Default path resolver for Waldiez items."""

from pathlib import Path
from typing import Optional, Union

from ..protocols import PathResolver


# pylint: disable=too-few-public-methods
class DefaultPathResolver(PathResolver):
    """Default path resolver for Waldiez items."""

    def resolve(self, path: str) -> str:
        """Resolve a path to a local file system path.

        Parameters
        ----------
        path : Union[str, Path]
            The path to resolve.

        Returns
        -------
        Optional[Path]
            The resolved local path or None if not found.
        """
        resolved = _check_local_path(path)
        if not resolved:
            return _get_raw_path_string(path)
        return _get_raw_path_string(resolved)


def _check_local_path(string: str) -> Optional[Path]:
    """Check if a string is a local path.

    Parameters
    ----------
    string : str
        The string to check.

    Returns
    -------
    bool
        True if the path is a local path.
    """
    # pylint: disable=broad-exception-caught
    try:
        path = Path(string).resolve()
    except BaseException:  # pragma: no cover
        return None
    if path.exists():
        return path
    return None


def _get_raw_path_string(path: Union[str, Path]) -> str:
    """Get the raw path string.

    Parameters
    ----------
    path : Union[str, Path]
        The string to check.

    Returns
    -------
    str
        The raw path string.
    """
    if not isinstance(path, str):
        path = str(path)
    while path.startswith('r"') and path.endswith('"'):
        path = path[2:-1]
    return f'r"{path}"'


# def get_path_string(path: str) -> str:
#     """Get the path string.

#     Parameters
#     ----------
#     path : str
#         The string to check.

#     Returns
#     -------
#     str
#         The local path string.
#     """
#     resolved = _check_local_path(path)
#     if not resolved:
#         return _get_raw_path_string(path)
#     return _get_raw_path_string(resolved)
