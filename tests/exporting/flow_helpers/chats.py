# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Helpers for getting a chat."""

from typing import Any

from waldiez.models import (
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatNested,
    WaldiezChatSummary,
    WaldiezChatType,
    WaldiezDefaultCondition,
    WaldiezTransitionAvailability,
)


def get_chats(is_group: bool, count: int = 5) -> list[WaldiezChat]:
    """Get a list of WaldiezChat instances.

    Parameters
    ----------
    is_group : bool
        Whether the chats are for a group chat.
    count : int, optional
        The number of chats to generate, by default 5

    Returns
    -------
    list[WaldiezChat]
        A list of WaldiezChat instances
    """
    chats: list[WaldiezChat] = []
    custom_message = (
        "def callable_message(sender, recipient, context):\n"
        '    return "hello there!!"'
    )
    for index in range(count):
        chat_id = f"wc-{index + 1}"
        context: dict[str, Any] = {}
        if index in (0, 3):
            context["problem"] = "Solve tha task."
        if index == 3:
            context["bool_variable"] = True
        nested_chat = WaldiezChatNested(
            message=None,
            reply=None,
        )
        chat_type: WaldiezChatType = "chat"
        if is_group:
            if index == 1:
                chat_type = "group"
            if index == 2:
                chat_type = "nested"
        source_index, target_index, prerequisites = _get_chat_numbers(
            index=index,
            is_group=is_group,
        )
        # noinspection PyTypeChecker
        chat = WaldiezChat(
            id=chat_id,
            type=chat_type,
            source=f"wa-{source_index}",
            target=f"wa-{target_index}",
            data=WaldiezChatData(
                name=f"chat_{index + 1}",
                description=f"Description of chat {index + 1}",
                position=-1,
                order=index,
                clear_history=True,
                silent=False,
                max_turns=5,
                message=WaldiezChatMessage(
                    type="string" if index != 2 else "method",
                    use_carryover=index == 2,
                    content=(
                        f"Hello wa-{source_index}"
                        if index != 2
                        else custom_message
                    ),
                    context=context,
                ),
                summary=WaldiezChatSummary(
                    method=(
                        "reflection_with_llm" if index % 2 == 0 else "last_msg"
                    ),
                    prompt="Summarize the chat.",
                    args={"summary_role": "user"},
                ),
                nested_chat=nested_chat,
                real_source=None,
                real_target=None,
                source_type="user_proxy",
                target_type="assistant",
                prerequisites=prerequisites,
                condition=WaldiezDefaultCondition.create(),
                available=WaldiezTransitionAvailability(),
            ),
        )
        chats.append(chat)
    return chats


def _get_chat_numbers(index: int, is_group: bool) -> tuple[int, int, list[str]]:
    """Get source and target index for chat messages."""
    source_index = index + 1
    target_index = index + 2
    prerequisites = []
    if not is_group:
        if index == 1:
            prerequisites = ["wc-1"]
        elif index > 2:
            prerequisites = [f"wc-{idx + 1}" for idx in range(index - 1)]
    else:
        if index == 0:
            target_index = 3
        if index == 2:
            source_index = 2
            target_index = 3
    return source_index, target_index, prerequisites
