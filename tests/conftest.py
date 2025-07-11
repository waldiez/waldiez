# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common fixtures for tests."""

import os
from pathlib import Path
from typing import Generator

import pytest

from waldiez.models import (
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
    WaldiezDefaultCondition,
    WaldiezFlow,
    WaldiezFlowData,
    WaldiezModel,
    WaldiezTransitionAvailability,
    WaldiezUserProxy,
    WaldiezUserProxyData,
)

ROOT_DIR = Path(__file__).parent.parent


def get_runnable_flow() -> WaldiezFlow:
    """Get a runnable WaldiezFlow instance.

    without models and tools

    Returns
    -------
    WaldiezFlow
        A WaldiezFlow instance.
    """
    user = WaldiezUserProxy(
        id="wa-1",
        name="user",
        agent_type="user_proxy",
        description="User Agent",
        type="agent",
        data=WaldiezUserProxyData(
            system_message=None,
            human_input_mode="ALWAYS",
            code_execution_config=False,
            agent_default_auto_reply="I am a user.",
            max_consecutive_auto_reply=5,
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                keywords=["bye", "goodbye"],
                criterion="found",
                method_content=None,
            ),
            model_ids=[],
            tools=[],
            nested_chats=[],
        ),
        tags=["user"],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    assistant = WaldiezAssistant(
        id="wa-2",
        name="assistant",
        description="Assistant Agent",
        type="agent",
        agent_type="assistant",
        data=WaldiezAssistantData(
            system_message=None,
            human_input_mode="NEVER",
            code_execution_config=False,
            agent_default_auto_reply="I am an assistant.",
            max_consecutive_auto_reply=5,
            termination=WaldiezAgentTerminationMessage(
                type="keyword",
                keywords=["bye", "goodbye"],
                criterion="found",
                method_content=None,
            ),
            model_ids=[],
            tools=[],
            nested_chats=[],
        ),
        tags=["assistant"],
        requirements=[],
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    chat = WaldiezChat(
        id="wc-1",
        source="wa-1",
        target="wa-2",
        type="chat",
        data=WaldiezChatData(
            name="chat_1",
            description="Description of chat 1",
            source_type="user_proxy",
            target_type="assistant",
            position=-1,
            order=0,
            clear_history=True,
            silent=False,
            max_turns=2,
            message=WaldiezChatMessage(
                type="string",
                use_carryover=False,
                content="Hello wa-1",
                context={},
            ),
            summary=WaldiezChatSummary(
                method="last_msg",
                prompt="",
                args={},
            ),
            nested_chat=WaldiezChatNested(
                message=None,
                reply=None,
            ),
            real_source=None,
            real_target=None,
            prerequisites=[],
            condition=WaldiezDefaultCondition.create(),
            available=WaldiezTransitionAvailability(),
        ),
    )
    agents = WaldiezAgents(
        userProxyAgents=[user],
        assistantAgents=[assistant],
        ragUserProxyAgents=[],
        reasoningAgents=[],
        captainAgents=[],
    )
    flow = WaldiezFlow(
        id="wf-1",
        name="flow_name",
        type="flow",
        description="Flow Description",
        data=WaldiezFlowData(
            nodes=[],
            edges=[],
            viewport={},
            agents=agents,
            models=[],
            tools=[],
            chats=[chat],
            is_async=False,
        ),
        tags=["flow"],
        requirements=[],
        storage_id="flow-1",
        created_at="2021-01-01T00:00:00.000Z",
        updated_at="2021-01-01T00:00:00.000Z",
    )
    return flow


def _cleanup_files() -> None:
    """Cleanup files created during tests."""
    extra_files = [
        "flow_name.mmd",
        "captain_agent_llm_config.json",
        "captain_agent_agent_lib.json",
    ]
    for file in extra_files:
        file_path = ROOT_DIR / file
        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                print(
                    f"Failed to remove {file_path}."
                    "It might be in use or read-only."
                )


def _reset_env_vars() -> None:
    """Reset environment variables."""
    dot_env_file = ROOT_DIR / ".env"
    # pylint: disable=too-many-try-statements
    try:
        if dot_env_file.exists():
            with open(dot_env_file, "r", encoding="utf-8") as file:
                for line in file:
                    if not line.startswith("#") and "=" in line:
                        key, _ = line.strip().split("=", 1)
                        if key in os.environ:
                            del os.environ[key]
    except (OSError, PermissionError, FileNotFoundError):
        pass


def _restore_env_vars() -> None:
    """Restore environment variables from .env file."""
    dot_env_file = ROOT_DIR / ".env"
    # pylint: disable=too-many-try-statements
    try:
        if dot_env_file.exists():
            with open(dot_env_file, "r", encoding="utf-8") as file:
                for line in file:
                    if not line.startswith("#") and "=" in line:
                        key, value = line.strip().split("=", 1)
                        os.environ[key] = value
    except (OSError, PermissionError, FileNotFoundError):
        pass


def _backup_dot_env_if_any() -> None:
    """Backup .env file if it exists."""
    env_file = ROOT_DIR / ".env"
    # pylint: disable=too-many-try-statements
    try:
        if env_file.exists():
            backup_file = ROOT_DIR / ".env.bak"
            if not backup_file.exists():
                env_file.rename(backup_file)
    except (OSError, PermissionError, FileNotFoundError):
        pass


def _restore_dot_env_if_any() -> None:
    """Restore .env file from backup if it exists."""
    env_file = ROOT_DIR / ".env"
    backup_file = ROOT_DIR / ".env.bak"
    # pylint: disable=too-many-try-statements
    try:
        if backup_file.exists():
            if env_file.exists():
                env_file.unlink()
            backup_file.rename(env_file)
    except (OSError, PermissionError, FileNotFoundError):
        pass


@pytest.fixture(scope="session", autouse=True)
def before_and_after_tests() -> Generator[None, None, None]:
    """Fixture to run before and after all tests.

    Yields
    ------
    None
        Nothing.
    """
    # Code to run before all tests
    _cleanup_files()
    _reset_env_vars()
    _backup_dot_env_if_any()
    yield
    _cleanup_files()
    _restore_dot_env_if_any()
    _restore_env_vars()


@pytest.fixture(scope="function")
def waldiez_flow() -> WaldiezFlow:
    """Get a valid, runnable WaldiezFlow instance.

    without models and tools

    Returns
    -------
    WaldiezFlow
        A WaldiezFlow instance.
    """
    return get_runnable_flow()


@pytest.fixture(scope="function")
def waldiez_flow_no_human_input() -> WaldiezFlow:
    """Get a valid, runnable WaldiezFlow instance with no human input.

    without models and tools

    Returns
    -------
    WaldiezFlow
        A WaldiezFlow instance.
    """
    flow = get_runnable_flow()
    dumped = flow.model_dump(by_alias=True)
    user_proxy = dumped["data"]["agents"]["userProxyAgents"][0]
    user_proxy["data"]["humanInputMode"] = "NEVER"
    dumped["data"]["agents"]["userProxyAgents"] = [user_proxy]
    dumped["data"]["chats"][0]["data"]["maxTurns"] = 1
    return WaldiezFlow(**dumped)


@pytest.fixture(scope="function")
def waldiez_flow_with_captain_agent() -> WaldiezFlow:
    """Get a valid, runnable WaldiezFlow instance with a captain agent.

    with a dummy model

    Returns
    -------
    WaldiezFlow
        A WaldiezFlow instance.
    """
    flow = get_runnable_flow()
    flow.data.agents.assistantAgents = []
    flow.data.models = [
        WaldiezModel(
            id="wm-1",
            name="model",
            type="model",
            description="Model",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
            data={},  # type: ignore
        ),
    ]
    os.environ["OPENAI_API_KEY"] = "sk-proj-something"
    flow.data.agents.captainAgents = [
        WaldiezCaptainAgent(
            id="wa-2",
            type="agent",
            agent_type="captain",
            name="captain",
            description="Captain Agent",
            tags=[],
            requirements=[],
            created_at="2021-01-01T00:00:00.000Z",
            updated_at="2021-01-01T00:00:00.000Z",
            data=WaldiezCaptainAgentData(  # pyright: ignore
                model_ids=["wm-1"],
            ),
        )
    ]
    dumped = flow.model_dump(by_alias=True)
    user_proxy = dumped["data"]["agents"]["userProxyAgents"][0]
    user_proxy["data"]["humanInputMode"] = "NEVER"
    dumped["data"]["agents"]["userProxyAgents"] = [user_proxy]
    dumped["data"]["chats"][0]["data"]["maxTurns"] = 1
    return flow
