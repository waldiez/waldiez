# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""LLM related utilities for Waldiez models."""
# pylint: disable=too-complex,too-many-return-statements
# flake8: noqa: C901

# Links:
# https://docs.llamaindex.ai/en/stable/api_reference/llms/
#
# https://docs.llamaindex.ai/en/stable/examples/llm/openai/
# https://docs.llamaindex.ai/en/stable/examples/llm/anthropic/
# https://docs.llamaindex.ai/en/stable/examples/llm/azure_openai/
# https://docs.llamaindex.ai/en/stable/examples/llm/bedrock/
# https://docs.llamaindex.ai/en/stable/examples/llm/bedrock_converse/
# https://docs.llamaindex.ai/en/stable/examples/llm/cohere/
# https://docs.llamaindex.ai/en/stable/examples/llm/deepseek/
# https://docs.llamaindex.ai/en/stable/examples/llm/gemini/
# https://docs.llamaindex.ai/en/stable/examples/llm/google_genai/
# https://docs.llamaindex.ai/en/stable/examples/llm/groq/
# https://docs.llamaindex.ai/en/stable/examples/llm/mistralai/
# https://docs.llamaindex.ai/en/stable/examples/llm/nvidia_nim/
# https://docs.llamaindex.ai/en/stable/examples/llm/nvidia/
# https://docs.llamaindex.ai/en/stable/examples/llm/together/
# https://docs.llamaindex.ai/en/stable/api_reference/llms/openai_like/
#

import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import WaldiezModel


# noinspection PyUnusedLocal
def get_llm_requirements(
    model: "WaldiezModel",
    ag2_version: str,  # pylint: disable=unused-argument
) -> set[str]:
    """Get the LLM requirements for the model.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM requirements for.
    ag2_version : str
        The version of AG2 to use for the requirements.

    Returns
    -------
    set[str]
        The set of LLM requirements for the model.
    """
    requirements: set[str] = {
        # f"ag2[rag]=={ag2_version}",
        "chromadb>=0.5,<2",
        "docling>=2.15.1,<3",
        "selenium>=4.28.1,<5",
        "webdriver-manager==4.0.2",
        "llama-index",
        "llama-index-core",
        "llama-index-embeddings-huggingface",
        "llama-index-llms-langchain",
        "llama-index-vector-stores-chroma",
    }
    match model.data.api_type:
        case "openai":
            requirements.add("llama-index-llms-openai")
        case "anthropic":
            requirements.add("llama-index-llms-anthropic")
        case "azure":
            requirements.add("llama-index-llms-azure-openai")
        case "bedrock":
            requirements.add("llama-index-llms-bedrock-converse")
        case "cohere":
            requirements.add("llama-index-llms-openai")
            requirements.add("llama-index-llms-cohere")
        case "deepseek":
            requirements.add("llama-index-llms-deepseek")
        case "google":
            #  | "gemini"
            requirements.add("llama-index-llms-google-genai")
            requirements.add("llama-index-llms-gemini")
        case "groq":
            requirements.add("llama-index-llms-groq")
        case "mistral":
            requirements.add("llama-index-llms-mistralai")
        case "nim":
            requirements.update(
                {
                    "llama-index-llms-nvidia",
                    "llama-index-readers-file",
                    "llama-index-embeddings-nvidia",
                    "llama-index-postprocessor-nvidia-rerank",
                }
            )
        case "together":
            requirements.add("llama-index-llms-together")
        case "other":  # pragma: no cover
            # openai compatible LLMs
            requirements.add("llama-index-llms-openai-like")

    return requirements


def get_llm_imports(model: "WaldiezModel") -> set[str]:
    """Get the LLM import statements for the model.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM import statements for.

    Returns
    -------
    set[str]
        A set of import statements needed for the model's LLM.

    Raises
    ------
    ValueError
        If the model's API type is unsupported.
    """
    match model.data.api_type:
        case "openai":
            return {"from llama_index.llms.openai import OpenAI"}
        case "anthropic":
            return {
                "from llama_index.llms.anthropic import Anthropic",
                "from llama_index.core import Settings",
            }
        case "azure":
            return {"from llama_index.llms.azure_openai import AzureOpenAI"}
        case "bedrock":
            return {
                "from llama_index.llms.bedrock_converse import BedrockConverse"
            }
        case "cohere":
            return {"from llama_index.llms.cohere import Cohere"}
        case "deepseek":
            return {"from llama_index.llms.deepseek import DeepSeek"}
        case "google":
            return {"from llama_index.llms.gemini import Gemini"}
        case "groq":
            return {"from llama_index.llms.groq import Groq"}
        case "mistral":
            return {"from llama_index.llms.mistralai import MistralAI"}
        case "nim":
            return {
                "from llama_index.core import Settings",
                "from llama_index.llms.nvidia import NVIDIA",
                "from llama_index.embeddings.nvidia import NVIDIAEmbedding",
            }
        case "together":
            return {"from llama_index.llms.together import TogetherLLM"}
        case "other":
            return {"from llama_index.llms.openai_like import OpenAILike"}
        case _:  # pragma: no cover
            # noinspection PyUnreachableCode
            raise ValueError(f"Unsupported API type: {model.data.api_type}")


def get_llm_arg(model: "WaldiezModel") -> tuple[str, str]:
    """Get the LLM argument for the model.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.

    Raises
    ------
    ValueError
        If the model's API type is unsupported.
    """
    match model.data.api_type:
        case "openai":
            return do_openai_llm(model)
        case "anthropic":
            return do_anthropic_llm(model)
        case "azure":
            return do_azure_llm(model)
        case "bedrock":
            return do_bedrock_llm(model)
        case "cohere":
            return do_cohere_llm(model)
        case "deepseek":
            return do_deepseek_llm(model)
        case "google":
            return do_google_llm(model)
        case "groq":
            return do_groq_llm(model)
        case "mistral":
            return do_mistral_llm(model)
        case "nim":
            return do_nim_llm(model)
        case "together":
            return do_together_llm(model)
        case "other":
            return do_other_llm(model)
        case _:  # pragma: no cover
            # noinspection PyUnreachableCode
            raise ValueError(f"Unsupported API type: {model.data.api_type}")


def do_openai_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the OpenAI LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    temperature = model.data.temperature or 0.0
    arg = f'OpenAI(model="{model.name}", temperature={temperature})'
    before = ""
    return arg, before


def do_anthropic_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the Anthropic LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    #  from llama_index.llms.anthropic import Anthropic
    # from llama_index.core import Settings

    # tokenizer = Anthropic().tokenizer
    # Settings.tokenizer = tokenizer
    # # otherwise it will lookup ANTHROPIC_API_KEY from your env variable
    # # llm = Anthropic(api_key="<api_key>")
    # llm = Anthropic(model="claude-sonnet-4-0")
    arg = f'Anthropic(model="{model.name}")'
    before = (
        "_tokenizer = Anthropic().tokenizer\nSettings.tokenizer = _tokenizer\n"
    )
    return arg, before


def do_azure_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the Azure OpenAI LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    #
    # llm = AzureOpenAI(
    #     engine="simon-llm", model="gpt-35-turbo-16k", temperature=0.0
    # )
    # Alternatively, you can also skip setting environment variables,
    #  and pass the parameters in directly via constructor.
    #  llm = AzureOpenAI(
    #     engine="my-custom-llm",
    #     model="gpt-35-turbo-16k",
    #     temperature=0.0,
    #     azure_endpoint="https://<your-resource-name>.openai.azure.com/",
    #     api_key="<your-api-key>",
    #     api_version="2023-07-01-preview",
    # )
    engine = model.data.extras.get("engine", model.name)
    temperature = model.data.temperature or 0.0
    arg = (
        f"AzureOpenAI(\n"
        f'    engine="{engine}"\n'
        f'    model="{model.name}",\n'
        f"    temperature={temperature},\n"
    )
    if model.data.base_url:  # pragma: no branch
        arg += f'    azure_endpoint="{model.data.base_url}",\n'
    if model.data.api_version:  # pragma: no branch
        arg += f'    api_version="{model.data.api_version}",\n'
    arg += ")"
    before = ""
    return arg, before


def do_bedrock_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the Bedrock LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    # llm = BedrockConverse(
    #     model="anthropic.claude-3-haiku-20240307-v1:0",
    #     profile_name=profile_name,
    # )
    # llm = BedrockConverse(
    #     model="us.amazon.nova-lite-v1:0",
    #     aws_access_key_id="AWS Access Key ID to use",
    #     aws_secret_access_key="AWS Secret Access Key to use",
    #     aws_session_token="AWS Session Token to use",
    #     region_name="AWS Region to use, eg. us-east-1",
    # )
    if not model.data.aws:
        # try to get what we can from env
        profile_name = os.getenv("AWS_PROFILE_NAME", "")
        aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID", "")
        aws_region = os.getenv("AWS_REGION", "")
    else:
        profile_name = model.data.aws.profile_name or ""
        aws_access_key_id = model.data.aws.access_key or ""
        aws_region = model.data.aws.region or ""
    arg = f'BedrockConverse(\n    model="{model.name}",\n'
    if profile_name:  # pragma: no branch
        arg += f'    profile_name="{profile_name}",\n'
    if aws_access_key_id:  # pragma: no branch
        arg += f'    aws_access_key_id="{aws_access_key_id}",\n'
    if aws_region:  # pragma: no branch
        arg += f'    region_name="{aws_region}",\n'
    arg += ")"
    before = ""
    return arg, before


def do_cohere_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the Cohere LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    arg = f'Cohere(\n    model="{model.name}",\n'
    if model.data.api_key:  # pragma: no branch
        arg += f'    api_key="{model.data.api_key}",\n'
    if model.data.base_url:  # pragma: no branch
        arg += f'    base_url="{model.data.base_url}",\n'
    if model.data.temperature is not None:  # pragma: no branch
        arg += f"    temperature={model.data.temperature},\n"
    arg += ")"
    before = ""
    return arg, before


# noinspection DuplicatedCode
def do_deepseek_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the DeepSeek LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    arg = f'DeepSeek(model="{model.name}")'
    before = ""
    return arg, before


def do_google_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the Google LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    arg = f'Gemini(model="{model.name}")'
    before = ""
    return arg, before


# noinspection DuplicatedCode
def do_groq_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the Groq LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    arg = f'Groq(model="{model.name}")'
    before = ""
    return arg, before


def do_mistral_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the Mistral LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    arg = f'MistralAI(model="{model.name}")'
    before = ""
    return arg, before


def do_nim_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the NVIDIA NIM LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    # NVIDIA's default embeddings only embed the first 512 tokens so we've set
    # our chunk size to 500 to maximize the accuracy of our embeddings.
    # Settings.text_splitter = SentenceSplitter(chunk_size=500)
    # We set our embedding model to NVIDIA's default.
    # If a chunk exceeds the number of tokens the model can encode,
    # the default is to throw an error, so we set truncate="END" to
    # instead discard tokens that go over the limit
    # (hopefully not many because of our chunk size above).
    before = (
        "Settings.text_splitter = SentenceSplitter(chunk_size=500)\n"
        "Settings.embed_model = "
        'NVIDIAEmbedding(model="NV-Embed-QA", truncate="END")\n'
    )
    arg = f'NVIDIA(model="{model.name}")'
    return arg, before


def do_together_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the Together LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    arg = f'TogetherLLM(model="{model.name}")'
    before = ""
    return arg, before


def do_other_llm(model: "WaldiezModel") -> tuple[str, str]:
    """Get the OpenAI-like LLM argument and any content before it.

    Parameters
    ----------
    model : WaldiezModel
        The model to get the LLM argument for.

    Returns
    -------
    tuple[str, str]
        A tuple containing the LLM argument string and any content before it.
    """
    #     llm = OpenAILike(
    #     model="my model",
    #     api_base="https://hostname.com/v1",
    #     api_key="fake",
    #     context_window=128000,
    #     is_chat_model=True,
    #     is_function_calling_model=False,
    # )

    arg = (
        "OpenAILike(\n"
        f'    model="{model.name}",\n'
        f'    api_base="{model.data.base_url}",\n'
    )
    if not model.data.api_key:  # pragma: no cover
        arg += '    api_key="na",\n'
    else:
        arg += f'    api_key="{model.data.api_key}",\n'
    if model.data.temperature is not None:  # pragma: no branch
        arg += f"    temperature={model.data.temperature},\n"
    if model.data.extras:  # pragma: no branch
        for key, value in model.data.extras.items():
            if isinstance(value, str):
                arg += f'    {key}="{value}",\n'
            else:
                arg += f"    {key}={value},\n"
    arg += ")"
    # if model.data.price:
    before = ""
    return arg, before
