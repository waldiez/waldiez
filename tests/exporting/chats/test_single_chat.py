# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-locals,duplicate-code
"""Test waldiez.exporting.chats.ChatsExporter with a single chat."""

from waldiez.exporting.base import ExportPositions
from waldiez.exporting.chats import ChatsExporter
from waldiez.models import (
    WaldiezAgent,
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatSummary,
    WaldiezRagUser,
)
from waldiez.models.chat.chat_message import get_last_carryover_method_content


def test_single_chat() -> None:
    """Test ChatsExporter with a single chat."""
    agent1_name = "agent1"
    agent2_name = "agent2"
    chat_name = "chat1"
    agent1 = WaldiezAgent(
        id="wa-1",
        name=agent1_name,
        agent_type="user",
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
    method_content = """
def callable_message(sender, recipient, context):
    return f"Hello to {recipient.name} from {sender.name}"
"""
    chat = WaldiezChat(
        id="wc-1",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source="wa-1",
            target="wa-2",
            summary=WaldiezChatSummary(
                method="reflectionWithLlm",
                prompt="Summarize the chat.",
                args={
                    "summary_role": "system",
                },
            ),
            message=WaldiezChatMessage(
                type="method",
                content=method_content,
                use_carryover=True,
                context={"variable1": "value1", "n_results": 2},
            ),
        ),
    )
    agent_names = {"wa-1": agent1_name, "wa-2": agent2_name}
    chat_names = {"wc-1": chat_name}
    exporter = ChatsExporter(
        get_swarm_members=lambda _: ([], None),
        all_agents=[agent1, agent2],
        agent_names=agent_names,
        all_chats=[chat],
        chat_names=chat_names,
        main_chats=[(chat, agent1, agent2)],
        for_notebook=False,
        is_async=False,
    )
    imports = exporter.get_imports()
    assert imports is None
    before_export = exporter.get_before_export()
    assert before_export is not None
    before_export_str, export_position = before_export[0]
    expected_before_string = (
        f"def callable_message_{chat_name}("
        "\n    sender: ConversableAgent,"
        "\n    recipient: ConversableAgent,"
        "\n    context: Dict[str, Any],"
        "\n) -> Union[Dict[str, Any], str]:"
        "\n"
        '    return f"Hello to {recipient.name} from {sender.name}"\n'
    )
    assert before_export_str == expected_before_string
    assert export_position.position == ExportPositions.CHATS
    after_export = exporter.get_after_export()
    assert not after_export
    generated = exporter.generate()
    expected = """
        results = agent1.initiate_chat(
            agent2,
            cache=cache,
            summary_method="reflection_with_llm",
            summary_args={
                "summary_prompt": "Summarize the chat.",
                "summary_role": "system"
            },
            variable1="value1",
            n_results=2,
            message=callable_message_chat1,
        )
"""
    assert generated == expected


def test_empty_chat() -> None:
    """Test ChatsExporter with an empty chat."""
    agent1_name = "agent1"
    agent2_name = "agent2"
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
    chat = WaldiezChat(
        id="wc-1",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source="wa-1",
            target="wa-2",
            max_turns=-1,
            clear_history=None,
            silent=None,
            summary=WaldiezChatSummary(
                method=None,
                prompt="",
                args={},
            ),
            message=WaldiezChatMessage(
                type="none",
                content=None,
                use_carryover=False,
                context={},
            ),
        ),
    )
    agent_names = {"wa-1": agent1_name, "wa-2": agent2_name}
    chat_names = {"wc-1": chat_name}
    exporter = ChatsExporter(
        get_swarm_members=lambda _: ([], None),
        all_agents=[agent1, agent2],
        agent_names=agent_names,
        all_chats=[chat],
        chat_names=chat_names,
        main_chats=[(chat, agent1, agent2)],
        for_notebook=False,
        is_async=False,
    )
    imports = exporter.get_imports()
    assert imports is None
    before_export = exporter.get_before_export()
    assert not before_export
    after_export = exporter.get_after_export()
    assert not after_export
    generated = exporter.generate()
    expected = (
        "\n        results = agent1.initiate_chat("
        "\n            agent2,"
        "\n            cache=cache,"
        "\n        )\n"
    )
    assert generated == expected


def test_chat_with_rag_and_carryover() -> None:
    """Test ChatsExporter with a chat with rag message generator."""
    agent1_name = "agent1"
    agent2_name = "agent2"
    chat_name = "chat1"
    agent1 = WaldiezAgent(
        id="wa-1",
        name=agent1_name,
        agent_type="rag_user",
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
    chat = WaldiezChat(
        id="wc-1",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source="wa-1",
            target="wa-2",
            max_turns=-1,
            clear_history=None,
            silent=None,
            summary=WaldiezChatSummary(
                method=None,
                prompt="",
                args={},
            ),
            message=WaldiezChatMessage(
                type="rag_message_generator",
                use_carryover=True,
                content="Hello, how are you?",
                context={
                    "problem": "summarization",
                    "model": "one/model/name",
                },
            ),
        ),
    )
    agent_names = {"wa-1": agent1_name, "wa-2": agent2_name}
    chat_names = {"wc-1": chat_name}
    exporter = ChatsExporter(
        get_swarm_members=lambda _: ([], None),
        all_agents=[agent1, agent2],
        agent_names=agent_names,
        all_chats=[chat],
        chat_names=chat_names,
        main_chats=[(chat, agent1, agent2)],
        for_notebook=False,
        is_async=False,
    )
    imports = exporter.get_imports()
    assert imports is None
    before_export = exporter.get_before_export()
    expected_before_body = get_last_carryover_method_content(
        "Hello, how are you?"
    )
    expected_before = (
        "def callable_message_chat1(\n"
        "    sender: RetrieveUserProxyAgent,\n"
        "    recipient: ConversableAgent,\n"
        "    context: Dict[str, Any],\n"
        ") -> Union[Dict[str, Any], str]:"
        f"{expected_before_body}"
    )
    assert before_export is not None
    before_export_str = before_export[0][0]
    assert before_export_str == expected_before
    after_export = exporter.get_after_export()
    assert not after_export
    generated = exporter.generate()
    tab = "    "
    space = tab * 2
    expected = (
        "\n"
        f"{space}results = {agent1_name}.initiate_chat("
        "\n"
        f"{space}{tab}{agent2_name},"
        "\n"
        f"{space}{tab}cache=cache,"
        "\n"
        f'{space}{tab}problem="summarization",'
        "\n"
        f'{space}{tab}model="one/model/name",'
        "\n"
        f"{space}{tab}message=callable_message_{chat_name},"
        "\n"
        f"{space})"
        "\n"
    )
    assert generated == expected


def test_chat_with_rag_no_carryover() -> None:
    """Test ChatsExporter with a chat with rag message generator."""
    agent1_name = "agent1"
    agent2_name = "agent2"
    chat_name = "chat1"
    agent1 = WaldiezRagUser(
        id="wa-1",
        name=agent1_name,
        agent_type="rag_user",
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
    chat = WaldiezChat(
        id="wc-1",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source="wa-1",
            target="wa-2",
            max_turns=-1,
            clear_history=None,
            silent=None,
            summary=WaldiezChatSummary(
                method=None,
                prompt="",
                args={},
            ),
            message=WaldiezChatMessage(
                type="rag_message_generator",
                content="Hello, how are you?",
                use_carryover=False,
                context={
                    "key1": "value1",
                },
            ),
        ),
    )
    agent_names = {"wa-1": agent1_name, "wa-2": agent2_name}
    chat_names = {"wc-1": chat_name}
    exporter = ChatsExporter(
        get_swarm_members=lambda _: ([], None),
        all_agents=[agent1, agent2],
        agent_names=agent_names,
        all_chats=[chat],
        chat_names=chat_names,
        main_chats=[(chat, agent1, agent2)],
        for_notebook=False,
        is_async=False,
    )
    imports = exporter.get_imports()
    assert imports is None
    before_export = exporter.get_before_export()
    assert not before_export
    after_export = exporter.get_after_export()
    assert not after_export
    generated = exporter.generate()
    tab = "    "
    space = tab * 2
    expected = (
        "\n"
        f"{space}results = {agent1_name}.initiate_chat("
        "\n"
        f"{space}{tab}{agent2_name},"
        "\n"
        f"{space}{tab}cache=cache,"
        "\n"
        f'{space}{tab}key1="value1",'
        "\n"
        f"{space}{tab}message={agent1_name}.message_generator,"
        "\n"
        f"{space})"
        "\n"
    )
    assert generated == expected
