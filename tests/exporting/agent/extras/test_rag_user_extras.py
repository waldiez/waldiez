# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa
# pylint: disable=line-too-long
"""Test waldiez.exporting.agents.extras.captain_agent_extras."""

import shutil
from pathlib import Path

from waldiez.exporting.agent import AgentExporter

from ..common import create_agent


def test_export_rag_user_agent(tmp_path: Path) -> None:
    """Test exporting a rag user agent.

    Parameters
    ----------
    tmp_path : Path
        Temporary path for the output directory.
    """
    agent, tools, models = create_agent(1, "rag_user_proxy")
    output_dir = tmp_path / "test_rag_user_agent_exporter"
    output_dir.mkdir(exist_ok=True)
    model_names = {model.id: model.name for model in models}
    # noinspection PyTypeChecker
    exporter = AgentExporter(
        agent=agent,
        agent_names={agent.id: agent.name},
        chats=([], {}),
        tool_names={tool.id: tool.name for tool in tools},
        models=(models, model_names),
        cache_seed=None,
        for_notebook=False,
        initial_chats=[],
        group_chat_members=[],
        arguments_resolver=lambda _agent: [
            "    llm_config='model-config'",
        ],
        output_dir=output_dir,
        is_async=False,
    )
    result = exporter.export()
    tab = "    "
    expected = (
        f"{agent.name} = RetrieveUserProxyAgent(\n"
        f'{tab}name="{agent.name}",'
        "\n"
        f'{tab}description="{agent.description}",'
        "\n"
        f'{tab}system_message="system message of agent 1",'
        "\n"
        f'{tab}human_input_mode="ALWAYS",'
        "\n"
        f"{tab}max_consecutive_auto_reply=None,"
        "\n"
        f'{tab}default_auto_reply="",'
        "\n"
        f"{tab}code_execution_config=False,"
        "\n"
        f"{tab}is_termination_msg=None,"
        "\n"
        f"{tab}retrieve_config={{"
        "\n"
        f'{tab}{tab}"task": "default",'
        "\n"
        f'{tab}{tab}"model": "all-MiniLM-L6-v2",'
        "\n"
        f'{tab}{tab}"customized_answer_prefix": "",'
        "\n"
        f'{tab}{tab}"new_docs": True,'
        "\n"
        f'{tab}{tab}"update_context": True,'
        "\n"
        f'{tab}{tab}"get_or_create": False,'
        "\n"
        f'{tab}{tab}"overwrite": False,'
        "\n"
        f'{tab}{tab}"recursive": True,'
        "\n"
        f'{tab}{tab}"chunk_mode": "multi_lines",'
        "\n"
        f'{tab}{tab}"must_break_at_empty_line": True,'
        "\n"
        f'{tab}{tab}"collection_name": "autogen-docs",'
        "\n"
        f'{tab}{tab}"distance_threshold": -1,'
        "\n"
        f'{tab}{tab}"vector_db": ChromaVectorDB('
        "\n"
        f"{tab}{tab}{tab}client={agent.name}_client,"
        "\n"
        f"{tab}{tab}{tab}embedding_function=agent1_embedding_function,"
        "\n"
        f"{tab}{tab}),"
        "\n"
        f'{tab}{tab}"client": {agent.name}_client,'
        "\n"
        f"{tab}}},"
        "\n"
        f"{tab}llm_config='model-config'"
        "\n)"
    )
    assert result.main_content == expected
    shutil.rmtree(output_dir)
    import_statements = [item.statement for item in result.imports]
    expected_imports = [
        "from autogen import register_function",
        "import chromadb",
        "from chromadb.utils.embedding_functions.sentence_transformer_embedding_function import SentenceTransformerEmbeddingFunction",
        "from autogen.agentchat.contrib.retrieve_user_proxy_agent import RetrieveUserProxyAgent",
        "import autogen",
        "from autogen.agentchat.contrib.vectordb.chromadb import ChromaVectorDB",
        "from chromadb.config import Settings",
    ]
    assert set(import_statements) == set(expected_imports)
    expected_before = (
        "\n"
        f"{agent.name}_client = chromadb.Client(Settings(anonymized_telemetry=False))"
        "\n"
        f"{agent.name}_embedding_function = SentenceTransformerEmbeddingFunction(\n"
        f'    model_name="all-MiniLM-L6-v2",\n'
        ")\n"
        "try:\n"
        f"{tab}{agent.name}_client.get_collection(\n"
        f'{tab}{tab}"autogen-docs",\n'
        f"{tab}{tab}embedding_function={agent.name}_embedding_function,\n"
        f"{tab})\n"
        "except ValueError:\n"
        f"{tab}{agent.name}_client.create_collection(\n"
        f'{tab}{tab}"autogen-docs",\n'
        f"{tab}{tab}embedding_function={agent.name}_embedding_function,\n"
        f"{tab})"
    )
    assert exporter.extras.before_agent == expected_before
