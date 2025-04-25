# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.agents.agent.agent.*."""

import pytest
from waldiez.models.agents import (
    WaldiezAgent,
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentLinkedSkill,
    WaldiezAgentNestedChat,
    WaldiezAgentTeachability,
    WaldiezAgentTerminationMessage,
    WaldiezAssistant,
    WaldiezAssistantData,
    WaldiezGroupManager,
    WaldiezRagUser,
    WaldiezReasoningAgent,
    WaldiezSwarmAgent,
    WaldiezUserProxy,
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
            teachability=WaldiezAgentTeachability(
                enabled=False,
                verbosity=0,
                reset_db=False,
                recall_threshold=0.0,
                max_num_retrievals=0,
            ),
            code_execution_config=WaldiezAgentCodeExecutionConfig(
                work_dir="work_dir",
                use_docker=True,
                timeout=60,
                last_n_messages=5,
                functions=["ws-1"],
            ),
            model_ids=["wm-1"],
            skills=[
                WaldiezAgentLinkedSkill(
                    id="ws-1",
                    executor_id="wa-1",
                )
            ],
            nested_chats=[
                WaldiezAgentNestedChat(
                    triggered_by=[],
                    messages=[],
                )
            ],
        ),
    )
    assert agent.id == "wa-1"
    agent.validate_linked_models(["wm-1"])
    agent.validate_linked_skills(skill_ids=["ws-1"], agent_ids=["wa-1"])
    agent.validate_code_execution(
        skill_ids=["ws-1"],
    )
    with pytest.raises(ValueError):
        agent.validate_code_execution(
            skill_ids=["ws-2"],
        )
    with pytest.raises(ValueError):
        agent.validate_linked_models(["wm-2"])
    with pytest.raises(ValueError):
        agent.validate_linked_skills(skill_ids=["ws-2"], agent_ids=["wa-1"])
    with pytest.raises(ValueError):
        agent.validate_linked_skills(skill_ids=["ws-1"], agent_ids=["wa-2"])


def test_agent_ag2_class() -> None:
    """Test WaldiezAgent.ag2_class."""
    user_proxy = WaldiezUserProxy(
        id="wa-1",
        name="user_proxy",
    )
    assistant = WaldiezAssistant(
        id="wa-2",
        name="assistant",
    )
    group_manager = WaldiezGroupManager(
        id="wa-3",
        name="group_manager",
    )
    rag_user = WaldiezRagUser(
        id="wa-4",
        name="rag_user",
    )
    multimodal_agent = WaldiezAssistant(
        id="wa-5",
        name="multimodal_agent",
        data=WaldiezAssistantData(
            is_multimodal=True,
        ),
    )
    swarm_agent = WaldiezSwarmAgent(
        id="wa-6",
        name="swarm_agent",
    )
    reasoning_agent = WaldiezReasoningAgent(
        id="wa-7",
        name="reasoning_agent",
    )
    assert user_proxy.ag2_class == "UserProxyAgent"
    assert assistant.ag2_class == "AssistantAgent"
    assert group_manager.ag2_class == "GroupChatManager"
    assert rag_user.ag2_class == "RetrieveUserProxyAgent"
    assert multimodal_agent.ag2_class == "MultimodalConversableAgent"
    assert swarm_agent.ag2_class == "SwarmAgent"
    assert reasoning_agent.ag2_class == "ReasoningAgent"


def test_agent_ag2_imports() -> None:
    """Test WaldiezAgent.ag2_imports."""
    user_proxy = WaldiezUserProxy(
        id="wa-1",
        name="user_proxy",
    )
    assistant = WaldiezAssistant(
        id="wa-2",
        name="assistant",
    )
    group_manager = WaldiezGroupManager(
        id="wa-3",
        name="group_manager",
    )
    rag_user = WaldiezRagUser(
        id="wa-4",
        name="rag_user",
    )
    multimodal_agent = WaldiezAssistant(
        id="wa-5",
        name="multimodal_agent",
        data=WaldiezAssistantData(
            is_multimodal=True,
        ),
    )
    swarm_agent = WaldiezSwarmAgent(
        id="wa-6",
        name="swarm_agent",
    )
    reasoning_agent = WaldiezReasoningAgent(
        id="wa-7",
        name="reasoning_agent",
    )
    assert user_proxy.ag2_imports == {
        "import autogen",
        "from autogen import UserProxyAgent",
    }
    assert assistant.ag2_imports == {
        "import autogen",
        "from autogen import AssistantAgent",
    }
    assert group_manager.ag2_imports == {
        "import autogen",
        "from autogen import GroupChatManager",
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
    assert swarm_agent.ag2_imports == {
        "import autogen",
        "from autogen import register_hand_off, AfterWork, OnCondition, UpdateSystemMessage, AfterWorkOption, SwarmResult",  # noqa: E501
    }
    assert reasoning_agent.ag2_imports == {
        "import autogen",
        "from autogen.agents.experimental import ReasoningAgent",
    }
