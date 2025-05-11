# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Extras for exporting a captain agent."""

import json
import os
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
    llm_config = get_llm_config(agent, all_models)
    os.makedirs(save_path, exist_ok=True)
    config_file_or_env_path = os.path.join(save_path, config_file_or_env_name)
    with open(
        config_file_or_env_path, "w", encoding="utf-8", newline="\n"
    ) as f:
        json.dump(llm_config, f, ensure_ascii=False, indent=4)
    nested_config = {
        "autobuild_init_config": {
            "config_file_or_env": config_file_or_env_name,
            "builder_model": llm_config["config_list"][0]["model"],
            "agent_model": llm_config["config_list"][0]["model"],
        },
        "autobuild_build_config": get_auto_build_build_config(
            agent, llm_config
        ),
        "group_chat_config": {"max_round": agent.data.max_round},
        "group_chat_llm_config": None,
        "max_turns": agent.data.max_turns,
    }
    return nested_config


def get_llm_config(
    agent: WaldiezAgent,
    all_models: list[WaldiezModel],
) -> dict[str, Any]:
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
    model_name = "gpt-4o"
    temperature: Optional[float] = 1
    top_p: Optional[float] = 0.95
    max_tokens: Optional[int] = 2048
    config_dict: dict[str, Any] = {}
    if agent.data.model_id:
        waldiez_model = get_waldiez_model(agent.data.model_id, all_models)
        llm_config = waldiez_model.get_llm_config(skip_price=True)
        for key in ["temperature", "top_p", "max_tokens"]:
            if key not in llm_config:
                llm_config[key] = None
        temp = llm_config.pop("temperature", None)
        config_dict = {
            "config_list": [llm_config],
        }
        if temp is not None:
            config_dict["temperature"] = temp
            return config_dict
    config_dict = {
        "model": model_name,
        "top_p": top_p,
        "max_tokens": max_tokens,
    }
    return {
        "config_list": [config_dict],
        "temperature": temperature,
    }


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
    code_execution_config = {
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
            "top_p": llm_config["config_list"][0]["top_p"],
            "max_tokens": llm_config["config_list"][0]["max_tokens"],
        },
        "code_execution_config": code_execution_config,
        "coding": coding,
    }


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
            api_key=os.environ.get("OPENAI_API_KEY", "REPLACE_ME"),
            api_version=None,
            default_headers={},
            price=None,
        ),
    )
