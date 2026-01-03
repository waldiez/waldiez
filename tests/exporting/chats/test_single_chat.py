# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-locals,duplicate-code
"""Test waldiez.exporting.chats.ChatsExporter with a single chat."""

from waldiez.exporting.chats import ChatsExporter
from waldiez.exporting.chats.utils.common import get_event_handler_string
from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentConnection,
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatNested,
    WaldiezChatSummary,
    WaldiezDefaultCondition,
    WaldiezRagUserProxy,
    WaldiezTransitionAvailability,
)
from waldiez.models.chat.chat_message import RAG_METHOD_WITH_CARRYOVER_BODY


# noinspection PyArgumentList
def test_single_chat() -> None:
    """Test ChatsExporter with a single chat."""
    agent1_name = "agent1"
    agent2_name = "agent2"
    chat_name = "chat1"
    agent1 = WaldiezAgent(
        id="wa-1",
        name=agent1_name,
        agent_type="user_proxy",
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
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source_type="user_proxy",
            target_type="assistant",
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
            nested_chat=WaldiezChatNested(),
            condition=WaldiezDefaultCondition.create(),
            available=WaldiezTransitionAvailability(),
        ),
    )
    agent_names = {"wa-1": agent1_name, "wa-2": agent2_name}
    chat_names = {"wc-1": chat_name}
    agent_connection: WaldiezAgentConnection = {
        "source": agent1,
        "target": agent2,
        "chat": chat,
    }
    # noinspection PyTypeChecker
    exporter = ChatsExporter(
        all_agents=[agent1, agent2],
        agent_names=agent_names,
        all_chats=[chat],
        chat_names=chat_names,
        root_group_manager=None,
        cache_seed=42,
        main_chats=[agent_connection],
        for_notebook=False,
        is_async=False,
    )
    imports = exporter.get_imports()
    assert not imports
    before_export_str = exporter.extras.chat_prerequisites
    assert before_export_str is not None
    expected_before_string = (
        f"def callable_message_{chat_name}("
        "\n    sender: ConversableAgent,"
        "\n    recipient: ConversableAgent,"
        "\n    context: dict[str, Any],"
        "\n) -> Union[dict[str, Any], str]:"
        "\n"
        '    return f"Hello to {recipient.name} from {sender.name}"\n'
        "\n"
        f"__INITIAL_MSG__=callable_message_{chat_name}"
    )
    assert before_export_str == expected_before_string
    after_export = exporter.extras.after_agent
    assert not after_export
    generated = exporter.extras.chat_initiation
    expected = """
        results = agent1.run(
            agent2,
            cache=cache,
            summary_method="reflection_with_llm",
            summary_args={
                "summary_prompt": "Summarize the chat.",
                "summary_role": "system"
            },
            clear_history=True,
            variable1="value1",
            n_results=2,
            message=__INITIAL_MSG__,
        )
"""
    space = "        "
    assert generated == expected + get_event_handler_string(
        space=space,
        is_async=False,
    )


# noinspection PyTypeChecker,PyArgumentList
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
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source_type="assistant",
            target_type="assistant",
            max_turns=-1,
            clear_history=True,
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
            nested_chat=WaldiezChatNested(),
            condition=WaldiezDefaultCondition.create(),
            available=WaldiezTransitionAvailability(),
        ),
    )
    # noinspection DuplicatedCode
    agent_names = {"wa-1": agent1_name, "wa-2": agent2_name}
    chat_names = {"wc-1": chat_name}
    exporter = ChatsExporter(
        all_agents=[agent1, agent2],
        agent_names=agent_names,
        all_chats=[chat],
        chat_names=chat_names,
        root_group_manager=None,
        cache_seed=42,
        main_chats=[
            {
                "chat": chat,
                "source": agent1,
                "target": agent2,
            }
        ],
        for_notebook=False,
        is_async=False,
    )
    imports = exporter.get_imports()
    assert not imports
    before_export = exporter.extras.chat_prerequisites
    assert before_export == "__INITIAL_MSG__=None"
    generated = exporter.extras.chat_initiation
    space = "        "
    expected = (
        f"\n{space}results = agent1.run("
        f"\n{space}    agent2,"
        f"\n{space}    cache=cache,"
        f"\n{space}    clear_history=True,"
        f"\n{space}    message=__INITIAL_MSG__,"
        f"\n{space})\n"
    )
    assert generated == expected + get_event_handler_string(
        space=space,
        is_async=False,
    )


# noinspection PyArgumentList
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
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source_type="rag_user",
            target_type="assistant",
            max_turns=-1,
            clear_history=True,
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
            nested_chat=WaldiezChatNested(),
            condition=WaldiezDefaultCondition.create(),
            available=WaldiezTransitionAvailability(),
        ),
    )
    agent_names = {"wa-1": agent1_name, "wa-2": agent2_name}
    chat_names = {"wc-1": chat_name}
    # noinspection PyTypeChecker
    exporter = ChatsExporter(
        all_agents=[agent1, agent2],
        agent_names=agent_names,
        all_chats=[chat],
        root_group_manager=None,
        cache_seed=42,
        chat_names=chat_names,
        main_chats=[
            {
                "chat": chat,
                "source": agent1,
                "target": agent2,
            }
        ],
        for_notebook=False,
        is_async=False,
    )
    imports = exporter.get_imports()
    assert not imports
    before_export = exporter.extras.chat_prerequisites
    expected_before_body = RAG_METHOD_WITH_CARRYOVER_BODY
    expected_before = (
        "def callable_message_chat1(\n"
        "    sender: RetrieveUserProxyAgent,\n"
        "    recipient: ConversableAgent,\n"
        "    context: dict[str, Any],\n"
        ") -> Union[dict[str, Any], str]:"
        f"{expected_before_body}"
        "\n"
        "__INITIAL_MSG__=callable_message_chat1"
    )
    assert before_export == expected_before
    generated = exporter.extras.chat_initiation
    tab = "    "
    space = tab * 2
    expected = (
        "\n"
        f"{space}results = {agent1_name}.run("
        "\n"
        f"{space}{tab}{agent2_name},"
        "\n"
        f"{space}{tab}cache=cache,"
        "\n"
        f"{space}{tab}clear_history=True,"
        "\n"
        f'{space}{tab}problem="summarization",'
        "\n"
        f'{space}{tab}model="one/model/name",'
        "\n"
        f"{space}{tab}message=__INITIAL_MSG__,"
        "\n"
        f"{space})"
        "\n"
    ) + get_event_handler_string(
        space=space,
        is_async=False,
    )
    assert generated == expected


# noinspection PyTypeChecker,PyArgumentList
def test_chat_with_rag_no_carryover() -> None:
    """Test ChatsExporter with a chat with rag message generator."""
    agent1_name = "agent1"
    agent2_name = "agent2"
    chat_name = "chat1"
    agent1 = WaldiezRagUserProxy(
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
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat1",
            description="A chat between two agents.",
            source_type="rag_user",
            target_type="assistant",
            max_turns=-1,
            clear_history=True,
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
            nested_chat=WaldiezChatNested(),
            condition=WaldiezDefaultCondition.create(),
            available=WaldiezTransitionAvailability(),
        ),
    )
    # noinspection DuplicatedCode
    agent_names = {"wa-1": agent1_name, "wa-2": agent2_name}
    chat_names = {"wc-1": chat_name}
    exporter = ChatsExporter(
        all_agents=[agent1, agent2],
        agent_names=agent_names,
        all_chats=[chat],
        chat_names=chat_names,
        root_group_manager=None,
        cache_seed=42,
        main_chats=[
            {
                "chat": chat,
                "source": agent1,
                "target": agent2,
            }
        ],
        for_notebook=False,
        is_async=False,
    )
    imports = exporter.get_imports()
    assert not imports
    before_export = exporter.extras.chat_prerequisites
    assert before_export == "__INITIAL_MSG__=agent1.message_generator"
    generated = exporter.extras.chat_initiation
    tab = "    "
    space = tab * 2
    expected = (
        "\n"
        f"{space}results = {agent1_name}.run("
        "\n"
        f"{space}{tab}{agent2_name},"
        "\n"
        f"{space}{tab}cache=cache,"
        "\n"
        f"{space}{tab}clear_history=True,"
        "\n"
        f'{space}{tab}key1="value1",'
        "\n"
        f"{space}{tab}message=__INITIAL_MSG__,"
        "\n"
        f"{space})"
        "\n"
    ) + get_event_handler_string(
        space=space,
        is_async=False,
    )
    assert generated == expected
