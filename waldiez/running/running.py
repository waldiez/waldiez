# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Utilities for running code."""

import asyncio
import datetime
import io
import os
import shutil
import subprocess
import sys
import tempfile
import warnings
from contextlib import asynccontextmanager, contextmanager
from pathlib import Path
from typing import (
    AsyncIterator,
    Callable,
    Iterator,
    Optional,
    Set,
    Tuple,
    Union,
)

from .environment import in_virtualenv, is_root
from .gen_seq_diagram import generate_sequence_diagram

# pylint: disable=import-outside-toplevel


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


def before_run(
    output_path: Optional[Union[str, Path]],
    uploads_root: Optional[Union[str, Path]],
) -> str:
    """Actions to perform before running the flow.

    Parameters
    ----------
    output_path : Optional[Union[str, Path]]
        The output path.
    uploads_root : Optional[Union[str, Path]]
        The runtime uploads root.

    Returns
    -------
    str
        The file name.
    """
    if not uploads_root:
        uploads_root = Path(tempfile.mkdtemp())
    else:
        uploads_root = Path(uploads_root)
    if not uploads_root.exists():
        uploads_root.mkdir(parents=True)
    file_name = "waldiez_flow.py" if not output_path else Path(output_path).name
    if file_name.endswith((".json", ".waldiez")):
        file_name = file_name.replace(".json", ".py").replace(".waldiez", ".py")
    if not file_name.endswith(".py"):
        file_name += ".py"
    return file_name


def install_requirements(
    extra_requirements: Set[str], printer: Callable[..., None]
) -> None:
    """Install the requirements.

    Parameters
    ----------
    extra_requirements : Set[str]
        The extra requirements.
    printer : Callable[..., None]
        The printer function.
    """
    requirements_string = ", ".join(extra_requirements)
    printer(f"Installing requirements: {requirements_string}")
    pip_install = [sys.executable, "-m", "pip", "install"]
    break_system_packages = ""
    if not in_virtualenv():  # it should
        # if not, let's try to install as user
        # not sure if --break-system-packages is safe
        # but it might fail if we don't
        break_system_packages = os.environ.get("PIP_BREAK_SYSTEM_PACKAGES", "")
        os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
        if not is_root():
            pip_install.append("--user")
    pip_install.extend(extra_requirements)
    # pylint: disable=too-many-try-statements
    try:
        with subprocess.Popen(
            pip_install,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        ) as proc:
            if proc.stdout:
                for line in io.TextIOWrapper(proc.stdout, encoding="utf-8"):
                    printer(line.strip())
            if proc.stderr:
                for line in io.TextIOWrapper(proc.stderr, encoding="utf-8"):
                    printer(line.strip())
    finally:
        if not in_virtualenv():
            # restore the old env var
            if break_system_packages:
                os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = break_system_packages
            else:
                del os.environ["PIP_BREAK_SYSTEM_PACKAGES"]


async def a_install_requirements(
    extra_requirements: Set[str], printer: Callable[..., None]
) -> None:
    """Install the requirements asynchronously.

    Parameters
    ----------
    extra_requirements : Set[str]
        The extra requirements.
    printer : Callable[..., None]
        The printer function.
    """
    requirements_string = ", ".join(extra_requirements)
    printer(f"Installing requirements: {requirements_string}")
    pip_install = [sys.executable, "-m", "pip", "install"]
    break_system_packages = ""
    if not in_virtualenv():
        break_system_packages = os.environ.get("PIP_BREAK_SYSTEM_PACKAGES", "")
        os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
        if not is_root():
            pip_install.extend(["--user"])
    pip_install.extend(extra_requirements)
    # pylint: disable=too-many-try-statements
    try:
        proc = await asyncio.create_subprocess_exec(
            *pip_install,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        if proc.stdout:
            async for line in proc.stdout:
                printer(line.decode().strip())
        if proc.stderr:
            async for line in proc.stderr:
                printer(line.decode().strip())
    finally:
        if not in_virtualenv():
            if break_system_packages:
                os.environ["PIP_BREAK_SYSTEM_PACKAGES"] = break_system_packages
            else:
                del os.environ["PIP_BREAK_SYSTEM_PACKAGES"]


def after_run(
    temp_dir: Path,
    output_path: Optional[Union[str, Path]],
    printer: Callable[..., None],
    flow_name: str,
    skip_mmd: bool = False,
) -> None:
    """Actions to perform after running the flow.

    Parameters
    ----------
    temp_dir : Path
        The temporary directory.
    output_path : Optional[Union[str, Path]]
        The output path.
    printer : Callable[..., None]
        The printer function.
    flow_name : str
        The flow name.
    skip_mmd : bool, optional
        Whether to skip the mermaid sequence diagram generation,
        by default False
    """
    if isinstance(output_path, str):
        output_path = Path(output_path)
    output_dir = output_path.parent if output_path else Path.cwd()
    if skip_mmd is False:
        events_csv_path = temp_dir / "logs" / "events.csv"
        if events_csv_path.exists():
            printer("Generating mermaid sequence diagram...")
            mmd_path = temp_dir / f"{flow_name}.mmd"
            generate_sequence_diagram(events_csv_path, mmd_path)
            if mmd_path.exists():
                shutil.copyfile(mmd_path, output_dir / f"{flow_name}.mmd")
    if output_path:
        destination_dir = output_path.parent
        destination_dir = (
            destination_dir
            / "waldiez_out"
            / datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        )
        destination_dir.mkdir(parents=True, exist_ok=True)
        # copy the contents of the temp dir to the destination dir
        printer(f"Copying the results to {destination_dir}")
        copy_results(
            temp_dir=temp_dir,
            output_path=output_path,
            output_dir=output_dir,
            destination_dir=destination_dir,
        )
    shutil.rmtree(temp_dir)


def copy_results(
    temp_dir: Path,
    output_path: Path,
    output_dir: Path,
    destination_dir: Path,
) -> None:
    """Copy the results to the output directory.

    Parameters
    ----------
    temp_dir : Path
        The temporary directory.
    output_path : Path
        The output path.
    output_dir : Path
        The output directory.
    destination_dir : Path
        The destination directory.
    """
    temp_dir.mkdir(parents=True, exist_ok=True)
    for item in temp_dir.iterdir():
        # skip cache files
        if (
            item.name.startswith("__pycache__")
            or item.name.endswith(".pyc")
            or item.name.endswith(".pyo")
            or item.name.endswith(".pyd")
            or item.name == ".cache"
        ):
            continue
        if item.is_file():
            # let's also copy the tree of thoughts image
            # to the output directory
            if item.name.endswith("tree_of_thoughts.png") or item.name.endswith(
                "reasoning_tree.json"
            ):
                shutil.copy(item, output_dir / item.name)
            shutil.copy(item, destination_dir)
        else:
            shutil.copytree(item, destination_dir / item.name)
    if output_path.is_file():
        if output_path.suffix == ".waldiez":
            output_path = output_path.with_suffix(".py")
        if output_path.suffix == ".py":
            src = temp_dir / output_path.name
            if src.exists():
                dst = destination_dir / output_path.name
                if dst.exists():
                    dst.unlink()
                shutil.copyfile(src, output_dir / output_path.name)


def get_printer() -> Callable[..., None]:
    """Get the printer function.

    Returns
    -------
    Callable[..., None]
        The printer function.
    """
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            module="flaml",
            message="^.*flaml.automl is not available.*$",
        )
        from autogen.io import IOStream  # type: ignore

    printer = IOStream.get_default().print

    def safe_printer(*args: object, **kwargs: object) -> None:
        try:
            printer(*args, **kwargs)
        except UnicodeEncodeError:
            # pylint: disable=too-many-try-statements
            try:
                msg, flush = get_what_to_print(*args, **kwargs)
                printer(msg, end="", flush=flush)
            except UnicodeEncodeError:
                sys.stdout = io.TextIOWrapper(
                    sys.stdout.buffer, encoding="utf-8"
                )
                sys.stderr = io.TextIOWrapper(
                    sys.stderr.buffer, encoding="utf-8"
                )
                try:
                    printer(*args, **kwargs)
                except UnicodeEncodeError:
                    sys.stderr.write(
                        "Could not print the message due to encoding issues.\n"
                    )

    return safe_printer


def get_what_to_print(*args: object, **kwargs: object) -> Tuple[str, bool]:
    """Get what to print.

    Parameters
    ----------
    args : object
        The arguments.
    kwargs : object
        The keyword arguments.

    Returns
    -------
    Tuple[str, bool]
        The message and whether to flush.
    """
    sep = kwargs.get("sep", " ")
    if not isinstance(sep, str):
        sep = " "
    end = kwargs.get("end", "\n")
    if not isinstance(end, str):
        end = "\n"
    flush = kwargs.get("flush", False)
    if not isinstance(flush, bool):
        flush = False
    msg = sep.join(str(arg) for arg in args) + end
    utf8_msg = msg.encode("utf-8", errors="replace").decode("utf-8")
    return utf8_msg, flush
