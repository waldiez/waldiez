# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
"""Waldiez Model Data."""

from typing import Annotated, Any, Literal

from pydantic import Field, model_validator
from typing_extensions import Self

from ..common import WaldiezBase, update_dict
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
        str | None,
        Field(
            default=None,
            title="Base URL",
            description="The base url of the model",
            alias="baseUrl",
        ),
    ]
    api_key: Annotated[
        str | None,
        Field(
            default=None,
            alias="apiKey",
            title="API Key",
            description="The api key to use with the model",
        ),
    ]
    api_type: Annotated[
        WaldiezModelAPIType,
        Field(
            default="other",
            alias="apiType",
            title="API Type",
            description="The api type of the model",
        ),
    ]
    api_version: Annotated[
        str | None,
        Field(
            default=None,
            alias="apiVersion",
            title="API Version",
            description="The api version of the model",
        ),
    ]
    temperature: Annotated[
        float | None,
        Field(
            default=None,
            alias="temperature",
            title="Temperature",
            description="The temperature of the model",
        ),
    ]
    top_p: Annotated[
        float | None,
        Field(
            default=None,
            alias="topP",
            title="Top P",
            description="The top p of the model",
        ),
    ]
    max_tokens: Annotated[
        int | None,
        Field(
            default=None,
            alias="maxTokens",
            title="Max Tokens",
            description="The max tokens of the model",
        ),
    ]
    aws: Annotated[
        WaldiezModelAWS | None,
        Field(
            default=None,
            alias="aws",
            title="AWS",
            description="The AWS related parameters",
        ),
    ]
    extras: Annotated[
        dict[str, Any],
        Field(
            alias="extras",
            default_factory=dict,
            title="Extras",
            description="Any extra attributes to include in the LLM Config",
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
        WaldiezModelPrice | None,
        Field(
            default=None, title="Price", description="The price of the model"
        ),
    ]

    @model_validator(mode="after")
    def validate_model_data(self) -> Self:
        """Validate model data.

        Returns
        -------
        WaldiezModelData
            The validated model data.
        """
        if self.extras:
            self.extras = update_dict(self.extras)
        return self
