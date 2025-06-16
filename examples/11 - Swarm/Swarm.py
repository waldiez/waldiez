#!/usr/bin/env python
# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501

# pylint: disable=line-too-long,unknown-option-value,unused-argument,unused-import,unused-variable,invalid-name
# pylint: disable=import-error,import-outside-toplevel,inconsistent-quotes,missing-function-docstring,missing-param-doc,missing-return-doc
# pylint: disable=ungrouped-imports,unnecessary-lambda-assignment,too-many-arguments,too-many-locals,too-many-try-statements,broad-exception-caught

# type: ignore

# pyright: reportUnusedImport=false,reportMissingTypeStubs=false,reportUnknownArgumentType=false
# pyright: reportUnknownMemberType=false,reportUnknownLambdaType=false,reportUnnecessaryIsInstance=false
# pyright: reportUnknownVariableType=false

"""Swarm.

Enhanced Swarm Orchestration with AG2. Based on <https://docs.ag2.ai/latest/docs/use-cases/notebooks/notebooks/agentchat_swarm_enhanced>

Requirements: ag2[openai]==0.9.2
Tags: Swarm, Group
🧩 generated with ❤️ by Waldiez.
"""


# Imports

import csv
import importlib
import json
import os
import sqlite3
import sys
from dataclasses import asdict
from pprint import pprint
from types import ModuleType
from typing import (
    Annotated,
    Any,
    Callable,
    Dict,
    List,
    Optional,
    Set,
    Tuple,
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
from autogen.agentchat import GroupChatManager, initiate_group_chat
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
from autogen.coding import LocalCommandLineCodeExecutor
import numpy as np

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

# patch the default IOStream
# pylint: disable=import-outside-toplevel
from waldiez.running.patch_io_stream import patch_io_stream

patch_io_stream(is_async=False)
# Load model API keys
# NOTE:
# This section assumes that a file named "swarm_api_keys"
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

authentication_agent = ConversableAgent(
    name="authentication_agent",
    description="Authentication Agent",
    system_message="You are an authentication agent that verifies the identity of the customer.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config={"executor": authentication_agent_executor},
    is_termination_msg=None,  # pyright: ignore
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

customer = UserProxyAgent(
    name="customer",
    description="The customer user proxy agent.",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=False,  # pyright: ignore
)

order_mgmt_agent = ConversableAgent(
    name="order_mgmt_agent",
    description="Order Management Agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
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

order_retrieval_agent = AssistantAgent(
    name="order_retrieval_agent",
    description="An order retrieval agent that gets details about an order.",
    system_message="You are an order retrieval agent that gets details about an order.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

order_summariser_agent = AssistantAgent(
    name="order_summariser_agent",
    description="An order summariser agent that provides a summary of the order details.",
    system_message="You are an order summariser agent that provides a summary of the order details.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

order_triage_agent = ConversableAgent(
    name="order_triage_agent",
    description="Order Triage Agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
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


def nested_chat_message_wc_getorderstatus(
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
        "message": nested_chat_message_wc_getorderstatus,
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

manager_pattern = DefaultPattern(
    initial_agent=order_triage_agent,
    agents=[order_triage_agent, order_mgmt_agent, authentication_agent],
    user_agent=customer,
    group_manager_args={
        "llm_config": autogen.LLMConfig(
            config_list=[
                gpt_4_1_llm_config,
            ],
            cache_seed=None,
        ),
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
    conn = sqlite3.connect(dbname)
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = conn.execute(query)
    except sqlite3.OperationalError:
        conn.close()
        return
    rows = cursor.fetchall()
    column_names = [description[0] for description in cursor.description]
    data = [dict(zip(column_names, row)) for row in rows]
    conn.close()
    with open(csv_file, "w", newline="", encoding="utf-8") as file:
        csv_writer = csv.DictWriter(file, fieldnames=column_names)
        csv_writer.writeheader()
        csv_writer.writerows(data)
    json_file = csv_file.replace(".csv", ".json")
    with open(json_file, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


def stop_logging() -> None:
    """Stop logging."""
    runtime_logging.stop()
    if not os.path.exists("logs"):
        os.makedirs("logs")
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


# Start chatting


def main() -> Union[ChatResult, list[ChatResult], dict[int, ChatResult]]:
    """Start chatting.

    Returns
    -------
    Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
        The result of the chat session, which can be a single ChatResult,
        a list of ChatResults, or a dictionary mapping integers to ChatResults.
    """
    results, _, __ = initiate_group_chat(
        pattern=manager_pattern,
        messages="Help me with my order",
        max_rounds=40,
    )

    stop_logging()
    return results


def call_main() -> None:
    """Run the main function and print the results."""
    results: Union[ChatResult, list[ChatResult], dict[int, ChatResult]] = main()
    if isinstance(results, dict):
        # order by key
        ordered_results = dict(sorted(results.items()))
        for _, result in ordered_results.items():
            pprint(asdict(result))
    else:
        if not isinstance(results, list):
            results = [results]
        for result in results:
            pprint(asdict(result))


if __name__ == "__main__":
    # Let's go!
    call_main()
