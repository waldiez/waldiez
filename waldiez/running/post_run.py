# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Utilities for running code."""

import datetime
import shutil
from pathlib import Path
from typing import Optional, Union

from .gen_seq_diagram import generate_sequence_diagram


def after_run(
    temp_dir: Path,
    output_path: Optional[Union[str, Path]],
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
    flow_name : str
        The flow name.
    skip_mmd : bool, optional
        Whether to skip the mermaid sequence diagram generation,
        by default, False
    """
    if isinstance(output_path, str):
        output_path = Path(output_path)
    mmd_dir = output_path.parent if output_path else Path.cwd()
    if skip_mmd is False:
        events_csv_path = temp_dir / "logs" / "events.csv"
        if events_csv_path.exists():
            print("Generating mermaid sequence diagram...")
            mmd_path = temp_dir / f"{flow_name}.mmd"
            generate_sequence_diagram(events_csv_path, mmd_path)
            if (
                not output_path
                and mmd_path.exists()
                and mmd_path != mmd_dir / f"{flow_name}.mmd"
            ):
                try:
                    shutil.copyfile(mmd_path, mmd_dir / f"{flow_name}.mmd")
                except BaseException:  # pylint: disable=broad-exception-caught
                    pass
    if output_path:
        destination_dir = output_path.parent
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
            output_path=output_path,
            output_dir=output_path.parent,
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
            # let's also copy the "tree of thoughts" image
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
