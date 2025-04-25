# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-locals
"""Nested chats exporting."""

from typing import Callable, Dict, List, Optional, Tuple

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentNestedChat,
    WaldiezAgentNestedChatMessage,
    WaldiezChat,
)

from .common import update_summary_chat_args


def export_nested_chat_registration(
    agent: WaldiezAgent,
    all_chats: List[WaldiezChat],
    chat_names: Dict[str, str],
    agent_names: Dict[str, str],
    serializer: Callable[..., str],
    string_escape: Callable[[str], str],
    is_async: bool,
) -> str:
    """Get the nested chat string.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    all_chats : List[WaldiezChat]
        All the chats in the flow.
    chat_names : Dict[str, str]
        The chat names.
    agent_names : Dict[str, str]
        The agent names.
    serializer : Callable[..., str]
        The serializer to use to escape quotes in a string.
    string_escape : Callable[[str], str]
        The string escape function.
    is_async : bool
        Whether the chat is asynchronous.

    Returns
    -------
    str
        The nested chat string.
    """
    if not agent.data.nested_chats:
        return ""
    content = ""
    extra_contents = []
    agent_name = agent_names[agent.id]
    use_suffix = len(agent.data.nested_chats) > 1
    for index, entry in enumerate(agent.data.nested_chats):
        trigger_names = get_nested_chat_trigger_agent_names(
            nested_chat=entry, agent_names=agent_names
        )
        chat_queue, extra_methods = get_nested_chat_queue(
            nested_chat=entry,
            agent=agent,
            agent_names=agent_names,
            chat_names=chat_names,
            all_chats=all_chats,
            serializer=serializer,
            string_escape=string_escape,
        )
        if not chat_queue:  # pragma: no cover
            continue
        extra_contents.extend(extra_methods)
        var_name = (
            f"{agent_name}_chat_queue_{index}"
            if use_suffix
            else f"{agent_name}_chat_queue"
        )
        content += f"{var_name} = {chat_queue}" + "\n"
        content += f"""
{agent_name}.register_nested_chats(
    trigger={trigger_names},
    chat_queue={var_name},
    use_async={is_async},
    ignore_async_in_sync_chat=True,
)
"""
    functions_string = "\n".join(sorted(extra_contents))
    if functions_string:
        functions_string = functions_string + "\n"
    content = f"{functions_string}{content}"
    return (
        content.replace('"None"', "None")
        .replace("'None'", "None")
        .replace('"False"', "False")
        .replace("'False'", "False")
        .replace("'True'", "True")
        .replace('"True"', "True")
    )


def get_nested_chat_trigger_agent_names(
    nested_chat: WaldiezAgentNestedChat,
    agent_names: Dict[str, str],
) -> str:
    """Get the trigger agent names for the nested chat.

    Parameters
    ----------
    nested_chat : WaldiezAgentNestedChat
        The nested chat.
    agent_names : Dict[str, str]
        A mapping of agent id to agent name.

    Returns
    -------
    str
        The trigger agent names.
    """
    agents = [agent_names[agent_id] for agent_id in nested_chat.triggered_by]
    agents_string = [", ".join(agents)]
    trigger_string = f"{agents_string}"
    return trigger_string.replace("'", '"')


def get_nested_chat_message_string(
    waldiez_chat: WaldiezChat,
    message: WaldiezAgentNestedChatMessage,
    agent: WaldiezAgent,
    agent_names: Dict[str, str],
    chat_names: Dict[str, str],
    serializer: Callable[..., str],
    string_escape: Callable[[str], str],
) -> Tuple[str, Optional[str]]:
    """Get the nested chat message string.

    Parameters
    ----------
    waldiez_chat : WaldiezChat
        The chat.
    message : WaldiezAgentNestedChatMessage
        The message.
    agent : WaldiezAgent
        The agent.
    agent_names : Dict[str, str]
        A mapping of agent id to agent name.
    chat_names : Dict[str, str]
        A mapping of chat id to chat name.
    serializer : Callable[..., str]
        The function to serialize the chat arguments.
    string_escape : Callable[[str], str]
        The function to escape the string.

    Returns
    -------
    Tuple[str, Optional[str]]
        The message string and the method name if the message is a method.
    """
    sender_name: Optional[str] = None
    sender_id = waldiez_chat.target if message.is_reply else waldiez_chat.source
    recipient_id = (
        waldiez_chat.source if message.is_reply else waldiez_chat.target
    )
    if sender_id != agent.id:
        sender_name = agent_names[sender_id]
    recipient_name = agent_names[recipient_id]
    chat_dict = waldiez_chat.get_chat_args(for_queue=True)
    chat_dict = update_summary_chat_args(chat_dict, string_escape)
    chat_dict["recipient"] = recipient_name
    if sender_name:
        chat_dict["sender"] = sender_name
    message_value, message_source = get_chat_nested_string(
        chat=waldiez_chat,
        is_reply=message.is_reply,
        chat_names=chat_names,
        string_escape=string_escape,
    )
    chat_dict["message"] = message_value
    message_dict_str = serializer(chat_dict, tabs=1)
    if message_source:
        # it's not a string, its the name of the function
        message_dict_str = message_dict_str.replace(
            f': "{message_value}"', f": {message_value}"
        )
    if sender_name:
        message_dict_str = message_dict_str.replace(
            f': "{sender_name}"', f": {sender_name}"
        )
    if recipient_name:
        message_dict_str = message_dict_str.replace(
            f': "{recipient_name}"', f": {recipient_name}"
        )
    return message_dict_str, message_source


def get_nested_chat_queue(
    nested_chat: WaldiezAgentNestedChat,
    agent: WaldiezAgent,
    agent_names: Dict[str, str],
    chat_names: Dict[str, str],
    all_chats: List[WaldiezChat],
    serializer: Callable[..., str],
    string_escape: Callable[[str], str],
) -> Tuple[str, List[str]]:
    """Get the nested chat queue.

    Parameters
    ----------
    nested_chat : WaldiezAgentNestedChat
        The nested chat.
    agent : WaldiezAgent
        The agent.
    agent_names : Dict[str, str]
        A mapping of agent id to agent name.
    chat_names : Dict[str, str]
        A mapping of chat id to chat name.
    all_chats : List[WaldiezChat]
        All the chats in the flow.
    serializer : Callable[..., str]
        The serializer to use to escape quotes in a string.
    string_escape : Callable[[str], str]
        The function to escape the string.

    Returns
    -------
    Tuple[str, List[str]]
        The nested chat queue and the methods to include
        (methods: message string and method name if the message is a method).
    """
    message_methods_to_include = []
    chat_messages_str = "[\n"
    for message in nested_chat.messages:
        waldiez_chat = next(chat for chat in all_chats if chat.id == message.id)
        message_str, message_source = get_nested_chat_message_string(
            waldiez_chat=waldiez_chat,
            message=message,
            agent=agent,
            agent_names=agent_names,
            chat_names=chat_names,
            serializer=serializer,
            string_escape=string_escape,
        )
        if message_source:
            message_methods_to_include.append(message_source)
        chat_messages_str += f"    {message_str}," + "\n"
    chat_messages_str += "]"
    if chat_messages_str == "[\n]":
        return "", message_methods_to_include
    return chat_messages_str, message_methods_to_include


def get_chat_nested_string(
    chat: WaldiezChat,
    is_reply: bool,
    chat_names: Dict[str, str],
    string_escape: Callable[[str], str],
) -> Tuple[str, Optional[str]]:
    """Get the nested chat message.

    Parameters
    ----------
    chat : WaldiezChat
        The chat.
    is_reply : bool
        Whether to use the nested chat's reply message or not.
    chat_names : Dict[str, str]
        A mapping of chat id to chat name.
    string_escape : Callable[[str], str]
        The function to escape the string.

    Returns
    -------
    Tuple[str, Optional[str]]
        If the message is a string, the message content and None.
        If the message is a method, the method name and the method content.
        If the message is None, 'None' and None.
    """
    message = (
        chat.data.nested_chat.reply
        if is_reply
        else chat.data.nested_chat.message
    )
    if not message or message.type == "none" or message.content is None:
        return "None", None
    if message.type == "string":
        return string_escape(message.content), None
    chat_name = chat_names[chat.id]
    if is_reply:
        function_content, function_name = chat.get_nested_chat_message_function(
            name_suffix=chat_name
        )
    else:
        function_content, function_name = chat.get_nested_chat_message_function(
            name_suffix=chat_name
        )
    return function_name, function_content
