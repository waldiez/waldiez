# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.chats.ChatsExporter with a sequential chat."""

from waldiez.exporting.chats import ChatsExporter
from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentConnection,
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatNested,
    WaldiezChatSummary,
)


# pylint: disable=too-many-locals
def test_sequential_chat() -> None:
    """Test ChatsExporter with a sequential chat."""
    agent1_name = "agent1"
    agent2_name = "agent2"
    agent3_name = "agent3"
    chat1_name = "chat1"
    chat2_name = "chat2"
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
        data={},  # type: ignore
    )
    chat1 = WaldiezChat(
        id="wc-1",
        data=WaldiezChatData(
            source="wa-1",
            target="wa-2",
            source_type="assistant",
            target_type="assistant",
            name=chat1_name,
            description="A chat between two agents.",
            message=WaldiezChatMessage(
                type="string",
                content="Hello, how are you?",
            ),
            nested_chat=WaldiezChatNested(),
            summary=WaldiezChatSummary(),
        ),
    )
    chat2 = WaldiezChat(
        id="wc-2",
        data=WaldiezChatData(
            source="wa-2",
            target="wa-3",
            source_type="assistant",
            target_type="assistant",
            name=chat2_name,
            description="A chat between two agents.",
            message=WaldiezChatMessage(
                type="string",
                content="Hello, how are you?",
            ),
            nested_chat=WaldiezChatNested(),
            summary=WaldiezChatSummary(),
        ),
    )
    agent_names = {
        "wa-1": agent1_name,
        "wa-2": agent2_name,
        "wa-3": agent3_name,
    }
    chat_names = {"wc-1": chat1_name, "wc-2": chat2_name}
    # main_chats = [(chat1, agent1, agent2), (chat2, agent2, agent3)]
    main_chats: list[WaldiezAgentConnection] = [
        {
            "chat": chat1,
            "source": agent1,
            "target": agent2,
        },
        {
            "chat": chat2,
            "source": agent2,
            "target": agent3,
        },
    ]
    exporter = ChatsExporter(
        all_agents=[agent1, agent2, agent3],
        agent_names=agent_names,
        all_chats=[chat1, chat2],
        chat_names=chat_names,
        main_chats=main_chats,
        for_notebook=False,
        is_async=False,
    )
    generated = exporter.generate()
    expected = """
        results = initiate_chats([
            {
                "sender": agent1,
                "recipient": agent2,
                "cache": cache,
                "summary_method": "last_msg",
                "chat_id": 0,
                "message": "Hello, how are you?",
            },
            {
                "sender": agent2,
                "recipient": agent3,
                "cache": cache,
                "summary_method": "last_msg",
                "chat_id": 0,
                "message": "Hello, how are you?",
            },
        ])
"""
    assert generated == expected
    imports = exporter.get_imports()
    assert imports is not None
    assert imports[0][0] == "from autogen.agentchat.chat import initiate_chats"
    # no nested chats in agents
    assert not exporter.get_after_export()
