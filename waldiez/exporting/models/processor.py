# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods,unused-argument
"""Model exporting utilities for Waldiez."""

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from waldiez.models import WaldiezModel

from ..core.constants import FILE_HEADER
from ..core.errors import ExporterContentError
from ..core.extras.serializer import DefaultSerializer
from ..core.protocols import Serializer


@dataclass
class ModelProcessingResult:
    """Result from processing models."""

    llm_configs_content: str = ""
    api_keys_file: Optional[Path] = None
    needs_api_key_loader: bool = False


class ModelProcessor:
    """Model processor for generating LLM configs and API key loading."""

    def __init__(
        self,
        flow_name: str,
        models: list[WaldiezModel],
        model_names: dict[str, str],
        serializer: Optional[Serializer] = None,
        output_dir: Optional[Path] = None,
    ):
        self.flow_name = flow_name
        self.models = models
        self.model_names = model_names
        self.serializer = serializer or DefaultSerializer()
        self.output_dir = output_dir

    def process(self) -> str:
        """Process the flow models.

        Returns
        -------
        str
            The string representation of all models' LLM configs.
        """
        content = ""
        for model in self.models:
            model_name = self.model_names[model.id]
            model_config = model.get_llm_config()

            # Remove api_key if present
            api_key = model_config.pop("api_key", None)
            model_dict_str = self.serializer.serialize(model_config, tabs=0)
            # and use the getter function to get it when needed
            if api_key:  # pragma: no branch
                extra_arg = (
                    f'get_{self.flow_name}_model_api_key("{model_name}")'
                )
                # remove the \n}, from the end of the dict string
                model_dict_str = model_dict_str.rstrip("\n},")
                model_dict_str += f',\n    "api_key": {extra_arg}\n}}'
            content += (
                f"\n{model_name}_llm_config: dict[str, Any] = "
                f"{model_dict_str}\n"
            )

        # Write API keys file if output directory provided
        if self.output_dir:
            self.output_dir = Path(self.output_dir)
            self.output_dir.mkdir(parents=True, exist_ok=True)
            self._write_api_keys()

        return content

    def _write_api_keys(self) -> None:
        """Write API keys file."""
        flow_name_upper = self.flow_name.upper()
        api_keys_content = f'''{FILE_HEADER}
# flake8: noqa: E501
# pylint: disable=line-too-long
"""API keys for the {self.flow_name} models."""

import os

__{flow_name_upper}_MODEL_API_KEYS__ = {{'''

        for model in self.models:
            model_name = self.model_names[model.id]
            key_env = model.api_key_env_key
            api_keys_content += (
                "\n" + f'    "{model_name}": '
                f'{{"key": "{model.api_key}", "env_key": "{key_env}"}},'
            )

        api_keys_content += "\n}\n"
        api_keys_content += f'''

def get_{self.flow_name}_model_api_key(model_name: str) -> str:
    """Get the api key for the model.

    Parameters
    ----------
    model_name : str
        The name of the model.

    Returns
    -------
    str
        The api key for the model.
    """
    entry = __{flow_name_upper}_MODEL_API_KEYS__.get(model_name, {{}})
    if not entry:
        return ""
    env_key = entry.get("env_key", "")
    if env_key:
        from_env = os.environ.get(env_key, "")
        if from_env:
            return from_env
    return entry.get("key", "")
'''

        # Write the file
        file_name = f"{self.flow_name}_api_keys.py"
        output_path = (
            self.output_dir / file_name if self.output_dir else Path(file_name)
        )
        try:
            with open(output_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(api_keys_content)
        except Exception as e:  # pragma: no cover
            raise ExporterContentError(
                f"Failed to write API keys file: {e}"
            ) from e
