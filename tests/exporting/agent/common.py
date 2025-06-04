# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=too-many-locals,too-many-statements,line-too-long
"""Common functions for testing waldiez.exporting.agents.*."""

from typing import Type

from waldiez.models import (
    WaldiezAgent,
    WaldiezAgentType,
    WaldiezAssistant,
    WaldiezCaptainAgent,
    WaldiezModel,
    WaldiezRagUserProxy,
    WaldiezReasoningAgent,
    WaldiezTool,
    WaldiezUserProxy,
)


def create_agent(
    counter: int,
    agent_type: WaldiezAgentType,
) -> tuple[WaldiezAgent, list[WaldiezTool], list[WaldiezModel]]:
    """Create an agent.

    Parameters
    ----------
    agent_type : WaldiezAgentType
        The agent type.
    counter : int
        The counter to use for the id and name.

    Returns
    -------
    WaldiezAgent
        The agent.
    """
    # fmt: off
    tool1 = WaldiezTool(
        id=f"wt-{counter}_1",
        name=f"tool{counter}_1",
        description=f"tool{counter}_1 description",
        data={  # type: ignore
            "content": f"def tool{counter}_1():" + "\n" + f'    return "tool body of tool{counter}_1"',
            "secrets": {
                "SECRET_KEY_1": "SECRET_VALUE_1",
                "SECRET_KEY_2": "SECRET_VALUE_2",
            },
        },
    )
    tool2 = WaldiezTool(
        id=f"wt-{counter}_2",
        name=f"tool{counter}_2",
        description=f"tool{counter}_2 description",
        data={  # type: ignore
            "content": f"def tool{counter}_2():" + "\n" + f'    return "tool body of tool{counter}_2"',
            "secrets": {},
        },
    )
    # fmt: on
    model1 = WaldiezModel(
        id=f"wm-{counter}_1",
        name=f"model{counter}_1",
        description=f"model{counter}_1 description",
        data={"apiType": "anthropic"},  # type: ignore
    )
    model2 = WaldiezModel(
        id=f"wm-{counter}_2",
        name=f"model{counter}_2",
        description=f"model{counter}_2 description",
        data={"apiType": "nim"},  # type: ignore
    )
    agent_cls: Type[WaldiezAgent] = WaldiezAgent
    if agent_type == "user_proxy":
        agent_cls = WaldiezUserProxy
    if agent_type == "assistant":
        agent_cls = WaldiezAssistant
    if agent_type in ("rag_user_proxy", "rag_user"):
        agent_cls = WaldiezRagUserProxy
    if agent_type == "reasoning":
        agent_cls = WaldiezReasoningAgent
    if agent_type == "captain":
        agent_cls = WaldiezCaptainAgent
    agent = agent_cls(
        id=f"wa-{counter}",
        name=f"agent{counter}",
        description=f"agent{counter} description",
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        data={  # type: ignore
            "system_message": f"system message of agent {counter}",
            "tools": [
                {
                    "id": f"wt-{counter}_1",
                    "executor_id": f"wa-{counter}",
                },
                {
                    "id": f"wt-{counter}_2",
                    "executor_id": f"wa-{counter}",
                },
            ],
            "model_id": f"wm-{counter}_1",
        },
    )
    return agent, [tool1, tool2], [model1, model2]
