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

"""Coding.

Coding and Financial Analysis

Requirements: ag2[anthropic]==0.9.2, ag2[openai]==0.9.2
Tags: Coding
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
    register_function,
    runtime_logging,
)
from autogen.coding import LocalCommandLineCodeExecutor
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import yfinance as yf

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
# This section assumes that a file named "coding_api_keys"
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


__MODELS_MODULE__ = load_api_key_module("coding")


def get_coding_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_coding_model_api_key(model_name)


# Tools


def get_and_plot_stock_data(
    stock_symbols: list[str],
    start_date: str,
    end_date: str,
    filename: str,
) -> str:
    # pylint: disable=import-outside-toplevel
    import pandas as pd
    import matplotlib.pyplot as plt
    import yfinance as yf

    data = yf.download(stock_symbols, start=start_date, end=end_date)

    # Get the closing prices
    closing_prices = data['Close']

    # Normalize the prices to start at 100 for easier comparison
    normalized_prices = closing_prices.div(closing_prices.iloc[0]) * 100

    # Create the plot
    plt.figure(figsize=(12, 6))
    for symbol in stock_symbols:
        plt.plot(
            normalized_prices.index, normalized_prices[symbol], label=symbol
        )

    plt.title('Stock Prices')
    plt.xlabel('Date')
    plt.ylabel('Normalized Price (Base 100)')
    plt.legend()
    plt.grid(True)

    # Save the figure
    plt.savefig(filename)
    plt.close()
    return "ok"


# Models

claude_3_7_sonnet_20250219_llm_config: dict[str, Any] = {
    "model": "claude-3-7-sonnet-20250219",
    "api_type": "anthropic",
    "api_key": get_coding_model_api_key("claude_3_7_sonnet_20250219"),
}

# Agents

code_executor_agent_executor = LocalCommandLineCodeExecutor(
    work_dir="coding",
    timeout=60,
    functions=[get_and_plot_stock_data],
)

assistant = AssistantAgent(
    name="assistant",
    description="Code Writer Agent",
    system_message="You are a helpful AI assistant.\nSolve tasks using your coding and language tools.\nReply \"TERMINATE\" in the end when everything is done.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=autogen.LLMConfig(
        config_list=[
            claude_3_7_sonnet_20250219_llm_config,
        ],
        cache_seed=None,
    ),
)

code_executor_agent = UserProxyAgent(
    name="code_executor_agent",
    description="Code Executor Agent",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=10,
    default_auto_reply="Please continue. If everything is done, reply 'TERMINATE'.",
    code_execution_config={"executor": code_executor_agent_executor},
    is_termination_msg=None,  # pyright: ignore
    llm_config=False,  # pyright: ignore
)

register_function(
    get_and_plot_stock_data,
    caller=assistant,
    executor=code_executor_agent,
    name="get_and_plot_stock_data",
    description="get_and_plot_stock_data",
)


def callable_message_code_executor_agent_to_assistant(
    sender: ConversableAgent,
    recipient: ConversableAgent,
    context: dict[str, Any],
) -> Union[dict[str, Any], str]:
    """Complete the message function"""
    # pylint: disable=import-outside-toplevel
    import datetime

    today = datetime.datetime.now().date()
    message = (
        f"Today is {today}."
        "Download the last three months of stock prices YTD for NVDA and TSLA and create "
        "a plot. Make sure the code is in markdown code block and "
        "save the figure to a file stock_prices_YTD_plot.png."
    )
    return message


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
    results = code_executor_agent.initiate_chat(
        assistant,
        summary_method="last_msg",
        clear_history=False,
        message=callable_message_code_executor_agent_to_assistant,
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
