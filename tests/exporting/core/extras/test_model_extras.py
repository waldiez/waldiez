# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Test waldiez.exporting.core.extras.model_extras."""

from pathlib import Path

from waldiez.exporting.core.extras.model_extras import ModelExtras
from waldiez.exporting.core.result import ExportResult


def test_model_extras_content_contribution(tmp_path: Path) -> None:
    """Test the contribution of ModelExtras to ExportResult.

    Parameters
    ----------
    tmp_path : Path
        Temporary path for testing configuration file creation.
    """
    extras = ModelExtras(
        instance_id="test_instance",
        llm_config={"content": '{"a": 1}'},
        config_file_path=str(tmp_path / "config.yaml"),
    )
    result = ExportResult()
    # pylint: disable=protected-access
    extras._contribute_specific_content(result)
    found = [c.content for c in result.positioned_content]
    assert any("a" in item for item in found)
