# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa
"""Test waldiez.exporting.agent.AgentExporter."""

import shutil
from pathlib import Path

from waldiez.exporting import AgentExporter

from .common import create_agent


def test_export_rag_user() -> None:
    """Test exporting a RAG user agent."""
    output_dir = Path("test_rag_user_exporter")
    output_dir.mkdir(exist_ok=True)
    agent, tools, models = create_agent(1, "rag_user_proxy")
    model_names = {model.id: model.name for model in models}
    exporter = AgentExporter(
        agent=agent,
        agent_names={agent.id: agent.name},
        models=(models, model_names),
        tool_names={tool.id: tool.name for tool in tools},
        chats=([], {}),
        is_async=False,
        cache_seed=None,
        for_notebook=False,
        group_chat_members=[],
        initial_chats=[],
        arguments_resolver=lambda _agent: [
            "    llm_config='model-config'",
        ],
        output_dir=output_dir,
    )
    output = exporter.export()
    assert output["imports"]
    imports = [x[0] for x in output["imports"]]
    # pylint: disable=line-too-long
    assert (
        "from autogen.agentchat.contrib.retrieve_user_proxy_agent import RetrieveUserProxyAgent"
        in imports
    )
    assert (
        "from autogen.agentchat.contrib.vectordb.chromadb import ChromaVectorDB"
        in imports
    )
    assert (
        "from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction"
        in imports
    )
    content = output["content"]
    tab = "    "
    assert content == (
        f"{agent.name} = RetrieveUserProxyAgent(\n"
        f'{tab}name="{agent.name}",' + "\n"
        f'{tab}description="{agent.description}",' + "\n"
        f'{tab}system_message="system message of agent 1",' + "\n"
        f'{tab}human_input_mode="ALWAYS",' + "\n"
        f"{tab}max_consecutive_auto_reply=None," + "\n"
        f'{tab}default_auto_reply="",' + "\n"
        f"{tab}code_execution_config=False," + "\n"
        f"{tab}is_termination_msg=None,  # pyright: ignore" + "\n"
        f"{tab}retrieve_config={{" + "\n"
        f'{tab}{tab}"task": "default",' + "\n"
        f'{tab}{tab}"model": "all-MiniLM-L6-v2",' + "\n"
        f'{tab}{tab}"customized_answer_prefix": "",' + "\n"
        f'{tab}{tab}"new_docs": True,' + "\n"
        f'{tab}{tab}"update_context": True,' + "\n"
        f'{tab}{tab}"get_or_create": False,' + "\n"
        f'{tab}{tab}"overwrite": False,' + "\n"
        f'{tab}{tab}"recursive": True,' + "\n"
        f'{tab}{tab}"chunk_mode": "multi_lines",' + "\n"
        f'{tab}{tab}"must_break_at_empty_line": True,' + "\n"
        f'{tab}{tab}"collection_name": "autogen-docs",' + "\n"
        f'{tab}{tab}"distance_threshold": -1,' + "\n"
        f'{tab}{tab}"vector_db": ChromaVectorDB(' + "\n"
        f"{tab}{tab}{tab}client={agent.name}_client," + "\n"
        f'{tab}{tab}{tab}embedding_function=SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2"),'
        + "\n"
        f"{tab}{tab})," + "\n"
        f'{tab}{tab}"client": {agent.name}_client,' + "\n"
        f"{tab}}}," + "\n"
        f"{tab}llm_config='model-config'" + "\n"
        ")"
    )
    before_export = output["before_export"]
    assert before_export
    assert before_export[0][0] == (
        "\n"
        + f"{agent.name}_client = chromadb.Client(Settings(anonymized_telemetry=False))"
        + "\n"
        "try:\n"
        f'{tab}{agent.name}_client.get_collection("autogen-docs")' + "\n"
        "except ValueError:\n"
        f'{tab}{agent.name}_client.create_collection("autogen-docs")' + "\n"
    )
    after_export = output["after_export"]
    assert not after_export
    shutil.rmtree(output_dir)
