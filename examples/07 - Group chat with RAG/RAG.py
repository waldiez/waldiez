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

"""RAG.

Group Chat with Retrieval Augmented Generation.

Requirements: ag2[openai]==0.9.2, beautifulsoup4, chromadb>=0.5.23, ipython, markdownify, protobuf==5.29.3, pypdf, sentence_transformers
Tags: RAG, FLAML
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
    Cache,
    ChatResult,
    ConversableAgent,
    GroupChat,
    runtime_logging,
)
from autogen.agentchat import GroupChatManager, initiate_group_chat
from autogen.agentchat.contrib.retrieve_user_proxy_agent import (
    RetrieveUserProxyAgent,
)
from autogen.agentchat.contrib.vectordb.chromadb import ChromaVectorDB
from autogen.agentchat.group import ContextVariables
import chromadb
import numpy as np
from chromadb.config import Settings
from chromadb.utils.embedding_functions.sentence_transformer_embedding_function import (
    SentenceTransformerEmbeddingFunction,
)

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
# This section assumes that a file named "rag_api_keys"
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


__MODELS_MODULE__ = load_api_key_module("rag")


def get_rag_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_rag_model_api_key(model_name)


# Models

gpt_4_1_llm_config: dict[str, Any] = {
    "model": "gpt-4.1",
    "api_type": "openai",
    "api_key": get_rag_model_api_key("gpt_4_1"),
}

# Agents

boss_assistant_client = chromadb.Client(Settings(anonymized_telemetry=False))
boss_assistant_embedding_function = SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2",
)
boss_assistant_client.get_or_create_collection(
    "autogen-docs",
    embedding_function=boss_assistant_embedding_function,
)

boss_assistant = RetrieveUserProxyAgent(
    name="boss_assistant",
    description="Assistant who has extra content retrieval power for solving difficult problems.",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=3,
    default_auto_reply="Reply 'TERMINATE' if the task is done.",
    code_execution_config=False,
    is_termination_msg=lambda x: any(
        isinstance(x, dict)
        and x.get("content", "")
        and isinstance(x.get("content", ""), str)
        and x.get("content", "").endswith(keyword)
        for keyword in ["TERMINATE"]
    ),
    retrieve_config={
        "task": "default",
        "model": "all-MiniLM-L6-v2",
        "docs_path": [
            r"https://raw.githubusercontent.com/microsoft/FLAML/main/website/docs/Examples/Integrate%20-%20Spark.md"
        ],
        "new_docs": True,
        "update_context": True,
        "get_or_create": True,
        "overwrite": False,
        "recursive": True,
        "chunk_mode": "multi_lines",
        "must_break_at_empty_line": True,
        "collection_name": "autogen-docs",
        "distance_threshold": -1.0,
        "vector_db": ChromaVectorDB(
            client=boss_assistant_client,
            embedding_function=boss_assistant_embedding_function,
        ),
        "client": boss_assistant_client,
    },
    llm_config=False,  # pyright: ignore
)

code_reviewer = ConversableAgent(
    name="code_reviewer",
    description="Code Reviewer who can review the code.",
    system_message="You are a code reviewer. Reply 'TERMINATE' in the end when everything is done.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=lambda x: any(
        isinstance(x, dict)
        and x.get("content", "")
        and isinstance(x.get("content", ""), str)
        and x.get("content", "").endswith(keyword)
        for keyword in ["TERMINATE"]
    ),
    functions=[],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=42,
    ),
)

product_manager = ConversableAgent(
    name="product_manager",
    description="Product Manager who can design and plan the project.",
    system_message="You are a product manager. Reply 'TERMINATE' in the end when everything is done.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=lambda x: any(
        isinstance(x, dict)
        and x.get("content", "")
        and isinstance(x.get("content", ""), str)
        and x.get("content", "").endswith(keyword)
        for keyword in ["TERMINATE"]
    ),
    functions=[],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=42,
    ),
)

senior_python_engineer = ConversableAgent(
    name="senior_python_engineer",
    description="Senior Python Engineer",
    system_message="You are a senior python engineer, you provide python code to answer questions. Reply 'TERMINATE' in the end when everything is done.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=lambda x: any(
        isinstance(x, dict)
        and x.get("content", "")
        and isinstance(x.get("content", ""), str)
        and x.get("content", "").endswith(keyword)
        for keyword in ["TERMINATE"]
    ),
    functions=[],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=42,
    ),
)

manager_group_chat = GroupChat(
    agents=[
        product_manager,
        senior_python_engineer,
        code_reviewer,
        boss_assistant,
    ],
    enable_clear_history=False,
    send_introductions=False,
    messages=[],
    max_round=20,
    admin_name="boss_assistant",
    speaker_selection_method="round_robin",
    allow_repeat_speaker=True,
)


def callable_message_boss_assistant_to_manager(
    sender: RetrieveUserProxyAgent,
    recipient: ConversableAgent,
    context: dict[str, Any],
) -> Union[dict[str, Any], str]:
    """Get the message to send using the last carryover.

    Parameters
    ----------
    sender : ConversableAgent
        The source agent.
    recipient : ConversableAgent
        The target agent.
    context : dict[str, Any]
        The context.

    Returns
    -------
    Union[dict[str, Any], str]
        The message to send using the last carryover.
    """
    carryover = context.get("carryover", "")
    if isinstance(carryover, list):
        carryover = carryover[-1]
    if not isinstance(carryover, str):
        if isinstance(carryover, list):
            carryover = carryover[-1]
        elif isinstance(carryover, dict):
            carryover = carryover.get("content", "")
    if not isinstance(carryover, str):
        carryover = ""
    return carryover


manager = GroupChatManager(
    name="manager",
    description="The group manager agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    groupchat=manager_group_chat,
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=42,
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
    with Cache.disk(cache_seed=42) as cache:  # pyright: ignore
        results = boss_assistant.initiate_chat(
            manager,
            cache=cache,
            summary_method="last_msg",
            clear_history=True,
            problem="How to use spark for parallel training in FLAML? Give me sample code.",
            message=callable_message_boss_assistant_to_manager,
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
