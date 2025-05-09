# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.waldiez.*."""

import os
from pathlib import Path

import pytest
from autogen.version import __version__ as ag2_version  # type: ignore

from waldiez import Waldiez

from .exporting.flow.flow_helpers import get_flow


def test_waldiez(tmp_path: Path) -> None:
    """Test Waldiez with retrievechat requirement.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    """
    flow = get_flow()
    waldiez = Waldiez(flow=flow)
    assert waldiez.name == flow.name

    flow_dump = waldiez.model_dump_json(by_alias=True)
    # pylint: disable=consider-using-with
    file_path = os.path.join(tmp_path, "test_waldiez.waldiez")
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(flow_dump)
    waldiez2 = Waldiez.load(file_path)
    os.remove(file_path)
    assert waldiez2.name == flow.name
    assert waldiez2.description == flow.description
    assert waldiez2.tags == flow.tags
    assert next(waldiez2.models)
    assert waldiez2.has_rag_agents
    assert waldiez.is_single_agent_mode is False
    tool = next(waldiez2.tools)
    assert f"ag2[openai]=={ag2_version}" in waldiez2.requirements
    assert "chromadb>=0.5.23" in waldiez2.requirements
    assert "TOOL_KEY" in tool.secrets
    assert "TOOL_KEY" == waldiez2.get_flow_env_vars()[0][0]
    assert waldiez2.chats


def test_waldiez_errors(tmp_path: Path) -> None:
    """Test Waldiez errors.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    """
    with pytest.raises(ValueError):
        Waldiez.load("non_existent_file")

    with pytest.raises(ValueError):
        Waldiez.from_dict(
            name="flow",
            description="flow description",
            tags=["tag"],
            requirements=["requirement"],
            data={"type": "flow", "data": {}},
        )

    with pytest.raises(ValueError):
        Waldiez.from_dict(
            data={"type": "flow", "data": {}},
        )

    with pytest.raises(ValueError):
        Waldiez.from_dict(
            data={"type": "other", "data": {}},
        )

    file_path = os.path.join(tmp_path, "test_waldiez_errors.waldiez")
    with open(file_path, "w", encoding="utf-8") as file:
        file.write("invalid json")
    with pytest.raises(ValueError):
        Waldiez.load(file_path)
    os.remove(file_path)
