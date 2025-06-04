# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.waldiez.*."""

import json
import os
from pathlib import Path

import pytest
from autogen.version import __version__ as ag2_version  # type: ignore

from waldiez import Waldiez
from waldiez.models import WaldiezFlow

from ..exporting.flow_helpers import get_flow


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
    flow_dump2 = waldiez2.model_dump_json(by_alias=True)
    flow_dump3 = json.loads(flow_dump2)
    assert flow_dump == flow_dump2
    waldiez3 = Waldiez.from_dict(
        name=waldiez2.name,
        description=waldiez2.description,
        tags=waldiez2.tags,
        requirements=waldiez2.requirements,
        data=flow_dump3,
    )
    os.remove(file_path)
    assert waldiez3.id == flow.id
    assert waldiez3.name == flow.name
    assert waldiez3.description == flow.description
    assert waldiez3.tags == flow.tags
    assert waldiez3.requirements == waldiez2.requirements
    assert waldiez3.is_async == flow.is_async
    assert waldiez3.cache_seed == flow.cache_seed
    assert next(waldiez3.models)
    assert waldiez3.has_rag_agents
    assert waldiez3.is_single_agent_mode is False
    tool = next(waldiez3.tools)
    assert f"ag2[openai]=={ag2_version}" in waldiez3.requirements
    assert "chromadb>=0.5.23" in waldiez3.requirements
    assert "TOOL_KEY" in tool.secrets
    assert "TOOL_KEY" == waldiez3.get_flow_env_vars()[0][0]
    assert waldiez3.initial_chats
    agent1 = next(waldiez3.agents)
    assert not agent1.is_group_manager
    assert not waldiez3.get_group_chat_members(agent1)


def test_waldiez_group() -> None:
    """Test Waldiez with group chat."""
    flow = get_flow(is_group=True, is_pattern_based=True)
    waldiez = Waldiez(flow=flow)
    assert waldiez.name == flow.name
    root_group_manager = waldiez.get_root_group_manager()
    assert root_group_manager
    assert waldiez.get_group_chat_members(root_group_manager)


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

    with pytest.raises(ValueError):
        waldiez = Waldiez(WaldiezFlow.default())
        waldiez.get_root_group_manager()
