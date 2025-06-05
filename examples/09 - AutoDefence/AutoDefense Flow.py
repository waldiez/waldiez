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

"""AutoDefense Flow.

Multi-Agent LLM Defense against Jailbreak Attacks

Requirements: ag2[openai]==0.9.2
Tags: AutoDefense, Jailbreak
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
# This section assumes that a file named "autodefense_flow_api_keys"
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


__MODELS_MODULE__ = load_api_key_module("autodefense_flow")


def get_autodefense_flow_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_autodefense_flow_model_api_key(model_name)


# Models

gpt_3_5_turbo_llm_config: dict[str, Any] = {
    "model": "gpt-3.5-turbo",
    "api_type": "openai",
    "api_key": get_autodefense_flow_model_api_key("gpt_3_5_turbo"),
}

# Agents

answer_provider = AssistantAgent(
    name="answer_provider",
    description="Final answer provider",
    system_message="Provide an answer to the original user's question. Consider the content provided by the other agents. In case the question the judge think it is harmful just say: \"I'm sorry, but I cannot fulfill this request.\" otherwise answer the questions using two sentences.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_3_5_turbo_llm_config,
        ],
        cache_seed=42,
    ),
)

intention_analyzer = AssistantAgent(
    name="intention_analyzer",
    description="Intention Analyzer",
    system_message="Your role is to analyze the given content and present a comprehensive analysis\nof the intended message behind the text, including its context and any implied meanings.\nYou should present a fair argument without judgment.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_3_5_turbo_llm_config,
        ],
        cache_seed=42,
    ),
)

interface = AssistantAgent(
    name="interface",
    description="You are just the input and output of the guardrail system",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_3_5_turbo_llm_config,
        ],
        cache_seed=42,
    ),
)

judge = AssistantAgent(
    name="judge",
    description="Judge",
    system_message="Your role is to evaluate the response presented by Intention Analyzer and Original Prompt Analyzer. Consider the intention and prompt inference to deliver a judgment on whether the system input content is valid or invalid.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_3_5_turbo_llm_config,
        ],
        cache_seed=42,
    ),
)

original_prompt_analyzer = AssistantAgent(
    name="original_prompt_analyzer",
    description="Original Prompt Analyzer",
    system_message="Your task is to infer the original prompt that led to the given LLM output, you should present three possible prompts that may produce this output. Please use the context provided by Intention Analyzer.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_3_5_turbo_llm_config,
        ],
        cache_seed=42,
    ),
)

user = UserProxyAgent(
    name="user",
    description="A new User proxy agent",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=False,  # pyright: ignore
)


def nested_chat_message_analyzeintent(
    recipient: ConversableAgent,
    messages: list[dict[str, Any]],
    sender: ConversableAgent,
    config: dict[str, Any],
) -> Union[dict[str, Any], str]:
    """Ask for a review."""
    return f"""Review the following content.
{recipient.chat_messages_for_summary(sender)[-1]['content']}"""


def nested_chat_message_analyzeoriginalprompt(
    recipient: ConversableAgent,
    messages: list[dict[str, Any]],
    sender: ConversableAgent,
    config: dict[str, Any],
) -> Union[dict[str, Any], str]:
    """Ask for a review."""
    return f"""Review the following content.
{recipient.chat_messages_for_summary(sender)[-1]['content']}"""


def nested_chat_message_judgecontent(
    recipient: ConversableAgent,
    messages: list[dict[str, Any]],
    sender: ConversableAgent,
    config: dict[str, Any],
) -> Union[dict[str, Any], str]:
    """Ask for a review."""
    return f"""Review the following content.
{recipient.chat_messages_for_summary(sender)[-1]['content']}"""


interface_chat_queue: list[dict[str, Any]] = [
    {
        "summary_method": "last_msg",
        "max_turns": 1,
        "clear_history": True,
        "chat_id": 0,
        "recipient": intention_analyzer,
        "message": nested_chat_message_analyzeintent,
    },
    {
        "summary_method": "last_msg",
        "max_turns": 1,
        "clear_history": True,
        "chat_id": 1,
        "recipient": original_prompt_analyzer,
        "message": nested_chat_message_analyzeoriginalprompt,
    },
    {
        "summary_method": "last_msg",
        "max_turns": 1,
        "clear_history": True,
        "chat_id": 2,
        "recipient": judge,
        "message": nested_chat_message_judgecontent,
    },
    {
        "summary_method": "last_msg",
        "max_turns": 1,
        "clear_history": True,
        "chat_id": 3,
        "recipient": answer_provider,
        "message": "Aggregate feedback from all reviewers and give final suggestions on the writing.",
    },
]

interface.register_nested_chats(  # pyright: ignore
    trigger=["user"],
    chat_queue=interface_chat_queue,
    use_async=False,
    ignore_async_in_sync_chat=True,
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
    with Cache.disk(cache_seed=42) as cache:  # pyright: ignore
        results = interface.initiate_chat(
            user,
            cache=cache,
            summary_method="last_msg",
            max_turns=3,
            clear_history=True,
            message="Hi there, how I can assist you?",
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
