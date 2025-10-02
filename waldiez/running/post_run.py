# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=unused-argument,broad-exception-caught

"""Utilities for running code."""

import csv
import datetime
import json
import shutil
import sqlite3
from pathlib import Path
from typing import Any

import anyio.to_thread

from .gen_seq_diagram import generate_sequence_diagram
from .io_utils import get_printer
from .run_results import ResultsMixin
from .timeline_processor import TimelineProcessor


# noinspection PyUnusedLocal
def after_run(
    results: list[dict[str, Any]],
    error: BaseException | None,
    temp_dir: Path,
    output_file: str | Path | None,
    flow_name: str,
    waldiez_file: Path,
    uploads_root: Path | None = None,
    skip_mmd: bool = False,
    skip_timeline: bool = False,
) -> Path | None:
    """Actions to perform after running the flow.

    Parameters
    ----------
    results : list[dict[str, Any]]
        The results of the flow run.
    error : BaseException | None
        Optional error during the run.
    temp_dir : Path
        The temporary directory.
    output_file : str | Path | None, optional
        The output file.
    flow_name : str
        The flow name.
    waldiez_file : Path
        The path of the waldiez file used (or dumped) for the run.
    uploads_root : Path | None, optional
        The runtime uploads root, by default None
    skip_mmd : bool, optional
        Whether to skip the mermaid sequence diagram generation,
        by default, False
    skip_timeline : bool, optional
        Whether to skip the timeline processing, by default False

    Returns
    -------
    Path | None
        The destination directory if output file, else None
    """
    if isinstance(output_file, str):
        output_file = Path(output_file)
    mmd_dir = output_file.parent if output_file else Path.cwd()
    _ensure_db_outputs(temp_dir)
    if error is not None:
        _ensure_error_json(temp_dir, error)
    else:
        ResultsMixin.ensure_results_json(temp_dir, results)
    if skip_mmd is False:
        _make_mermaid_diagram(
            temp_dir=temp_dir,
            output_file=output_file,
            flow_name=flow_name,
            mmd_dir=mmd_dir,
        )
    if skip_timeline is False:  # pragma: no branch
        _make_timeline_json(temp_dir=temp_dir)
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
        dst_waldiez = destination_dir / waldiez_file.name
        if not dst_waldiez.exists() and waldiez_file.is_file():
            shutil.copyfile(waldiez_file, dst_waldiez)
        return destination_dir
    shutil.rmtree(temp_dir)
    return None


async def a_after_run(
    results: list[dict[str, Any]],
    error: BaseException | None,
    temp_dir: Path,
    output_file: str | Path | None,
    flow_name: str,
    waldiez_file: Path,
    uploads_root: Path | None = None,
    skip_mmd: bool = False,
    skip_timeline: bool = False,
) -> Path | None:
    """Actions to perform after running the flow.

    Parameters
    ----------
    results : list[dict[str, Any]]
        The results of the flow run.
    error : BaseException | None
        Optional error during the run.
    temp_dir : Path
        The temporary directory.
    output_file : output_file : str | Path | None, optional
        The output file.
    flow_name : str
        The flow name.
    waldiez_file : Path
        The path of the waldiez file used (or dumped) for the run.
    uploads_root :  Path | None, optional
        The runtime uploads root, by default None
    skip_mmd : bool, optional
        Whether to skip the mermaid sequence diagram generation,
        by default, False
    skip_timeline : bool, optional
        Whether to skip the timeline processing, by default False

    Returns
    -------
    Path | None
        The destination directory if output file, else None
    """
    return await anyio.to_thread.run_sync(
        after_run,
        results,
        error,
        temp_dir,
        output_file,
        flow_name,
        waldiez_file,
        uploads_root,
        skip_mmd,
        skip_timeline,
    )


# noinspection PyBroadException
def _make_mermaid_diagram(
    temp_dir: Path,
    output_file: str | Path | None,
    flow_name: str,
    mmd_dir: Path,
) -> None:
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
            except BaseException:
                pass


# noinspection PyBroadException
def _make_timeline_json(
    temp_dir: Path,
) -> None:
    """Make the timeline JSON file."""
    events_csv_path = temp_dir / "logs" / "events.csv"
    if events_csv_path.exists():
        log_files = TimelineProcessor.get_files(temp_dir / "logs")
        if any(log_files.values()):  # pragma: no branch
            output_file = temp_dir / "timeline.json"
            # pylint: disable=too-many-try-statements
            try:
                processor = TimelineProcessor()
                processor.load_csv_files(
                    agents_file=log_files["agents"],
                    chat_file=log_files["chat"],
                    events_file=log_files["events"],
                    functions_file=log_files["functions"],
                )
                results = processor.process_timeline()
                with open(
                    output_file, "w", encoding="utf-8", newline="\n"
                ) as f:
                    json.dump(results, f, indent=2, default=str)
                short_results = TimelineProcessor.get_short_results(results)
                printer = get_printer()
                printer(
                    json.dumps(
                        {"type": "timeline", "content": short_results},
                        default=str,
                    ),
                    flush=True,
                )
            except BaseException:
                pass


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
            or item.name.endswith((".pyc", ".pyo", ".pyd"))
            or item.name == ".cache"
            or item.name == ".env"
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
        if output_file.suffix == ".py":  # pragma: no branch
            src = temp_dir / output_file.name
            if src.exists():
                dst = destination_dir / output_file.name
                if dst.exists():
                    dst.unlink()
                shutil.copyfile(src, output_dir / output_file.name)


def get_sqlite_out(dbname: str, table: str, csv_file: str) -> None:
    """Convert a sqlite table to csv and json files.

    Parameters
    ----------
    dbname : str
        The sqlite database name.
    table : str
        The table name.
    csv_file : str
        The csv file name.
    """
    conn = sqlite3.connect(dbname)
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = conn.execute(query)
    except BaseException:
        conn.close()
        return
    rows = cursor.fetchall()
    column_names = [description[0] for description in cursor.description]
    data = [dict(zip(column_names, row, strict=True)) for row in rows]
    conn.close()
    with open(csv_file, "w", newline="", encoding="utf-8") as file:
        csv_writer = csv.DictWriter(file, fieldnames=column_names)
        csv_writer.writeheader()
        csv_writer.writerows(data)
    json_file = csv_file.replace(".csv", ".json")
    with open(json_file, "w", encoding="utf-8", newline="\n") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


def _ensure_db_outputs(output_dir: Path) -> None:
    """Ensure the csv and json files are generated if a flow.db exists."""
    flow_db = output_dir / "flow.db"
    if not flow_db.is_file():
        return
    tables = [
        "chat_completions",
        "agents",
        "oai_wrappers",
        "oai_clients",
        "version",
        "events",
        "function_calls",
    ]
    dest = output_dir / "logs"
    dest.mkdir(parents=True, exist_ok=True)
    for table in tables:
        table_csv = dest / f"{table}.csv"
        table_json = dest / f"{table}.json"
        if not table_csv.exists() or not table_json.exists():
            get_sqlite_out(str(flow_db), table, str(table_csv))


def _ensure_error_json(output_dir: Path, error: BaseException) -> None:
    """Ensure an error.json exists in the output."""
    existing = output_dir / "error.json"
    if not existing.exists():
        with open(existing, "w", encoding="utf-8", newline="\n") as file:
            file.write(json.dumps({"error": str(error)}))
