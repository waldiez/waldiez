#!/usr/bin/env python
# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501

# pylint: disable=line-too-long,unknown-option-value,unused-argument,unused-import,unused-variable
# pylint: disable=invalid-name,import-error,import-outside-toplevel,inconsistent-quotes,missing-function-docstring
# pylint: disable=missing-param-doc,missing-return-doc,ungrouped-imports,unnecessary-lambda-assignment

# mypy: disable-error-code="import-untyped, no-redef, unused-ignore, import-not-found"

# pyright: reportUnusedImport=false,reportMissingTypeStubs=false,reportUnknownArgumentType=false
# pyright: reportUnknownMemberType=false,reportUnknownLambdaType=false,reportUnnecessaryIsInstance=false
# pyright: reportUnknownVariableType=false

"""On-boarding.

Sequential Chats and Customer Onboarding

Requirements: ag2[anthropic]==0.9.2, ag2[openai]==0.9.2
Tags: Sequential, Customer, On-boarding, Onboarding
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
    UserProxyAgent,
    runtime_logging,
)
from autogen.agentchat.chat import initiate_chats
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

# Load model API keys
# NOTE:
# This section assumes that a file named "on_boarding_api_keys"
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


__MODELS_MODULE__ = load_api_key_module("on_boarding")


def get_on_boarding_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_on_boarding_model_api_key(model_name)


# Models

claude_3_7_sonnet_20250219_llm_config: dict[str, Any] = {
    "model": "claude-3-7-sonnet-20250219",
    "api_type": "anthropic",
    "api_key": get_on_boarding_model_api_key("claude_3_7_sonnet_20250219"),
}

gpt_3_5_turbo_llm_config: dict[str, Any] = {
    "model": "gpt-3.5-turbo",
    "api_type": "openai",
    "api_key": get_on_boarding_model_api_key("gpt_3_5_turbo"),
}

# Agents

customer_engagement_agent = AssistantAgent(
    name="customer_engagement_agent",
    description="A customer_engagement_agent agent.",
    system_message="You are a helpful customer service agent here to provide fun for the customer based on the user's personal information and topic preferences. This could include fun facts, jokes, or interesting stories. Make sure to make it engaging and fun! Return 'TERMINATE' when you are done.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=lambda x: any(
        isinstance(x, dict)
        and x.get("content", "")
        and isinstance(x.get("content", ""), str)
        and x.get("content", "") == keyword
        for keyword in ["TERMINATE"]
    ),
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_3_5_turbo_llm_config,
        ],
        cache_seed=None,
    ),
)

customer_proxy = UserProxyAgent(
    name="customer_proxy",
    description="A new User proxy agent",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=False,  # pyright: ignore
)

personal_information_agent = AssistantAgent(
    name="personal_information_agent",
    description="A customer on-boarding agent.",
    system_message="You are a helpful customer on-boarding agent, you are here to help new customers get started with our product. Your job is to gather customer's name and location. Do not ask for other information. Return 'TERMINATE' when you have gathered all the information.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=lambda x: any(
        isinstance(x, dict)
        and x.get("content", "")
        and isinstance(x.get("content", ""), str)
        and x.get("content", "") == keyword
        for keyword in ["TERMINATE"]
    ),
    llm_config=autogen.LLMConfig(
        config_list=[
            claude_3_7_sonnet_20250219_llm_config,
        ],
        cache_seed=None,
    ),
)

topic_preference_agent = AssistantAgent(
    name="topic_preference_agent",
    description="A topic preference agent",
    system_message="You are a helpful customer service agent here to provide fun for the customer based on the user's personal information and topic preferences. This could include fun facts, jokes, or interesting stories. Make sure to make it engaging and fun! Return 'TERMINATE' when you are done.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=lambda x: any(
        isinstance(x, dict)
        and x.get("content", "")
        and isinstance(x.get("content", ""), str)
        and x.get("content", "") == keyword
        for keyword in ["TERMINATE"]
    ),
    llm_config=autogen.LLMConfig(
        config_list=[
            claude_3_7_sonnet_20250219_llm_config,
        ],
        cache_seed=None,
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
    results = initiate_chats(
        [
            {
                "sender": personal_information_agent,
                "recipient": customer_proxy,
                "summary_method": "reflection_with_llm",
                "summary_args": {
                    "summary_prompt": "Return the customer information into as JSON object only: {'name': '', 'location': ''}",
                    "summary_role": "user",
                },
                "max_turns": 1,
                "clear_history": True,
                "chat_id": 0,
                "message": "Hello, I'm here to help you get started with our product. Could you tell me your name and location?",
            },
            {
                "sender": topic_preference_agent,
                "recipient": customer_proxy,
                "summary_method": "reflection_with_llm",
                "summary_args": {
                    "summary_prompt": "Return the customer information into as JSON object only: {'topic_of_interest': ''}",
                    "summary_role": "user",
                },
                "max_turns": 1,
                "clear_history": True,
                "chat_id": 1,
                "message": "Great! Could you tell me what topics you are interested in reading about?",
            },
            {
                "sender": customer_proxy,
                "recipient": customer_engagement_agent,
                "summary_method": "last_msg",
                "max_turns": 1,
                "clear_history": True,
                "chat_id": 2,
                "message": "Let's find something fun to read.",
            },
        ]
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
