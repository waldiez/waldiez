# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=line-too-long
"""Utilities for exporting a single chat in a flow."""

from typing import Any, Callable, Dict, Optional, Tuple

from waldiez.models import (
    WaldiezAgent,
    WaldiezChat,
    WaldiezChatMessage,
    WaldiezRagUser,
)

from .common import get_chat_message_string, update_summary_chat_args


def export_single_chat(
    sender: WaldiezAgent,
    recipient: WaldiezAgent,
    chat: WaldiezChat,
    agent_names: Dict[str, str],
    chat_names: Dict[str, str],
    serializer: Callable[[str], str],
    string_escape: Callable[[str], str],
    tabs: int,
    is_async: bool,
) -> Tuple[str, str]:
    """Get the chat string when there is only one chat in the flow.

    Parameters
    ----------
    sender : WaldiezAgent
        The sender.
    recipient : WaldiezAgent
        The recipient.
    chat : WaldiezChat
        The chat.
    agent_names : Dict[str, str]
        A mapping of agent id to agent name.
    chat_names : Dict[str, str]
        A mapping of chat id to chat name.
    serializer : Callable[[str], str]
        The serializer function to escape quotes in a string.
    string_escape : Callable[[str], str]
        The string escape function.
    tabs : int
        The number of tabs to use for indentation.
    is_async : bool
        Whether the chat is asynchronous.

    Returns
    -------
    Tuple[str, str]
        The chat string and additional methods string if any

    Example
    -------
    ```python
    >>> from waldiez.models import WaldiezAgent, WaldiezChat, WaldiezChatData, WaldiezChatMessage
    >>> chat = WaldiezChat(
    ...     id="wc-1",
    ...     name="chat1",
    ...     description="A chat between two agents.",
    ...     tags=["chat", "chat1"],
    ...     requirements=[],
    ...     data=WaldiezChatData(
    ...         sender="wa-1",
    ...         recipient="wa-2",
    ...         message=WaldiezChatMessage(
    ...             type="string",
    ...             content="Hello, how are you?",
    ...         ),
    ...     ),
    ... )
    >>> agent_names = {"wa-1": "agent1", "wa-2": "agent2"}
    >>> chat_names = {"wc-1": "chat1"}
    >>> export_single_chat_string(
    ...     sender=agent1,
    ...     recipient=agent2,
    ...     chat=chat,
    ...     agent_names=agent_names,
    ...     chat_names=chat_names,
    ...     tabs=0,
    ... )
    agent1.initiate_chat(
        agent2,
        message="Hello, how are you?",
        cache=cache,
    )
    ```
    """
    tab = "    " * tabs if tabs > 0 else ""
    chat_args = chat.get_chat_args(for_queue=False, sender=sender)
    chat_args = update_summary_chat_args(chat_args, string_escape)
    if not chat_args:
        return get_empty_simple_chat_string(
            chat=chat,
            sender=sender,
            recipient=recipient,
            agent_names=agent_names,
            string_escape=string_escape,
            tab=tab,
            is_async=is_async,
        )
    return get_simple_chat_string(
        chat=chat,
        chat_args=chat_args,
        sender=sender,
        recipient=recipient,
        agent_names=agent_names,
        chat_names=chat_names,
        serializer=serializer,
        string_escape=string_escape,
        tabs=tabs,
        is_async=is_async,
    )


# pylint: disable=too-many-locals
def get_simple_chat_string(
    chat: WaldiezChat,
    sender: WaldiezAgent,
    recipient: WaldiezAgent,
    agent_names: Dict[str, str],
    chat_names: Dict[str, str],
    chat_args: Dict[str, Any],
    serializer: Callable[..., str],
    string_escape: Callable[[str], str],
    tabs: int,
    is_async: bool,
) -> Tuple[str, str]:
    """Get the chat string when there are chat arguments.

    Parameters
    ----------
    chat : WaldiezChat
        The chat.
    sender : WaldiezAgent
        The sender.
    recipient : WaldiezAgent
        The recipient.
    agent_names : Dict[str, str]
        A mapping of agent id to agent name.
    chat_names : Dict[str, str]
        A mapping of chat id to chat name.
    chat_args : Dict[str, Any]
        The chat arguments.
    serializer : Callable[[str], str]
        The serializer function to escape quotes in a string.
    string_escape : Callable[[str], str]
        The string escape function.
    tabs : int
        The number of tabs to use for indentation.
    is_async : bool
        Whether the chat is asynchronous.

    Returns
    -------
    Tuple[str, str]
        The chat string and additional methods string if any.
    """
    tab = "    " * tabs
    sender_name = agent_names[sender.id]
    initiate = "initiate_chat"
    if is_async:
        sender_name = f"await {sender_name}"
        initiate = "a_initiate_chat"
    recipient_name = agent_names[recipient.id]
    chat_string = "\n" + f"{tab}results = {sender_name}.{initiate}(" + "\n"
    chat_string += f"{tab}    {recipient_name},"
    chat_string += "\n" + f"{tab}    cache=cache,"
    for key, value in chat_args.items():
        if isinstance(value, str):
            chat_string += "\n" + f'{tab}    {key}="{value}",'
        elif isinstance(value, dict):
            chat_string += (
                "\n" + f"{tab}    {key}={serializer(value, tabs + 1)},"
            )
        else:
            chat_string += "\n" + f"{tab}    {key}={value},"
    message_arg, additional_methods_string = get_chat_message(
        tab=tab,
        chat=chat,
        chat_names=chat_names,
        sender=sender,
        sender_name=sender_name,
        string_escape=string_escape,
    )
    chat_string += message_arg
    chat_string += "\n" + f"{tab})" + "\n"
    return chat_string, additional_methods_string


def get_empty_simple_chat_string(
    chat: WaldiezChat,
    sender: WaldiezAgent,
    recipient: WaldiezAgent,
    agent_names: Dict[str, str],
    string_escape: Callable[[str], str],
    tab: str,
    is_async: bool,
) -> Tuple[str, str]:
    """Get the chat string when there are no chat arguments.

    Parameters
    ----------
    chat : WaldiezChat
        The chat.
    sender : WaldiezAgent
        The sender.
    recipient : WaldiezAgent
        The recipient.
    agent_names : Dict[str, str]
        A mapping of agent id to agent name.
    string_escape : Callable[[str], str]
        The string escape function.
    tab : str
        The tab string.
    is_async : bool
        Whether the chat is asynchronous.

    Returns
    -------
    Tuple[str, str]
        The chat string and additional methods string if any
    """
    sender_name = agent_names[sender.id]
    if is_async:
        sender_name = f"await {sender_name}"
    recipient_name = agent_names[recipient.id]
    initiate = "a_initiate_chat" if is_async else "initiate_chat"
    content = "\n" + f"{tab}results = {sender_name}.{initiate}(" + "\n"
    content += f"{tab}    {recipient_name}," + "\n"
    content += f"{tab}    cache=cache," + "\n"
    message_arg, _ = get_chat_message(
        tab=tab,
        chat=chat,
        chat_names={},
        sender=sender,
        sender_name=sender_name,
        string_escape=string_escape,
    )
    content += message_arg
    content += f"{tab})" + "\n"
    return content, ""


def get_chat_message(
    tab: str,
    chat: WaldiezChat,
    chat_names: Dict[str, str],
    sender: WaldiezAgent,
    sender_name: str,
    string_escape: Callable[[str], str],
) -> Tuple[str, str]:
    """Get the chat message string.

    Parameters
    ----------
    tab : str
        The tab string.
    chat : WaldiezChat
        The chat.
    chat_names : Dict[str, str]
        A mapping of chat id to chat name.
    sender : WaldiezAgent
        The sender.
    sender_name : str
        The sender name.
    string_escape : Callable[[str], str]
        The string escape function.

    Returns
    -------
    Tuple[str, str]
        The message argument and additional methods string if any.
    """
    additional_methods_string = ""
    method_content: Optional[str] = None
    if (
        sender.agent_type == "rag_user"
        and isinstance(sender, WaldiezRagUser)
        and chat.message.type == "rag_message_generator"
        and chat.message.use_carryover is False
    ):
        message = f"{sender_name}.message_generator"
        return "\n" + f"{tab}    message={message},", additional_methods_string
    message, method_content = get_chat_message_string(
        sender=sender,
        chat=chat,
        chat_names=chat_names,
        string_escape=string_escape,
    )
    if message and isinstance(chat.data.message, WaldiezChatMessage):
        message = string_escape(message)
        if chat.data.message.type == "method":
            additional_methods_string += (
                method_content if method_content else ""
            )
            return (
                "\n" + f"{tab}    message={message},",
                additional_methods_string,
            )
        if chat.message.type == "string" and chat.data.message.content:
            return (
                "\n" + f'{tab}    message="{message}",',
                additional_methods_string,
            )
        if chat.message.type == "rag_message_generator":
            additional_methods_string += (
                method_content if method_content else ""
            )
            return (
                "\n" + f"{tab}    message={message},",
                additional_methods_string,
            )
    return "", additional_methods_string  # pragma: no cover
