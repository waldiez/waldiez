# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pyright: reportMissingTypeStubs=false, reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
"""Test waldiez.exporting.flow.flow_exporter."""

import shutil
from pathlib import Path

import jupytext  # type: ignore[import-untyped]
from jupytext.config import (  # type: ignore[import-untyped]
    JupytextConfiguration,
)

from waldiez.exporting import FlowExporter, create_flow_exporter
from waldiez.models import Waldiez

from ..flow_helpers import get_flow

MY_DIR = Path(__file__).resolve().parent
ROOT_DIR = MY_DIR.parent.parent.parent
DOT_LOCAL = ROOT_DIR / ".local"
DOT_LOCAL.mkdir(exist_ok=True, parents=True)


# pylint: disable=too-many-locals
def _export_flow(
    tmp_path: Path,
    is_async: bool,
    is_group: bool = False,
    is_pattern_based: bool = False,
    extension: str = "py",
) -> None:
    """Export flow to py.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    is_async : bool
        Whether the flow is async.
    """
    sync_mode = "async" if is_async else "sync"
    output_dir_name = f"test_export_flow_{extension}_{sync_mode}"
    if is_group:
        output_dir_name += "_group"
    if is_pattern_based:
        output_dir_name += "_pattern"
    output_dir = tmp_path / output_dir_name
    if output_dir.exists():
        shutil.rmtree(output_dir, ignore_errors=True)
    output_dir.mkdir(exist_ok=True)
    flow = get_flow(
        is_async=is_async,
        is_group=is_group,
        is_pattern_based=is_pattern_based,
    )
    waldiez = Waldiez(flow=flow)
    for_notebook = extension == "ipynb"
    exporter = (
        FlowExporter(
            waldiez,
            for_notebook=for_notebook,
            output_dir=output_dir,
        )
        if extension == "py"
        else create_flow_exporter(
            waldiez,
            output_dir=output_dir,
            uploads_root=None,
            for_notebook=for_notebook,
            message=None,
            is_async=is_async,
        )
    )
    result = exporter.export()
    assert result.main_content is not None
    destination_dir = DOT_LOCAL / output_dir.name
    destination_path = destination_dir / f"flow.{extension}"
    shutil.rmtree(destination_dir, ignore_errors=True)
    shutil.copytree(output_dir, destination_dir)
    if extension == "ipynb":
        destination_path = destination_dir / f"flow.{extension}.tmp.py"
    destination_path.write_text(result.main_content, encoding="utf-8")
    if extension == "ipynb":
        destination_ipynb = DOT_LOCAL / output_dir.name / "flow.ipynb"
        config = JupytextConfiguration(
            comment_magics=False,
            hide_notebook_metadata=True,
            cell_metadata_filter="-all",
        )
        with open(destination_path, "r", encoding="utf-8") as py_out:
            jp_content = jupytext.read(
                py_out,
                fmt="py:percent",
                config=config,
            )
        jupytext.write(
            jp_content,
            destination_ipynb,
            fmt="ipynb",
            config=config,
        )
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


def test_flow_export_group_sync_to_py(tmp_path: Path) -> None:
    """Test FlowExporter export group flow to py.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(tmp_path, is_async=False, is_group=True)


def test_flow_export_group_async_to_py(tmp_path: Path) -> None:
    """Test FlowExporter export group flow to async py.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(tmp_path, is_async=True, is_group=True)


def test_flow_export_group_sync_to_ipynb(tmp_path: Path) -> None:
    """Test FlowExporter export group flow to ipynb.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(tmp_path, is_async=False, is_group=True, extension="ipynb")


def test_flow_export_group_async_to_ipynb(tmp_path: Path) -> None:
    """Test FlowExporter export group flow to async ipynb.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(tmp_path, is_async=True, is_group=True, extension="ipynb")


def test_flow_export_pattern_based_sync_to_py(tmp_path: Path) -> None:
    """Test FlowExporter export pattern-based flow to py.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(tmp_path, is_async=False, is_group=True, is_pattern_based=True)


def test_flow_export_pattern_based_async_to_py(tmp_path: Path) -> None:
    """Test FlowExporter export pattern-based flow to async py.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(tmp_path, is_async=True, is_group=True, is_pattern_based=True)


def test_flow_export_pattern_based_sync_to_ipynb(tmp_path: Path) -> None:
    """Test FlowExporter export pattern-based flow to ipynb.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(
        tmp_path,
        is_async=False,
        is_group=True,
        is_pattern_based=True,
        extension="ipynb",
    )


def test_flow_export_pattern_based_async_to_ipynb(tmp_path: Path) -> None:
    """Test FlowExporter export pattern-based flow to async ipynb.

    Parameters
    ----------
    tmp_path : Path
        Temporary directory.
    """
    _export_flow(
        tmp_path,
        is_async=True,
        is_group=True,
        is_pattern_based=True,
        extension="ipynb",
    )
