# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Extra requirements for agents."""
# pylint: disable=line-too-long

from typing import Set

from .agent import WaldiezAgent
from .rag_user_proxy import WaldiezRagUserProxy


def get_retrievechat_extra_requirements(
    agents: list[WaldiezAgent],
) -> set[str]:
    """Get the retrievechat extra requirements.

    Parameters
    ----------
    agents : list[WaldiezAgent]
        The flow agents.

    Returns
    -------
    set[str]
        The retrievechat extra requirements.
    """
    # https://github.com/ag2ai/ag2/blob/main/pyproject.toml
    # with chromadb and sentence_transdormers relaxed
    rag_requirements: Set[str] = {
        "protobuf==5.29.3",
        "chromadb>=0.5.23",
        "sentence_transformers",
        "pypdf",
        "ipython",
        "beautifulsoup4",
        "markdownify",
    }
    for agent in agents:
        if agent.is_rag_user and isinstance(agent, WaldiezRagUserProxy):
            # if not chroma, get the relevant db requirements
            db_type = agent.data.retrieve_config.vector_db
            if db_type == "pgvector":
                rag_requirements.update(
                    [
                        "pgvector>=0.2.5",
                        "psycopg[binary]>=3.2.4",
                    ]
                )
            elif db_type == "mongodb":
                rag_requirements.add("pymongo>=4.11")
            elif db_type == "qdrant":
                rag_requirements.update(["qdrant_client[fastembed]"])
    return rag_requirements


def get_captain_agent_extra_requirements() -> list[str]:
    """Get the captain agent extra requirements.

    Returns
    -------
    list[str]
        The captain agent extra requirements.
    """
    # https://github.com/ag2ai/ag2/blob/main/autogen/agentchat/contrib/captainagent/tools/requirements.txt  # noqa: E501
    tool_requirements = [
        "markdownify",
        "arxiv",
        "pymupdf",
        "wikipedia-api",
        "easyocr",
        "python-pptx",
        "openai-whisper",
        "scipy",
        # "pandas", also in agent_requirements below
        # "sentence-transformers", also in agent_requirements below
    ]
    agent_requirements = [
        "pandas",
        "chromadb",
        "sentence-transformers",
        "huggingface-hub",
    ]
    return tool_requirements + agent_requirements
