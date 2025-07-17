# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.agents.extras.doc_agent_extras.*."""

from pathlib import Path

from waldiez.exporting.agent import AgentExporter, create_agent_exporter

# from waldiez.models import WaldiezDocAgent
from ..common import create_agent


def test_export_doc_agent(tmp_path: Path) -> None:
    """Test exporting a doc agent.

    Parameters
    ----------
    tmp_path : Path
        Temporary path for the output directory.
    """
    agent, tools, models = create_agent(1, "doc_agent")
    output_dir = tmp_path / "test_doc_agent_exporter"
    output_dir.mkdir(exist_ok=True)
    models_and_names = (models, {model.id: model.name for model in models})
    exporter = AgentExporter(
        agent=agent,
        tools=tools,
        models=models_and_names,
        output_dir=output_dir,
        tool_names={tool.id: tool.name for tool in tools},
        agent_names={agent.id: agent.name},
        chats=([], {}),
    )
    result = exporter.export()
    assert result
    assert result.main_content
    assert "query_engine=" in result.main_content

    exporter = create_agent_exporter(
        agent=agent,
        tools=tools,
        models=models_and_names,
        output_dir=output_dir,
        tool_names={tool.id: tool.name for tool in tools},
        agent_names={agent.id: agent.name},
        chats=([], {}),
        initial_chats=[],
    )
    result = exporter.export()
    assert result
    assert result.main_content
    assert "query_engine=" in result.main_content
