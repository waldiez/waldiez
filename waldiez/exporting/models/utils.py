# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Model/LLM related string generation functions.

Functions
---------
export_models
    Get the string representations of the LLM configs.
"""

from pathlib import Path
from typing import Callable, Dict, List, Optional

from waldiez.models import WaldiezAgent, WaldiezModel


def export_models(
    flow_name: str,
    all_models: List[WaldiezModel],
    model_names: Dict[str, str],
    serializer: Callable[..., str],
    output_dir: Optional[Path] = None,
) -> str:
    """Get the string representations of all the models in the flow.

    Parameters
    ----------
    flow_name : str
        The name of the flow.
    all_models : List[WaldiezModel]
        All the models in the flow.
    model_names : Dict[str, str]
        A mapping of model ids to model names.
    serializer : Callable[..., str]
        The serializer function.
    output_dir : Optional[Path]
        The output directory to write the api keys.

    Returns
    -------
    str
        The models' llm config string.
    """
    content = ""
    for model in all_models:
        model_name = model_names[model.id]
        model_config = model.get_llm_config()
        model_config["api_key"] = (
            f'get_{flow_name}_model_api_key("{model_name}")'
        )
        model_dict_str = serializer(model_config, tabs=0)
        model_dict_str = model_dict_str.replace(
            f'"get_{flow_name}_model_api_key("{model_name}")"',
            f'get_{flow_name}_model_api_key("{model_name}")',
        )
        content += "\n" + f"{model_name}_llm_config = {model_dict_str}" + "\n"
    if output_dir:
        write_api_keys(flow_name, all_models, model_names, output_dir)
    return content


def get_agent_llm_config_arg(
    agent: WaldiezAgent,
    all_models: List[WaldiezModel],
    model_names: Dict[str, str],
    cache_seed: Optional[int],
    tabs: int = 1,
) -> str:
    """Get the string representation of the agent's llm config argument.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    all_models : List[WaldiezModel]
        All the models in the flow.
    model_names : Dict[str, str]
        A mapping of model ids to model names.
    cache_seed : Optional[int]
        The cache seed.
    tabs : int, optional
        The number of tabs for indentation, by default 1.

    Returns
    -------
    str
        The agent's llm config argument to use.
    """
    tab = "    " * tabs if tabs > 0 else ""
    if not agent.data.model_id:
        return f"{tab}llm_config=False," + "\n"
    content = f"{tab}llm_config=" + "{\n"
    content += f'{tab}    "config_list": ['
    got_at_least_one_model = False
    temperature: Optional[float] = None
    model = next((m for m in all_models if m.id == agent.data.model_id), None)
    if model is not None:
        temperature = model.data.temperature
        model_name = model_names[agent.data.model_id]
        content += "\n" + f"{tab}        {model_name}_llm_config,"
        got_at_least_one_model = True
    if not got_at_least_one_model:  # pragma: no cover
        return f"{tab}llm_config=False," + "\n"
    content += "\n" + f"{tab}    ]," + "\n"
    content += f'{tab}    "cache_seed": {cache_seed},' + "\n"
    if temperature is not None:
        content += f'{tab}    "temperature": {temperature},' + "\n"
    content += tab + "},\n"
    return content


def write_api_keys(
    flow_name: str,
    all_models: List[WaldiezModel],
    model_names: Dict[str, str],
    output_dir: Path,
) -> None:
    """Write the api keys to a separate file.

    Parameters
    ----------
    flow_name : str
        The name of the flow.
    all_models : List[WaldiezModel]
        All the models in the flow.
    model_names : Dict[str, str]
        A mapping of model ids to model names.
    output_dir : Path
        The output directory to write the api keys.
    """
    flow_name_upper = flow_name.upper()
    api_keys_content = f'''
"""API keys for the {flow_name} models."""

import os

__{flow_name_upper}_MODEL_API_KEYS__ = {{'''
    for model in all_models:
        model_name = model_names[model.id]
        key_env = model.api_key_env_key
        api_keys_content += (
            "\n" + f'    "{model_name}": '
            f'{{"key": "{model.api_key}", "env_key": "{key_env}"}},'
        )
    api_keys_content += "\n}\n"
    api_keys_content += f'''

def get_{flow_name}_model_api_key(model_name: str) -> str:
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
    file_name = f"{flow_name}_api_keys.py"
    with open(output_dir / file_name, "w", encoding="utf-8", newline="\n") as f:
        f.write(api_keys_content)
