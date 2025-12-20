#!/usr/bin/env python
# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501

# pylint: disable=broad-exception-caught,f-string-without-interpolation,invalid-name,import-error,import-outside-toplevel,inconsistent-quotes,line-too-long,missing-function-docstring
# pylint: disable=missing-param-doc,missing-return-doc,no-member,pointless-string-statement,too-complex,too-many-arguments,too-many-locals,too-many-try-statements
# pylint: disable=ungrouped-imports,unnecessary-lambda-assignment,unknown-option-value,unused-argument,unused-import,unused-variable

# type: ignore

# pyright: reportArgumentType=false,reportAttributeAccessIssue=false,reportCallInDefaultInitializer=false,reportConstantRedefinition=false,reportDeprecated=false,reportDuplicateImport=false,reportMissingTypeStubs=false
# pyright: reportOperatorIssue=false,reportOptionalMemberAccess=false,reportPossiblyUnboundVariable=false,reportUnreachable=false,reportUnusedImport=false,reportUnknownArgumentType=false,reportUnknownMemberType=false
# pyright: reportUnknownLambdaType=false,reportUnnecessaryIsInstance=false,reportUnusedParameter=false,reportUnusedVariable=false,reportUnknownVariableType=false

"""Weather sightseeing recommendation.

A group chat workflow checking whether the weather conditions are fine for visiting a specified site at a specified date. It contains an agent using tool to retrieve the temperature at real-time. The communication within the agents is achieved using handoffs.

Requirements: ag2[openai]==0.10.3
Tags: Weather, Travel, Group
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
from datetime import timedelta
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
    UpdateSystemMessage,
    UserProxyAgent,
    register_function,
    runtime_logging,
)
from autogen.agentchat import GroupChatManager, ReplyResult, run_group_chat
from autogen.agentchat.group import (
    AgentTarget,
    ContextVariables,
    OnCondition,
    OnContextCondition,
    ReplyResult,
    RevertToUserTarget,
    StringContextCondition,
    StringLLMCondition,
)
from autogen.agentchat.group.patterns import DefaultPattern
from autogen.agentchat.group.patterns.pattern import Pattern
from autogen.coding import LocalCommandLineCodeExecutor
from autogen.events import BaseEvent
from autogen.io.run_response import (
    AsyncRunResponseProtocol,
    RunResponseProtocol,
)
import numpy as np
import pandas as pd
import requests
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
# "weather_sightseeing_api_keys.py"
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


__MODELS_MODULE__ = load_api_key_module("weather_sightseeing")


def get_weather_sightseeing_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_weather_sightseeing_model_api_key(model_name)


class GroupDict(TypedDict):
    """Group related global dict."""

    chats: dict[str, GroupChat]
    patterns: dict[str, Pattern]


__GROUP__: GroupDict = {"chats": {}, "patterns": {}}

__AGENTS__: dict[str, ConversableAgent] = {}


# Tools


def record_info(
    date: str, time: str, city: str, context_variables: ContextVariables
) -> ReplyResult:
    """Record the date, time and city in the workflow context"""

    context_variables["date"] = date
    context_variables["definedDate"] = True
    context_variables["time"] = time
    context_variables["definedTime"] = True
    context_variables["city"] = city
    context_variables["definedCity"] = True
    context_variables["retrievedInfo"] = True

    return ReplyResult(
        context_variables=context_variables,
        message=f"Info Recorded: {date}, {time} and {city}",
    )


def record_temperature(context_variables: ContextVariables) -> ReplyResult:
    """Record the place in the workflow context"""

    place = context_variables["city"]
    target_time = context_variables["time"]
    target_date_str = context_variables["date"]

    try:
        # Use pandas to parse date and time flexibly
        datetime_str = f"{target_date_str} {target_time}"
        dt = pd.to_datetime(
            datetime_str, dayfirst=True
        )  # dayfirst=True handles DD/MM/YYYY
        hour = dt.hour
        remainder = hour % 3
        if remainder < 1.5:
            rounded_hour = hour - remainder
        else:
            rounded_hour = hour + (3 - remainder)
            if rounded_hour >= 24:
                dt += timedelta(days=1)
                rounded_hour = 0
        dt = dt.replace(hour=rounded_hour, minute=0, second=0, microsecond=0)

        # Format inputs for API
        place = place.strip()
        formatted_date = dt.strftime('%Y-%m-%d')
        formatted_time = str(dt.hour * 100)

        print(
            f"Searching for weather in {place} on {formatted_date} at {dt.hour:02d}:00..."
        )

        # Get weather data
        response = requests.get(f"https://wttr.in/{place}?format=j1")
        response.raise_for_status()
        data = response.json()

        # Search for the target date and time
        forecast = None
        for day in data['weather']:
            if day['date'] == formatted_date:
                for slot in day['hourly']:
                    if slot['time'] == formatted_time:
                        forecast = slot
                        break
                break

        # Output result
        if forecast:
            temp_c = forecast['tempC']
            feels_like = forecast['FeelsLikeC']
            desc = forecast['weatherDesc'][0]['value']
            print(
                f"\nWeather in {place} on {formatted_date} at {dt.hour:02d}:00:"
            )
            print(f"Temperature: {temp_c}°C, Feels like: {feels_like}°C")
            print(f"Conditions: {desc}")
            context_variables["definedTemperature"] = True
            context_variables["temperature"] = temp_c
        else:
            print(
                f"\nSorry, could not find the forecast for {place} on {formatted_date} at {dt.hour:02d}:00."
            )

    except Exception as e:
        print(f"Error: {e}")
        print(
            "Try formats like: '27/06/2025 2PM', '2025-06-27 14:00', 'June 27, 2025 2:30 PM'"
        )

    return ReplyResult(
        context_variables=context_variables,
        message=f"Temperature Recorded: {temp_c}",
    )


# Models

gpt_4_1_llm_config: dict[str, Any] = {
    "model": "gpt-4.1",
    "api_type": "openai",
    "api_key": get_weather_sightseeing_model_api_key("gpt_4_1"),
}

# Agents

Info_Agent_executor = LocalCommandLineCodeExecutor(
    work_dir="coding",
)

Info_Agent = ConversableAgent(
    name="Info_Agent",
    description="A place agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config={"executor": Info_Agent_executor},
    is_termination_msg=None,
    functions=[
        record_info,
    ],
    update_agent_state_before_reply=[
        UpdateSystemMessage(
            "You need to retrieve the city the date and the time"
        ),
    ],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["Info_Agent"] = Info_Agent

Triage_Agent = ConversableAgent(
    name="Triage_Agent",
    description="triage_agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[],
    update_agent_state_before_reply=[
        UpdateSystemMessage(
            "You are an order triage agent, working with a user and a group of agents to provide support for your weather tips.\n Give the speech to Info_Agent if the user hasn't defined a place.\nThe Weather_Agent will retrieve all weather related tasks. \nYou will manage all weather optimization task related tasks. Be sure to the temperature value first. Then if it's valid you can record it in the context.\n\nAsk the user for further information when necessary.\n\nThe current status of this workflow is:\nCity of interest: {city}\nCity defined: {definedCity}\nTime: {time}\nTime defined: {definedTime}\nDate: {date}\nTemperature: {temperature}"
        ),
    ],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["Triage_Agent"] = Triage_Agent

User = UserProxyAgent(
    name="User",
    description="A new User agent",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    llm_config=False,
)

__AGENTS__["User"] = User

Weather_Agent = ConversableAgent(
    name="Weather_Agent",
    description="weather_agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        record_temperature,
    ],
    update_agent_state_before_reply=[
        UpdateSystemMessage(
            "You are a weather agent, get temperature data. Check weather the temperature values are safe for the user.\nReturn to the triage_agent if temp is retrieved. \n"
        ),
    ],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["Weather_Agent"] = Weather_Agent

Info_Agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(Triage_Agent),
        condition=StringLLMCondition(prompt="The info have been retrieved"),
    )
)
Info_Agent.handoffs.set_after_work(target=RevertToUserTarget())

Triage_Agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(Info_Agent),
        condition=StringLLMCondition(
            prompt="The user hasn't defined a city, ask for the place of interest"
        ),
    )
)
Triage_Agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(Weather_Agent),
        condition=StringLLMCondition(
            prompt="Temperature has not been retrieved"
        ),
    )
)
Triage_Agent.handoffs.set_after_work(target=RevertToUserTarget())

Weather_Agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(Triage_Agent),
        condition=StringContextCondition(variable_name="{definedTemperature}"),
    )
)
Weather_Agent.handoffs.set_after_work(target=AgentTarget(Triage_Agent))

Manager_pattern = DefaultPattern(
    initial_agent=Triage_Agent,
    agents=[Weather_Agent, Info_Agent, Triage_Agent],
    user_agent=User,
    group_manager_args={
        "llm_config": False,
        "name": "Manager",
    },
    context_variables=ContextVariables(
        data={
            "timestamp": None,
            "temperature": None,
            "city": None,
            "definedCity": False,
            "date": None,
            "definedTime": False,
            "definedDate": False,
            "time": None,
            "retrievedInfo": False,
            "definedTemperature": False,
        }
    ),
)

__INITIAL_MSG__ = "Hi I want to visit a place"

__GROUP__["patterns"]["Manager_pattern"] = Manager_pattern


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
    if User not in _known_agents:
        _known_agents.append(User)
    _known_agents.append(User)
    for _group_member in _check_for_group_members(User):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(User):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if Weather_Agent not in _known_agents:
        _known_agents.append(Weather_Agent)
    _known_agents.append(Weather_Agent)
    for _group_member in _check_for_group_members(Weather_Agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(Weather_Agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if Info_Agent not in _known_agents:
        _known_agents.append(Info_Agent)
    _known_agents.append(Info_Agent)
    for _group_member in _check_for_group_members(Info_Agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(Info_Agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if Triage_Agent not in _known_agents:
        _known_agents.append(Triage_Agent)
    _known_agents.append(Triage_Agent)
    for _group_member in _check_for_group_members(Triage_Agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(Triage_Agent):
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
    results = run_group_chat(
        pattern=Manager_pattern,
        messages=__INITIAL_MSG__,
        max_rounds=40,
        pause_event=pause_event,
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
