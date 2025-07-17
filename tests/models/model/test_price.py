# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long,redefined-variable-type
"""Test waldiez.models.model._price.*."""

import pytest

from waldiez.models.model._price import WaldiezModelPrice


def test_waldiez_model_price() -> None:
    """Test WaldiezModelPrice."""
    # Given
    prompt_price_per_1k = 0.1
    completion_token_price_per_1k = 0.2
    # When
    model_price = WaldiezModelPrice(
        prompt_price_per_1k=prompt_price_per_1k,
        completion_token_price_per_1k=completion_token_price_per_1k,
    )
    # Then
    assert model_price.prompt_price_per_1k == prompt_price_per_1k
    assert (
        model_price.completion_token_price_per_1k
        == completion_token_price_per_1k
    )

    # Given
    prompt_price_per_1k = None  # type: ignore[assignment]
    completion_token_price_per_1k = None  # type: ignore[assignment]
    # When
    model_price = WaldiezModelPrice(
        prompt_price_per_1k=prompt_price_per_1k,
        completion_token_price_per_1k=completion_token_price_per_1k,
    )
    # Then
    assert model_price.prompt_price_per_1k == prompt_price_per_1k
    assert (
        model_price.completion_token_price_per_1k
        == completion_token_price_per_1k
    )

    # Given
    prompt_price_per_1k = "invalid"  # type: ignore[assignment]
    completion_token_price_per_1k = 0.2
    # When
    with pytest.raises(ValueError):
        WaldiezModelPrice(
            prompt_price_per_1k=prompt_price_per_1k,  # pyright: ignore
            completion_token_price_per_1k=completion_token_price_per_1k,
        )
