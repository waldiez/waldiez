# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
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
    agent.data.model_ids = [models[0].id]
    output_dir = tmp_path / "test_doc_agent_exporter"
    output_dir.mkdir(exist_ok=True)
    models_and_names = (models, {model.id: model.name for model in models})
    exporter = AgentExporter(
        agent=agent,
        all_agents=[agent],
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
    assert any(
        import_statement.statement
        == (
            "from llama_index.embeddings.huggingface "
            "import HuggingFaceEmbedding"
        )
        for import_statement in result.imports
    )
    content = "\n".join(
        item.content for item in result.positioned_content
    )
    assert "Settings.embed_model = HuggingFaceEmbedding(" in content
    assert (
        content.index("Settings.embed_model = HuggingFaceEmbedding(")
        < content.index("VectorChromaQueryEngine(")
    )

    exporter = create_agent_exporter(
        agent=agent,
        all_agents=[agent],
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
    content = "\n".join(
        item.content for item in result.positioned_content
    )
    assert "Settings.embed_model = HuggingFaceEmbedding(" in content
