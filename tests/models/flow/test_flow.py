# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=too-many-locals
"""Test waldiez.models.flow.*."""

import pytest

from waldiez.models import (
    WaldiezAgents,
    WaldiezAgentTerminationMessage,
    WaldiezAssistant,
    WaldiezAssistantData,
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatNested,
    WaldiezChatSummary,
    WaldiezDefaultCondition,
    WaldiezFlow,
    WaldiezFlowData,
    WaldiezModel,
    WaldiezModelData,
    WaldiezModelPrice,
    WaldiezRagUserProxy,
    WaldiezRagUserProxyData,
    WaldiezRagUserProxyRetrieveConfig,
    WaldiezRagUserProxyVectorDbConfig,
    WaldiezReasoningAgent,
    WaldiezReasoningAgentData,
    WaldiezReasoningAgentReasonConfig,
    WaldiezTool,
    WaldiezToolData,
    WaldiezTransitionAvailability,
    WaldiezUserProxy,
    WaldiezUserProxyData,
)


def test_waldiez_flow() -> None:
    """Test WaldiezFlow."""
    # Given
    user = WaldiezUserProxy(
        id="wa-1",
        name="user",
        type="agent",
        agent_type="user_proxy",
        description="User",
        tags=["user"],
        requirements=["user"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezUserProxyData(
            system_message="User message",
            human_input_mode="ALWAYS",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
            agent_default_auto_reply="User auto reply",
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            tools=[],
            nested_chats=[],
        ),
    )
    assistant = WaldiezAssistant(
        id="wa-2",
        name="assistant",
        type="agent",
        agent_type="assistant",
        description="Assistant",
        tags=["assistant"],
        requirements=["assistant"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezAssistantData(
            system_message="Assistant message",
            human_input_mode="ALWAYS",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
            agent_default_auto_reply="Assistant auto reply",
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            tools=[],
            nested_chats=[],
        ),
    )
    rag_user = WaldiezRagUserProxy(
        id="wa-3",
        name="rag_user",
        type="agent",
        agent_type="rag_user_proxy",
        description="Rag user",
        tags=["rag_user"],
        requirements=["rag_user"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezRagUserProxyData(
            system_message="Rag user message",
            human_input_mode="ALWAYS",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
            agent_default_auto_reply="Rag user auto reply",
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            tools=[],
            nested_chats=[],
            retrieve_config=WaldiezRagUserProxyRetrieveConfig(
                task="code",
                vector_db="chroma",
                db_config=WaldiezRagUserProxyVectorDbConfig(
                    local_storage_path="",
                    use_local_storage=False,
                    use_memory=False,
                    connection_url="",
                    wait_until_document_ready=None,
                    wait_until_index_ready=None,
                    metadata={},
                    model="all-MiniLM-L6-v2",
                ),
                distance_threshold=0.0,
                n_results=1,
                docs_path="",
                chunk_mode="multi_lines",
                chunk_token_size=100,
                collection_name="test",
                context_max_tokens=100,
                new_docs=False,
                model="gpt2",
                must_break_at_empty_line=False,
                get_or_create=True,
                overwrite=False,
                embedding_function=None,
                custom_text_split_function=None,
                use_custom_embedding=False,
                use_custom_text_split=False,
                use_custom_token_count=False,
                custom_text_types=None,
                custom_token_count_function=None,
                customized_answer_prefix="",
                customized_prompt="",
                update_context=False,
                recursive=False,
            ),
        ),
    )
    reasoning_agent = WaldiezReasoningAgent(
        id="wa-4",
        name="reasoning_agent",
        type="agent",
        agent_type="reasoning",
        description="Reasoning agent",
        tags=["reasoning"],
        requirements=["reasoning"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezReasoningAgentData(
            system_message="Reasoning agent message",
            human_input_mode="ALWAYS",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
            agent_default_auto_reply="Reasoning agent auto reply",
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            tools=[],
            nested_chats=[],
            reason_config=WaldiezReasoningAgentReasonConfig(
                method="beam_search",
                max_depth=3,
                forest_size=1,
                rating_scale=10,
                beam_size=3,
                answer_approach="pool",
                nsim=3,
            ),
        ),
    )
    agents = WaldiezAgents(
        userProxyAgents=[user],
        assistantAgents=[assistant],
        ragUserProxyAgents=[rag_user],
        reasoningAgents=[reasoning_agent],
        captainAgents=[],
    )
    chats = [
        WaldiezChat(
            id="wc-1",
            source="wa-1",
            target="wa-2",
            type="chat",
            data=WaldiezChatData(
                name="chat_data",
                description="Chat data",
                source_type="user_proxy",
                target_type="assistant",
                position=-1,
                order=0,
                clear_history=False,
                message="Hello there",
                max_turns=1,
                nested_chat=WaldiezChatNested(message=None, reply=None),
                summary=WaldiezChatSummary(
                    method="last_msg",
                    prompt="",
                    args={},
                ),
                silent=False,
                real_source=None,
                real_target=None,
                prerequisites=[],
                condition=WaldiezDefaultCondition.create(),
                available=WaldiezTransitionAvailability(),
            ),
        ),
        WaldiezChat(
            id="wc-2",
            source="wa-3",
            target="wa-2",
            type="chat",
            data=WaldiezChatData(
                name="chat_data",
                description="Chat data",
                source_type="rag_user_proxy",
                target_type="assistant",
                position=-1,
                order=1,
                clear_history=False,
                message="Hello there",
                max_turns=2,
                nested_chat=WaldiezChatNested(message=None, reply=None),
                summary=WaldiezChatSummary(
                    method="last_msg",
                    prompt="",
                    args={},
                ),
                silent=False,
                real_source=None,
                real_target=None,
                prerequisites=[],
                condition=WaldiezDefaultCondition.create(),
                available=WaldiezTransitionAvailability(),
            ),
        ),
        WaldiezChat(
            id="wc-3",
            source="wa-3",
            target="wa-4",
            type="chat",
            data=WaldiezChatData(
                name="chat_data",
                description="Chat data",
                source_type="rag_user_proxy",
                target_type="reasoning",
                position=-1,
                order=-1,
                clear_history=False,
                message="Hello there",
                summary=WaldiezChatSummary(
                    method="last_msg",
                    prompt="",
                    args={},
                ),
                max_turns=3,
                nested_chat=WaldiezChatNested(message=None, reply=None),
                silent=False,
                real_source=None,
                real_target=None,
                prerequisites=[],
                condition=WaldiezDefaultCondition.create(),
                available=WaldiezTransitionAvailability(),
            ),
        ),
    ]
    tool = WaldiezTool(
        id="wt-1",
        name="tool_name",
        type="tool",
        description="Tool description",
        tags=["tool"],
        requirements=["tool"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezToolData(
            content="def tool_name():\n    return 'Tool name'",
            secrets={},
        ),
    )
    model = WaldiezModel(
        id="wm-1",
        name="model_name",
        type="model",
        description="Model description",
        tags=["model"],
        requirements=["model"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezModelData(
            api_key="-",
            api_type="openai",
            api_version="2020-05-03",
            base_url="https://example.com",
            temperature=0.1,
            top_p=None,
            max_tokens=100,
            default_headers={},
            price=WaldiezModelPrice(
                prompt_price_per_1k=0.06,
                completion_token_price_per_1k=0.12,
            ),
        ),
    )
    flow_data = WaldiezFlowData(
        nodes=[],
        edges=[],
        viewport={},
        agents=agents,
        models=[model],
        tools=[tool],
        chats=chats,
        is_async=False,
    )
    # When
    flow1 = WaldiezFlow(
        id="wf-1",
        name="flow",
        type="flow",
        description="Flow",
        tags=["flow"],
        requirements=["flow"],
        storage_id="flow-1",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=flow_data,
    )
    # Then
    assert flow1.id is not None
    assert not flow1.data.nodes
    assert flow1.get_agent_by_id("wa-1").id == "wa-1"
    with pytest.raises(ValueError):
        flow1.get_agent_by_id("wa-5")
    assert flow1.get_agent_connections("wa-1") == ["wa-2"]
    assert flow1.get_agent_connections("wa-2") == ["wa-1", "wa-3"]
    assert flow1.get_agent_connections("wa-3") == ["wa-4", "wa-2"]
    assert flow1.get_agent_connections("wa-3", False) == ["wa-2"]
    assert flow1.get_agent_connections("wa-2", False) == ["wa-1", "wa-3"]
    assert flow1.get_agent_connections("wa-1", False) == ["wa-2"]

    with pytest.raises(ValueError):
        # no chats
        WaldiezFlow(
            id="wf-2",
            name="flow",
            type="flow",
            description="Flow",
            tags=["flow"],
            requirements=["flow"],
            storage_id="flow-1",
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
            data=WaldiezFlowData(
                nodes=[],
                edges=[],
                viewport={},
                agents=agents,
                models=[model],
                tools=[tool],
                chats=[],
                is_async=False,
            ),
        )
    with pytest.raises(ValueError):
        # not unique tool IDs
        WaldiezFlow(
            id="wf-2",
            name="flow",
            type="flow",
            description="Flow",
            tags=["flow"],
            requirements=["flow"],
            storage_id="flow-1",
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
            data=WaldiezFlowData(
                nodes=[],
                edges=[],
                viewport={},
                agents=agents,
                models=[],
                tools=[tool, tool],
                chats=chats,
                is_async=False,
            ),
        )

    with pytest.raises(ValueError):
        # not unique model IDs
        WaldiezFlow(
            id="wf-3",
            name="flow",
            type="flow",
            description="Flow",
            tags=["flow"],
            requirements=["flow"],
            storage_id="flow-1",
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
            data=WaldiezFlowData(
                nodes=[],
                edges=[],
                viewport={},
                agents=agents,
                models=[model, model],
                tools=[],
                chats=chats,
                is_async=False,
            ),
        )
    assistant2 = WaldiezAssistant(
        id="wa-5",
        name="assistant",
        type="agent",
        agent_type="assistant",
        description="Assistant",
        tags=["assistant"],
        requirements=["assistant"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezAssistantData(
            system_message="Assistant message",
            human_input_mode="ALWAYS",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
            agent_default_auto_reply="Assistant auto reply",
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            tools=[],
            nested_chats=[],
        ),
    )
    agents2 = WaldiezAgents(
        userProxyAgents=[user],
        assistantAgents=[assistant, assistant2],
        ragUserProxyAgents=[rag_user],
        reasoningAgents=[],
        captainAgents=[],
    )
    with pytest.raises(ValueError):
        # agents do not connect to any other node
        WaldiezFlow(
            id="wf-4",
            name="flow",
            type="flow",
            description="Flow",
            tags=["flow"],
            requirements=["flow"],
            storage_id="flow-1",
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
            data=WaldiezFlowData(
                nodes=[],
                edges=[],
                viewport={},
                agents=agents2,
                models=[model],
                tools=[tool],
                chats=chats,
                is_async=False,
            ),
        )
    # set positions < 0
    # and one chat in the flow
    agents3 = WaldiezAgents(
        userProxyAgents=[user],
        assistantAgents=[assistant],
        ragUserProxyAgents=[],
        reasoningAgents=[],
        captainAgents=[],
    )
    chats2 = [
        WaldiezChat(
            id="wc-1",
            source="wa-1",
            target="wa-2",
            type="chat",
            data=WaldiezChatData(
                name="chat_data",
                description="Chat data",
                source_type="user_proxy",
                target_type="assistant",
                position=-1,
                order=-1,
                clear_history=False,
                summary=WaldiezChatSummary(
                    method="last_msg",
                    prompt="",
                    args={},
                ),
                message="Hello there",
                max_turns=1,
                nested_chat=WaldiezChatNested(message=None, reply=None),
                silent=False,
                real_source=None,
                real_target=None,
                prerequisites=[],
                condition=WaldiezDefaultCondition.create(),
                available=WaldiezTransitionAvailability(),
            ),
        ),
    ]
    flow = WaldiezFlow(
        id="wf-5",
        name="flow",
        type="flow",
        description="Flow",
        tags=["flow"],
        requirements=["flow"],
        storage_id="flow-1",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezFlowData(
            nodes=[],
            edges=[],
            viewport={},
            agents=agents3,
            models=[],
            tools=[],
            chats=chats2,
            is_async=False,
        ),
    )
    assert flow.ordered_flow == [
        {"chat": chats2[0], "source": user, "target": assistant}
    ]


def test_empty_flow() -> None:
    """Test empty flow."""
    with pytest.raises(ValueError):
        WaldiezFlow(
            id="wf-1",
            name="flow",
            type="flow",
            description="Flow",
            tags=["flow"],
            requirements=["flow"],
            storage_id="flow-1",
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-00T00:00:00.000Z",
            data=WaldiezFlowData(
                nodes=[],
                edges=[],
                viewport={},
                agents=WaldiezAgents(
                    userProxyAgents=[],
                    assistantAgents=[],
                    ragUserProxyAgents=[],
                    reasoningAgents=[],
                    captainAgents=[],
                ),
                models=[],
                tools=[],
                chats=[],
                is_async=False,
            ),
        )


def test_flow_default() -> None:
    """Test default flow."""
    flow = WaldiezFlow.default()
    assert flow.id is not None
    assert flow.data.agents.members
    assert flow.data.chats
    with pytest.raises(ValueError):
        flow.get_root_group_manager()
