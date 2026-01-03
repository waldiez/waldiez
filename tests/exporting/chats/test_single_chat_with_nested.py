# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-locals,duplicate-code
"""Test waldiez.exporting.chats.ChatsExporter with a single chat.

With the agents also having nested chats.
"""

from waldiez.exporting.chats import ChatsExporter
from waldiez.exporting.chats.utils.common import get_event_handler_string
from waldiez.models import (
    WaldiezAgent,
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatNested,
    WaldiezChatSummary,
    WaldiezDefaultCondition,
    WaldiezTransitionAvailability,
)


# pylint: disable=too-many-locals
# noinspection PyArgumentList
def test_single_chat_with_nested() -> None:
    """Test ChatsExporter with a single chat."""
    agent1_name = "agent1"
    agent2_name = "agent2"
    agent3_name = "agent3"
    agent4_name = "agent4"
    chat_name = "chat1"
    agent1 = WaldiezAgent(
        id="wa-1",
        name=agent1_name,
        agent_type="assistant",
        description="agent description",
        data={},  # type: ignore
    )
    agent2 = WaldiezAgent(
        id="wa-2",
        name=agent2_name,
        agent_type="assistant",
        description="agent description",
        data={},  # type: ignore
    )
    agent3 = WaldiezAgent(
        id="wa-3",
        name=agent3_name,
        agent_type="assistant",
        description="agent description",
        data={  # type: ignore
            "nestedChats": [
                {
                    "triggeredBy": ["wa-1"],
                    "messages": [{"id": "wc-2", "isReply": True}],
                }
            ]
        },
    )
    agent4 = WaldiezAgent(
        id="wa-4",
        name=agent4_name,
        agent_type="assistant",
        description="agent description",
        data={  # type: ignore
            "nestedChats": [
                {
                    "triggeredBy": ["wa-2"],
                    "messages": [{"id": "wc-2", "isReply": False}],
                }
            ]
        },
    )
    chat1 = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source_type="assistant",
            target_type="assistant",
            order=1,
            nested_chat=WaldiezChatNested(),
            summary=WaldiezChatSummary(),
            message=WaldiezChatMessage(
                type="string",
                content='Hello "wa-2" from "wa-1"',
                use_carryover=False,
                context={
                    "variable1": "value1",
                },
            ),
            condition=WaldiezDefaultCondition.create(),
            available=WaldiezTransitionAvailability(),
        ),
    )
    chat2 = WaldiezChat(
        id="wc-2",
        source="wa-1",
        target="wa-3",
        type="chat",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source_type="assistant",
            target_type="assistant",
            order=-1,
            summary=WaldiezChatSummary(),
            message=WaldiezChatMessage(
                type="none",
                content=None,
                use_carryover=False,
                context={},
            ),
            nested_chat=WaldiezChatNested(
                message=WaldiezChatMessage(
                    type="string",
                    content='Hello "wa-3" from "wa-1"',
                    use_carryover=False,
                    context={},
                ),
                reply=WaldiezChatMessage(
                    type="string",
                    content='Hello "wa-1" from "wa-3"',
                    use_carryover=False,
                    context={},
                ),
            ),
            condition=WaldiezDefaultCondition.create(),
            available=WaldiezTransitionAvailability(),
        ),
    )
    method_content = """
def nested_chat_message(recipient, messages, sender, config):
    return f"Hello to {recipient.name} from {sender.name}"
"""
    chat3 = WaldiezChat(
        id="wc-3",
        source="wa-2",
        target="wa-4",
        type="chat",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source_type="assistant",
            target_type="assistant",
            order=-1,
            message=WaldiezChatMessage(
                type="none",
                content=None,
                use_carryover=False,
                context={},
            ),
            nested_chat=WaldiezChatNested(
                message=WaldiezChatMessage(
                    type="method",
                    content=method_content,
                    use_carryover=False,
                    context={
                        "variable1": "value1",
                    },
                ),
                reply=WaldiezChatMessage(
                    type="string",
                    content='Hello "wa-2" from "wa-4"',
                    use_carryover=False,
                    context={},
                ),
            ),
            summary=WaldiezChatSummary(),
            condition=WaldiezDefaultCondition.create(),
            available=WaldiezTransitionAvailability(),
        ),
    )
    agent_names = {
        "wa-1": agent1_name,
        "wa-2": agent2_name,
        "wa-3": agent3_name,
        "wa-4": agent4_name,
    }
    chat_names = {"wc-1": chat_name, "wc-2": chat_name, "wc-3": chat_name}
    # noinspection PyTypeChecker
    exporter = ChatsExporter(
        all_agents=[agent1, agent2, agent3, agent4],
        agent_names=agent_names,
        all_chats=[chat1, chat2, chat3],
        chat_names=chat_names,
        root_group_manager=None,
        cache_seed=42,
        main_chats=[
            {
                "chat": chat1,
                "source": agent1,
                "target": agent2,
            }
        ],
        for_notebook=False,
        is_async=False,
    )
    exporter.export()
    expected = """
        results = agent1.run(
            agent2,
            cache=cache,
            summary_method="last_msg",
            clear_history=True,
            variable1="value1",
            message=__INITIAL_MSG__,
        )
"""
    space = "        "
    assert (
        exporter.extras.chat_initiation
        == expected + get_event_handler_string(space=space, is_async=False)
    )
    registrations = exporter.extras.chat_registration
    # after_export = exporter.get_after_export()
    # assert after_export is not None
    # after_export_str, _ = after_export[0]
    excepted_after_string = """
agent3_chat_queue: list[dict[str, Any]] = [
    {
        "summary_method": "last_msg",
        "clear_history": True,
        "chat_id": 0,
        "recipient": agent1,
        "message": "Hello \\"wa-1\\" from \\"wa-3\\""
    },
]

agent3.register_nested_chats(
    trigger=["agent1"],
    chat_queue=agent3_chat_queue,
    use_async=False,
    ignore_async_in_sync_chat=True,
)

agent4_chat_queue: list[dict[str, Any]] = [
    {
        "summary_method": "last_msg",
        "clear_history": True,
        "chat_id": 0,
        "recipient": agent3,
        "sender": agent1,
        "message": "Hello \\"wa-3\\" from \\"wa-1\\""
    },
]

agent4.register_nested_chats(
    trigger=["agent2"],
    chat_queue=agent4_chat_queue,
    use_async=False,
    ignore_async_in_sync_chat=True,
)
"""
    assert registrations == excepted_after_string
