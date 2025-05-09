# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Helpers for getting a flow."""

from typing import Any, Dict, List

from typing_extensions import Literal

from waldiez.models import (
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentNestedChatMessage,
    WaldiezAgents,
    WaldiezAgentTerminationMessage,
    WaldiezAssistant,
    WaldiezAssistantData,
    WaldiezCaptainAgent,
    WaldiezCaptainAgentData,
    WaldiezChat,
    WaldiezChatData,
    WaldiezChatMessage,
    WaldiezChatNested,
    WaldiezChatSummary,
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
    WaldiezUserProxy,
    WaldiezUserProxyData,
)

from ...models.agents.captain_agent.example_agent_lib import EXAMPLE_AGENT_LIB


def get_model(model_id: str = "wm-1") -> WaldiezModel:
    """Get a WaldiezModel.

    Parameters
    ----------
    model_id : str, optional
        The model ID, by default "wm-1"

    Returns
    -------
    WaldiezModel
        A WaldiezModel instance
    """
    return WaldiezModel(
        id=model_id,
        name="model_name",
        description="Model Description",
        tags=["model"],
        requirements=[],
        type="model",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezModelData(
            api_type="groq",  # to cover additional requirements
            api_key="api_key",
            api_version="2020-05-03",
            base_url="https://example.com/v1",
            price=WaldiezModelPrice(
                prompt_price_per_1k=0.06,
                completion_token_price_per_1k=0.12,
            ),
            temperature=0.5,
            top_p=None,
            max_tokens=1000,
            default_headers={},
        ),
    )


def get_tool(tool_id: str = "ws-1") -> WaldiezTool:
    """Get a WaldiezTool.

    Parameters
    ----------
    tool_id : str, optional
        The tool ID, by default "ws-1"

    Returns
    -------
    WaldiezTool
        A WaldiezTool instance.
    """
    return WaldiezTool(
        id=tool_id,
        name="tool_name",
        description="Tool Description",
        tags=["tool"],
        requirements=["chess"],
        type="tool",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezToolData(
            content=(
                "def tool_name():\n"
                '    """Tool Description."""\n'
                "    return 'Tool Response'"
            ),
            secrets={
                "TOOL_KEY": "tool_value",
            },
        ),
    )


def get_interop_tool(
    tool_id: str = "ws-2",
    tool_type: Literal["langchain", "crewai"] = "langchain",
) -> WaldiezTool:
    """Get an interop tool.

    Parameters
    ----------
    tool_id : str, optional
        The tool ID, by default "ws-2"
    tool_type : Literal["langchain", "crewai"], optional
        The tool type, by default "langchain"

    Returns
    -------
    WaldiezTool
        A WaldiezTool instance.
    """
    tool_name = f"{tool_type}_tool"
    return WaldiezTool(
        id=tool_id,
        name=tool_name,
        description="Interop Tool Description",
        tags=["interop_tool"],
        requirements=[],
        type="tool",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezToolData(
            content=(f"{tool_name} = lambda: 'Interop Tool Response'"),
            tool_type=tool_type,
            secrets={},
        ),
    )


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
                functions=["ws-1"],
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
                    id="ws-1",
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
                            id="wc-3",
                            is_reply=False,
                        ),
                    ],
                ),
            ],
        ),
    )


def get_assistant(agent_id: str = "wa-2") -> WaldiezAssistant:
    """Get a WaldiezAssistant.

    Parameters
    ----------
    agent_id : str, optional
        The agent ID, by default "wa-2"

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
                    id="ws-1",
                    executor_id="wa-2",
                ),
            ],
            nested_chats=[],
            is_multimodal=True,
        ),
    )


def get_rag_user(agent_id: str = "wa-3") -> WaldiezRagUserProxy:
    """Get a WaldiezRagUserProxy.

    Parameters
    ----------
    agent_id : str, optional
        The agent ID, by default "wa-3"

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
            model_ids=[],
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


def get_reasoning_agent(agent_id: str = "wa-4") -> WaldiezReasoningAgent:
    """Get a WaldiezReasoningAgent.

    Parameters
    ----------
    agent_id : str, optional
        The agent ID, by default "wa-4"

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


def get_captain_agent(agent_id: str = "wa-5") -> WaldiezCaptainAgent:
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
        model_ids=["wm-1"],
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


def get_chats(count: int = 4) -> List[WaldiezChat]:
    """Get a list of WaldiezChat instances.

    Parameters
    ----------
    count : int, optional
        The number of chats to generate, by default 4

    Returns
    -------
    List[WaldiezChat]
        A list of WaldiezChat instances
    """
    chats = []
    custom_message = (
        "def callable_message(sender, recipient, context):\n"
        '    return "hello there!!"'
    )
    for index in range(count):
        chat_id = f"wc-{index + 1}"
        context: Dict[str, Any] = {}
        if index in (0, 3):
            context["problem"] = "Solve tha task."
        if index == 3:
            context["bool_variable"] = True
        nested_chat = WaldiezChatNested(
            message=None,
            reply=None,
        )
        source_index = index + 1
        target_index = index + 2
        prerequisites = []
        if index == 1:
            prerequisites = ["wc-1"]
        elif index > 2:
            prerequisites = [f"wc-{idx + 1}" for idx in range(index - 1)]
        chat = WaldiezChat(
            id=chat_id,
            data=WaldiezChatData(
                name=f"chat_{index + 1}",
                description=f"Description of chat {index + 1}",
                source=f"wa-{source_index}",
                target=f"wa-{target_index}",
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
            ),
        )
        chats.append(chat)
    return chats


def get_flow(is_async: bool = False) -> WaldiezFlow:
    """Get a WaldiezFlow instance.

    Parameters
    ----------
    is_async : bool, optional
        Whether the flow is asynchronous, by default False.

    Returns
    -------
    WaldiezFlow
        A WaldiezFlow instance.
    """
    model = get_model()
    custom_tool = get_tool()
    langchain_tool = get_interop_tool(tool_type="langchain")
    crewai_tool = get_interop_tool(tool_id="ws-3", tool_type="crewai")
    user = get_user_proxy()
    assistant = get_assistant()
    rag_user = get_rag_user()
    reasoning_agent = get_reasoning_agent()
    captain_agent = get_captain_agent()
    chats = get_chats()
    agents = WaldiezAgents(
        userProxyAgents=[user],
        assistantAgents=[assistant],
        ragUserProxyAgents=[rag_user],
        reasoningAgents=[reasoning_agent],
        captainAgents=[captain_agent],
    )
    flow = WaldiezFlow(
        id="wf-1",
        name="flow_name",
        type="flow",
        description="Flow Description",
        tags=["flow"],
        requirements=["chess"],
        storage_id="flow-1",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezFlowData(
            is_async=is_async,
            nodes=[],
            edges=[],
            viewport={},
            agents=agents,
            models=[model],
            tools=[custom_tool, langchain_tool, crewai_tool],
            chats=chats,
        ),
    )
    return flow
