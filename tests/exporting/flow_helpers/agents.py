# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Helpers for getting a flow."""

from waldiez.models import (
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentNestedChatMessage,
    WaldiezAgentTerminationMessage,
    WaldiezAssistant,
    WaldiezAssistantData,
    WaldiezCaptainAgent,
    WaldiezCaptainAgentData,
    WaldiezDefaultCondition,
    WaldiezDocAgent,
    WaldiezDocAgentData,
    WaldiezDocAgentQueryEngine,
    WaldiezRagUserProxy,
    WaldiezRagUserProxyData,
    WaldiezRagUserProxyRetrieveConfig,
    WaldiezRagUserProxyVectorDbConfig,
    WaldiezReasoningAgent,
    WaldiezReasoningAgentData,
    WaldiezReasoningAgentReasonConfig,
    WaldiezTransitionAvailability,
    WaldiezUserProxy,
    WaldiezUserProxyData,
)

from ...models.agents.captain_agent.example_agent_lib import EXAMPLE_AGENT_LIB


def get_user_proxy(agent_id: str = "wa-1") -> WaldiezUserProxy:
    """Get a WaldiezUserProxy.

    Parameters
    ----------
    agent_id : str, optional
        The agent ID, by default "wa-1"

    Returns
    -------
    WaldiezUserProxy
        A WaldiezUserProxy instance.
    """
    return WaldiezUserProxy(
        id=agent_id,
        name="user",
        description="User Agent",
        type="agent",
        agent_type="user",
        tags=["user"],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezUserProxyData(
            system_message=None,
            human_input_mode="ALWAYS",
            code_execution_config=WaldiezAgentCodeExecutionConfig(
                work_dir="coding",
                use_docker=None,
                last_n_messages=3,
                functions=["wt-1"],
                timeout=40,
            ),
            agent_default_auto_reply="I am a user.",
            max_consecutive_auto_reply=5,
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                keywords=["bye", "goodbye"],
                criterion="found",
                method_content=None,
            ),
            model_ids=[],
            tools=[
                WaldiezAgentLinkedTool(
                    id="wt-1",
                    executor_id="wa-2",
                )
            ],
            nested_chats=[
                WaldiezAgentNestedChat(
                    triggered_by=["wa-1"],
                    messages=[
                        WaldiezAgentNestedChatMessage(
                            id="wc-2",
                            is_reply=True,
                        ),
                        WaldiezAgentNestedChatMessage(
                            id="wc-4",
                            is_reply=False,
                        ),
                    ],
                    condition=WaldiezDefaultCondition.create(),
                    available=WaldiezTransitionAvailability(),
                ),
            ],
        ),
    )


def get_assistant(
    agent_id: str = "wa-2",
    is_multimodal: bool = False,
    with_nested_chat: bool = False,
) -> WaldiezAssistant:
    """Get a WaldiezAssistant.

    Parameters
    ----------
    agent_id : str, optional
        The agent ID, by default "wa-2"
    is_multimodal : bool, optional
        Whether the assistant is multimodal, by default False
    with_nested_chat : bool, optional
        Whether the assistant has nested chat, by default False

    Returns
    -------
    WaldiezAssistant
        A WaldiezAssistant instance.
    """
    assistant_termination = (
        "def is_termination_message(message):\n"
        '    """Check if the message is a termination message."""\n'
        "    return any(\n"
        '        keyword in message.get("content", "").lower()\n'
        '        for keyword in ["bye", "goodbye"]\n'
        "    )"
    )
    nested_chats: list[WaldiezAgentNestedChat] = []
    if with_nested_chat:
        nested_chats = [
            WaldiezAgentNestedChat(
                triggered_by=["wa-1"],
                messages=[
                    WaldiezAgentNestedChatMessage(
                        id="wc-2",
                        is_reply=False,
                    ),
                    WaldiezAgentNestedChatMessage(
                        id="wc-3",
                        is_reply=False,
                    ),
                ],
                condition=WaldiezDefaultCondition.create(),
                available=WaldiezTransitionAvailability(),
            ),
        ]
    return WaldiezAssistant(
        id=agent_id,
        name="assistant",
        description="Assistant Agent",
        type="agent",
        agent_type="assistant",
        tags=["assistant"],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezAssistantData(
            system_message="You are a helpful assistant.",
            human_input_mode="NEVER",
            code_execution_config=False,
            agent_default_auto_reply="I am an assistant.",
            max_consecutive_auto_reply=5,
            termination=WaldiezAgentTerminationMessage(
                type="method",
                keywords=[],
                criterion="found",
                method_content=assistant_termination,
            ),
            model_ids=["wm-1"],
            tools=[
                WaldiezAgentLinkedTool(
                    id="wt-1",
                    executor_id="wa-2",
                ),
            ],
            nested_chats=nested_chats,
            is_multimodal=is_multimodal,
        ),
    )


def get_rag_user(agent_id: str = "wa-4") -> WaldiezRagUserProxy:
    """Get a WaldiezRagUserProxy.

    Parameters
    ----------
    agent_id : str, optional
        The agent ID, by default "wa-4"

    Returns
    -------
    WaldiezRagUserProxy
        A WaldiezRagUserProxy instance.
    """
    custom_embedding = "def custom_embedding_function():\n    return list"
    return WaldiezRagUserProxy(
        id=agent_id,
        name="rag_user",
        description="RAG User",
        tags=["rag_user"],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        type="agent",
        agent_type="rag_user",
        data=WaldiezRagUserProxyData(
            system_message="You are a RAG user agent.",
            human_input_mode="ALWAYS",
            code_execution_config=False,
            agent_default_auto_reply="I am rag user agent.",
            max_consecutive_auto_reply=5,
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="ending",
                keywords=["bye", "goodbye"],
                method_content=None,
            ),
            model_ids=["wm-1"],
            tools=[],
            nested_chats=[],
            retrieve_config=WaldiezRagUserProxyRetrieveConfig(
                task="default",
                vector_db="chroma",
                db_config=WaldiezRagUserProxyVectorDbConfig(
                    model=None,
                    use_memory=False,
                    use_local_storage=True,
                    local_storage_path="documents",
                    connection_url=None,
                    wait_until_document_ready=None,
                    wait_until_index_ready=None,
                    metadata=None,
                ),
                docs_path=[
                    "documents",
                    "C:\\Users\\username\\Documents",
                    "/home/username/Documents/",
                    "https://example.com/file.txt",
                ],
                new_docs=True,
                model=None,
                chunk_token_size=100,
                context_max_tokens=1000,
                chunk_mode="multi_lines",
                must_break_at_empty_line=True,
                use_custom_embedding=True,
                embedding_function=custom_embedding,
                use_custom_text_split=False,
                custom_text_split_function=None,
                use_custom_token_count=False,
                custom_token_count_function=None,
                collection_name="autogen-docs",
                custom_text_types=None,
                customized_answer_prefix=None,
                update_context=True,
                get_or_create=True,
                overwrite=True,
                recursive=True,
                distance_threshold=20,
                n_results=10,
                customized_prompt=None,
            ),
        ),
    )


def get_reasoning_agent(agent_id: str = "wa-5") -> WaldiezReasoningAgent:
    """Get a WaldiezReasoningAgent.

    Parameters
    ----------
    agent_id : str, optional
        The agent ID, by default "wa-5"

    Returns
    -------
    WaldiezReasoningAgent
        A WaldiezReasoningAgent instance.
    """
    return WaldiezReasoningAgent(
        id=agent_id,
        name="reasoning_agent",
        description="Reasoning Agent",
        tags=["reasoning_agent"],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        type="agent",
        agent_type="reasoning",
        data=WaldiezReasoningAgentData(
            system_message=None,
            human_input_mode="NEVER",
            code_execution_config=False,
            agent_default_auto_reply="I am a reasoning agent.",
            max_consecutive_auto_reply=5,
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="ending",
                keywords=["bye", "goodbye"],
                method_content=None,
            ),
            model_ids=[],
            tools=[],
            nested_chats=[],
            verbose=True,
            reason_config=WaldiezReasoningAgentReasonConfig(
                method="beam_search",
                max_depth=3,
                forest_size=1,
                rating_scale=10,
                beam_size=3,
                answer_approach="pool",
                nsim=3,
                exploration_constant=1.41,
            ),
        ),
    )


def get_captain_agent(agent_id: str = "wa-6") -> WaldiezCaptainAgent:
    """Get a WaldiezCaptainAgent.

    Parameters
    ----------
    agent_id : str, optional
        The agent ID, by default "wa-5"

    Returns
    -------
    WaldiezCaptainAgent
        A WaldiezCaptainAgent instance.
    """
    data = WaldiezCaptainAgentData(
        system_message=None,
        human_input_mode="NEVER",
        code_execution_config=WaldiezAgentCodeExecutionConfig(
            work_dir="coding",
            use_docker=False,
            last_n_messages=3,
            functions=[],
            timeout=120,
        ),
        agent_default_auto_reply="I am a captain agent.",
        max_consecutive_auto_reply=5,
        termination=WaldiezAgentTerminationMessage(
            type="keyword",
            criterion="ending",
            keywords=["bye", "goodbye"],
            method_content=None,
        ),
        model_ids=[],
        tools=[],
        nested_chats=[],
        agent_lib=EXAMPLE_AGENT_LIB,  # type: ignore
        tool_lib="default",
    )
    return WaldiezCaptainAgent(
        id=agent_id,
        name="captain_agent",
        description="Captain Agent",
        type="agent",
        agent_type="captain",
        tags=["captain"],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=data,
    )


def get_doc_agent(agent_id: str = "wa-7") -> WaldiezDocAgent:
    """Get a WaldiezDocAgent.

    Parameters
    ----------
    agent_id : str, optional
        The agent ID, by default "wa-7"

    Returns
    -------
    WaldiezDocAgent
        A WaldiezDocAgent instance.
    """
    return WaldiezDocAgent(
        id=agent_id,
        name="doc_agent",
        description="Document Agent",
        type="agent",
        agent_type="doc_agent",
        tags=["doc_agent"],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezDocAgentData(
            system_message=None,
            human_input_mode="NEVER",
            code_execution_config=False,
            agent_default_auto_reply="I am a document agent.",
            max_consecutive_auto_reply=5,
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                criterion="ending",
                keywords=["bye", "goodbye"],
                method_content=None,
            ),
            model_ids=[],
            tools=[],
            nested_chats=[],
            collection_name="documents",
            query_engine=WaldiezDocAgentQueryEngine(
                type="VectorChromaCitationQueryEngine",
                db_path=None,
                enable_query_citations=True,
                citation_chunk_size=512,
            ),
        ),
    )
