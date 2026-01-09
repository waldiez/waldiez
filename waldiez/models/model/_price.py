# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# flake8: noqa: E501
"""Waldiez Model Price."""

from pydantic import Field
from typing_extensions import Annotated

from ..common import WaldiezBase


class WaldiezModelPrice(WaldiezBase):
    """Model Price.

    Attributes
    ----------
    prompt_price_per_1k : float
        The prompt price per 1k tokens.
    completion_token_price_per_1k : float
        The completion token price per 1k tokens.
    """

    prompt_price_per_1k: Annotated[
        float | None, Field(None, alias="promptPricePer1k")
    ]
    completion_token_price_per_1k: Annotated[
        float | None, Field(None, alias="completionTokenPricePer1k")
    ]
