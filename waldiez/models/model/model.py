# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez model model."""

import os
from typing import Any, Optional

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..common import WaldiezBase, now
from .model_data import WaldiezModelAPIType, WaldiezModelAWS, WaldiezModelData

DEFAULT_BASE_URLS: dict[WaldiezModelAPIType, str] = {
    "deepseek": "https://api.deepseek.com/v1",
    "google": "https://generativelanguage.googleapis.com/v1beta",
    "anthropic": "https://api.anthropic.com/v1",
    "mistral": "https://api.mistral.ai/v1",
    "groq": "https://api.groq.com/openai/v1",
    "together": "https://api.together.xyz/v1",
    "nim": "https://integrate.api.nvidia.com/v1",
    "cohere": "https://api.cohere.com",
}


# we can omit the base_url for these models
MODEL_NEEDS_BASE_URL: dict[WaldiezModelAPIType, bool] = {
    "openai": False,
    "azure": False,
    "google": False,
    "anthropic": False,
    "cohere": False,
    "other": False,  # falls back to openai
    "deepseek": True,
    "mistral": True,
    "groq": True,
    "together": True,
    "nim": True,
}


class WaldiezModel(WaldiezBase):
    """Waldiez Model class.

    Attributes
    ----------
    id : str
        The ID of the model.
    name : str
        The name of the model.
    description : str
        The description of the model.
    tags : list[str]
        The tags of the model.
    requirements : list[str]
        The requirements of the model.
    created_at : str
        The date and time when the model was created.
    updated_at : str
        The date and time when the model was last updated.
    data : WaldiezModelData
        The data of the model.
        See `waldiez.models.model.WaldiezModelData` for more information.
    """

    id: Annotated[
        str, Field(..., title="ID", description="The ID of the model.")
    ]
    type: Annotated[
        Literal["model"],
        Field(
            default="model",
            title="Type",
            description="The type of the 'node' in a graph.",
        ),
    ]
    name: Annotated[
        str, Field(..., title="Name", description="The name of the model.")
    ]
    description: Annotated[
        str,
        Field(
            "Model's Description",
            title="Description",
            description="The description of the model.",
        ),
    ]
    tags: Annotated[
        list[str],
        Field(
            default_factory=list,
            title="Tags",
            description="The tags of the model.",
        ),
    ]
    requirements: Annotated[
        list[str],
        Field(
            default_factory=list,
            title="Requirements",
            description="The requirements of the model.",
        ),
    ]
    created_at: Annotated[
        str,
        Field(
            default_factory=now,
            title="Create At",
            description="The date and time when the model was created.",
        ),
    ]
    updated_at: Annotated[
        str,
        Field(
            default_factory=now,
            title="Updated At",
            description="The date and time when the model was last updated.",
        ),
    ]
    data: Annotated[
        WaldiezModelData,
        Field(..., title="Data", description="The data of the model."),
    ]

    @property
    def api_key_env_key(self) -> str:
        """Get the model's api key environment key to check.

        - openai: 'OPENAI_API_KEY',
        - azure: 'AZURE_API_KEY',
        - deepseek: 'DEEPSEEK_API_KEY',
        - google: 'GOOGLE_GEMINI_API_KEY',
        - anthropic: 'ANTHROPIC_API_KEY',
        - mistral: 'MISTRAL_API_KEY',
        - groq: 'GROQ_API_KEY',
        - together: 'TOGETHER_API_KEY',
        - nim: 'NIM_API_KEY',
        - cohere: 'COHERE_API_KEY',
        - other: 'OPENAI_API_KEY'
        """
        env_key = "OPENAI_API_KEY"
        if self.data.api_type == "google":
            env_key = "GOOGLE_GEMINI_API_KEY"
        elif self.data.api_type not in ["openai", "other"]:
            env_key = f"{self.data.api_type.upper()}_API_KEY"
        return env_key

    @property
    def api_key(self) -> str:
        """Get the model's api key.

        Either from the model's data or from the environment variables:

            - openai: 'OPENAI_API_KEY',
            - azure: 'AZURE_API_KEY',
            - deepseek: 'DEEPSEEK_API_KEY',
            - google: 'GOOGLE_GEMINI_API_KEY',
            - anthropic: 'ANTHROPIC_API_KEY',
            - mistral: 'MISTRAL_API_KEY',
            - groq: 'GROQ_API_KEY',
            - together: 'TOGETHER_API_KEY',
            - nim: 'NIM_API_KEY',
            - cohere: 'COHERE_API_KEY',
            - other: 'OPENAI_API_KEY'
        """
        if self.data.api_key and self.data.api_key != "REPLACE_ME":
            os.environ[self.api_key_env_key] = self.data.api_key
            return self.data.api_key
        env_key = self.api_key_env_key
        api_key = os.environ.get(
            env_key, getattr(self.data, "api_key", "REPLACE_ME")
        )
        if api_key and api_key != "REPLACE_ME":
            os.environ[env_key] = api_key
        return api_key or "REPLACE_ME"

    @property
    def price(self) -> Optional[list[float]]:
        """Get the model's price."""
        if self.data.price is None:
            return None
        if isinstance(
            self.data.price.prompt_price_per_1k, float
        ) and isinstance(self.data.price.completion_token_price_per_1k, float):
            return [
                self.data.price.prompt_price_per_1k,
                self.data.price.completion_token_price_per_1k,
            ]
        return None

    def get_llm_config(self, skip_price: bool = False) -> dict[str, Any]:
        """Get the model's llm config.

        Parameters
        ----------
        skip_price : bool, optional
            Whether to skip the price, by default, False

        Returns
        -------
        dict[str, Any]
            The model's llm config dictionary.
        """
        # noinspection PyDictCreation
        _llm_config = {}
        _llm_config["model"] = self.name
        for attr, atr_type in [
            ("base_url", str),
            ("max_tokens", int),
            # ("temperature", float),
            ("top_p", float),
            ("api_version", str),
            ("default_headers", dict),
        ]:
            value = getattr(self.data, attr)
            if value and isinstance(value, atr_type):
                _llm_config[attr] = value
        if self.data.api_type not in ["nim", "other"]:
            _llm_config["api_type"] = self.data.api_type
        other_attrs = ["api_key"] if skip_price else ["api_key", "price"]
        for attr in other_attrs:
            value = getattr(self, attr)
            if value:
                _llm_config[attr] = value
        if self.data.api_type == "bedrock":
            _llm_config.pop("base_url", None)
            return set_bedrock_aws_config(_llm_config, self.data.aws)
        return set_default_base_url(_llm_config, self.data.api_type)


def set_default_base_url(
    llm_config: dict[str, Any], api_type: WaldiezModelAPIType
) -> dict[str, Any]:
    """Set the default base url if not provided.

    Parameters
    ----------
    llm_config : dict[str, Any]
        The llm config dictionary.
    api_type : str
        The api type.

    Returns
    -------
    dict[str, Any]
        The llm config dictionary with the default base url set.
    """
    dict_copy = llm_config.copy()
    if "base_url" not in llm_config or not llm_config["base_url"]:
        if MODEL_NEEDS_BASE_URL.get(api_type, True):
            dict_copy["base_url"] = DEFAULT_BASE_URLS.get(api_type, "")
    if (
        not llm_config.get("base_url", "")
        and MODEL_NEEDS_BASE_URL.get(api_type, True) is False
    ):
        dict_copy.pop("base_url", None)
    return dict_copy


def set_bedrock_aws_config(
    llm_config: dict[str, Any],
    aws_config: Optional[WaldiezModelAWS],
) -> dict[str, Any]:
    """Set the AWS config for Bedrock.

    Parameters
    ----------
    llm_config : dict[str, Any]
        The llm config dictionary.
    aws_config : Optional[WaldiezModelAWS]
        The passed aws config if any.

    Returns
    -------
    dict[str, Any]
        The llm config dictionary with the AWS config set.
    """
    dict_copy = llm_config.copy()
    aws_params = [
        "access_key",
        "secret_key",
        "session_token",
        "profile_name",
        "region",
    ]

    extra_args = {}
    for param in aws_params:
        config_key = f"aws_{param}"
        env_var = f"AWS_{param.upper()}"

        # First try to get from aws_config
        value = getattr(aws_config, param, "") if aws_config else ""

        # If not found, try environment variable
        if not value:
            value = os.environ.get(env_var, "")

        # Add to extra_args if value exists
        if value:
            extra_args[config_key] = value

    # Update llm_config with extra_args
    if extra_args:
        dict_copy.update(extra_args)

    return dict_copy
