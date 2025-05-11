# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
"""Waldiez Model Data."""

from typing import Optional

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..common import WaldiezBase

WaldiezModelAPIType = Literal[
    "openai",
    "azure",
    "deepseek",
    "google",
    "anthropic",
    "mistral",
    "groq",
    "together",
    "nim",
    "cohere",
    "other",
]
"""Possible API types for the model."""


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
        Optional[float], Field(None, alias="promptPricePer1k")
    ]
    completion_token_price_per_1k: Annotated[
        Optional[float], Field(None, alias="completionTokenPricePer1k")
    ]


# pylint: disable=line-too-long
class WaldiezModelData(WaldiezBase):
    """Waldiez Model Data.

    Attributes
    ----------
    base_url : Optional[str]
        The base url of the model, by default None.
    api_key : Optional[str]
        The api key to use with the model, by default None.
    api_type : WaldiezModelAPIType
        The api type of the model.
    api_version : Optional[str]
        The api version of the model, by default None.
    temperature : Optional[float]
        The temperature of the model, by default None.
    top_p : Optional[float]
        The top p of the model, by default None.
    max_tokens : Optional[int]
        The max tokens of the model, by default None.
    default_headers : dict[str, str]
        The default headers of the model.
    price : Optional[WaldiezModelPrice]
        The price of the model, by default None.
    """

    base_url: Annotated[
        Optional[str],
        Field(
            None,
            title="Base URL",
            description="The base url of the model",
            alias="baseUrl",
        ),
    ]
    api_key: Annotated[
        Optional[str],
        Field(
            None,
            alias="apiKey",
            title="API Key",
            description="The api key to use with the model",
        ),
    ]
    api_type: Annotated[
        WaldiezModelAPIType,
        Field(
            "other",
            alias="apiType",
            title="API Type",
            description="The api type of the model",
        ),
    ]
    api_version: Annotated[
        Optional[str],
        Field(
            None,
            alias="apiVersion",
            title="API Version",
            description="The api version of the model",
        ),
    ]
    temperature: Annotated[
        Optional[float],
        Field(
            None,
            alias="temperature",
            title="Temperature",
            description="The temperature of the model",
        ),
    ]
    top_p: Annotated[
        Optional[float],
        Field(
            None,
            alias="topP",
            title="Top P",
            description="The top p of the model",
        ),
    ]
    max_tokens: Annotated[
        Optional[int],
        Field(
            None,
            alias="maxTokens",
            title="Max Tokens",
            description="The max tokens of the model",
        ),
    ]
    default_headers: Annotated[
        dict[str, str],
        Field(
            alias="defaultHeaders",
            default_factory=dict,
            title="Default Headers",
            description="The default headers of the model",
        ),
    ]
    price: Annotated[
        Optional[WaldiezModelPrice],
        Field(None, title="Price", description="The price of the model"),
    ]
