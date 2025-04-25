# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.model.extra_requirements."""

from typing import Iterator

from waldiez.models.common import get_autogen_version
from waldiez.models.model import WaldiezModel, get_models_extra_requirements


def test_get_models_extra_requirements() -> None:
    """Test get_models_extra_requirements."""
    models_list = [
        WaldiezModel(
            id="wm-1",
            name="model",
            description="model",
            data={  # type: ignore
                "api_type": "openai",
            },
        ),
        WaldiezModel(
            id="wm-2",
            name="model",
            description="model",
            data={  # type: ignore
                "api_type": "google",
            },
        ),
        WaldiezModel(
            id="wm-3",
            name="model",
            description="model",
            requirements=["requests"],
            data={  # type: ignore
                "api_type": "together",
            },
        ),
        WaldiezModel(
            id="wm-4",
            name="model",
            description="model",
            data={  # type: ignore
                "api_type": "mistral",
            },
        ),
        WaldiezModel(
            id="wm-5",
            name="model",
            description="model",
            data={  # type: ignore
                "api_type": "groq",
            },
        ),
        WaldiezModel(
            id="wm-6",
            name="model",
            description="model",
            data={  # type: ignore
                "api_type": "anthropic",
            },
        ),
        WaldiezModel(
            id="wm-7",
            name="model",
            description="model",
            data={  # type: ignore
                "api_type": "cohere",
            },
        ),
    ]
    models_iter: Iterator[WaldiezModel] = iter(models_list)
    autogen_version = get_autogen_version()
    expected_packages = [
        "requests",
        f"pyautogen[gemini]=={autogen_version}",
        f"pyautogen[together]=={autogen_version}",
        f"pyautogen[mistral]=={autogen_version}",
        f"pyautogen[groq]=={autogen_version}",
        f"pyautogen[anthropic]=={autogen_version}",
        f"pyautogen[cohere]=={autogen_version}",
        # f"pyautogen[bedrock]=={autogen_version}",
    ]
    model_requirements = get_models_extra_requirements(
        models=models_iter, autogen_version=autogen_version
    )
    for package in expected_packages:
        assert package in model_requirements
