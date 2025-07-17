# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long,redefined-variable-type
"""Test waldiez.models.model.model_data.*."""

from waldiez.models.model import (
    WaldiezModelAPIType,
    WaldiezModelData,
    WaldiezModelPrice,
)


def test_waldiez_model_data() -> None:
    """Test WaldiezModelData."""
    # Given
    base_url = "https://example.com"
    api_key = "api_key"
    api_type: WaldiezModelAPIType = "openai"
    api_version = "v1"
    temperature = 0.1
    top_p = 0.2
    max_tokens = 100
    default_headers = {"Content-Type": "application/json"}
    price = WaldiezModelPrice(
        prompt_price_per_1k=0.1,
        completion_token_price_per_1k=0.2,
    )
    # When
    model_data = WaldiezModelData(
        base_url=base_url,
        api_key=api_key,
        api_type=api_type,
        api_version=api_version,
        temperature=temperature,
        top_p=top_p,
        max_tokens=max_tokens,
        default_headers=default_headers,
        price=price,
    )
    # Then
    assert model_data.base_url == base_url
    assert model_data.api_key == api_key
    assert model_data.api_type == api_type
    assert model_data.api_version == api_version
    assert model_data.temperature == temperature
    assert model_data.top_p == top_p
    assert model_data.max_tokens == max_tokens
    assert model_data.default_headers == default_headers
    assert model_data.price == price
