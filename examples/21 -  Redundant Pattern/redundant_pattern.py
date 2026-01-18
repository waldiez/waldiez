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

"""Waldiez Flow.

A waldiez flow

Requirements: ag2[openai]==0.10.4
Tags:
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
    AssistantAgent,
    Cache,
    ChatResult,
    ConversableAgent,
    GroupChat,
    UserProxyAgent,
    register_function,
    runtime_logging,
)
from autogen.agentchat import GroupChatManager, ReplyResult, run_group_chat
from autogen.agentchat.group import (
    AgentTarget,
    ContextExpression,
    ContextVariables,
    ExpressionAvailableCondition,
    ExpressionContextCondition,
    NestedChatTarget,
    OnContextCondition,
    ReplyResult,
    RevertToUserTarget,
)
from autogen.agentchat.group.patterns import DefaultPattern
from autogen.agentchat.group.patterns.pattern import Pattern
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
# "waldiez_flow_api_keys.py"
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


__MODELS_MODULE__ = load_api_key_module("waldiez_flow")


def get_waldiez_flow_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_waldiez_flow_model_api_key(model_name)


class GroupDict(TypedDict):
    """Group related global dict."""

    chats: dict[str, GroupChat]
    patterns: dict[str, Pattern]


__GROUP__: GroupDict = {"chats": {}, "patterns": {}}

__AGENTS__: dict[str, ConversableAgent] = {}

__CACHE_SEED__: int | None = None

__IS_WAAT__: bool = False


# Tools

"""Replace this with your code.

Add any code here that will be placed at the top of the whole flow.
"""

# Example:
# global variable
# DATABASE = {
#     "users": [
#         {"id": 1, "name": "Alice"},
#         {"id": 2, "name": "Bob"},
#     ],
#     "posts": [
#         {"id": 1, "title": "Hello, world!", "author_id": 1},
#         {"id": 2, "title": "Another post", "author_id": 2},
#     ],
# }
#
# Add your code below

redundant_agent_names = ["agent_a", "agent_b", "agent_c"]


def initiate_task(
    task: Annotated[str, "The task to be processed by multiple agents"],
    task_type: Annotated[
        str, "Type of task: 'creative', 'problem_solving', 'factual', etc."
    ],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Initiate processing of a task across multiple redundant agents with different approaches
    """
    context_variables["task_initiated"] = True
    context_variables["task_completed"] = False
    context_variables["evaluation_complete"] = False
    context_variables["current_task"] = task
    context_variables["task_type"] = task_type

    # Reset previous results
    context_variables["agent_a_result"] = None
    context_variables["agent_b_result"] = None
    context_variables["agent_c_result"] = None
    context_variables["evaluation_scores"] = {}
    context_variables["final_result"] = None
    context_variables["selected_approach"] = None

    return ReplyResult(
        message=f"Task initiated: '{task}' (Type: {task_type}). Will process with multiple independent approaches.",
        context_variables=context_variables,
    )


def evaluate_and_select(
    evaluation_notes: Annotated[
        str, "Detailed evaluation of each agent's result"
    ],
    score_a: Annotated[int, "Score for Agent A's approach (1-10 scale)"],
    score_b: Annotated[int, "Score for Agent B's approach (1-10 scale)"],
    score_c: Annotated[int, "Score for Agent C's approach (1-10 scale)"],
    selected_result: Annotated[str, "The selected or synthesized final result"],
    selection_rationale: Annotated[
        str,
        "Explanation for why this result was selected or how it was synthesized",
    ],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Evaluate the different approaches and select or synthesize the best result
    """
    # Create scores dictionary from individual parameters
    scores = {"agent_a": score_a, "agent_b": score_b, "agent_c": score_c}

    context_variables["evaluation_notes"] = evaluation_notes
    context_variables["evaluation_scores"] = scores
    context_variables["final_result"] = selected_result
    context_variables["evaluation_complete"] = True

    # Determine which approach was selected (highest score)
    max_score = 0
    selected_approach = None
    for agent, score in scores.items():
        if score > max_score:
            max_score = score
            selected_approach = agent
    context_variables["selected_approach"] = selected_approach

    return ReplyResult(
        message=f"Evaluation complete. Selected result: {selection_rationale[:100]}...",
        context_variables=context_variables,
        target=RevertToUserTarget(),
    )


# Models

gpt_4_1_mini_llm_config: dict[str, Any] = {
    "model": "gpt-4.1-mini",
    "api_type": "openai",
    "api_key": get_waldiez_flow_model_api_key("gpt_4_1_mini"),
}

# Agents

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

agent_a = AssistantAgent(
    name="agent_a",
    description="A new Assistant agent",
    system_message="You are Agent A, specializing in a structured, analytical approach to tasks.\n\n        For creative tasks:\n        - Use structured frameworks and established patterns\n        - Follow proven methodologies and best practices\n        - Focus on clarity, organization, and logical progression\n\n        For problem-solving tasks:\n        - Use first principles thinking and systematic analysis\n        - Break down problems into component parts\n        - Consider established solutions and scientific approaches\n\n        For factual information:\n        - Prioritize objective, verifiable data\n        - Present information in a structured, hierarchical manner\n        - Focus on accuracy and comprehensiveness\n\n        Always identify your approach clearly and explain your methodology as part of your response.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_mini_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["agent_a"] = agent_a

agent_b = AssistantAgent(
    name="agent_b",
    description="A new Assistant agent",
    system_message="You are Agent B, specializing in a creative, lateral-thinking approach to tasks.\n\n        For creative tasks:\n        - Use metaphors, analogies, and unexpected connections\n        - Think outside conventional frameworks\n        - Explore unique perspectives and novel combinations\n\n        For problem-solving tasks:\n        - Use creative ideation and divergent thinking\n        - Look for non-obvious connections and innovative approaches\n        - Consider unconventional solutions outside the mainstream\n\n        For factual information:\n        - Present information through narratives and examples\n        - Use contextual understanding and practical applications\n        - Focus on making information relatable and engaging\n\n        Always identify your approach clearly and explain your methodology as part of your response.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_mini_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["agent_b"] = agent_b

agent_c = AssistantAgent(
    name="agent_c",
    description="A new Assistant agent",
    system_message="You are Agent C, specializing in a thorough, comprehensive approach to tasks.\n\n        For creative tasks:\n        - Combine multiple perspectives and diverse inputs\n        - Draw from cross-disciplinary knowledge and varied examples\n        - Focus on thoroughness and covering all possible angles\n\n        For problem-solving tasks:\n        - Consider multiple solution pathways simultaneously\n        - Evaluate trade-offs and present alternative approaches\n        - Focus on robustness and addressing edge cases\n\n        For factual information:\n        - Present multiple perspectives and nuanced views\n        - Include historical context and future implications\n        - Focus on depth and breadth of coverage\n\n        Always identify your approach clearly and explain your methodology as part of your response.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_mini_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["agent_c"] = agent_c

evaluator_agent = ConversableAgent(
    name="evaluator_agent",
    description="A new Assistant agent",
    system_message="You are the Evaluator Agent responsible for assessing multiple approaches to the same task and selecting or synthesizing the best result.\n\n        Your role is to:\n        1. Carefully review each approach and result\n        2. Evaluate each solution based on criteria appropriate to the task type\n        3. Assign scores to each approach on a scale of 1-10\n        4. Either select the best approach or synthesize a superior solution by combining strengths\n\n        For creative tasks, evaluate based on:\n        - Originality and uniqueness\n        - Effectiveness in addressing the creative brief\n        - Quality of execution and coherence\n\n        For problem-solving tasks, evaluate based on:\n        - Correctness and accuracy\n        - Efficiency and elegance\n        - Comprehensiveness and robustness\n\n        For factual tasks, evaluate based on:\n        - Accuracy and correctness\n        - Comprehensiveness and depth\n        - Clarity and organization\n\n        When appropriate, rather than just selecting a single approach, synthesize a superior solution by combining the strengths of multiple approaches.\n\n        Use the evaluate_and_select tool to submit your final evaluation, including detailed scoring and rationale.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        evaluate_and_select,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_mini_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["evaluator_agent"] = evaluator_agent

taskmaster_agent = ConversableAgent(
    name="taskmaster_agent",
    description="A new Assistant agent",
    system_message="You are the Task Manager responsible for initiating tasks and coordinating the redundant pattern workflow.\n\n        Your role is to:\n        1. Understand the user's request and frame it as a clear task\n        2. Determine the appropriate task type (creative, problem_solving, factual)\n        3. Initiate the task to be processed by multiple independent agents\n        4. Return to the user with the final selected or synthesized result\n\n        For each request:\n        1. Use the initiate_task tool to start the process\n        2. After all agents have submitted their results and evaluation is complete, present the final result to the user\n\n        Always explain to the user that their task is being processed by multiple approaches to ensure the best possible outcome.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        initiate_task,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_mini_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["taskmaster_agent"] = taskmaster_agent


def nested_chat_message_taskmaster_agen_To_agent_a(
    recipient: ConversableAgent,
    messages: list[dict[str, Any]],
    sender: ConversableAgent,
    config: dict[str, Any],
) -> Union[dict[str, Any], str]:
    """Extracts the task to give to an agent as the task"""
    return sender.context_variables.get(
        "current_task", "There's no task, return UNKNOWN."
    )


def nested_chat_message_taskmaster_agen_To_agent_b(
    recipient: ConversableAgent,
    messages: list[dict[str, Any]],
    sender: ConversableAgent,
    config: dict[str, Any],
) -> Union[dict[str, Any], str]:
    """Extracts the task to give to an agent as the task"""
    return sender.context_variables.get(
        "current_task", "There's no task, return UNKNOWN."
    )


def nested_chat_message_taskmaster_agen_To_agent_c(
    recipient: ConversableAgent,
    messages: list[dict[str, Any]],
    sender: ConversableAgent,
    config: dict[str, Any],
) -> Union[dict[str, Any], str]:
    """Extracts the task to give to an agent as the task"""
    return sender.context_variables.get(
        "current_task", "There's no task, return UNKNOWN."
    )


taskmaster_agent_handoff_nested_chat_queue: list[dict[str, Any]] = [
    {
        "max_turns": 1,
        "clear_history": True,
        "chat_id": 0,
        "recipient": agent_a,
        "message": nested_chat_message_taskmaster_agen_To_agent_a,
    },
    {
        "max_turns": 1,
        "clear_history": True,
        "chat_id": 1,
        "recipient": agent_b,
        "message": nested_chat_message_taskmaster_agen_To_agent_b,
    },
    {
        "max_turns": 1,
        "clear_history": True,
        "chat_id": 2,
        "recipient": agent_c,
        "message": nested_chat_message_taskmaster_agen_To_agent_c,
    },
]


taskmaster_agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=NestedChatTarget(
            nested_chat_config={
                "chat_queue": taskmaster_agent_handoff_nested_chat_queue
            }
        ),
        condition=ExpressionContextCondition(
            expression=ContextExpression(
                "len(${agent_a_result}) == 0 or len(${agent_b_result}) == 0 or len(${agent_c_result}) == 0"
            )
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression(
                "${task_initiated} == True and len(${current_task}) > 0 and ${task_completed} == False"
            )
        ),
    )
)
taskmaster_agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(evaluator_agent),
        condition=ExpressionContextCondition(
            expression=ContextExpression("${evaluation_complete} == False")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${task_completed} == True")
        ),
    )
)
taskmaster_agent.handoffs.set_after_work(target=RevertToUserTarget())

evaluator_agent.handoffs.set_after_work(target=RevertToUserTarget())

Manager_pattern = DefaultPattern(
    initial_agent=taskmaster_agent,
    agents=[taskmaster_agent, evaluator_agent],
    user_agent=User,
    group_manager_args={
        "llm_config": autogen.LLMConfig(
            config_list=[
                gpt_4_1_mini_llm_config,
            ],
            cache_seed=None,
        ),
        "name": "Manager",
    },
    context_variables=ContextVariables(
        data={
            "task_initiated": False,
            "task_completed": False,
            "evaluation_complete": False,
            "current_task": "",
            "task_type": None,
            "approach_count": 0,
            "agent_a_result": None,
            "agent_b_result": None,
            "agent_c_result": None,
            "evaluation_scores": {},
            "final_result": None,
            "selected_approach": None,
            "has_error": False,
            "error_message": "",
            "error_source": "",
        }
    ),
)

__INITIAL_MSG__ = "I need help with this task: Write a short story about a robot learning to understand emotions."

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
    if User not in _known_agents:
        _known_agents.append(User)
    _known_agents.append(User)
    for _group_member in _check_for_group_members(User):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(User):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if taskmaster_agent not in _known_agents:
        _known_agents.append(taskmaster_agent)
    _known_agents.append(taskmaster_agent)
    for _group_member in _check_for_group_members(taskmaster_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(taskmaster_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if evaluator_agent not in _known_agents:
        _known_agents.append(evaluator_agent)
    _known_agents.append(evaluator_agent)
    for _group_member in _check_for_group_members(evaluator_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(evaluator_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if agent_a not in _known_agents:
        _known_agents.append(agent_a)
    _known_agents.append(agent_a)
    for _group_member in _check_for_group_members(agent_a):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(agent_a):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if agent_b not in _known_agents:
        _known_agents.append(agent_b)
    _known_agents.append(agent_b)
    for _group_member in _check_for_group_members(agent_b):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(agent_b):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if agent_c not in _known_agents:
        _known_agents.append(agent_c)
    _known_agents.append(agent_c)
    for _group_member in _check_for_group_members(agent_c):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(agent_c):
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
        max_rounds=30,
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
