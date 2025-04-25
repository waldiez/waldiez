# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-many-locals
"""Test waldiez.models.flow.*."""

import pytest

from waldiez.models import (
    WaldiezAgents,
    WaldiezAgentTeachability,
    WaldiezAgentTerminationMessage,
    WaldiezAssistant,
    WaldiezAssistantData,
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatNested,
    WaldiezChatSummary,
    WaldiezFlow,
    WaldiezFlowData,
    WaldiezGroupManager,
    WaldiezGroupManagerData,
    WaldiezGroupManagerSpeakers,
    WaldiezModel,
    WaldiezModelData,
    WaldiezModelPrice,
    WaldiezRagUser,
    WaldiezRagUserData,
    WaldiezRagUserRetrieveConfig,
    WaldiezRagUserVectorDbConfig,
    WaldiezSkill,
    WaldiezSkillData,
    WaldiezSwarmOnConditionAvailable,
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
        agent_type="user",
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
            teachability=WaldiezAgentTeachability(
                enabled=False,
                verbosity=0,
                reset_db=False,
                recall_threshold=0.0,
                max_num_retrievals=0,
            ),
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            skills=[],
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
            teachability=WaldiezAgentTeachability(
                enabled=False,
                verbosity=0,
                reset_db=False,
                recall_threshold=0.0,
                max_num_retrievals=0,
            ),
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            skills=[],
            nested_chats=[],
        ),
    )
    manager = WaldiezGroupManager(
        id="wa-3",
        name="manager",
        type="agent",
        agent_type="manager",
        description="Manager",
        tags=["manager"],
        requirements=["manager"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezGroupManagerData(
            system_message="Manager message",
            human_input_mode="ALWAYS",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
            agent_default_auto_reply="Manager auto reply",
            teachability=WaldiezAgentTeachability(
                enabled=False,
                verbosity=0,
                reset_db=False,
                recall_threshold=0.0,
                max_num_retrievals=0,
            ),
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            skills=[],
            nested_chats=[],
            max_round=1,
            enable_clear_history=False,
            admin_name="user",
            send_introductions=False,
            speakers=WaldiezGroupManagerSpeakers(
                selection_method="round_robin",
                selection_custom_method=None,
                selection_mode="transition",
                transitions_type="allowed",
                allow_repeat=True,
                allowed_or_disallowed_transitions={
                    "wa-1": ["wa-2"],
                },
                max_retries_for_selecting=1,
            ),
        ),
    )
    rag_user = WaldiezRagUser(
        id="wa-4",
        name="rag_user",
        type="agent",
        agent_type="rag_user",
        description="Rag user",
        tags=["rag_user"],
        requirements=["rag_user"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezRagUserData(
            system_message="Rag user message",
            human_input_mode="ALWAYS",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
            agent_default_auto_reply="Rag user auto reply",
            teachability=WaldiezAgentTeachability(
                enabled=False,
                verbosity=0,
                reset_db=False,
                recall_threshold=0.0,
                max_num_retrievals=0,
            ),
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            skills=[],
            nested_chats=[],
            retrieve_config=WaldiezRagUserRetrieveConfig(
                task="code",
                vector_db="chroma",
                db_config=WaldiezRagUserVectorDbConfig(
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
    agents = WaldiezAgents(
        users=[user],
        assistants=[assistant],
        managers=[manager],
        rag_users=[rag_user],
        swarm_agents=[],
        reasoning_agents=[],
        captain_agents=[],
    )
    chats = [
        WaldiezChat(
            id="wc-1",
            data=WaldiezChatData(
                name="chat_data",
                description="Chat data",
                source="wa-1",
                target="wa-2",
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
                available=WaldiezSwarmOnConditionAvailable(
                    type="none",
                    value=None,
                ),
            ),
        ),
        WaldiezChat(
            id="wc-2",
            data=WaldiezChatData(
                name="chat_data",
                description="Chat data",
                source="wa-3",
                target="wa-2",
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
                available=WaldiezSwarmOnConditionAvailable(
                    type="none",
                    value=None,
                ),
            ),
        ),
        WaldiezChat(
            id="wc-3",
            data=WaldiezChatData(
                name="chat_data",
                description="Chat data",
                source="wa-3",
                target="wa-4",
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
                available=WaldiezSwarmOnConditionAvailable(
                    type="none",
                    value=None,
                ),
            ),
        ),
    ]
    skill = WaldiezSkill(
        id="ws-1",
        name="skill_name",
        type="skill",
        description="Skill description",
        tags=["skill"],
        requirements=["skill"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezSkillData(
            content="def skill_name():\n    return 'Skill name'",
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
        skills=[skill],
        chats=chats,
        is_async=False,
    )
    # When
    flow1 = WaldiezFlow(
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
    assert not flow1.get_group_chat_members("wa-1")
    assert flow1.get_agent_connections("wa-1") == ["wa-2"]
    assert flow1.get_agent_connections("wa-2") == ["wa-1", "wa-3"]
    assert flow1.get_agent_connections("wa-3") == ["wa-4", "wa-2"]
    assert flow1.get_agent_connections("wa-3", False) == ["wa-2"]
    assert flow1.get_agent_connections("wa-2", False) == ["wa-1", "wa-3"]
    assert flow1.get_agent_connections("wa-1", False) == ["wa-2"]
    assert flow1.get_group_chat_members("wa-3") == [rag_user, assistant]

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
                skills=[skill],
                chats=[],
                is_async=False,
            ),
        )
    with pytest.raises(ValueError):
        # not unique skill IDs
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
                skills=[skill, skill],
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
                skills=[],
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
            teachability=WaldiezAgentTeachability(
                enabled=False,
                verbosity=0,
                reset_db=False,
                recall_threshold=0.0,
                max_num_retrievals=0,
            ),
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            skills=[],
            nested_chats=[],
        ),
    )
    agents2 = WaldiezAgents(
        users=[user],
        assistants=[assistant, assistant2],
        managers=[manager],
        rag_users=[rag_user],
        swarm_agents=[],
        reasoning_agents=[],
        captain_agents=[],
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
                skills=[skill],
                chats=chats,
                is_async=False,
            ),
        )
    # set positions < 0
    # and one chat in the flow
    agents3 = WaldiezAgents(
        users=[user],
        assistants=[assistant],
        managers=[],
        rag_users=[],
        swarm_agents=[],
        reasoning_agents=[],
        captain_agents=[],
    )
    chats2 = [
        WaldiezChat(
            id="wc-1",
            data=WaldiezChatData(
                name="chat_data",
                description="Chat data",
                source="wa-1",
                target="wa-2",
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
                available=WaldiezSwarmOnConditionAvailable(
                    type="none",
                    value=None,
                ),
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
            skills=[],
            chats=chats2,
            is_async=False,
        ),
    )
    assert flow.ordered_flow == [(chats2[0], user, assistant)]

    swarm_members, swarm_user = flow.get_swarm_chat_members(user)
    assert not swarm_members
    assert swarm_user is None


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
                    users=[],
                    assistants=[],
                    managers=[],
                    rag_users=[],
                    swarm_agents=[],
                    reasoning_agents=[],
                    captain_agents=[],
                ),
                models=[],
                skills=[],
                chats=[],
                is_async=False,
            ),
        )


def test_single_agent_mode() -> None:
    """Test single agent mode."""
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
            teachability=WaldiezAgentTeachability(
                enabled=False,
                verbosity=0,
                reset_db=False,
                recall_threshold=0.0,
                max_num_retrievals=0,
            ),
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            skills=[],
            nested_chats=[],
        ),
    )
    agents = WaldiezAgents(
        users=[],
        assistants=[assistant],
        managers=[],
        rag_users=[],
        swarm_agents=[],
        reasoning_agents=[],
        captain_agents=[],
    )
    flow_data = WaldiezFlowData(
        nodes=[],
        edges=[],
        viewport={},
        agents=agents,
        models=[],
        skills=[],
        chats=[],
        is_async=False,
    )
    flow = WaldiezFlow(
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
    assert flow.is_single_agent_mode is True

    # if manager or swarm, it should raise ValueError
    manager = WaldiezGroupManager(
        id="wa-3",
        name="manager",
        type="agent",
        agent_type="manager",
        description="Manager",
        tags=["manager"],
        requirements=["manager"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezGroupManagerData(
            system_message="Manager message",
            human_input_mode="ALWAYS",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
            agent_default_auto_reply="Manager auto reply",
            teachability=WaldiezAgentTeachability(
                enabled=False,
                verbosity=0,
                reset_db=False,
                recall_threshold=0.0,
                max_num_retrievals=0,
            ),
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="found",
                keywords=["TERMINATE"],
                method_content=None,
            ),
            model_ids=[],
            skills=[],
            nested_chats=[],
            max_round=1,
            enable_clear_history=False,
            admin_name="user",
            send_introductions=False,
            speakers=WaldiezGroupManagerSpeakers(
                selection_method="round_robin",
                selection_custom_method=None,
                selection_mode="transition",
                transitions_type="allowed",
                allow_repeat=True,
                allowed_or_disallowed_transitions={
                    "wa-1": ["wa-2"],
                },
                max_retries_for_selecting=1,
            ),
        ),
    )
    agents = WaldiezAgents(
        users=[],
        assistants=[],
        managers=[manager],
        rag_users=[],
        swarm_agents=[],
        reasoning_agents=[],
        captain_agents=[],
    )
    with pytest.raises(ValueError):
        flow_data = WaldiezFlowData(
            nodes=[],
            edges=[],
            viewport={},
            agents=agents,
            models=[],
            skills=[],
            chats=[],
            is_async=False,
        )
        WaldiezFlow(
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
