# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test WaldiezExporter."""

import uuid
from pathlib import Path

import pytest

from waldiez import Waldiez, WaldiezExporter
from waldiez.models import WaldiezFlow

from .exporting.flow.flow_helpers import get_flow


def test_export_load_from_file(
    tmp_path: Path, waldiez_flow: WaldiezFlow
) -> None:
    """Test exporting and loading from file.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    exporter.export(str(output_file))
    assert output_file.exists()
    WaldiezExporter.load(output_file)
    output_file.unlink(missing_ok=True)


def test_exporter_load_invalid_path() -> None:
    """Test exporter load invalid path."""
    with pytest.raises(ValueError):
        WaldiezExporter.load(Path("non_existent_file"))


def test_exporter_use_directory(
    tmp_path: Path, waldiez_flow: WaldiezFlow
) -> None:
    """Test exporter use directory.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_dir = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    output_dir.mkdir()
    with pytest.raises(IsADirectoryError):
        exporter.export(output_dir)
    output_dir.rmdir()


def test_exporter_file_exists(
    tmp_path: Path, waldiez_flow: WaldiezFlow
) -> None:
    """Test exporter file exists.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    output_file.touch()
    with pytest.raises(FileExistsError):
        exporter.export(output_file)
    exporter.export(output_file, force=True)
    output_file.unlink(missing_ok=True)


def test_exporter_force(tmp_path: Path, waldiez_flow: WaldiezFlow) -> None:
    """Test exporter force.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    output_file.touch()
    exporter.export(output_file, force=True)
    output_file.unlink(missing_ok=True)


def test_export_to_py(tmp_path: Path, waldiez_flow: WaldiezFlow) -> None:
    """Test exporting to Python.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.py"
    exporter.export(output_file)
    assert output_file.exists()
    output_file.unlink(missing_ok=True)


def test_export_to_ipynb(tmp_path: Path, waldiez_flow: WaldiezFlow) -> None:
    """Test exporting to Jupyter Notebook.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.ipynb"
    exporter.export(output_file)
    assert output_file.exists()
    output_file.unlink(missing_ok=True)


def test_export_to_waldiez(tmp_path: Path, waldiez_flow: WaldiezFlow) -> None:
    """Test exporting to Waldiez file.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    exporter.export(output_file)
    assert output_file.exists()
    output_file.unlink(missing_ok=True)


def test_export_to_invalid_extension(
    tmp_path: Path, waldiez_flow: WaldiezFlow
) -> None:
    """Test exporting to invalid extension.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.invalid"
    with pytest.raises(ValueError):
        exporter.export(output_file)


def test_export_complex_flow(tmp_path: Path) -> None:
    """Test exporting invalid flow.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    """
    flow = get_flow()
    waldiez = Waldiez(flow=flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.py"
    exporter.export(output_file)
    assert output_file.exists()
    output_file.unlink()
