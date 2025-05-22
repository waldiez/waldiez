# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Extras for exporting a captain agent."""

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional, Union

from waldiez.models import (
    WaldiezAgent,
    WaldiezCaptainAgent,
    WaldiezModel,
    WaldiezModelData,
)


def get_captain_agent_extras(
    agent: WaldiezAgent,
    agent_names: dict[str, str],
    all_models: list[WaldiezModel],
    serializer: Callable[..., str],
    output_dir: Optional[Union[str, Path]],
) -> str:
    """Get the extra args for the captain agent.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    agent_names : dict[str, str]
        A mapping of agent ids to agent names.
    all_models : list[WaldiezModel]
        All the models in the flow.
    serializer : Callable[..., str]
        The serializer to use.
    output_dir : Optional[Union[str, Path]]
        The output directory to save the agent lib and nested config.
    serializer : Callable[..., str]
        The serializer to use.

    Returns
    -------
    str
        The extra args to use in the captain agent.
    """
    # extra args: nested_config, agent_lib, tool_lib
    if not isinstance(agent, WaldiezCaptainAgent):
        return ""
    agent_name = agent_names[agent.id]
    save_path = str(output_dir) if output_dir else "."
    extra_args_content = "\n" + "    agent_config_save_path=os.getcwd(),"
    if agent.data.agent_lib:
        lib_dict = [
            lib.model_dump(by_alias=False) for lib in agent.data.agent_lib
        ]
        lib_json_name = f"{agent_name}_agent_lib.json"
        agent_lib_path = os.path.join(save_path, lib_json_name)
        with open(agent_lib_path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(lib_dict, f, ensure_ascii=False, indent=4)
        extra_args_content += "\n" + f'    agent_lib="{lib_json_name}",'
    if agent.data.tool_lib:
        extra_args_content += "\n" + f'    tool_lib="{agent.data.tool_lib}",'
    nested_config = generate_nested_config(
        agent,
        agent_name,
        all_models,
        save_path,
    )
    serialized_nested_config = serializer(nested_config)
    extra_args_content += (
        "\n" + f"    nested_config={serialized_nested_config},"
    )
    return extra_args_content


def generate_nested_config(
    agent: WaldiezCaptainAgent,
    agent_name: str,
    all_models: list[WaldiezModel],
    save_path: str,
) -> dict[str, Any]:
    """Generate the nested config for the captain agent.

    Parameters
    ----------
    agent : WaldiezCaptainAgent
        The captain agent.
    agent_name : str
        The agent name.
    all_models : list[WaldiezModel]
        All the models in the flow.
    save_path : str
        The path to save the nested config.

    Returns
    -------
    dict[str, Any]
        The nested config.
    """
    config_file_or_env_name = f"{agent_name}_llm_config.json"
    llm_config_list = get_llm_configs(agent, all_models)
    os.makedirs(save_path, exist_ok=True)
    config_file_or_env_path = os.path.join(save_path, config_file_or_env_name)
    with open(
        config_file_or_env_path, "w", encoding="utf-8", newline="\n"
    ) as f:
        json.dump(llm_config_list, f, ensure_ascii=False, indent=4)
    llm_config = llm_config_list[0]
    if "temperature" not in llm_config:
        llm_config["temperature"] = 1
    if "top_p" not in llm_config:
        llm_config["top_p"] = 0.95
    if "max_tokens" not in llm_config:
        llm_config["max_tokens"] = 2048
    nested_config: dict[str, Any] = {
        "autobuild_init_config": {
            "config_file_or_env": config_file_or_env_name,
            "builder_model": llm_config["model"],
            "agent_model": llm_config["model"],
        },
        "autobuild_build_config": get_auto_build_build_config(
            agent, llm_config
        ),
        "group_chat_config": {"max_round": agent.data.max_round},
        "group_chat_llm_config": None,
        "max_turns": agent.data.max_turns,
    }
    return nested_config


def get_llm_configs(
    agent: WaldiezAgent,
    all_models: list[WaldiezModel],
) -> list[dict[str, Any]]:
    """Get the config list environment variable name and its dict value.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    all_models : list[WaldiezModel]
        All the models in the flow.

    Returns
    -------
    dict[str, str]
        The llm config dict.
    """
    temperature: float = 1
    top_p: float = 0.95
    max_tokens: int = 2048
    models_in_list: list[WaldiezModel] = []
    config_list: list[dict[str, Any]] = []
    for model_id in agent.data.model_ids:
        model = get_waldiez_model(model_id, all_models)
        if model not in models_in_list:
            models_in_list.append(model)
            llm_config = model.get_llm_config(skip_price=True)
            config_list.append(llm_config)
    if not config_list:
        default_model = get_default_model(uuid.uuid4().hex)
        default_llm_config = default_model.get_llm_config(skip_price=True)
        if "temperature" not in default_llm_config:
            default_llm_config["temperature"] = temperature
        if "top_p" not in default_llm_config:
            default_llm_config["top_p"] = top_p
        if "max_tokens" not in default_llm_config:
            default_llm_config["max_tokens"] = max_tokens
        config_list.append(default_llm_config)
    return config_list


def get_auto_build_build_config(
    agent: WaldiezAgent,
    llm_config: dict[str, Any],
) -> dict[str, Any]:
    """Get the auto build build config.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    llm_config : dict[str, Any]
        The llm config.

    Returns
    -------
    dict[str, Any]
        The auto build build config.
    """
    coding = False
    code_execution_config: dict[str, Any] = {
        "timeout": 300,
        "work_dir": "groupchat",
        "last_n_messages": 1,
        "use_docker": False,
    }
    if agent.data.code_execution_config is not False:
        coding = True
        code_execution_config["work_dir"] = (
            agent.data.code_execution_config.work_dir or "groupchat"
        )
        code_execution_config["last_n_messages"] = (
            agent.data.code_execution_config.last_n_messages or 1
        )
        code_execution_config["timeout"] = (
            agent.data.code_execution_config.timeout or 300
        )
    return {
        "default_llm_config": {
            "temperature": llm_config["temperature"],
            "top_p": llm_config["top_p"],
            "max_tokens": llm_config["max_tokens"],
        },
        "code_execution_config": code_execution_config,
        "coding": coding,
    }


def get_default_model(model_id: str) -> WaldiezModel:
    """Get the default model.

    Parameters
    ----------
    model_id : str
        The model's id.

    Returns
    -------
    WaldiezModel
        The default model.
    """
    now = (
        datetime.now(tz=timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )
    return WaldiezModel(
        id=model_id,
        type="model",
        name="gpt-4o",
        description="The GPT-4o model.",
        tags=["gpt-4o"],
        requirements=[],
        created_at=now,
        updated_at=now,
        data=WaldiezModelData(
            api_type="openai",
            temperature=1,
            top_p=0.95,
            max_tokens=2048,
            base_url=None,
            api_key=None,
            api_version=None,
            default_headers={},
            price=None,
        ),
    )


def get_waldiez_model(
    model_id: str, all_models: list[WaldiezModel]
) -> WaldiezModel:
    """Get the model name from the model id.

    Parameters
    ----------
    model_id : str
        The model id.
    all_models : list[WaldiezModel]
        All the models in the flow.

    Returns
    -------
    str
        The model name.
    """
    for model in all_models:
        if model.id == model_id:
            return model
    return get_default_model(model_id)


# DEFAULT_NESTED_CONFIG = {
#         "autobuild_init_config": {
#             "config_file_or_env": "OAI_CONFIG_LIST",
#             "builder_model": "gpt-4o",
#             "agent_model": "gpt-4o",
#         },
#         "autobuild_build_config": {
#             "default_llm_config": {
#                   "temperature": 1,
#                   "top_p": 0.95,
#                   "max_tokens": 2048
#             },
#             "code_execution_config": {
#                 "timeout": 300,
#                 "work_dir": "groupchat",
#                 "last_n_messages": 1,
#                 "use_docker": False,
#             },
#             "coding": True,
#         },
#         "group_chat_config": {"max_round": 10},
#         "group_chat_llm_config": None,
#         "max_turns": 5,
#     }
