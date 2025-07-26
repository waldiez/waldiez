# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use
"""Test waldiez.models.model._llm module."""

import os
from unittest.mock import patch

from waldiez.models.model import WaldiezModel, WaldiezModelAWS, WaldiezModelData

# noinspection PyProtectedMember
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


class TestGetLLMRequirements:
    """Test get_llm_requirements function."""

    def test_openai_requirements(self) -> None:
        """Test OpenAI requirements."""
        # Given
        model = WaldiezModel(
            id="wm-1",
            name="gpt-4",
            description="OpenAI GPT-4",
            data=WaldiezModelData(api_type="openai"),
            type="model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )

        # When
        requirements = get_llm_requirements(
            model,
            ag2_version="0.1.0",
        )

        # Then
        expected = {
            "ag2[rag]==0.1.0",
            "llama-index",
            "llama-index-core",
            "llama-index-llms-openai",
        }
        assert requirements == expected

    def test_anthropic_requirements(self) -> None:
        """Test Anthropic requirements."""
        # Given
        model = WaldiezModel(
            id="wm-1",
            name="claude-3",
            description="Anthropic Claude",
            data=WaldiezModelData(api_type="anthropic"),
            type="model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )

        # When
        requirements = get_llm_requirements(
            model,
            ag2_version="0.1.0",
        )

        # Then
        expected = {
            "ag2[rag]==0.1.0",
            "llama-index",
            "llama-index-core",
            "llama-index-llms-anthropic",
        }
        assert requirements == expected

    def test_azure_requirements(self) -> None:
        """Test Azure requirements."""
        # Given
        model = WaldiezModel(
            id="wm-1",
            name="gpt-4",
            description="Azure OpenAI GPT-4",
            data=WaldiezModelData(api_type="azure"),
            type="model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )

        # When
        requirements = get_llm_requirements(
            model,
            ag2_version="0.1.0",
        )

        # Then
        expected = {
            "ag2[rag]==0.1.0",
            "llama-index",
            "llama-index-core",
            "llama-index-llms-azure-openai",
        }
        assert requirements == expected

    def test_nim_requirements(self) -> None:
        """Test NVIDIA NIM requirements."""
        # Given
        model = WaldiezModel(
            id="wm-1",
            name="llama-3-70b",
            description="NVIDIA NIM Llama",
            data=WaldiezModelData(api_type="nim"),
            type="model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )

        # When
        requirements = get_llm_requirements(
            model,
            ag2_version="0.1.0",
        )

        # Then
        expected = {
            "ag2[rag]==0.1.0",
            "llama-index",
            "llama-index-core",
            "llama-index-llms-nvidia",
            "llama-index-readers-file",
            "llama-index-embeddings-nvidia",
            "llama-index-postprocessor-nvidia-rerank",
        }
        assert requirements == expected

    def test_other_requirements(self) -> None:
        """Test other (OpenAI-like) requirements."""
        # Given
        model = WaldiezModel(
            id="wm-1",
            name="custom-model",
            description="Custom OpenAI-like model",
            data=WaldiezModelData(api_type="other"),
            type="model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )

        # When
        requirements = get_llm_requirements(
            model,
            ag2_version="0.1.0",
        )

        # Then
        expected = {
            "ag2[rag]==0.1.0",
            "llama-index",
            "llama-index-core",
            "llama-index-llms-openai-like",
        }
        assert requirements == expected


class TestGetLLMImports:
    """Test get_llm_imports function."""

    def test_openai_imports(self) -> None:
        """Test OpenAI imports."""
        # Given
        model = WaldiezModel(
            id="wm-1",
            name="gpt-4",
            description="OpenAI GPT-4",
            data=WaldiezModelData(api_type="openai"),
            type="model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )

        # When
        imports = get_llm_imports(model)

        # Then
        expected = {"from llama_index.llms.openai import OpenAI"}
        assert imports == expected

    def test_anthropic_imports(self) -> None:
        """Test Anthropic imports."""
        # Given
        model = WaldiezModel(
            id="wm-1",
            name="claude-3",
            description="Anthropic Claude",
            data=WaldiezModelData(api_type="anthropic"),
            type="model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )

        # When
        imports = get_llm_imports(model)

        # Then
        expected = {
            "from llama_index.llms.anthropic import Anthropic",
            "from llama_index.core import Settings",
        }
        assert imports == expected


class TestGetLLMArg:
    """Test get_llm_arg function."""

    def test_openai_arg(self) -> None:
        """Test OpenAI argument generation."""
        # Given
        model = WaldiezModel(
            id="wm-1",
            name="gpt-4",
            description="OpenAI GPT-4",
            data=WaldiezModelData(api_type="openai", temperature=0.7),
            type="model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )

        # When
        arg, before = get_llm_arg(model)

        # Then
        assert arg == 'OpenAI(model="gpt-4", temperature=0.7)'
        assert before == ""

    def test_anthropic_arg(self) -> None:
        """Test Anthropic argument generation."""
        # Given
        model = WaldiezModel(
            id="wm-1",
            name="claude-3",
            description="Anthropic Claude",
            data=WaldiezModelData(api_type="anthropic"),
            type="model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )

        # When
        arg, before = get_llm_arg(model)

        # Then
        assert arg == 'Anthropic(model="claude-3")'
        assert "_tokenizer = Anthropic().tokenizer" in before
        assert "Settings.tokenizer = _tokenizer" in before

    def test_azure_arg(self) -> None:
        """Test Azure argument generation."""
        # Given
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

        # When
        arg, before = get_llm_arg(model)

        # Then
        assert 'engine="my-engine"' in arg
        assert 'model="gpt-4"' in arg
        assert "temperature=0.5" in arg
        assert 'azure_endpoint="https://example.openai.azure.com/"' in arg
        assert 'api_version="2023-07-01-preview"' in arg
        assert before == ""

    @patch.dict(os.environ, {"AWS_PROFILE_NAME": "test-profile"})
    def test_bedrock_arg_with_env(self) -> None:
        """Test Bedrock argument generation with environment variables."""
        # Given
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

        # When
        arg, before = get_llm_arg(model)

        # Then
        assert 'model="anthropic.claude-3-haiku-20240307-v1:0"' in arg
        assert 'profile_name="test-profile"' in arg
        assert before == ""

    def test_bedrock_arg_with_aws_config(self) -> None:
        """Test Bedrock argument generation with AWS config."""
        # Given
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

        # When
        arg, before = get_llm_arg(model)

        # Then
        assert 'profile_name="custom-profile"' in arg
        assert 'aws_access_key_id="test-key"' in arg
        assert 'region_name="us-east-1"' in arg
        assert before == ""

    def test_other_arg(self) -> None:
        """Test other (OpenAI-like) argument generation."""
        # Given
        model = WaldiezModel(
            id="wm-1",
            name="custom-model",
            description="Custom OpenAI-like model",
            data=WaldiezModelData(
                api_type="other",
                base_url="https://api.custom.com/v1",
                extras={"context_window": "128000", "is_chat_model": "True"},
            ),
            type="model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )

        # When
        arg, before = get_llm_arg(model)

        # Then
        assert 'model="custom-model"' in arg
        assert 'api_base="https://api.custom.com/v1"' in arg
        assert 'api_key="na"' in arg
        assert 'context_window="128000"' in arg
        assert 'is_chat_model="True"' in arg
        assert before == ""


class TestPrivateFunctions:
    """Test private helper functions."""

    def test_do_openai_llm_with_none_temperature(self) -> None:
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

    def test_do_cohere_llm_with_params(self) -> None:
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

    def test_do_nim_llm_before_content(self) -> None:
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
        assert (
            "Settings.text_splitter = SentenceSplitter(chunk_size=500)"
            in before
        )
        expected = (
            "Settings.embed_model = "
            'NVIDIAEmbedding(model="NV-Embed-QA", truncate="END")'
        )
        assert expected in before

    def test_simple_llm_functions(self) -> None:
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
