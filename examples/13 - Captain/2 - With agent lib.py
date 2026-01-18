#!/usr/bin/env python
# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# flake8: noqa: E501

# pylint: disable=broad-exception-caught,f-string-without-interpolation,invalid-name,import-error,import-outside-toplevel,inconsistent-quotes,line-too-long,missing-function-docstring
# pylint: disable=missing-param-doc,missing-return-doc,no-member,pointless-string-statement,too-complex,too-many-arguments,too-many-locals,too-many-try-statements
# pylint: disable=ungrouped-imports,unnecessary-lambda-assignment,unknown-option-value,unused-argument,unused-import,unused-variable

# type: ignore

# pyright: reportArgumentType=false,reportAttributeAccessIssue=false,reportCallInDefaultInitializer=false,reportConstantRedefinition=false,reportDeprecated=false,reportDuplicateImport=false,reportMissingTypeStubs=false
# pyright: reportOperatorIssue=false,reportOptionalMemberAccess=false,reportPossiblyUnboundVariable=false,reportUnreachable=false,reportUnusedImport=false,reportUnknownArgumentType=false,reportUnknownMemberType=false
# pyright: reportUnknownLambdaType=false,reportUnnecessaryIsInstance=false,reportUnusedParameter=false,reportUnusedVariable=false,reportUnknownVariableType=false

"""2 - With agent lib.

Using CaptainAgent with agent library. Based on: <https://docs.ag2.ai/latest/docs/user-guide/reference-agents/captainagent/#using-agent-library-only>

Requirements: ag2[openai]==0.10.4, arxiv, chromadb, easyocr, huggingface-hub, markdownify, openai-whisper, pandas, pymupdf, python-pptx, scipy, sentence-transformers, wikipedia-api
Tags: CaptainAgent, ag2
🧩 generated with ❤️ by Waldiez.
"""

# Imports

import asyncio
import csv
import importlib
import json
import os
import shutil
import sqlite3
import sys
import threading
import traceback
from dataclasses import asdict
from pathlib import Path
from pprint import pprint
from types import ModuleType
from typing import (
    Annotated,
    Any,
    Callable,
    Coroutine,
    Dict,
    List,
    Optional,
    Set,
    Tuple,
    TypedDict,
    Union,
)

import autogen  # type: ignore
from autogen import (
    Agent,
    Cache,
    ChatResult,
    ConversableAgent,
    GroupChat,
    UserProxyAgent,
    runtime_logging,
)
from autogen.agentchat import ReplyResult
from autogen.agentchat.contrib.captainagent import CaptainAgent
from autogen.agentchat.group import ContextVariables
from autogen.agentchat.group.patterns.pattern import Pattern
from autogen.coding import LocalCommandLineCodeExecutor
from autogen.events import BaseEvent
from autogen.io.run_response import (
    AsyncRunResponseProtocol,
    RunResponseProtocol,
)
import numpy as np
from dotenv import load_dotenv

# Common environment variable setup for Waldiez flows
load_dotenv(override=True)
os.environ["AUTOGEN_USE_DOCKER"] = "0"
os.environ["TOGETHER_NO_BANNER"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
#
# let's try to avoid:
# module 'numpy' has no attribute '_no_nep50_warning'"
# ref: https://github.com/numpy/numpy/blob/v2.2.2/doc/source/release/2.2.0-notes.rst#nep-50-promotion-state-option-removed
os.environ["NEP50_DEPRECATION_WARNING"] = "0"
os.environ["NEP50_DISABLE_WARNING"] = "1"
os.environ["NPY_PROMOTION_STATE"] = "weak"
if not hasattr(np, "_no_pep50_warning"):

    import contextlib
    from typing import Generator

    @contextlib.contextmanager
    def _np_no_nep50_warning() -> Generator[None, None, None]:
        """Dummy function to avoid the warning.

        Yields
        ------
        None
            Nothing.
        """
        yield

    setattr(np, "_no_pep50_warning", _np_no_nep50_warning)  # noqa

# Start logging.


def start_logging() -> None:
    """Start logging."""
    runtime_logging.start(
        logger_type="sqlite",
        config={"dbname": "flow.db"},
    )


start_logging()

# Load model API keys
# NOTE:
# This section assumes that a file named:
# "wf_2___with_agent_lib_api_keys.py"
# exists in the same directory as this file.
# This file contains the API keys for the models used in this flow.
# It should be .gitignored and not shared publicly.
# If this file is not present, you can either create it manually
# or change the way API keys are loaded in the flow.


def load_api_key_module(flow_name: str) -> ModuleType:
    """Load the api key module.

    Parameters
    ----------
    flow_name : str
        The flow name.

    Returns
    -------
    ModuleType
        The api keys loading module.
    """
    module_name = f"{flow_name}_api_keys"
    if module_name in sys.modules:
        return importlib.reload(sys.modules[module_name])
    return importlib.import_module(module_name)


__MODELS_MODULE__ = load_api_key_module("wf_2___with_agent_lib")


def get_wf_2___with_agent_lib_model_api_key(model_name: str) -> str:
    """Get the model api key.
    Parameters
    ----------
    model_name : str
        The model name.

    Returns
    -------
    str
        The model api key.
    """
    return __MODELS_MODULE__.get_wf_2___with_agent_lib_model_api_key(model_name)


class GroupDict(TypedDict):
    """Group related global dict."""

    chats: dict[str, GroupChat]
    patterns: dict[str, Pattern]


__GROUP__: GroupDict = {"chats": {}, "patterns": {}}

__AGENTS__: dict[str, ConversableAgent] = {}

__CACHE_SEED__: int | None = None

__IS_WAAT__: bool = False


# Models

gpt_4o_llm_config: dict[str, Any] = {
    "model": "gpt-4o",
    "api_type": "openai",
    "api_key": get_wf_2___with_agent_lib_model_api_key("gpt_4o"),
}

# Agents

Captain_executor = LocalCommandLineCodeExecutor(
    work_dir="groupchat",
)

# try to avoid having both temperature and top_p in the config
try:
    _CAPTAIN_AGENT_DEFAULT_CONFIG = CaptainAgent.DEFAULT_NESTED_CONFIG
    _CAPTAIN_AGENT_DEFAULT_CONFIG.get("autobuild_build_config", {}).get(
        "default_llm_config", {}
    ).pop("top_p", None)
    CaptainAgent.DEFAULT_NESTED_CONFIG = _CAPTAIN_AGENT_DEFAULT_CONFIG
except Exception as e:
    print(f"Error occurred while patching default nested config: {e}")

Captain = CaptainAgent(
    name="Captain",
    description="A new Captain agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config={"executor": Captain_executor},
    is_termination_msg=None,
    agent_config_save_path=os.getcwd(),
    agent_lib="Captain_agent_lib.json",
    nested_config={
        "autobuild_init_config": {
            "config_file_or_env": "Captain_llm_config.json",
            "builder_model": "gpt-4o",
            "agent_model": "gpt-4o",
        },
        "autobuild_build_config": {
            "default_llm_config": {"max_tokens": 2048, "temperature": 1},
            "code_execution_config": {
                "timeout": 300,
                "work_dir": "groupchat",
                "last_n_messages": 1,
                "use_docker": False,
            },
            "coding": True,
        },
        "group_chat_config": {"max_round": 10},
        "group_chat_llm_config": None,
        "max_turns": 5,
    },
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4o_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["Captain"] = Captain

User_proxy = UserProxyAgent(
    name="User_proxy",
    description="A new User proxy agent",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    llm_config=False,
)

__AGENTS__["User_proxy"] = User_proxy

__INITIAL_MSG__ = "Find a recent paper about large language models on arxiv and find its potential applications in software."


def get_sqlite_out(dbname: str, table: str, csv_file: str) -> None:
    """Convert a sqlite table to csv and json files.

    Parameters
    ----------
    dbname : str
        The sqlite database name.
    table : str
        The table name.
    csv_file : str
        The csv file name.
    """
    # pylint: disable=broad-exception-caught,too-many-try-statements
    try:
        conn = sqlite3.connect(dbname)
    except BaseException:
        return
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = conn.execute(query)
    except BaseException:
        conn.close()
        return
    try:
        rows = cursor.fetchall()
        column_names = [description[0] for description in cursor.description]
        data = [dict(zip(column_names, row, strict=True)) for row in rows]
        cursor.close()
        conn.close()
    except BaseException:
        try:
            cursor.close()
            conn.close()
        except BaseException:
            pass
        return
    try:
        with open(csv_file, "w", newline="", encoding="utf-8") as file:
            csv_writer = csv.DictWriter(file, fieldnames=column_names)
            csv_writer.writeheader()
            csv_writer.writerows(data)
        json_file = csv_file.replace(".csv", ".json")
        with open(json_file, "w", encoding="utf-8", newline="\n") as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
    except BaseException:
        return


def stop_logging() -> None:
    """Stop logging."""
    if not __IS_WAAT__:
        runtime_logging.stop()
        if not os.path.exists("logs"):
            try:
                os.makedirs("logs", exist_ok=True)
            except BaseException:
                pass
        for table in [
            "chat_completions",
            "agents",
            "oai_wrappers",
            "oai_clients",
            "version",
            "events",
            "function_calls",
        ]:
            dest = os.path.join("logs", f"{table}.csv")
            get_sqlite_out("flow.db", table, dest)


def _check_for_extra_agents(agent: ConversableAgent) -> list[ConversableAgent]:
    _extra_agents: list[ConversableAgent] = []
    _agent_cls_name = agent.__class__.__name__
    if _agent_cls_name == "CaptainAgent":
        _assistant_agent = getattr(agent, "assistant", None)
        if _assistant_agent and _assistant_agent not in _extra_agents:
            _extra_agents.append(_assistant_agent)
        _executor_agent = getattr(agent, "executor", None)
        if _executor_agent and _executor_agent not in _extra_agents:
            _extra_agents.append(_executor_agent)
    return _extra_agents


def _check_for_group_members(agent: ConversableAgent) -> list[ConversableAgent]:
    _extra_agents: list[ConversableAgent] = []
    _group_chat = getattr(agent, "_groupchat", None)
    if _group_chat:
        _chat_agents = getattr(_group_chat, "agents", [])
        if isinstance(_chat_agents, list):
            for _group_member in _chat_agents:
                if _group_member not in _extra_agents:
                    _extra_agents.append(_group_member)
    _manager = getattr(agent, "_group_manager", None)
    if _manager:
        if _manager not in _extra_agents:
            _extra_agents.append(_manager)
        for _group_member in _check_for_group_members(_manager):
            if _group_member not in _extra_agents:
                _extra_agents.append(_group_member)
    return _extra_agents


def _get_known_agents() -> list[ConversableAgent]:
    _known_agents: list[ConversableAgent] = []
    if User_proxy not in _known_agents:
        _known_agents.append(User_proxy)
    _known_agents.append(User_proxy)
    for _group_member in _check_for_group_members(User_proxy):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(User_proxy):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if Captain not in _known_agents:
        _known_agents.append(Captain)
    _known_agents.append(Captain)
    for _group_member in _check_for_group_members(Captain):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(Captain):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)
    return _known_agents


def store_error(exc: BaseException | None = None) -> None:
    """Store the error in error.json.

    Parameters
    ----------
    exc : BaseException | None
        The exception we got if any.
    """
    reason = (
        "Event handler stopped processing"
        if not exc
        else traceback.format_exc()
    )
    try:
        with open("error.json", "w", encoding="utf-8", newline="\n") as file:
            file.write(json.dumps({"error": reason}))
    except BaseException:  # pylint: disable=broad-exception-caught
        pass


def store_results(result_dicts: list[dict[str, Any]]) -> None:
    """Store the results to results.json.
    Parameters
    ----------
    result_dicts : list[dict[str, Any]]
        The list of the results.
    """
    try:
        with open("results.json", "w", encoding="utf-8", newline="\n") as file:
            file.write(
                json.dumps(
                    {'results': result_dicts}, indent=4, ensure_ascii=False
                )
            )
    except BaseException:  # pylint: disable=broad-exception-caught
        pass


def _get_agent_by_name(
    agents: list[ConversableAgent], agent_name: str
) -> tuple[int, ConversableAgent | None]:
    """Get an agent by its name."""
    for ind, agent in enumerate(agents):
        if agent.name == agent_name:
            return ind, agent
    return -1, None


def _handle_resume_group_pattern(
    detected_pattern: Pattern, state_messages: list[dict[str, Any]]
) -> None:
    """Handle detected pattern for resuming a group chat."""
    # pylint: disable=broad-exception-caught,too-many-try-statements
    try:
        _pattern_type = getattr(detected_pattern.__class__, "__name__", None)
    except BaseException:
        return
    if _pattern_type == "RoundRobinPattern" and state_messages:
        last_message = state_messages[-1]
        if not last_message or not isinstance(last_message, dict):
            return
        last_agent_name = last_message.get("name", "")
        if not last_agent_name:
            return
        try:
            idx, last_agent = _get_agent_by_name(
                detected_pattern.agents, last_agent_name
            )
            if last_agent and len(detected_pattern.agents) >= (idx + 1):
                detected_pattern.agents.append(detected_pattern.user_agent)
                detected_pattern.initial_agent = detected_pattern.agents[
                    idx + 1
                ]
                detected_pattern.user_agent = detected_pattern.agents[idx]
                # fmt: off
                new_agent_order_list = detected_pattern.agents[idx+1:] + detected_pattern.agents[:idx]
                # fmt: on
                detected_pattern.agents = new_agent_order_list
        except BaseException:
            pass


def _prepare_resume(state_json: str | Path | None = None) -> None:
    """Prepare resuming a chat from state.json.

    state.json format:
        {
            "messages": [{"content": "..", "role": "...", "name": "..."}],
            "context_variables": {"key1": "value1", "key2": 4, "key3": [], "key4": {"other": "key"}}
        }
    metadata.json format:
        {
            "type": "group",
            "group": {  # one of:
                "pattern" : "<pattern_name>",
                "manager" : "<manager_name>",
            }
        }

    Parameters
    ----------
    state_json : str | Path | None
        The path to state.json to load previous state.
    """
    # pylint: disable=broad-exception-caught,too-many-try-statements,global-statement
    global __INITIAL_MSG__
    if not state_json or not Path(state_json).is_file():
        return
    metadata_json = str(state_json).replace("state.json", "metadata.json")
    if not metadata_json or not Path(metadata_json).is_file():
        return
    try:
        with open(metadata_json, "r", encoding="utf-8") as f:
            _metadata_dict = json.load(f)
    except BaseException:
        return
    if not _metadata_dict or not isinstance(_metadata_dict, dict):
        return
    _state_chat_type = _metadata_dict.get("type", "")
    if _state_chat_type != "group":
        # only resume group chats
        return
    _state_group_details = _metadata_dict.get("group", {})
    if not _state_group_details or not isinstance(_state_group_details, dict):
        return
    # either pattern or manager
    _state_group_pattern = _state_group_details.get("pattern", "")
    _state_group_manager = _state_group_details.get("manager", "")
    if not _state_group_pattern and not _state_group_manager:
        return
    try:
        with open(state_json, "r", encoding="utf-8") as f:
            _state_dict = json.load(f)
    except BaseException:
        return
    if not _state_dict or not isinstance(_state_dict, dict):
        return
    _state_messages = _state_dict.get("messages", [])
    _detected_pattern = None
    if _state_group_pattern and isinstance(_state_group_pattern, str):
        _detected_pattern = __GROUP__["patterns"].get(
            _state_group_pattern, None
        )
        if _detected_pattern:
            _state_context_variables = _state_dict.get("context_variables", {})
            if _state_context_variables and isinstance(
                _state_context_variables, dict
            ):
                _new_context_variables = (
                    _detected_pattern.context_variables.data.copy()
                )
                _new_context_variables.update(_state_context_variables)
                _detected_pattern.context_variables = ContextVariables(
                    data=_new_context_variables
                )
        if _state_messages and isinstance(_state_messages, list):
            __INITIAL_MSG__ = _state_messages
    elif _state_group_manager and isinstance(_state_group_manager, str):
        _known_group_manager = __AGENTS__.get(_state_group_manager, None)
        if _known_group_manager and hasattr(_known_group_manager, "groupchat"):
            if _state_messages and isinstance(_state_messages, list):
                _known_group_manager.groupchat.messages = _state_messages
        else:
            _detected_pattern = __GROUP__["patterns"].get(
                f"{_state_group_manager}_pattern"
            )
            if _detected_pattern:
                _state_context_variables = _state_dict.get(
                    "context_variables", {}
                )
                if _state_context_variables and isinstance(
                    _state_context_variables, dict
                ):
                    _new_context_variables = (
                        _detected_pattern.context_variables.data.copy()
                    )
                    _new_context_variables.update(_state_context_variables)
                    _detected_pattern.context_variables = ContextVariables(
                        data=_new_context_variables
                    )
            if _state_messages and isinstance(_state_messages, list):
                __INITIAL_MSG__ = _state_messages
    if (
        _detected_pattern
        and _state_messages
        and isinstance(_state_messages, list)
    ):
        _handle_resume_group_pattern(_detected_pattern, _state_messages)


# Start chatting


def main(
    on_event: Callable[[BaseEvent, list[ConversableAgent]], bool] | None = None,
    state_json: str | Path | None = None,
) -> list[dict[str, Any]]:
    """Start chatting.

    Returns
    -------
    list[dict[str, Any]]
        The result of the chat session.

    Raises
    ------
    SystemExit
        If the user interrupts the chat session.
    """
    if state_json:
        _prepare_resume(state_json)
    results: list[RunResponseProtocol] | RunResponseProtocol = []
    result_dicts: list[dict[str, Any]] = []
    a_pause_event = asyncio.Event()
    a_pause_event.set()
    pause_event = threading.Event()
    pause_event.set()
    if Path(".cache").is_dir():
        shutil.rmtree(".cache", ignore_errors=True)
    results = User_proxy.run(
        Captain,
        summary_method="last_msg",
        max_turns=1,
        clear_history=True,
        message=__INITIAL_MSG__,
    )
    if not isinstance(results, list):
        results = [results]  # pylint: disable=redefined-variable-type
    got_agents = False
    known_agents: list[ConversableAgent] = []
    result_events: list[dict[str, Any]] = []
    if on_event:
        for index, result in enumerate(results):
            result_events = []
            for event in result.events:
                try:
                    result_events.append(
                        event.model_dump(mode="json", fallback=str)
                    )
                except BaseException:  # pylint: disable=broad-exception-caught
                    pass
                if not got_agents:
                    known_agents = _get_known_agents()
                    got_agents = True
                pause_event.clear()
                try:
                    should_continue = on_event(event, known_agents)
                    pause_event.set()
                except BaseException as e:
                    stop_logging()
                    store_error(e)
                    raise SystemExit("Error in event handler: " + str(e)) from e
                if getattr(event, "type") == "run_completion":
                    break
                if not should_continue:
                    stop_logging()
                    store_error()
                    raise SystemExit("Event handler stopped processing")
            result_cost = result.cost
            result_context_variables = result.context_variables
            result_dict = {
                "index": index,
                "uuid": str(result.uuid),
                "events": result_events,
                "messages": result.messages,
                "summary": result.summary,
                "cost": (
                    result_cost.model_dump(mode="json", fallback=str)
                    if result_cost
                    else None
                ),
                "context_variables": (
                    result_context_variables.model_dump(
                        mode="json", fallback=str
                    )
                    if result_context_variables
                    else None
                ),
                "last_speaker": result.last_speaker,
            }
            result_dicts.append(result_dict)
    else:
        for index, result in enumerate(results):
            result_events = []
            # result.process()
            for event in result.events:
                try:
                    result_events.append(
                        event.model_dump(mode="json", fallback=str)
                    )
                except BaseException:  # pylint: disable=broad-exception-caught
                    pass
            result_cost = result.cost
            result_context_variables = result.context_variables
            result_dict = {
                "index": index,
                "uuid": str(result.uuid),
                "events": result_events,
                "messages": result.messages,
                "summary": result.summary,
                "cost": (
                    result_cost.model_dump(mode="json", fallback=str)
                    if result_cost
                    else None
                ),
                "context_variables": (
                    result_context_variables.model_dump(
                        mode="json", fallback=str
                    )
                    if result_context_variables
                    else None
                ),
                "last_speaker": result.last_speaker,
            }
            result_dicts.append(result_dict)

    stop_logging()
    store_results(result_dicts)
    return result_dicts


def call_main() -> None:
    """Run the main function and print the results."""
    state_json: str | Path | None = None
    if "--state" in sys.argv:
        entry_index = sys.argv.index("--state")
        if entry_index + 1 < len(sys.argv):
            state_location = Path(sys.argv[entry_index + 1])
            if state_location.resolve().exists():
                state_json = state_location
    results: list[dict[str, Any]] = main(None, state_json=state_json)
    print(json.dumps(results, default=str, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    # Let's go!
    call_main()
