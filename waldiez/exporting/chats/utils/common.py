# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Common utilities for exporting chats."""

import json
from typing import Optional

from waldiez.models import WaldiezAgent, WaldiezChat


def get_chat_message_string(
    sender: WaldiezAgent,
    chat: WaldiezChat,
    chat_names: dict[str, str],
) -> tuple[str, Optional[str]]:
    """Get the agent's message as a string.

    Parameters
    ----------
    sender : WaldiezAgent
        The sender.
    chat : WaldiezChat
        The chat.
    chat_names : dict[str, str]
        A mapping of chat id to chat name with all the chats in the flow.

    Returns
    -------
    tuple[str, Optional[str]]
        If the message is a string, the message content and None.
        If the message is a method, the method name and the method content.
        If the message is None, 'None' and None.
    """
    if not chat.message or chat.message.type == "none":
        return "None", None
    if chat.message.type == "string":
        if chat.message.content is None:  # pragma: no cover
            # should be covered previously on pydantic validation
            return "None", None
        if not chat.message.content:
            return "", None
        return json.dumps(chat.message.content, ensure_ascii=False), None

    is_rag_with_carryover = sender.is_rag_user and chat.message.use_carryover
    chat_name = chat_names[chat.id]
    function_content, function_name = chat.get_message_function(
        name_suffix=chat_name,
        is_rag=is_rag_with_carryover,
    )
    return function_name, function_content


def _stop_logging(space: str, is_async: bool) -> str:
    tab = "    "
    if is_async:
        return f"{space}{tab}{tab}{tab}{tab}await stop_logging()\n"
    return f"{space}{tab}{tab}{tab}{tab}stop_logging()\n"


def get_event_handler_string(
    space: str,
    is_async: bool,
) -> str:
    """Get the event handler string.

    Parameters
    ----------
    space : str
        The space before the content.
    is_async : bool
        Whether the handler is asynchronous.

    Returns
    -------
    str
        The event handler string.
    """
    tab = "    "
    content = (
        f"{space}if not isinstance(results, list):\n"
        f"{space}{tab}results = [results]  # pylint: disable=redefined-variable-type\n"
        f"{space}if on_event:\n"
        f"{space}{tab}for index, result in enumerate(results):\n"
    )
    if is_async:
        content += (
            f"{space}{tab}{tab}async for event in result.events:\n"
            f"{space}{tab}{tab}{tab}try:\n"
            f"{space}{tab}{tab}{tab}{tab}should_continue = await on_event(event, __KNOWN_AGENTS__)\n"
            f"{space}{tab}{tab}{tab}except BaseException as e:\n{_stop_logging(space, is_async)}"
            f"{space}{tab}{tab}{tab}{tab}store_error(e)\n"
            f"{space}{tab}{tab}{tab}{tab}raise SystemExit(\n"
            f'{space}{tab}{tab}{tab}{tab}{tab}"Error in event handler: " + str(e)\n'
            f"{space}{tab}{tab}{tab}{tab}) from e\n"
        )
    else:
        content += (
            f"{space}{tab}{tab}for event in result.events:\n"
            f"{space}{tab}{tab}{tab}try:\n"
            f"{space}{tab}{tab}{tab}{tab}should_continue = on_event(event, __KNOWN_AGENTS__)\n"
            f"{space}{tab}{tab}{tab}except BaseException as e:\n{_stop_logging(space, is_async)}"
            f"{space}{tab}{tab}{tab}{tab}store_error(e)\n"
            f"{space}{tab}{tab}{tab}{tab}raise SystemExit(\n"
            f'{space}{tab}{tab}{tab}{tab}{tab}"Error in event handler: " + str(e)\n'
            f"{space}{tab}{tab}{tab}{tab}) from e\n"
        )
    content += (
        f'{space}{tab}{tab}{tab}if event.type == "run_completion":\n'
        f"{space}{tab}{tab}{tab}{tab}break\n"
        f"{space}{tab}{tab}{tab}if not should_continue:\n{_stop_logging(space, is_async)}"
        f"{space}{tab}{tab}{tab}{tab}store_error()\n"
        f'{space}{tab}{tab}{tab}{tab}raise SystemExit("Event handler stopped processing")\n'
    )
    content += get_result_dicts_string(space, is_async)
    content += (
        f"{space}else:\n{space}{tab}for index, result in enumerate(results):\n"
    )
    if is_async:
        content += f"{space}{tab}{tab}await result.process()\n"
    else:
        content += f"{space}{tab}{tab}result.process()\n"
    content += get_result_dicts_string(space, is_async)

    return content


def get_result_dicts_string(tab: str, is_async: bool) -> str:
    """Get the result dicts string.

    Parameters
    ----------
    tab : str
        The space string to use for indentation.
    is_async : bool
        Whether the function is asynchronous.

    Returns
    -------
    str
        The result dicts string.
    """
    space = f"{tab}        "
    flow_content = f"{space}result_dict = {{\n"
    flow_content += f'{space}    "index": index,\n'
    if is_async:
        flow_content += f'{space}    "messages": await result.messages,\n'
        flow_content += f'{space}    "summary": await result.summary,\n'
        flow_content += f'{space}    "cost": (await result.cost).model_dump(mode="json", fallback=str) if await result.cost else None,\n'
        flow_content += f'{space}    "context_variables": (await result.context_variables).model_dump(mode="json", fallback=str) if await result.context_variables else None,\n'
        flow_content += (
            f'{space}    "last_speaker": await result.last_speaker,\n'
        )
    else:
        flow_content += f'{space}    "messages": result.messages,\n'
        flow_content += f'{space}    "summary": result.summary,\n'
        flow_content += f'{space}    "cost": result.cost.model_dump(mode="json", fallback=str) if result.cost else None,\n'
        flow_content += f'{space}    "context_variables": result.context_variables.model_dump(mode="json", fallback=str) if result.context_variables else None,\n'
        flow_content += f'{space}    "last_speaker": result.last_speaker,\n'
    flow_content += f'{space}    "uuid": str(result.uuid),\n'
    flow_content += f"{space}}}\n"
    flow_content += f"{space}result_dicts.append(result_dict)\n"
    return flow_content
