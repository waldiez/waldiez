# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.flow.flow_exporter."""

import shutil
from pathlib import Path

import jupytext  # type: ignore[import-untyped]
from waldiez.exporting.flow.flow_exporter import FlowExporter

from waldiez.models import Waldiez

from .flow_helpers import get_flow

MY_DIR = Path(__file__).resolve().parent
ROOT_DIR = MY_DIR.parent.parent.parent
DOT_LOCAL = ROOT_DIR / ".local"
DOT_LOCAL.mkdir(exist_ok=True, parents=True)


def _export_flow(tmp_path: Path, is_async: bool, extension: str = "py") -> None:
    """Export flow to py.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    is_async : bool
        Whether the flow is async.
    """
    sync_mode = "async" if is_async else "sync"
    output_dir = tmp_path / f"test_export_flow_{extension}_{sync_mode}"
    if output_dir.exists():
        shutil.rmtree(output_dir, ignore_errors=True)
    output_dir.mkdir(exist_ok=True)
    flow = get_flow(is_async=is_async)
    waldiez = Waldiez(flow=flow)
    exporter = FlowExporter(
        waldiez,
        for_notebook=extension == "ipynb",
        output_dir=output_dir,
    )
    result = exporter.export()
    assert result["content"] is not None
    destination_dir = DOT_LOCAL / output_dir.name
    destination_path = destination_dir / f"flow.{extension}"
    shutil.rmtree(destination_dir, ignore_errors=True)
    shutil.copytree(output_dir, destination_dir)
    if extension == "ipynb":
        destination_path = destination_dir / f"flow.{extension}.tmp.py"
    destination_path.write_text(result["content"])
    if extension == "ipynb":
        destination_ipynb = DOT_LOCAL / output_dir.name / "flow.ipynb"
        with open(destination_path, "r", encoding="utf-8") as py_out:
            content = jupytext.read(py_out, fmt="py:light")
        jupytext.write(content, str(destination_ipynb), fmt="ipynb")
        destination_path.unlink(missing_ok=True)


def test_flow_exporter_to_py_sync(tmp_path: Path) -> None:
    """Test FlowExporter export to py.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(tmp_path, is_async=False)


def test_flow_exporter_to_py_async(tmp_path: Path) -> None:
    """Test FlowExporter export to async py.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(tmp_path, is_async=True)


def test_flow_export_sync_to_ipynb(tmp_path: Path) -> None:
    """Test FlowExporter export to ipynb.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(tmp_path, is_async=False, extension="ipynb")


def test_flow_export_async_to_ipynb(tmp_path: Path) -> None:
    """Test FlowExporter export to async ipynb.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(tmp_path, is_async=True, extension="ipynb")
