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

"""Swarm.

Enhanced Swarm Orchestration with AG2. Based on <https://docs.ag2.ai/latest/docs/use-cases/notebooks/notebooks/agentchat_swarm_enhanced>

Requirements: ag2[openai]==0.10.2
Tags: Swarm, Group
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
    UpdateSystemMessage,
    UserProxyAgent,
    register_function,
    runtime_logging,
)
from autogen.agentchat import GroupChatManager, ReplyResult, run_group_chat
from autogen.agentchat.group import (
    AgentNameTarget,
    AgentTarget,
    ContextExpression,
    ContextVariables,
    ExpressionAvailableCondition,
    NestedChatTarget,
    OnCondition,
    OnContextCondition,
    ReplyResult,
    RevertToUserTarget,
    StringAvailableCondition,
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
# "swarm_api_keys.py"
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


__MODELS_MODULE__ = load_api_key_module("swarm")


def get_swarm_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_swarm_model_api_key(model_name)


class GroupDict(TypedDict):
    """Group related global dict."""

    chats: dict[str, GroupChat]
    patterns: dict[str, Pattern]


__GROUP__: GroupDict = {"chats": {}, "patterns": {}}

__AGENTS__: dict[str, ConversableAgent] = {}


# Tools

# Databases

USER_DATABASE = {
    "mark": {
        "full_name": "Mark Sze",
    },
    "kevin": {
        "full_name": "Yiran Wu",
    },
}

ORDER_DATABASE = {
    "TR13845": {
        "user": "mark",
        "order_number": "TR13845",
        "status": "shipped",  # order status: order_received, shipped, delivered, return_started, returned
        "return_status": "N/A",  # return status: N/A, return_started, return_shipped, return_delivered, refund_issued
        "product": "matress",
        "link": "https://www.example.com/TR13845",
        "shipping_address": "123 Main St, State College, PA 12345",
    },
    "TR14234": {
        "user": "kevin",
        "order_number": "TR14234",
        "status": "delivered",
        "return_status": "N/A",
        "product": "pillow",
        "link": "https://www.example.com/TR14234",
        "shipping_address": "123 Main St, State College, PA 12345",
    },
    "TR29384": {
        "user": "mark",
        "order_number": "TR29384",
        "status": "delivered",
        "return_status": "N/A",
        "product": "bed frame",
        "link": "https://www.example.com/TR29384",
        "shipping_address": "123 Main St, State College, PA 12345",
    },
}


def record_order_id(
    order_id: str, context_variables: ContextVariables
) -> ReplyResult:
    """Record the order ID in the workflow context"""
    target = AgentNameTarget("order_triage_agent")
    if order_id not in ORDER_DATABASE:
        return ReplyResult(
            target=target,
            context_variables=context_variables,
            message=f"Order ID {order_id} not found. Please ask for the correct order ID.",
        )

    context_variables["order_id"] = order_id
    context_variables["has_order_id"] = True
    return ReplyResult(
        target=target,
        context_variables=context_variables,
        message=f"Order ID Recorded: {order_id}",
    )


def check_order_id(
    order_id: str, context_variables: ContextVariables
) -> ReplyResult:
    """Check if the order ID is valid"""
    target = AgentNameTarget("order_triage_agent")
    # Restricts order to checking to the logged in user
    if (
        context_variables["logged_in_username"]
        and order_id in ORDER_DATABASE
        and ORDER_DATABASE[order_id]["user"]
        == context_variables["logged_in_username"]
    ):
        return ReplyResult(
            target=target,
            context_variables=context_variables,
            message=f"Order ID {order_id} is valid.",
        )
    return ReplyResult(
        target=target,
        context_variables=context_variables,
        message=f"Order ID {order_id} is invalid. Please ask for the correct order ID.",
    )


def login_customer_by_username(
    username: str, context_variables: ContextVariables
) -> ReplyResult:
    """Get and log the customer in by their username"""
    target = AgentNameTarget("authentication_agent")
    if username in USER_DATABASE:
        context_variables["customer_name"] = USER_DATABASE[username][
            "full_name"
        ]
        context_variables["logged_in_username"] = username
        context_variables["logged_in"] = True
        context_variables["requires_login"] = False
        return ReplyResult(
            context_variables=context_variables,
            message=f"Welcome back our customer, {context_variables['customer_name']}! Please continue helping them.",
        )
    return ReplyResult(
        target=target,
        context_variables=context_variables,
        message=f"User {username} not found. Please ask for the correct username.",
    )


# Models

gpt_4_1_llm_config: dict[str, Any] = {
    "model": "gpt-4.1",
    "api_type": "openai",
    "api_key": get_swarm_model_api_key("gpt_4_1"),
}

# Agents

authentication_agent_executor = LocalCommandLineCodeExecutor(
    work_dir="coding",
    timeout=60,
)

Customer = UserProxyAgent(
    name="Customer",
    description="The customer user proxy agent.",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    llm_config=False,
)

__AGENTS__["Customer"] = Customer

authentication_agent = ConversableAgent(
    name="authentication_agent",
    description="Authentication Agent",
    system_message="You are an authentication agent that verifies the identity of the customer.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config={"executor": authentication_agent_executor},
    is_termination_msg=None,
    functions=[
        login_customer_by_username,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["authentication_agent"] = authentication_agent

order_mgmt_agent = ConversableAgent(
    name="order_mgmt_agent",
    description="Order Management Agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        check_order_id,
        record_order_id,
    ],
    update_agent_state_before_reply=[
        UpdateSystemMessage(
            "You are an order management agent that manages inquiries related to e-commerce orders.\n\nThe order must be logged in to access their order.\n\nUse your available tools to get the status of the details from the customer. Ask the customer questions as needed.\n\nUse the check_order_id tool before the record_order_id tool, never together.\n\nThe current status of this workflow is:\nCustomer name: {customer_name}\nLogged in: {logged_in}\nEnquiring for Order ID: {order_id}"
        ),
    ],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["order_mgmt_agent"] = order_mgmt_agent

order_retrieval_agent = AssistantAgent(
    name="order_retrieval_agent",
    description="An order retrieval agent that gets details about an order.",
    system_message="You are an order retrieval agent that gets details about an order.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["order_retrieval_agent"] = order_retrieval_agent

order_summariser_agent = AssistantAgent(
    name="order_summariser_agent",
    description="An order summariser agent that provides a summary of the order details.",
    system_message="You are an order summariser agent that provides a summary of the order details.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["order_summariser_agent"] = order_summariser_agent

order_triage_agent = ConversableAgent(
    name="order_triage_agent",
    description="Order Triage Agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[],
    update_agent_state_before_reply=[
        UpdateSystemMessage(
            "You are an order triage agent, working with a customer and a group of agents to provide support for your e-commerce platform.\n\nAn agent needs to be logged in to be able to access their order. The authentication_agent will work with the customer to verify their identity, transfer to them to start with.\nThe order_mgmt_agent will manage all order related tasks, such as tracking orders, managing orders, etc. Be sure to check the order as one step. Then if it's valid you can record it in the context.\n\nAsk the customer for further information when necessary.\n\nThe current status of this workflow is:\nCustomer name: {customer_name}\nLogged in: {logged_in}\nEnquiring for Order ID: {order_id}"
        ),
    ],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["order_triage_agent"] = order_triage_agent

authentication_agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(order_triage_agent),
        condition=StringContextCondition(variable_name="logged_in"),
    )
)
authentication_agent.handoffs.set_after_work(target=RevertToUserTarget())

order_mgmt_agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(authentication_agent),
        condition=StringLLMCondition(
            prompt="The customer is not logged in, authenticate the customer."
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("!(${logged_in})")
        ),
    )
)
order_mgmt_agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(order_triage_agent),
        condition=StringLLMCondition(
            prompt="The customer has no more enquiries about this order."
        ),
    )
)


def nested_chat_message_wc_GetOrderStatus(
    recipient: ConversableAgent,
    messages: list[dict[str, Any]],
    sender: ConversableAgent,
    config: dict[str, Any],
) -> Union[dict[str, Any], str]:
    """Extract the order summary based on the OrderID in the context variables"""
    order_id = sender.context_variables.get("order_id")
    if order_id and order_id in ORDER_DATABASE:
        order = ORDER_DATABASE[order_id]
        address = order["shipping_address"]
        order_no = order["order_number"]
        product = order["product"]
        status = order["status"]
        return f"Order {order_no} for {product} is currently {status}. The shipping address is {address}."
    return f"Order {order_id} not found."


order_mgmt_agent_handoff_nested_chat_queue: list[dict[str, Any]] = [
    {
        "summary_method": "last_msg",
        "max_turns": 1,
        "clear_history": True,
        "chat_id": 6,
        "recipient": order_retrieval_agent,
        "message": nested_chat_message_wc_GetOrderStatus,
    },
    {
        "summary_method": "last_msg",
        "max_turns": 1,
        "clear_history": True,
        "chat_id": 5,
        "recipient": order_summariser_agent,
        "message": "Summarise the order details provided in a tabulated, text-based, order sheet format.",
    },
]


order_mgmt_agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=NestedChatTarget(
            nested_chat_config={
                "chat_queue": order_mgmt_agent_handoff_nested_chat_queue
            }
        ),
        condition=StringLLMCondition(
            prompt="Retrieve the status of the order."
        ),
        available=StringAvailableCondition("has_order_id"),
    )
)
order_mgmt_agent.handoffs.set_after_work(target=RevertToUserTarget())

order_triage_agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(authentication_agent),
        condition=StringLLMCondition(
            prompt="The customer is not logged in, authenticate the customer."
        ),
    )
)
order_triage_agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(order_mgmt_agent),
        condition=StringLLMCondition(
            prompt="The customer is logged in, continue with the order mgmt agent."
        ),
    )
)
order_triage_agent.handoffs.set_after_work(target=RevertToUserTarget())

Manager_pattern = DefaultPattern(
    initial_agent=order_triage_agent,
    agents=[order_triage_agent, order_mgmt_agent, authentication_agent],
    user_agent=Customer,
    group_manager_args={
        "llm_config": autogen.LLMConfig(
            config_list=[
                gpt_4_1_llm_config,
            ],
            cache_seed=None,
        ),
        "name": "Manager",
    },
    context_variables=ContextVariables(
        data={
            "customer_name": None,
            "logged_in_username": None,
            "logged_in": False,
            "requires_login": True,
            "has_order_id": False,
            "order_id": None,
        }
    ),
)

__INITIAL_MSG__ = "Help me with my order"

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
    if Customer not in _known_agents:
        _known_agents.append(Customer)
    _known_agents.append(Customer)
    for _group_member in _check_for_group_members(Customer):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(Customer):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if order_triage_agent not in _known_agents:
        _known_agents.append(order_triage_agent)
    _known_agents.append(order_triage_agent)
    for _group_member in _check_for_group_members(order_triage_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(order_triage_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if order_mgmt_agent not in _known_agents:
        _known_agents.append(order_mgmt_agent)
    _known_agents.append(order_mgmt_agent)
    for _group_member in _check_for_group_members(order_mgmt_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(order_mgmt_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if authentication_agent not in _known_agents:
        _known_agents.append(authentication_agent)
    _known_agents.append(authentication_agent)
    for _group_member in _check_for_group_members(authentication_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(authentication_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if order_summariser_agent not in _known_agents:
        _known_agents.append(order_summariser_agent)
    _known_agents.append(order_summariser_agent)
    for _group_member in _check_for_group_members(order_summariser_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(order_summariser_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if order_retrieval_agent not in _known_agents:
        _known_agents.append(order_retrieval_agent)
    _known_agents.append(order_retrieval_agent)
    for _group_member in _check_for_group_members(order_retrieval_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(order_retrieval_agent):
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
    with open("results.json", "w", encoding="utf-8", newline="\n") as file:
        file.write(
            json.dumps({'results': result_dicts}, indent=4, ensure_ascii=False)
        )


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
