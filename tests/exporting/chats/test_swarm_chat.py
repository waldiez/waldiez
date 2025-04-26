# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.chats.ChatsExporter with a swarm chat."""

import pytest

from waldiez.exporting.chats import ChatsExporter
from waldiez.exporting.chats.utils.swarm import (
    export_swarm_chat,
    get_swarm_after_work_string,
    get_swarm_agents_strings,
    get_swarm_messages_string,
)
from waldiez.models import (
    Waldiez,
    WaldiezAgent,
    WaldiezAgents,
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatNested,
    WaldiezChatSummary,
    WaldiezFlow,
    WaldiezFlowData,
    WaldiezSwarmAfterWork,
    WaldiezSwarmOnConditionAvailable,
)


# pylint: disable=too-many-locals,too-many-statements
def test_swarm_chat() -> None:
    """Test ChatsExporter with a swarm chat."""
    agent1 = WaldiezAgent(
        id="wa-1",
        name="agent1",
        agent_type="user",
    )
    agent2 = WaldiezAgent(
        id="wa-2",
        name="agent2",
        agent_type="swarm",
    )
    agent3 = WaldiezAgent(
        id="wa-3",
        name="agent3",
        agent_type="swarm",
    )
    agent4 = WaldiezAgent(
        id="wa-4",
        name="agent4",
        agent_type="swarm",
    )
    agent5 = WaldiezAgent(
        id="wa-5",
        name="agent5",
        agent_type="assistant",
    )
    chat1 = WaldiezChat(
        id="wc-1",
        data=WaldiezChatData(
            name="chat1",
            description="A simple swarm chat.",
            source="wa-1",
            target="wa-2",
            position=1,
            order=1,
            clear_history=False,
            message=WaldiezChatMessage(
                type="string",
                use_carryover=False,
                content="Hello wa-2 from wa-1!",
                context={},
            ),
            summary=WaldiezChatSummary(
                method=None,
                prompt="",
                args={},
            ),
            nested_chat=WaldiezChatNested(
                message=None,
                reply=None,
            ),
            context_variables={
                "variable1": "value1",
            },
            silent=False,
            real_source=None,
            real_target=None,
            max_turns=1,
            max_rounds=10,
            after_work=WaldiezSwarmAfterWork(
                recipient="REVERT_TO_USER",
                recipient_type="option",
            ),
            available=WaldiezSwarmOnConditionAvailable(
                type="string",
                value="variable1",
            ),
            prerequisites=[],
        ),
    )
    after_work_callable = """
def custom_after_work(last_speaker, messages, groupchat):
    return "TERMINATE"
"""
    chat2 = WaldiezChat(
        id="wc-2",
        data=WaldiezChatData(
            name="chat2",
            description="A chat.",
            source="wa-2",
            target="wa-3",
            position=-1,
            order=-1,
            clear_history=False,
            message=WaldiezChatMessage(
                type="string",
                use_carryover=False,
                content="Hello wa-3 from wa-2!",
                context={},
            ),
            summary=WaldiezChatSummary(
                method=None,
                prompt="",
                args={},
            ),
            nested_chat=WaldiezChatNested(
                message=None,
                reply=None,
            ),
            silent=False,
            real_source=None,
            real_target=None,
            max_turns=2,
            max_rounds=5,
            after_work=WaldiezSwarmAfterWork(
                recipient=after_work_callable,
                recipient_type="callable",
            ),
            available=WaldiezSwarmOnConditionAvailable(
                type="none",
                value=None,
            ),
            prerequisites=[],
        ),
    )
    chat3 = WaldiezChat(
        id="wc-3",
        data=WaldiezChatData(
            name="chat3",
            description="A simple chat.",
            source="wa-3",
            target="wa-4",
            position=-1,
            order=-1,
            clear_history=False,
            message=WaldiezChatMessage(
                type="string",
                use_carryover=False,
                content="Hello wa-4 from wa-3!",
                context={},
            ),
            summary=WaldiezChatSummary(
                method=None,
                prompt="",
                args={},
            ),
            nested_chat=WaldiezChatNested(
                message=None,
                reply=None,
            ),
            silent=False,
            real_source=None,
            real_target=None,
            max_turns=3,
            max_rounds=2,
            after_work=WaldiezSwarmAfterWork(
                recipient="wa-4",
                recipient_type="agent",
            ),
            available=WaldiezSwarmOnConditionAvailable(
                type="none",
                value=None,
            ),
            prerequisites=[],
        ),
    )
    callable_message = """
def callable_message(sender, recipient, context):
    return "hello" + context.get("name", "")
"""
    chat4 = WaldiezChat(
        id="wc-4",
        data=WaldiezChatData(
            name="chat4",
            description="A chat.",
            source="wa-5",
            target="wa-1",
            position=-1,
            order=-1,
            clear_history=False,
            message=WaldiezChatMessage(
                type="method",
                use_carryover=False,
                content=callable_message,
                context={
                    "name": "world",
                },
            ),
            summary=WaldiezChatSummary(
                method=None,
                prompt="",
                args={},
            ),
            nested_chat=WaldiezChatNested(
                message=None,
                reply=None,
            ),
            silent=False,
            real_source=None,
            real_target=None,
            max_turns=4,
            max_rounds=3,
            after_work=None,
            available=WaldiezSwarmOnConditionAvailable(
                type="string",
                value="variable1",
            ),
            prerequisites=[],
        ),
    )
    all_agents = [agent1, agent2, agent3, agent4, agent5]
    all_chats = [chat1, chat2, chat3, chat4]
    agent_names = {agent.id: agent.name for agent in all_agents}
    chat_names = {chat.id: chat.name for chat in all_chats}
    agents = WaldiezAgents(
        users=[agent1.model_dump()],  # type: ignore
        assistants=[agent5.model_dump()],  # type: ignore
        managers=[],
        rag_users=[],
        swarm_agents=[
            agent2.model_dump(),  # type: ignore
            agent3.model_dump(),  # type: ignore
            agent4.model_dump(),  # type: ignore
        ],
    )
    flow = WaldiezFlow(
        id="wf-1",
        name="flow1",
        description="A flow.",
        tags=[],
        requirements=[],
        data=WaldiezFlowData(
            agents=agents,
            chats=[chat.model_dump() for chat in all_chats],  # type: ignore
        ),
    )
    waldiez = Waldiez(
        flow=flow,
    )
    swarm_members = waldiez.get_swarm_members(
        initial_agent=agent2,
    )
    exporter = ChatsExporter(
        get_swarm_members=lambda _: swarm_members,
        all_agents=all_agents,
        agent_names=agent_names,
        all_chats=all_chats,
        chat_names=chat_names,
        main_chats=waldiez.chats,
        for_notebook=False,
        is_async=False,
    )
    generated = exporter.generate()
    expected = """
        results, _, __ = initiate_swarm_chat(
            initial_agent=agent2,
            agents=[agent2, agent3, agent4],
            messages=[{"role": "user", "content": "Hello wa-2 from wa-1!"}],
            context_variables={
                "variable1": "value1"
            },
            user_agent=agent1,
            after_work=AfterWork(AfterWorkOption.REVERT_TO_USER),
            max_rounds=10,
        )
"""
    assert generated == expected
    chat_imports = exporter.get_imports()
    assert chat_imports
    assert chat_imports[0][0] == ("from autogen import initiate_swarm_chat")
    with pytest.raises(ValueError):
        # no swarm agent in chat
        export_swarm_chat(
            get_swarm_members=lambda _: swarm_members,
            chat=chat4,
            sender=agent5,
            recipient=agent1,
            agent_names=agent_names,
            chat_names=chat_names,
            tabs=1,
            serializer=exporter.serializer,
            string_escape=exporter.string_escape,
            is_async=False,
        )
    after_work_string, _ = get_swarm_after_work_string(
        chat=chat3,
        agent_names=agent_names,
        name_suffix=chat_names[chat3.id],
    )
    assert after_work_string == "AfterWork(agent4)"
    after_work_string, _ = get_swarm_after_work_string(
        chat=chat4,
        agent_names=agent_names,
        name_suffix=chat_names[chat4.id],
    )
    assert after_work_string == "AfterWork(AfterWorkOption.TERMINATE)"
    after_work_string, additional_method_string = get_swarm_after_work_string(
        chat=chat2,
        agent_names=agent_names,
        name_suffix=chat_names[chat2.id],
    )
    chat2_name = chat_names[chat2.id]
    assert after_work_string == f"AfterWork(custom_after_work_{chat2_name})"
    # pylint: disable=line-too-long,inconsistent-quotes
    expected = (
        "\n"
        f"def custom_after_work_{chat2_name}("
        "\n    last_speaker: ConversableAgent,"
        "\n    messages: List[Dict[str, Any]],"
        "\n    groupchat: GroupChat,"
        "\n) -> Union[AfterWorkOption, ConversableAgent, str]:"
        '\n    return "TERMINATE"\n\n'
    )
    assert expected == additional_method_string
    messages_string = get_swarm_messages_string(
        chat=chat4, string_escape=exporter.string_escape
    )
    assert messages_string == '"Start the chat."'
    agents_string, user_string = get_swarm_agents_strings(
        swarm_members=swarm_members,
        sender=agent1,
        recipient=agent2,
        agent_names=agent_names,
        user_agent=None,
    )
    assert agents_string == "agent2, agent3, agent4"
    assert user_string == "agent1"
    agents = WaldiezAgents(
        users=[],
        assistants=[],
        managers=[],
        rag_users=[],
        swarm_agents=[
            agent2.model_dump(),  # type: ignore
            agent3.model_dump(),  # type: ignore
            agent4.model_dump(),  # type: ignore
        ],
    )
    all_chats = [chat2, chat3]
    chat_dumps = [chat.model_dump() for chat in all_chats]
    for index, _ in enumerate(chat_dumps):
        chat_dumps[index]["data"]["order"] = index
    flow = WaldiezFlow(
        id="wf-1",
        name="flow1",
        description="A flow.",
        tags=[],
        requirements=[],
        data=WaldiezFlowData(
            agents=agents,
            chats=chat_dumps,  # type: ignore
        ),
    )
    waldiez = Waldiez(
        flow=flow,
    )
    all_agents = [agent2, agent3, agent4]
    agent_names = {agent.id: agent.name for agent in all_agents}
    chat_names = {chat.id: chat.name for chat in all_chats}
    swarm_members = waldiez.flow.get_swarm_chat_members(
        initial_agent=agent2,
    )
    agents_string, user_string = get_swarm_agents_strings(
        swarm_members=swarm_members,
        sender=agent2,
        recipient=agent3,
        agent_names=agent_names,
        user_agent=None,
    )
    assert agents_string == "agent2, agent3, agent4"
    assert user_string == "None"
