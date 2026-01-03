# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Test waldiez.agents.extra_requirements."""

from waldiez.models.agents import (
    WaldiezAgent,
    WaldiezRagUserProxy,
    get_captain_agent_extra_requirements,
    get_retrievechat_extra_requirements,
)


def test_get_retrievechat_extra_requirements() -> None:
    """Test get_retrievechat_extra_requirements."""
    agents_list: list[WaldiezAgent] = [
        WaldiezRagUserProxy(
            id="wa-1",
            name="rag_user",
            data={  # type: ignore
                "retrieve_config": {
                    "vector_db": "pgvector",
                },
            },
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
        ),
        WaldiezRagUserProxy(
            id="wa-2",
            name="rag_user",
            data={  # type: ignore
                "retrieve_config": {
                    "vector_db": "mongodb",
                },
            },
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
        ),
        WaldiezRagUserProxy(
            id="wa-3",
            name="rag_user",
            data={  # type: ignore
                "retrieve_config": {
                    "vector_db": "qdrant",
                },
            },
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
        ),
        WaldiezRagUserProxy(
            id="wa-4",
            name="rag_user",
            data={  # type: ignore
                "retrieve_config": {
                    "vector_db": "chroma",
                },
            },
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
        ),
    ]
    expected_packages = [
        "protobuf==5.29.3",
        "chromadb>=0.5.23",
        "sentence_transformers",
        "pypdf",
        "ipython",
        "beautifulsoup4",
        "markdownify",
        "pgvector>=0.2.5",
        "psycopg[binary]>=3.2.4",
        "pymongo>=4.11",
        "qdrant_client[fastembed]",
    ]
    rag_requirements = get_retrievechat_extra_requirements(agents_list)
    for package in expected_packages:
        assert package in rag_requirements


def test_get_captain_agent_extra_requirements() -> None:
    """Test get_captain_agent_extra_requirements."""
    expected_packages = [
        "markdownify",
        "arxiv",
        "pymupdf",
        "wikipedia-api",
        "easyocr",
        "python-pptx",
        "openai-whisper",
        "pandas",
        "scipy",
        "sentence-transformers",
        "huggingface-hub",
        "chromadb",
    ]
    captain_agent_requirements = get_captain_agent_extra_requirements()
    for package in expected_packages:
        assert package in captain_agent_requirements
