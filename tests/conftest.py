# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common fixtures for tests."""

import os
import shutil
from collections.abc import Generator
from pathlib import Path

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

PROJECT_ROOT = Path(__file__).parent.parent


def get_runnable_flow() -> WaldiezFlow:
    """Get a runnable WaldiezFlow instance.

    Without models and tools

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
        name="runnable_flow_name",
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


@pytest.fixture(scope="function")
def waldiez_flow() -> WaldiezFlow:
    """Get a valid, runnable WaldiezFlow instance.

    Without models and tools

    Returns
    -------
    WaldiezFlow
        A WaldiezFlow instance.
    """
    return get_runnable_flow()


@pytest.fixture(scope="function")
def waldiez_flow_no_human_input() -> WaldiezFlow:
    """Get a valid, runnable WaldiezFlow instance with no human input.

    Without models and tools

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

    With a model

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
            data=WaldiezCaptainAgentData(
                model_ids=["wm-1"],
                termination=WaldiezAgentTerminationMessage(
                    type="keyword",
                    keywords=["bye", "goodbye"],
                    criterion="found",
                    method_content=None,
                ),
            ),
        )
    ]
    dumped = flow.model_dump(by_alias=True)
    user_proxy = dumped["data"]["agents"]["userProxyAgents"][0]
    user_proxy["data"]["humanInputMode"] = "NEVER"
    dumped["data"]["agents"]["userProxyAgents"] = [user_proxy]
    dumped["data"]["chats"][0]["data"]["maxTurns"] = 1
    return flow


def _cleanup_files() -> None:
    """Cleanup files created during tests."""
    extra_files = [
        "test_flow",
        "test_flow.waldiez",
        "flow_name.mmd",
        "captain_agent_llm_config.json",
        "captain_agent_agent_lib.json",
    ]
    for file in extra_files:
        file_path = PROJECT_ROOT / file
        if file_path.exists():
            try:
                file_path.unlink()
            except (OSError, PermissionError):
                msg = (
                    f"Failed to remove {file_path}."
                    "It might be in use or read-only."
                )
                print(msg)


def _reset_env_vars() -> None:
    """Reset environment variables."""
    dot_env_file = PROJECT_ROOT / ".env"
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

    os.environ.pop("OPENAI_API_KEY", None)


def _restore_env_vars() -> None:
    """Restore environment variables from .env file."""
    dot_env_file = PROJECT_ROOT / ".env"
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


def _get_work_dir(worker_id: str) -> Path:
    """Get the working directory for a given worker ID.

    Parameters
    ----------
    worker_id : str
        The ID of the worker process.

    Returns
    -------
    Path
        The working directory path.
    """
    if worker_id == "master":
        # Single process or master - work in project root
        return PROJECT_ROOT
    # else:
    # xdist worker - create isolated directory
    work_dir = PROJECT_ROOT / f"test_worker_{worker_id}"
    work_dir.mkdir(exist_ok=True)
    return work_dir


def _get_backup_file(worker_id: str) -> Path:
    """Get the backup file path for a given worker ID."""
    work_dir = _get_work_dir(worker_id)
    return work_dir / ".env.test_backup"


def _env_file_backup(worker_id: str) -> bool:
    """Backup .env before tests, restore after tests."""
    # SETUP: Backup existing .env if it exists
    work_dir = _get_work_dir(worker_id)
    backup_file = _get_backup_file(worker_id)
    env_file = work_dir / ".env"
    if env_file.exists():
        shutil.copy2(env_file, backup_file)
        backed_up = True
    else:
        backed_up = False
    return backed_up


def _env_file_restore(worker_id: str, backed_up: bool) -> None:
    """Restore .env from backup after tests."""
    # TEARDOWN: Restore or clean up
    # Determine working directory
    work_dir = _get_work_dir(worker_id)
    backup_file = _get_backup_file(worker_id)
    env_file = work_dir / ".env"
    if backed_up and backup_file.exists():
        # Restore original .env
        shutil.copy2(backup_file, env_file)
        backup_file.unlink()
    elif not backed_up and env_file.exists():
        # No original .env existed, remove any test-created one
        env_file.unlink()

    # Clean up worker directory if we created it
    if worker_id != "master" and work_dir.exists():
        # Remove the worker directory and its contents
        shutil.rmtree(work_dir, ignore_errors=True)


@pytest.fixture(scope="session", autouse=True)
def before_and_after_tests(worker_id: str) -> Generator[None, None, None]:
    """Fixture to run before and after all tests.

    Parameters
    ----------
    worker_id : str
        The ID of the worker process.

    Yields
    ------
    None
        Nothing.
    """
    # before all tests
    backed_up = _env_file_backup(worker_id)
    _cleanup_files()
    _reset_env_vars()
    yield
    # after all tests
    _env_file_restore(worker_id, backed_up=backed_up)
    _cleanup_files()
    _restore_env_vars()
