# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common fixtures for tests."""

import logging
import os
import shutil
import time
from contextlib import contextmanager
from datetime import datetime
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
ENV_LOCK_FILE = ROOT_DIR / ".env.operations"

logger = logging.getLogger(__name__)


class EnvLockError(Exception):
    """Exception raised when environment file operations fail."""


@contextmanager
def file_lock(
    lock_path: Path, timeout: float = 30.0
) -> Generator[None, None, None]:
    """
    Run a block of code with a file lock.

    Parameters
    ----------
    lock_path : Path
        The path to the lock file.
    timeout : float, optional
        Maximum time to wait for the lock in seconds (default: 30.0).

    Yields
    ------
    None
        Nothing

    Raises
    ------
    EnvLockError
        If the lock cannot be acquired within the timeout period.
    """
    lock_path = lock_path.with_suffix(lock_path.suffix + ".lock")
    start_time = time.time()
    fd: int | None = None

    # Acquire lock with timeout
    while True:
        try:
            fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_RDWR)
            break
        except FileExistsError as exc:
            if time.time() - start_time > timeout:
                raise EnvLockError(
                    f"Could not acquire lock {lock_path} within {timeout}s"
                ) from exc
            time.sleep(0.02)

    try:
        yield
    finally:
        # Clean up the lock
        if fd is not None:  # pyright: ignore
            try:
                os.close(fd)
            except (OSError, FileNotFoundError, PermissionError) as e:
                logger.warning("Error closing lock file descriptor: %s", e)

        try:
            lock_path.unlink()
        except (OSError, FileNotFoundError, PermissionError) as e:
            logger.warning("Error removing lock file %s: %s", lock_path, e)


def _cleanup_temp_file(temp_file: Path) -> None:
    """Safely remove a temporary file."""
    try:
        if temp_file.exists():
            temp_file.unlink()
    except BaseException as e:  # pylint: disable=broad-exception-caught
        logger.warning("Could not clean up temporary file %s: %s", temp_file, e)


def _backup_dot_env_if_any(*, overwrite: bool = False) -> bool:
    """Create or refresh .env.bak atomically if .env exists."""
    env_file = ROOT_DIR / ".env"
    bak_file = ROOT_DIR / ".env.bak"
    tmp_file = ROOT_DIR / ".env.bak.tmp"

    with file_lock(ENV_LOCK_FILE):
        # Early returns for cases where no backup is needed
        if not env_file.exists():
            return False

        if bak_file.exists() and not overwrite:
            return False

        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            shutil.copy2(env_file, tmp_file)
            os.replace(tmp_file, bak_file)  # Atomic operation
            return True

        except BaseException as e:
            logger.error("Failed to backup .env file: %s", e)
            _cleanup_temp_file(tmp_file)
            raise


def _restore_dot_env_if_any() -> bool:
    """Atomically restore .env from .env.bak if backup exists."""
    env_file = ROOT_DIR / ".env"
    bak_file = ROOT_DIR / ".env.bak"

    if not bak_file.exists():
        return False

    # Create timestamped backup of current .env if it exists
    prev_file = None
    if env_file.exists():
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        prev_file = ROOT_DIR / f".env.prev-{timestamp}"

    with file_lock(ENV_LOCK_FILE):
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            # Step 1: Move current .env aside if it exists
            if env_file.exists() and prev_file:
                env_file.rename(prev_file)

            # Step 2: Atomically restore from backup
            os.replace(bak_file, env_file)

            return True

        except BaseException as e:
            logger.error("Failed to restore .env file: %s", e)

            # Attempt rollback if we moved the original
            if prev_file and prev_file.exists() and not env_file.exists():
                try:
                    os.replace(prev_file, env_file)
                except BaseException as rollback_error:
                    msg = (
                        f"CRITICAL: Rollback failed after restore error. "
                        f"Original .env is at {prev_file}. "
                        f"Rollback error: {rollback_error}"
                    )
                    logger.critical(msg)
            raise

        finally:
            # Clean up the previous version file
            if prev_file and prev_file.exists():
                _cleanup_temp_file(prev_file)


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
        "test_flow",
        "test_flow.waldiez",
        "flow_name.mmd",
        "captain_agent_llm_config.json",
        "captain_agent_agent_lib.json",
    ]
    for file in extra_files:
        file_path = ROOT_DIR / file
        if file_path.exists():
            try:
                file_path.unlink()
            except (OSError, PermissionError):
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

    os.environ.pop("OPENAI_API_KEY", None)


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


@pytest.fixture(scope="session", autouse=True)
def before_and_after_tests() -> Generator[None, None, None]:
    """Fixture to run before and after all tests.

    Yields
    ------
    None
        Nothing.
    """
    # before all tests
    _cleanup_files()
    _reset_env_vars()
    _backup_dot_env_if_any()
    yield
    # after all tests
    _cleanup_files()
    _restore_dot_env_if_any()
    _restore_env_vars()


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
            data=WaldiezCaptainAgentData(  # pyright: ignore
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
