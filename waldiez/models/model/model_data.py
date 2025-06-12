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
    "bedrock",
    "other",
]
"""Possible API types for the model."""


class WaldiezModelAWS(WaldiezBase):
    """AWS related parameters.

    Attributes
    ----------
    region : Optional[str]
        The AWS region, by default None.
    access_key : Optional[str]
        The AWS access key, by default None.
    secret_key : Optional[str]
        The AWS secret access key, by default None.
    session_token : Optional[str]
        The AWS session token, by default None.
    profile_name : Optional[str]
        The AWS profile name, by default Nonde.
    """

    region: Annotated[
        Optional[str],
        Field(
            None,
            alias="region",
            title="Region",
            description="The AWS region",
        ),
    ] = None
    access_key: Annotated[
        Optional[str],
        Field(
            None,
            alias="accessKey",
            title="Access Ke",
            description="The AWS access key",
        ),
    ] = None
    secret_key: Annotated[
        Optional[str],
        Field(
            None,
            alias="secretKey",
            title="Secret Key",
            description="The AWS secret key",
        ),
    ] = None
    session_token: Annotated[
        Optional[str],
        Field(
            None,
            alias="sessionToken",
            title="Session Token",
            description="The AWS session token",
        ),
    ] = None
    profile_name: Annotated[
        Optional[str],
        Field(
            None,
            alias="profileName",
            title="Profile Name",
            description="The AWS Profile name to use",
        ),
    ] = None


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
    aws : Optional[WaldiezModelAWS]
    extras: dict[str, str]
        Any extra attributes to include in the LLM Config.
    default_headers : dict[str, str]
        The default headers of the model.
    price : Optional[WaldiezModelPrice]
        The price of the model, by default None.
    """

    base_url: Annotated[
        Optional[str],
        Field(
            default=None,
            title="Base URL",
            description="The base url of the model",
            alias="baseUrl",
        ),
    ] = None
    api_key: Annotated[
        Optional[str],
        Field(
            default=None,
            alias="apiKey",
            title="API Key",
            description="The api key to use with the model",
        ),
    ] = None
    api_type: Annotated[
        WaldiezModelAPIType,
        Field(
            default="other",
            alias="apiType",
            title="API Type",
            description="The api type of the model",
        ),
    ] = "other"
    api_version: Annotated[
        Optional[str],
        Field(
            default=None,
            alias="apiVersion",
            title="API Version",
            description="The api version of the model",
        ),
    ] = None
    temperature: Annotated[
        Optional[float],
        Field(
            default=None,
            alias="temperature",
            title="Temperature",
            description="The temperature of the model",
        ),
    ] = None
    top_p: Annotated[
        Optional[float],
        Field(
            default=None,
            alias="topP",
            title="Top P",
            description="The top p of the model",
        ),
    ] = None
    max_tokens: Annotated[
        Optional[int],
        Field(
            default=None,
            alias="maxTokens",
            title="Max Tokens",
            description="The max tokens of the model",
        ),
    ] = None
    aws: Annotated[
        Optional[WaldiezModelAWS],
        Field(
            default=None,
            alias="aws",
            title="AWS",
            description="The AWS related parameters",
        ),
    ] = None
    extras: Annotated[
        dict[str, str],
        Field(
            alias="extras",
            default_factory=dict,
            title="Extras",
            description="Any extra attributes to include in the LLM Config",
        ),
    ] = {}
    default_headers: Annotated[
        dict[str, str],
        Field(
            alias="defaultHeaders",
            default_factory=dict,
            title="Default Headers",
            description="The default headers of the model",
        ),
    ] = {}
    price: Annotated[
        Optional[WaldiezModelPrice],
        Field(
            default=None, title="Price", description="The price of the model"
        ),
    ] = None
