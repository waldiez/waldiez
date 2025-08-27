# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.agent.agent.*."""

import pytest

from waldiez.models.agents import (
    WaldiezAgent,
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentTerminationMessage,
    WaldiezAssistant,
    WaldiezAssistantData,
    WaldiezCaptainAgent,
    WaldiezGroupManager,
    WaldiezGroupManagerData,
    WaldiezRagUserProxy,
    WaldiezReasoningAgent,
    WaldiezUserProxy,
)
from waldiez.models.common import (
    WaldiezDefaultCondition,
    WaldiezTransitionAvailability,
)


def test_waldiez_agent() -> None:
    """Test WaldiezAgent."""
    agent = WaldiezAgent(
        id="wa-1",
        name="agent-1",
        type="agent",
        description="description",
        agent_type="assistant",
        tags=["tag-1", "tag-2"],
        requirements=["req-1", "req-2"],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
        data=WaldiezAgentData(
            system_message="system_message",
            human_input_mode="NEVER",
            agent_default_auto_reply="auto_reply",
            max_consecutive_auto_reply=5,
            termination=WaldiezAgentTerminationMessage(
                type="none",
                keywords=[],
                criterion=None,
                method_content=None,
            ),
            code_execution_config=WaldiezAgentCodeExecutionConfig(
                work_dir="work_dir",
                use_docker=True,
                timeout=60,
                last_n_messages=5,
                functions=["wt-1"],
            ),
            model_ids=["wm-1"],
            tools=[
                WaldiezAgentLinkedTool(
                    id="wt-1",
                    executor_id="wa-1",
                )
            ],
            nested_chats=[
                WaldiezAgentNestedChat(
                    triggered_by=[],
                    messages=[],
                    condition=WaldiezDefaultCondition.create(),
                    available=WaldiezTransitionAvailability(),
                )
            ],
        ),
    )
    assert agent.id == "wa-1"
    agent.validate_linked_models(["wm-1"])
    agent.validate_linked_tools(tool_ids=["wt-1"], agent_ids=["wa-1"])
    agent.validate_code_execution(
        tool_ids=["wt-1"],
    )
    with pytest.raises(ValueError):
        agent.validate_code_execution(
            tool_ids=["wt-2"],
        )
    with pytest.raises(ValueError):
        agent.validate_linked_models(["wm-2"])
    with pytest.raises(ValueError):
        agent.validate_linked_tools(tool_ids=["wt-2"], agent_ids=["wa-1"])
    with pytest.raises(ValueError):
        agent.validate_linked_tools(tool_ids=["wt-1"], agent_ids=["wa-2"])
    with pytest.raises(RuntimeError):
        _ = agent.handoffs


# noinspection DuplicatedCode,PyArgumentList
def test_agent_ag2_class() -> None:
    """Test WaldiezAgent.ag2_class."""
    user_proxy = WaldiezUserProxy(  # pyright: ignore
        id="wa-1",
        name="user_proxy",
    )
    assistant = WaldiezAssistant(  # pyright: ignore
        id="wa-2",
        name="assistant",
    )
    rag_user = WaldiezRagUserProxy(  # pyright: ignore
        id="wa-4",
        name="rag_user",
    )
    multimodal_agent = WaldiezAssistant(  # pyright: ignore
        id="wa-5",
        name="multimodal_agent",
        data=WaldiezAssistantData(  # pyright: ignore
            is_multimodal=True,
        ),
    )
    reasoning_agent = WaldiezReasoningAgent(  # pyright: ignore
        id="wa-7",
        name="reasoning_agent",
    )
    multimodal_group_member = WaldiezAssistant(  # pyright: ignore
        id="wa-6",
        name="multimodal_group_member",
        data=WaldiezAssistantData(  # pyright: ignore
            is_multimodal=True,
            parent_id="wa-5",
        ),
    )
    captain = WaldiezCaptainAgent(  # pyright: ignore
        id="wa-3",
        name="captain",
    )
    group_manager = WaldiezGroupManager(  # pyright: ignore
        id="wa-8",
        name="group_manager",
        data=WaldiezGroupManagerData(  # pyright: ignore
            initial_agent_id="wa-2",
        ),
    )
    assert user_proxy.ag2_class == "UserProxyAgent"
    assert assistant.ag2_class == "AssistantAgent"
    assert rag_user.ag2_class == "RetrieveUserProxyAgent"
    assert multimodal_agent.ag2_class == "MultimodalConversableAgent"
    assert reasoning_agent.ag2_class == "ReasoningAgent"
    assert multimodal_group_member.ag2_class == "MultimodalConversableAgent"
    assert captain.ag2_class == "CaptainAgent"
    assert group_manager.ag2_class == "GroupChatManager"


# noinspection DuplicatedCode,PyArgumentList
def test_agent_ag2_imports() -> None:
    """Test WaldiezAgent.ag2_imports."""
    user_proxy = WaldiezUserProxy(  # pyright: ignore
        id="wa-1",
        name="user_proxy",
    )
    assistant = WaldiezAssistant(  # pyright: ignore
        id="wa-2",
        name="assistant",
    )
    rag_user = WaldiezRagUserProxy(  # pyright: ignore
        id="wa-4",
        name="rag_user",
    )
    multimodal_agent = WaldiezAssistant(  # pyright: ignore
        id="wa-5",
        name="multimodal_agent",
        data=WaldiezAssistantData(  # pyright: ignore
            is_multimodal=True,
        ),
    )
    reasoning_agent = WaldiezReasoningAgent(  # pyright: ignore
        id="wa-7",
        name="reasoning_agent",
    )
    captain_agent = WaldiezCaptainAgent(  # pyright: ignore
        id="wa-3",
        name="captain",
    )
    group_manager = WaldiezGroupManager(  # pyright: ignore
        id="wa-8",
        name="group_manager",
        data=WaldiezGroupManagerData(  # pyright: ignore
            initial_agent_id="wa-2",
        ),
    )
    assert user_proxy.ag2_imports == {
        "import autogen",
        "from autogen import UserProxyAgent",
    }
    assert assistant.ag2_imports == {
        "import autogen",
        "from autogen import AssistantAgent",
    }
    # pylint: disable=line-too-long
    assert rag_user.ag2_imports == {
        "import autogen",
        "from autogen.agentchat.contrib.retrieve_user_proxy_agent import RetrieveUserProxyAgent",  # noqa: E501
    }
    assert multimodal_agent.ag2_imports == {
        "import autogen",
        "from autogen.agentchat.contrib.multimodal_conversable_agent import MultimodalConversableAgent",  # noqa: E501
    }
    assert reasoning_agent.ag2_imports == {
        "import autogen",
        "from autogen.agents.experimental import ReasoningAgent",
    }
    assert captain_agent.ag2_imports == {
        "import autogen",
        "from autogen.agentchat.contrib.captainagent import CaptainAgent",
    }
    assert group_manager.ag2_imports == {
        "import autogen",
        "from autogen import GroupChat",
        "from autogen.agentchat import GroupChatManager",
        "from autogen.agentchat.group import ContextVariables",
    }
