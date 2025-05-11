# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Extra requirements for agents."""

# pylint: disable=line-too-long
import platform
from typing import Iterator, Set

from .agent import WaldiezAgent
from .rag_user_proxy import WaldiezRagUserProxy


def get_retrievechat_extra_requirements(
    agents: Iterator[WaldiezAgent],
) -> Set[str]:
    """Get the retrievechat extra requirements.

    Parameters
    ----------
    agents : list[WaldiezAgent]
        The flow agents.

    Returns
    -------
    Set[str]
        The retrievechat extra requirements.
    """
    # https://github.com/ag2ai/ag2/blob/main/pyproject.toml
    # with chromadb relaxed
    # to avoid conflicts with other extras and (later) allow py3.13
    rag_requirements: Set[str] = {
        "protobuf==4.25.3",
        "chromadb>=0.5.23",
        "sentence_transformers",
        "pypdf",
        "ipython",
        "beautifulsoup4",
        "markdownify",
    }
    for agent in agents:
        if agent.agent_type == "rag_user_proxy" and isinstance(
            agent, WaldiezRagUserProxy
        ):
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
        "pandas",
        "scipy",
        # "sentence-transformers", also in agent_requirements
    ]
    agent_requirements = [
        "chromadb",
        "sentence-transformers",
        "huggingface-hub",
    ]
    if platform.system() == "Linux":
        agent_requirements.append("pysqlite3-binary")
    # on windows and OSX, installing pysqlite3-binary seem to fail in some cases
    # we can handle/install if needed in waldiez.utils.pysqlite3_checker
    return tool_requirements + agent_requirements
