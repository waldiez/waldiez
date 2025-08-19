# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use,missing-param-doc,line-too-long
# flake8: noqa: E501
"""Test waldiez.models.model._llm module."""

import os
from unittest.mock import patch

import pytest

from waldiez.models.model import (
    WaldiezModel,
    WaldiezModelAPIType,
    WaldiezModelAWS,
    WaldiezModelData,
)
from waldiez.models.model._llm import (
    do_cohere_llm,
    do_deepseek_llm,
    do_google_llm,
    do_groq_llm,
    do_mistral_llm,
    do_nim_llm,
    do_openai_llm,
    do_together_llm,
    get_llm_arg,
    get_llm_imports,
    get_llm_requirements,
)


@pytest.mark.parametrize(
    "api_type, expected_requirements",
    [
        (
            "openai",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-llms-openai",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
            },
        ),
        (
            "anthropic",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-llms-anthropic",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
            },
        ),
        (
            "azure",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-llms-azure-openai",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
            },
        ),
        (
            "nim",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
                "llama-index-llms-nvidia",
                "llama-index-readers-file",
                "llama-index-embeddings-nvidia",
                "llama-index-postprocessor-nvidia-rerank",
            },
        ),
        (
            "bedrock",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
                "llama-index-llms-bedrock-converse",
            },
        ),
        (
            "deepseek",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
                "llama-index-llms-deepseek",
            },
        ),
        (
            "cohere",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
                "llama-index-llms-cohere",
                "llama-index-llms-openai",
            },
        ),
        (
            "google",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
                "llama-index-llms-google-genai",
                "llama-index-llms-gemini",
            },
        ),
        (
            "groq",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
                "llama-index-llms-groq",
            },
        ),
        (
            "mistral",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
                "llama-index-llms-mistralai",
            },
        ),
        (
            "together",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
                "llama-index-llms-together",
            },
        ),
        (
            "other",
            {
                # "ag2[rag]==0.1.0",
                "llama-index",
                "llama-index-core",
                "llama-index-embeddings-huggingface",
                "llama-index-vector-stores-chroma",
                "llama-index-llms-langchain",
                "llama-index-llms-openai-like",
            },
        ),
    ],
)
def test_get_llm_requirements(
    api_type: WaldiezModelAPIType, expected_requirements: set[str]
) -> None:
    """Test the get_llm_requirements function."""
    model = WaldiezModel(
        id="wm-1",
        name=f"{api_type}-model",
        description=f"{api_type} test model",
        data=WaldiezModelData(api_type=api_type),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    requirements = get_llm_requirements(model, ag2_version="0.1.0")
    assert requirements == expected_requirements


@pytest.mark.parametrize(
    "api_type, expected_imports",
    [
        ("openai", {"from llama_index.llms.openai import OpenAI"}),
        (
            "anthropic",
            {
                "from llama_index.llms.anthropic import Anthropic",
                "from llama_index.core import Settings",
            },
        ),
        ("azure", {"from llama_index.llms.azure_openai import AzureOpenAI"}),
        (
            "bedrock",
            {"from llama_index.llms.bedrock_converse import BedrockConverse"},
        ),
        ("cohere", {"from llama_index.llms.cohere import Cohere"}),
        ("deepseek", {"from llama_index.llms.deepseek import DeepSeek"}),
        ("google", {"from llama_index.llms.gemini import Gemini"}),
        ("groq", {"from llama_index.llms.groq import Groq"}),
        ("mistral", {"from llama_index.llms.mistralai import MistralAI"}),
        (
            "nim",
            {
                "from llama_index.core import Settings",
                "from llama_index.llms.nvidia import NVIDIA",
                "from llama_index.embeddings.nvidia import NVIDIAEmbedding",
            },
        ),
        ("together", {"from llama_index.llms.together import TogetherLLM"}),
        ("other", {"from llama_index.llms.openai_like import OpenAILike"}),
    ],
)
def test_get_llm_imports(
    api_type: WaldiezModelAPIType, expected_imports: set[str]
) -> None:
    """Test the get_llm_imports function."""
    model = WaldiezModel(
        id="wm-1",
        name=f"{api_type}-model",
        description=f"{api_type} test model",
        data=WaldiezModelData(api_type=api_type),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    imports = get_llm_imports(model)
    assert imports == expected_imports


@pytest.mark.parametrize(
    "api_type, expected_arg, expected_before",
    [
        ("openai", 'OpenAI(model="openai-model", temperature=0.0)', ""),
        (
            "anthropic",
            'Anthropic(model="anthropic-model")',
            "_tokenizer = Anthropic().tokenizer",
        ),
        ("deepseek", 'DeepSeek(model="deepseek-model")', ""),
        ("google", 'Gemini(model="google-model")', ""),
        ("groq", 'Groq(model="groq-model")', ""),
        ("mistral", 'MistralAI(model="mistral-model")', ""),
        ("together", 'TogetherLLM(model="together-model")', ""),
    ],
)
def test_get_llm_arg_simple_cases(
    api_type: WaldiezModelAPIType, expected_arg: str, expected_before: str
) -> None:
    """Test the get_llm_arg function."""
    model = WaldiezModel(
        id="wm-1",
        name=f"{api_type}-model",
        description=f"{api_type} test model",
        data=WaldiezModelData(api_type=api_type),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    arg, before = get_llm_arg(model)
    assert arg == expected_arg
    if expected_before:
        assert expected_before in before
    else:
        assert before == ""


def test_azure_llm_arg() -> None:
    """Test the Azure LLM argument extraction."""
    model = WaldiezModel(
        id="wm-1",
        name="gpt-4",
        description="Azure OpenAI GPT-4",
        data=WaldiezModelData(
            api_type="azure",
            temperature=0.5,
            base_url="https://example.openai.azure.com/",
            api_version="2023-07-01-preview",
            extras={"engine": "my-engine"},
        ),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    arg, before = get_llm_arg(model)
    assert 'engine="my-engine"' in arg
    assert 'model="gpt-4"' in arg
    assert "temperature=0.5" in arg
    assert 'azure_endpoint="https://example.openai.azure.com/"' in arg
    assert 'api_version="2023-07-01-preview"' in arg
    assert before == ""


@patch.dict(os.environ, {"AWS_PROFILE_NAME": "test-profile"})
def test_bedrock_llm_arg_with_env() -> None:
    """Test the Bedrock LLM argument extraction with environment variables."""
    model = WaldiezModel(
        id="wm-1",
        name="anthropic.claude-3-haiku-20240307-v1:0",
        description="Bedrock Claude",
        data=WaldiezModelData(api_type="bedrock"),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    arg, before = get_llm_arg(model)
    assert 'model="anthropic.claude-3-haiku-20240307-v1:0"' in arg
    assert 'profile_name="test-profile"' in arg
    assert before == ""


def test_bedrock_llm_arg_with_aws_config() -> None:
    """Test the Bedrock LLM argument extraction with AWS config."""
    model = WaldiezModel(
        id="wm-1",
        name="anthropic.claude-3-haiku-20240307-v1:0",
        description="Bedrock Claude",
        data=WaldiezModelData(
            api_type="bedrock",
            aws=WaldiezModelAWS(
                region="us-east-1",
                access_key="test-key",  # nosemgrep # nosec
                profile_name="custom-profile",
            ),
        ),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    arg, before = get_llm_arg(model)
    assert 'profile_name="custom-profile"' in arg
    assert 'aws_access_key_id="test-key"' in arg
    assert 'region_name="us-east-1"' in arg
    assert before == ""


def test_cohere_llm_arg_with_params() -> None:
    """Test the Cohere LLM argument extraction with parameters."""
    model = WaldiezModel(
        id="wm-1",
        name="command-r",
        description="Cohere Command R",
        data=WaldiezModelData(
            api_type="cohere",
            api_key="test-key",  # nosemgrep # nosec
            base_url="https://api.cohere.ai/v1",
            temperature=0.8,
        ),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    arg, before = get_llm_arg(model)
    assert 'model="command-r"' in arg
    assert 'api_key="test-key"' in arg
    assert 'base_url="https://api.cohere.ai/v1"' in arg
    assert "temperature=0.8" in arg
    assert before == ""


def test_nim_llm_before_content() -> None:
    """Test the NIM LLM before content extraction."""
    model = WaldiezModel(
        id="wm-1",
        name="meta/llama-3-70b-instruct",
        description="NVIDIA NIM Llama",
        data=WaldiezModelData(api_type="nim"),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    arg, before = get_llm_arg(model)
    assert arg == 'NVIDIA(model="meta/llama-3-70b-instruct")'
    assert "Settings.text_splitter = SentenceSplitter(chunk_size=500)" in before
    assert (
        'Settings.embed_model = NVIDIAEmbedding(model="NV-Embed-QA", truncate="END")'
        in before
    )


def test_other_llm_arg_with_params() -> None:
    """Test the Other LLM argument extraction with parameters."""
    model = WaldiezModel(
        id="wm-1",
        name="other-model",
        description="Other Model",
        data=WaldiezModelData(
            api_type="other",
            api_key="test-key",  # nosemgrep # nosec
            base_url="https://api.other.ai/v1",
            temperature=0.8,
            extras={
                "context_window": "1024",
                "max_retries": 5,
                "key": "value",
                "timeout": "30.0",
            },
        ),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    arg, before = get_llm_arg(model)
    assert 'model="other-model"' in arg
    assert 'api_key="test-key"' in arg
    assert 'api_base="https://api.other.ai/v1"' in arg
    assert "temperature=0.8" in arg
    assert "context_window=1024" in arg
    assert "max_retries=5" in arg
    assert "timeout=30.0" in arg
    assert 'key="value"' in arg
    assert before == ""


def test_do_openai_llm_with_no_temperature() -> None:
    """Test _do_openai_llm with None temperature."""
    # Given
    model = WaldiezModel(
        id="wm-1",
        name="gpt-4",
        description="OpenAI GPT-4",
        data=WaldiezModelData(api_type="openai", temperature=None),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )

    # When
    arg, before = do_openai_llm(model)

    # Then
    assert arg == 'OpenAI(model="gpt-4", temperature=0.0)'
    assert before == ""


def test_do_cohere_llm_with_params() -> None:
    """Test _do_cohere_llm with parameters."""
    # Given
    model = WaldiezModel(
        id="wm-1",
        name="command-r",
        description="Cohere Command R",
        data=WaldiezModelData(
            api_type="cohere",
            api_key="test-key",  # nosemgrep # nosec
            base_url="https://api.cohere.ai/v1",
            temperature=0.8,
        ),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )

    # When
    arg, before = do_cohere_llm(model)

    # Then
    assert 'model="command-r"' in arg
    assert 'api_key="test-key"' in arg
    assert 'base_url="https://api.cohere.ai/v1"' in arg
    assert "temperature=0.8" in arg
    assert before == ""


def test_do_nim_llm_before_content() -> None:
    """Test _do_nim_llm before content."""
    # Given
    model = WaldiezModel(
        id="wm-1",
        name="meta/llama-3-70b-instruct",
        description="NVIDIA NIM Llama",
        data=WaldiezModelData(api_type="nim"),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )

    # When
    arg, before = do_nim_llm(model)

    # Then
    assert arg == 'NVIDIA(model="meta/llama-3-70b-instruct")'
    assert "Settings.text_splitter = SentenceSplitter(chunk_size=500)" in before
    expected = (
        "Settings.embed_model = "
        'NVIDIAEmbedding(model="NV-Embed-QA", truncate="END")'
    )
    assert expected in before


def test_simple_llm_functions() -> None:
    """Test simple LLM functions that return basic configurations."""
    # Given
    model = WaldiezModel(
        id="wm-1",
        name="test-model",
        description="Test model",
        data=WaldiezModelData(api_type="deepseek"),
        type="model",
        tags=[],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )

    # When/Then
    arg, before = do_deepseek_llm(model)
    assert arg == 'DeepSeek(model="test-model")'
    assert before == ""

    arg, before = do_google_llm(model)
    assert arg == 'Gemini(model="test-model")'
    assert before == ""

    arg, before = do_groq_llm(model)
    assert arg == 'Groq(model="test-model")'
    assert before == ""

    arg, before = do_mistral_llm(model)
    assert arg == 'MistralAI(model="test-model")'
    assert before == ""

    arg, before = do_together_llm(model)
    assert arg == 'TogetherLLM(model="test-model")'
    assert before == ""
