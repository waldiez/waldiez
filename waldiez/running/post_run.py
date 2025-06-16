# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=unused-argument
"""Utilities for running code."""

import datetime
import shutil
from pathlib import Path
from typing import Optional, Union

from .gen_seq_diagram import generate_sequence_diagram


def after_run(
    temp_dir: Path,
    output_file: Optional[Union[str, Path]],
    flow_name: str,
    uploads_root: Optional[Path] = None,
    skip_mmd: bool = False,
) -> None:
    """Actions to perform after running the flow.

    Parameters
    ----------
    temp_dir : Path
        The temporary directory.
    output_file : Optional[Union[str, Path]]
        The output file.
    flow_name : str
        The flow name.
    uploads_root : Optional[Path], optional
        The runtime uploads root, by default None
    skip_mmd : bool, optional
        Whether to skip the mermaid sequence diagram generation,
        by default, False
    """
    if isinstance(output_file, str):
        output_file = Path(output_file)
    mmd_dir = output_file.parent if output_file else Path.cwd()
    if skip_mmd is False:
        events_csv_path = temp_dir / "logs" / "events.csv"
        if events_csv_path.exists():
            print("Generating mermaid sequence diagram...")
            mmd_path = temp_dir / f"{flow_name}.mmd"
            generate_sequence_diagram(events_csv_path, mmd_path)
            if (
                not output_file
                and mmd_path.exists()
                and mmd_path != mmd_dir / f"{flow_name}.mmd"
            ):
                try:
                    shutil.copyfile(mmd_path, mmd_dir / f"{flow_name}.mmd")
                except BaseException:  # pylint: disable=broad-exception-caught
                    pass
    if output_file:
        destination_dir = output_file.parent
        destination_dir = (
            destination_dir
            / "waldiez_out"
            / datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        )
        destination_dir.mkdir(parents=True, exist_ok=True)
        # copy the contents of the temp dir to the destination dir
        print(f"Copying the results to {destination_dir}")
        copy_results(
            temp_dir=temp_dir,
            output_file=output_file,
            destination_dir=destination_dir,
        )
    shutil.rmtree(temp_dir)


def copy_results(
    temp_dir: Path,
    output_file: Path,
    destination_dir: Path,
) -> None:
    """Copy the results to the output directory.

    Parameters
    ----------
    temp_dir : Path
        The temporary directory.
    output_file : Path
        The output file.
    destination_dir : Path
        The destination directory.
    """
    temp_dir.mkdir(parents=True, exist_ok=True)
    output_dir = output_file.parent
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
            # let's also copy the "tree of thoughts" image
            # to the output directory
            if item.name.endswith("tree_of_thoughts.png") or item.name.endswith(
                "reasoning_tree.json"
            ):
                shutil.copy(item, output_dir / item.name)
            shutil.copy(item, destination_dir)
        else:
            shutil.copytree(item, destination_dir / item.name)
    if output_file.is_file():
        if output_file.suffix == ".waldiez":
            output_file = output_file.with_suffix(".py")
        if output_file.suffix == ".py":
            src = temp_dir / output_file.name
            if src.exists():
                dst = destination_dir / output_file.name
                if dst.exists():
                    dst.unlink()
                shutil.copyfile(src, output_dir / output_file.name)
