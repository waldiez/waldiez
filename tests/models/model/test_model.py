# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.model.WaldiezModel."""

import os

import pytest

from waldiez.models.model import (
    DEFAULT_BASE_URLS,
    MODEL_NEEDS_BASE_URL,
    WaldiezModel,
    WaldiezModelAPIType,
    WaldiezModelAWS,
    WaldiezModelData,
    WaldiezModelPrice,
)


def test_valid_waldiez_model() -> None:
    """Test valid WaldiezModel."""
    # Given
    api_type: WaldiezModelAPIType = "openai"
    data = WaldiezModelData(
        base_url="https://example.com",
        api_key="api_key",
        api_type=api_type,
        api_version="v1",
        temperature=0.1,
        top_p=0.2,
        max_tokens=100,
        default_headers={"Content-Type": "application/json"},
        price=WaldiezModelPrice(
            prompt_price_per_1k=0.1,
            completion_token_price_per_1k=0.2,
        ),
    )
    # When
    name = "model"
    description = "description"
    model = WaldiezModel(
        id="wm-1",
        name=name,
        description=description,
        data=data,
        type="model",
        tags=["tag1", "tag2"],
        requirements=["requirement1", "requirement2"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    # Then
    assert model.id == "wm-1"
    assert model.name == name
    assert model.description == description
    assert model.data == data
    assert model.type == "model"
    assert model.tags == ["tag1", "tag2"]
    assert model.requirements == ["requirement1", "requirement2"]
    assert model.api_key == "api_key"
    assert model.price == [0.1, 0.2]
    # When
    model_dump = model.model_dump()
    # Then
    assert model_dump["id"] == "wm-1"
    assert model_dump["name"] == name
    assert model_dump["description"] == description
    assert model_dump["data"] == data.model_dump()
    assert model_dump["type"] == "model"
    assert model_dump["tags"] == ["tag1", "tag2"]
    assert model_dump["requirements"] == ["requirement1", "requirement2"]
    assert model_dump["data"]["apiKey"] == "api_key"
    # When
    llm_config = model.get_llm_config()
    # # Then
    assert llm_config == {
        "model": name,
        "base_url": "https://example.com",
        "max_tokens": 100,
        "temperature": 0.1,
        "api_version": "v1",
        "api_type": "openai",
        "api_key": "api_key",
        "default_headers": {"Content-Type": "application/json"},
        "price": [0.1, 0.2],
    }


def test_waldiez_model_api_key_and_price() -> None:
    """Test WaldiezModel api key from env var and price."""
    current_api_key = os.environ.pop("OPENAI_API_KEY", None)
    os.environ["OPENAI_API_KEY"] = "api_key"
    # Given
    api_type: WaldiezModelAPIType = "openai"
    data = WaldiezModelData(
        base_url="https://example.com",
        api_type=api_type,
        price=WaldiezModelPrice(
            prompt_price_per_1k=0.1,
            completion_token_price_per_1k=None,
        ),
    )
    # When
    model = WaldiezModel(
        id="wm-1",
        name="model",
        description="description",
        data=data,
        type="model",
        tags=["tag1", "tag2"],
        requirements=["requirement1", "requirement2"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    # Then
    assert model.price is None
    assert model.api_key == "api_key"
    if current_api_key is not None:
        os.environ["OPENAI_API_KEY"] = current_api_key
    else:
        os.environ.pop("OPENAI_API_KEY", None)

    # Given
    data = WaldiezModelData(
        base_url="https://example.com",
        api_type=api_type,
    )
    # When
    model = WaldiezModel(
        id="wm-1",
        name="model",
        description="description",
        data=data,
        type="model",
        tags=["tag1", "tag2"],
        requirements=["requirement1", "requirement2"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    # Then
    assert model.price is None
    assert model.api_key in (os.environ.get("OPENAI_API_KEY", "REPLACE_ME"), "")


def test_waldiez_api_key() -> None:
    """Test WaldiezModel api key from env var."""
    current_api_key = os.environ.pop("GOOGLE_GEMINI_API_KEY", None)
    os.environ["GOOGLE_GEMINI_API_KEY"] = "GOOGLE_GEMINI_API_KEY"
    # Given
    api_type: WaldiezModelAPIType = "google"
    data = WaldiezModelData(
        base_url="https://example.com",
        api_type=api_type,
    )
    # When
    model = WaldiezModel(
        id="wm-1",
        name="model",
        description="description",
        data=data,
        type="model",
        tags=["tag1", "tag2"],
        requirements=["requirement1", "requirement2"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    # Then
    assert model.api_key == "GOOGLE_GEMINI_API_KEY"
    if current_api_key is not None:
        os.environ["GOOGLE_GEMINI_API_KEY"] = current_api_key
    else:
        os.environ.pop("GOOGLE_GEMINI_API_KEY", None)

    current_api_key = os.environ.pop("GROQ_API_KEY", None)
    os.environ["GROQ_API_KEY"] = "groq_api_key"
    # Given
    api_type = "groq"
    data = WaldiezModelData(
        api_type=api_type,
    )
    # When
    model = WaldiezModel(
        id="wm-1",
        name="model",
        description="description",
        data=data,
        type="model",
        tags=["tag1", "tag2"],
        requirements=["requirement1", "requirement2"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    # Then
    assert model.api_key == "groq_api_key"
    if current_api_key is not None:
        os.environ["GROQ_API_KEY"] = current_api_key
    else:
        os.environ.pop("GROQ_API_KEY", None)


# noinspection PyArgumentList
def test_waldiez_invalid_model() -> None:
    """Test invalid WaldiezModel."""
    with pytest.raises(ValueError):
        WaldiezModel(  # pyright: ignore
            id="wm-1",
            name="model",
            description="description",
            type="model",
            tags=["tag1", "tag2"],
            requirements=["requirement1", "requirement2"],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )


def test_waldiez_model_use_default_base_url() -> None:
    """Test WaldiezModel use default base url."""
    # Given
    api_types: list[WaldiezModelAPIType] = [
        "openai",
        "azure",
        "google",
        "anthropic",
        "mistral",
        "groq",
        "together",
        "nim",
        "other",
    ]
    for api_type in api_types:
        data = WaldiezModelData(
            api_type=api_type,
        )
        # When
        model = WaldiezModel(
            id="wm-1",
            name="model",
            description="description",
            data=data,
            type="model",
            tags=["tag1", "tag2"],
            requirements=["requirement1", "requirement2"],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
        )
        # Then
        expected_url = DEFAULT_BASE_URLS.get(api_type, "")
        if expected_url and MODEL_NEEDS_BASE_URL.get(api_type, False) is True:
            assert model.get_llm_config()["base_url"] == expected_url
    data = WaldiezModelData(
        api_type="mistral",
        base_url="https://example.com",
    )
    # When
    model = WaldiezModel(
        id="wm-1",
        name="model",
        description="description",
        data=data,
        type="model",
        tags=["tag1", "tag2"],
        requirements=["requirement1", "requirement2"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    # Then
    assert model.get_llm_config()["base_url"] == "https://example.com"


def test_waldiez_model_with_aws() -> None:
    """Test WaldiezModel with AWS."""
    # Given
    data = WaldiezModelData(
        api_type="bedrock",
        aws=WaldiezModelAWS(
            region="us-west-2",
            access_key="aws_access_key",  # nosemgrep # nosec
            secret_key="aws_secret_key",  # nosemgrep # nosec
            session_token="aws_session_token",  # nosemgrep # nosec
            profile_name="aws_profile",
        ),
    )
    # When
    model = WaldiezModel(
        id="wm-1",
        name="model",
        description="description",
        type="model",
        tags=["tag1", "tag2"],
        requirements=["requirement1", "requirement2"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=data,
    )
    # Then
    assert model.data.aws is not None
    assert model.data.aws.region == "us-west-2"
    assert model.data.aws.access_key == "aws_access_key"  # nosemgrep # nosec
    assert model.data.aws.secret_key == "aws_secret_key"  # nosemgrep # nosec
    assert (
        model.data.aws.session_token == "aws_session_token"  # nosemgrep # nosec
    )
    assert model.data.aws.profile_name == "aws_profile"
    llm_config = model.get_llm_config()
    assert llm_config["aws_region"] == "us-west-2"
