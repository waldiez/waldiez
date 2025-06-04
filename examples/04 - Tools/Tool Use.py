#!/usr/bin/env python
# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# mypy: disable-error-code="import-untyped,no-redef,unused-ignore"
# flake8: noqa: E501

# pylint: disable=line-too-long,unknown-option-value,unused-argument,unused-import,unused-variable
# pylint: disable=invalid-name,import-error,import-outside-toplevel,inconsistent-quotes,missing-function-docstring
# pylint: disable=missing-param-doc,missing-return-doc,ungrouped-imports,unnecessary-lambda-assignment

# pyright: reportUnusedImport=false,reportMissingTypeStubs=false
# pyright: reportUnknownArgumentType=false,reportUnknownMemberType=false
# pyright: reportUnknownLambdaType=false,reportUnnecessaryIsInstance=false

"""Tool Use.

Tool Use and Conversational Chess

Requirements: ag2[openai]==0.9.1post0, chess
Tags:
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
from typing import Annotated
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
import chess
import chess.svg
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
# This section assumes that a file named "tool_use_api_keys"
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


__MODELS_MODULE__ = load_api_key_module("tool_use")


def get_tool_use_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_tool_use_model_api_key(model_name)


# Tools

BOARD = chess.Board()
MADE_MOVE = False

# pylint: disable=global-statement


def get_legal_moves() -> Annotated[str, "A list of legal moves in UCI format"]:
    """Get a list of legal moves."""
    return "Possible moves are: " + ",".join(
        [str(move) for move in BOARD.legal_moves]
    )


# pylint: disable=global-statement,unused-import


def make_move(
    move: Annotated[str, "A move in UCI format."],
) -> Annotated[str, "Result of the move."]:
    """Make a move on the board."""
    # pylint: disable=global-statement
    global MADE_MOVE
    try:
        chess_move = chess.Move.from_uci(move)
    except BaseException:  # pylint: disable=broad-except
        chess_move = BOARD.parse_san(move)
    BOARD.push_uci(str(move))
    # Get the piece name.
    piece = BOARD.piece_at(chess_move.to_square)
    if piece is None:
        return "Invalid move."
    piece_symbol = piece.unicode_symbol()
    piece_name = (
        chess.piece_name(piece.piece_type).capitalize()
        if piece_symbol.isupper()
        else chess.piece_name(piece.piece_type)
    )
    MADE_MOVE = True  # pyright: ignore
    return (
        f"Moved {piece_name} ({piece_symbol}) from "
        f"{chess.SQUARE_NAMES[chess_move.from_square]} to "
        f"{chess.SQUARE_NAMES[chess_move.to_square]}."
    )


# Models

gpt_3_5_turbo_llm_config: dict[str, Any] = {
    "model": "gpt-3.5-turbo",
    "api_type": "openai",
    "api_key": get_tool_use_model_api_key("gpt_3_5_turbo"),
}

# Agents


def is_termination_message_board_proxy(
    message: dict[str, Any],
) -> bool:
    """Complete the termination message function"""
    if "MADE_MOVE" not in globals():
        globals()["MADE_MOVE"] = False
    # pylint: disable=global-statement
    global MADE_MOVE
    if MADE_MOVE is True:
        MADE_MOVE = False  # pyright: ignore
        return True
    return False


board_proxy = AssistantAgent(
    name="board_proxy",
    description="Board Proxy",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=is_termination_message_board_proxy,
    llm_config=False,  # pyright: ignore
)

player_black = UserProxyAgent(
    name="player_black",
    description="Player Black",
    system_message="You are a chess player and you play as black. First call get_legal_moves(), to get a list of legal moves. Then call make_move(move) to make a move.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_3_5_turbo_llm_config,
        ],
        cache_seed=None,
    ),
)

player_white = UserProxyAgent(
    name="player_white",
    description="Player White",
    system_message="You are a chess player and you play as white. First call get_legal_moves(), to get a list of legal moves. Then call make_move(move) to make a move.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_3_5_turbo_llm_config,
        ],
        cache_seed=None,
    ),
)

player_white_chat_queue: list[dict[str, Any]] = [
    {
        "summary_method": "last_msg",
        "clear_history": True,
        "chat_id": 0,
        "recipient": player_white,
        "sender": board_proxy,
        "message": None,
    },
]

player_white.register_nested_chats(  # pyright: ignore
    trigger=["player_black"],
    chat_queue=player_white_chat_queue,
    use_async=False,
    ignore_async_in_sync_chat=True,
)

player_black_chat_queue: list[dict[str, Any]] = [
    {
        "summary_method": "last_msg",
        "clear_history": True,
        "chat_id": 1,
        "recipient": player_black,
        "sender": board_proxy,
        "message": None,
    },
]

player_black.register_nested_chats(  # pyright: ignore
    trigger=["player_white"],
    chat_queue=player_black_chat_queue,
    use_async=False,
    ignore_async_in_sync_chat=True,
)

register_function(
    get_legal_moves,
    caller=player_white,
    executor=board_proxy,
    name="get_legal_moves",
    description="Get a list of legal chess moves.",
)
register_function(
    make_move,
    caller=player_white,
    executor=board_proxy,
    name="make_move",
    description="Make a move on the board.",
)

register_function(
    get_legal_moves,
    caller=player_black,
    executor=board_proxy,
    name="get_legal_moves",
    description="Get a list of legal chess moves.",
)
register_function(
    make_move,
    caller=player_black,
    executor=board_proxy,
    name="make_move",
    description="Make a move on the board.",
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
    results = player_black.initiate_chat(
        player_white,
        summary_method="last_msg",
        max_turns=2,
        clear_history=False,
        message="Let's play chess! Your move.",
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
