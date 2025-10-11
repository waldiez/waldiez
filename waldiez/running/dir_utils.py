# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Dir related utilities for the waldiez runner."""

import os
from collections.abc import AsyncIterator, Iterator
from contextlib import asynccontextmanager, contextmanager
from pathlib import Path


@contextmanager
def chdir(to: str | Path) -> Iterator[None]:
    """Change the current working directory in a context.

    Parameters
    ----------
    to : str | Path
        The directory to change to.

    Yields
    ------
    Iterator[None]
        The context manager.
    """
    old_cwd = str(os.getcwd())
    try:
        os.chdir(to)
        yield
    finally:
        os.chdir(old_cwd)


@asynccontextmanager
async def a_chdir(to: str | Path) -> AsyncIterator[None]:
    """Asynchronously change the current working directory in a context.

    Parameters
    ----------
    to : str | Path
        The directory to change to.

    Yields
    ------
    AsyncIterator[None]
        The async context manager.
    """
    old_cwd = str(os.getcwd())
    try:
        os.chdir(to)
        yield
    finally:
        os.chdir(old_cwd)
