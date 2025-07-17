# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
"""Waldiez Model Data."""

from typing import Optional

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..common import WaldiezBase
from ._aws import WaldiezModelAWS
from ._price import WaldiezModelPrice

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
