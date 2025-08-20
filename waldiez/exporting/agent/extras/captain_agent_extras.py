# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods,no-self-use
"""Captain agent configuration processor."""

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from waldiez.models import (
    WaldiezAgent,
    WaldiezCaptainAgent,
    WaldiezModel,
    WaldiezModelData,
)

from ...core import (
    CodeExecutionConfig,
    DefaultSerializer,
    Serializer,
    SystemMessageConfig,
    TerminationConfig,
)
from ...core.extras.agent_extras import CaptainExtras


class CaptainAgentProcessor:
    """Processor for captain agent configuration."""

    def __init__(
        self,
        agent: WaldiezAgent,
        agent_names: dict[str, str],
        all_models: list[WaldiezModel],
        serializer: Optional[Serializer] = None,
        output_dir: Optional[Path] = None,
    ):
        self.agent = agent
        self.agent_names = agent_names
        self.all_models = all_models
        self.serializer = serializer or DefaultSerializer()
        self.output_dir = output_dir

    def process(
        self,
        code_execution_config: Optional[CodeExecutionConfig] = None,
        termination_config: Optional[TerminationConfig] = None,
        system_message_config: Optional[SystemMessageConfig] = None,
    ) -> CaptainExtras:
        """Process group manager and return extras.

        Parameters
        ----------
        code_execution_config : CodeExecutionConfig, optional
            Configuration for code execution, by default None.
        termination_config : TerminationConfig, optional
            Configuration for termination, by default None.
        system_message_config : SystemMessageConfig, optional
            Configuration for system messages, by default None.

        Returns
        -------
        CaptainExtras
            The processed result containing extra arguments, before content,
            imports, and environment variables.
        """
        result = CaptainExtras(
            instance_id=self.agent.id,
            code_execution_config=code_execution_config,
            termination_config=termination_config,
            system_message_config=system_message_config,
        )
        if not self.agent.is_captain or not isinstance(
            self.agent, WaldiezCaptainAgent
        ):
            return result
        agent_name = self.agent_names[self.agent.id]
        save_path = str(self.output_dir) if self.output_dir else "."
        if save_path != ".":
            os.makedirs(save_path, exist_ok=True)
        result.add_arg("agent_config_save_path=os.getcwd()", tabs=1)
        if self.agent.data.agent_lib:
            lib_dict = [
                lib.model_dump(by_alias=False)
                for lib in self.agent.data.agent_lib
            ]
            lib_json_name = f"{agent_name}_agent_lib.json"
            agent_lib_path = os.path.join(save_path, lib_json_name)
            with open(agent_lib_path, "w", encoding="utf-8", newline="\n") as f:
                json.dump(lib_dict, f, ensure_ascii=False, indent=4)
            result.add_arg(f'agent_lib="{lib_json_name}"', tabs=1)
        if self.agent.data.tool_lib:
            result.add_arg(f'tool_lib="{self.agent.data.tool_lib}"', tabs=1)
        nested_config = self._generate_nested_config(
            self.agent,
            agent_name,
            save_path,
        )
        result.set_nested_config(nested_config)
        serialized_nested_config = self.serializer.serialize(nested_config)
        result.add_arg(f"nested_config={serialized_nested_config}", tabs=1)
        return result

    def _generate_nested_config(
        self,
        agent: WaldiezCaptainAgent,
        agent_name: str,
        save_path: str,
    ) -> dict[str, Any]:
        """Generate the nested config for the captain agent.

        Parameters
        ----------
        agent_name : str
            The agent name.
        save_path : str
            The path to save the nested config.

        Returns
        -------
        dict[str, Any]
            The nested config.
        """
        config_file_or_env_name = f"{agent_name}_llm_config.json"
        llm_config_list = self._get_llm_configs()
        os.makedirs(save_path, exist_ok=True)
        config_file_or_env_path = os.path.join(
            save_path, config_file_or_env_name
        )
        with open(
            config_file_or_env_path, "w", encoding="utf-8", newline="\n"
        ) as f:
            json.dump(llm_config_list, f, ensure_ascii=False, indent=4)
        llm_config = llm_config_list[0]
        if "temperature" not in llm_config and "top_p" not in llm_config:
            llm_config["temperature"] = 1
        if "top_p" not in llm_config and "temperature" not in llm_config:
            llm_config["top_p"] = 0.95
        if "max_tokens" not in llm_config:
            llm_config["max_tokens"] = 2048
        return {
            "autobuild_init_config": {
                "config_file_or_env": config_file_or_env_name,
                "builder_model": llm_config["model"],
                "agent_model": llm_config["model"],
            },
            "autobuild_build_config": self._get_auto_build_build_config(
                llm_config
            ),
            "group_chat_config": {"max_round": agent.data.max_round},
            "group_chat_llm_config": None,
            "max_turns": agent.data.max_turns,
        }

    def _get_llm_configs(self) -> list[dict[str, Any]]:
        """Get the LLM configurations for the captain agent.

        Returns
        -------
        list[dict[str, Any]]
            The list of LLM configurations.
        """
        temperature = 1
        top_p = 0.95
        max_tokens = 2048
        models_in_list: list[WaldiezModel] = []
        config_list: list[dict[str, Any]] = []
        for model_id in self.agent.data.model_ids:
            model = self._get_waldiez_model(model_id)
            if model not in models_in_list:
                models_in_list.append(model)
                llm_config = model.get_llm_config(skip_price=True)
                config_list.append(llm_config)
        if not config_list:
            default_model = self._get_default_model(uuid.uuid4().hex)
            default_llm_config = default_model.get_llm_config(skip_price=True)
            if (
                "temperature" not in default_llm_config
                and "top_p" not in default_llm_config
            ):
                default_llm_config["temperature"] = temperature
            if (
                "top_p" not in default_llm_config
                and "temperature" not in default_llm_config
            ):
                default_llm_config["top_p"] = top_p
            if "max_tokens" not in default_llm_config:
                default_llm_config["max_tokens"] = max_tokens
            config_list.append(default_llm_config)
        return config_list

    def _get_auto_build_build_config(
        self,
        llm_config: dict[str, Any],
    ) -> dict[str, Any]:
        """Get the auto build build config.

        Parameters
        ----------
        llm_config : dict[str, Any]
            The LLM configuration.

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
        if self.agent.data.code_execution_config is not False:
            coding = True
            code_execution_config["work_dir"] = (
                self.agent.data.code_execution_config.work_dir or "groupchat"
            )
            code_execution_config["last_n_messages"] = (
                self.agent.data.code_execution_config.last_n_messages or 1
            )
            code_execution_config["timeout"] = (
                self.agent.data.code_execution_config.timeout or 300
            )
        to_return: dict[str, Any] = {
            "default_llm_config": {
                "max_tokens": llm_config["max_tokens"],
            },
            "code_execution_config": code_execution_config,
            "coding": coding,
        }
        if llm_config.get("temperature") is not None:
            to_return["default_llm_config"]["temperature"] = llm_config[
                "temperature"
            ]
        elif llm_config.get("top_p") is not None:
            to_return["default_llm_config"]["top_p"] = llm_config["top_p"]
        return to_return

    def _get_waldiez_model(self, model_id: str) -> WaldiezModel:
        """Get the Waldiez model by its ID.

        Parameters
        ----------
        model_id : str
            The model's ID.

        Returns
        -------
        WaldiezModel
            The Waldiez model.
        """
        for model in self.all_models:
            if model.id == model_id:
                return model
        return self._get_default_model(model_id)

    # noinspection PyMethodMayBeStatic
    def _get_default_model(self, model_id: str) -> WaldiezModel:
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
