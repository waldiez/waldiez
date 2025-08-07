# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common utilities for the waldiez runner."""

import asyncio
import os
import re
import subprocess
import sys

# noinspection PyProtectedMember
from asyncio.subprocess import Process
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass
from getpass import getpass
from pathlib import Path
from typing import AsyncIterator, Iterator, Union


@dataclass
class ProcessSetup:
    """Container for subprocess setup data."""

    temp_dir: Path
    file_path: Path
    old_vars: dict[str, str]
    skip_mmd: bool


@contextmanager
def chdir(to: Union[str, Path]) -> Iterator[None]:
    """Change the current working directory in a context.

    Parameters
    ----------
    to : Union[str, Path]
        The directory to change to.

    Yields
    ------
    Iterator[None]
        The context manager.
    """
    old_cwd = str(os.getcwd())
    os.chdir(to)
    try:
        yield
    finally:
        os.chdir(old_cwd)


@asynccontextmanager
async def a_chdir(to: Union[str, Path]) -> AsyncIterator[None]:
    """Asynchronously change the current working directory in a context.

    Parameters
    ----------
    to : Union[str, Path]
        The directory to change to.

    Yields
    ------
    AsyncIterator[None]
        The async context manager.
    """
    old_cwd = str(os.getcwd())
    os.chdir(to)
    try:
        yield
    finally:
        os.chdir(old_cwd)


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


def create_sync_subprocess(setup: ProcessSetup) -> subprocess.Popen[bytes]:
    """Create a synchronous subprocess.

    Parameters
    ----------
    setup : ProcessSetup
        The setup data for the subprocess.

    Returns
    -------
    subprocess.Popen[bytes]
        The created subprocess.
    """
    return subprocess.Popen(
        [sys.executable, "-u", str(setup.file_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.PIPE,
        # text=True,
        # bufsize=1,  # Line buffered for real-time output
        # universal_newlines=True,
        env={**os.environ},
    )


async def create_async_subprocess(setup: ProcessSetup) -> Process:
    """Create an asynchronous subprocess.

    Parameters
    ----------
    setup : ProcessSetup
        The setup data for the subprocess.

    Returns
    -------
    Process
        The created asynchronous subprocess.
    """
    return await asyncio.create_subprocess_exec(
        sys.executable,
        "-u",
        str(setup.file_path),
        # stdout=asyncio.subprocess.PIPE,
        # stderr=asyncio.subprocess.PIPE,
        # stdin=asyncio.subprocess.PIPE,
        env={**os.environ},
    )


async def input_async(prompt: str, *, password: bool = False) -> str:
    """Asynchronous input function.

    Parameters
    ----------
    prompt : str
        The prompt to display to the user.
    password : bool, optional
        Whether to hide input (password mode), by default False.

    Returns
    -------
    str
        The user input.
    """
    if password:
        return await asyncio.to_thread(getpass, prompt)
    return await asyncio.to_thread(input, prompt)


def input_sync(prompt: str, *, password: bool = False) -> str:
    """Input function (synchronous).

    Parameters
    ----------
    prompt : str
        The prompt to display to the user.
    password : bool, optional
        Whether to hide input (password mode), by default False.

    Returns
    -------
    str
        The user input.
    """
    if password:
        return getpass(prompt)
    return input(prompt)
