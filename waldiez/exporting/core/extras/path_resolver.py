# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Default path resolver for Waldiez items."""

from pathlib import Path

from ..protocols import PathResolver


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
        str
            The resolved local path string (raw path format).
        """
        resolved = DefaultPathResolver._check_local_path(path)
        if not resolved:
            return _get_raw_path_string(path)
        return _get_raw_path_string(resolved)

    def is_local(self, path: str) -> bool:
        """Check if the given path is a local path.

        Parameters
        ----------
        path : str
            The path to check.

        Returns
        -------
        bool
            True if the path is a local path, False otherwise.
        """
        return DefaultPathResolver._check_local_path(path) is not None

    @staticmethod
    def _check_local_path(string: str) -> Path | None:
        """Check if a string is a local path.

        Parameters
        ----------
        string : str
            The string to check.

        Returns
        -------
        Path | None
            The resolved local path string (raw path format) or
            None if it does not exist.
        """
        # pylint: disable=broad-exception-caught
        # noinspection PyBroadException
        try:
            path = Path(string).resolve()
        except BaseException:  # pragma: no cover
            return None
        if path.exists():
            return path
        return None


def _get_raw_path_string(path: str | Path) -> str:
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
    while path.startswith("r'") and path.endswith("'"):
        path = path[2:-1]
    # return repr(path)
    return f'r"{path}"'
