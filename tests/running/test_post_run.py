# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.running.post_run.*."""

from pathlib import Path

from waldiez.running.post_run import after_run


def test_after_run(tmp_path: Path) -> None:
    """Test after_run.

    Parameters
    ----------
    tmp_path : Path
        The temporary path.
    """
    flow_name = "flow_name"
    tmp_dir = tmp_path / "test_after_run"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    output_file = str(tmp_path / "output_path" / "output.py")
    waldiez_file = tmp_path / "output_path" / "output.waldiez"

    after_run(
        temp_dir=tmp_dir,
        output_file=output_file,
        flow_name=flow_name,
        waldiez_file=waldiez_file,
        uploads_root=None,
        skip_mmd=False,
    )

    logs_dir = tmp_dir / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    event_csv = logs_dir / "events.csv"
    with open(event_csv, "w", encoding="utf-8", newline="\n") as file:
        # pylint: disable=line-too-long
        file.write(
            "event_name,source_id,source_name,agent_module,agent_class_name,id,json_state,timestamp\n"  # noqa: E501
            "start,source_id,source_name,agent_module,agent_class_name,id,{},000000000\n"  # noqa: E501
        )

    after_run(
        temp_dir=tmp_dir,
        output_file=output_file,
        flow_name=flow_name,
        waldiez_file=waldiez_file,
        skip_mmd=False,
        uploads_root=None,
    )

    tmp_dir.mkdir(parents=True, exist_ok=True)
    after_run(
        temp_dir=tmp_dir,
        output_file=None,
        flow_name=flow_name,
        waldiez_file=waldiez_file,
        uploads_root=None,
        skip_mmd=True,
    )
