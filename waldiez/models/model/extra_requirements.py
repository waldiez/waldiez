# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez model extra requirements."""

from typing import Iterator, Set

from .model import WaldiezModel


def get_models_extra_requirements(
    models: Iterator[WaldiezModel], autogen_version: str
) -> Set[str]:
    """Get the models extra requirements.

    Parameters
    ----------
    models : list[WaldiezModel]
        The models.
    autogen_version : str
        The autogen version.

    Returns
    -------
    list[str]
        The models extra requirements.
    """
    model_requirements: Set[str] = set()
    # ref: https://github.com/ag2ai/ag2/blob/main/pyproject.toml
    models_with_additional_requirements = [
        "together",
        "gemini",
        "mistral",
        "groq",
        "anthropic",
        "cohere",
        "bedrock",  # we might add this later
    ]
    for model in models:
        for requirement in model.requirements:
            model_requirements.add(requirement)
        if model.data.api_type == "google":
            model_requirements.add(f"ag2[gemini]=={autogen_version}")
            continue
        if model.data.api_type in models_with_additional_requirements:
            model_requirements.add(
                f"ag2[{model.data.api_type}]=={autogen_version}"
            )
    return model_requirements


# for bedrock, there are some additional params needed
# (both here and on the ui part):
# aws_region (mandatory)
# aws_access_key (or environment variable: AWS_ACCESS_KEY)
# aws_secret_key (or environment variable: AWS_SECRET_KEY)
# aws_session_token (or environment variable: AWS_SESSION_TOKEN)
# aws_profile_name
