# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
"""Test waldiez.models.agents.swarm.after_work.*."""

import pytest
from waldiez.models.agents.swarm_agent.after_work import WaldiezSwarmAfterWork


def test_waldiez_swarm_after_work_terminate() -> None:
    """Test WaldiezSwarmAfterWork."""
    after_work = WaldiezSwarmAfterWork(
        recipient="TERMINATE", recipient_type="option"
    )
    assert after_work.recipient == "TERMINATE"
    assert after_work.recipient_type == "option"


def test_waldiez_swarm_after_work_revert_to_user() -> None:
    """Test WaldiezSwarmAfterWork."""
    after_work = WaldiezSwarmAfterWork(
        recipient="REVERT_TO_USER", recipient_type="option"
    )
    assert after_work.recipient == "REVERT_TO_USER"
    assert after_work.recipient_type == "option"


def test_waldiez_swarm_after_work_stay() -> None:
    """Test WaldiezSwarmAfterWork."""
    after_work = WaldiezSwarmAfterWork(
        recipient="STAY", recipient_type="option"
    )
    assert after_work.recipient == "STAY"
    assert after_work.recipient_type == "option"
    recipient_string, _ = after_work.get_recipient({})
    assert recipient_string == "AfterWork(AfterWorkOption.STAY)"


def test_waldiez_swarm_after_work_swarm_manager() -> None:
    """Test WaldiezSwarmAfterWork."""
    after_work = WaldiezSwarmAfterWork(
        recipient="SWARM_MANAGER", recipient_type="option"
    )
    assert after_work.recipient == "SWARM_MANAGER"
    assert after_work.recipient_type == "option"
    recipient_string, _ = after_work.get_recipient({})
    assert recipient_string == "AfterWork(AfterWorkOption.SWARM_MANAGER)"


def test_waldiez_swarm_after_work_agent() -> None:
    """Test WaldiezSwarmAfterWork."""
    after_work = WaldiezSwarmAfterWork(
        recipient="agent_id", recipient_type="agent"
    )
    assert after_work.recipient == "agent_id"
    assert after_work.recipient_type == "agent"
    recipient_string, _ = after_work.get_recipient({"agent_id": "agent_name"})
    assert recipient_string == "AfterWork(agent_name)"


def test_waldiez_swarm_after_work_invalid_option() -> None:
    """Test WaldiezSwarmAfterWork."""
    with pytest.raises(ValueError):
        WaldiezSwarmAfterWork(recipient="INVALID", recipient_type="option")


def test_waldiez_swarm_after_work_callable() -> None:
    """Test WaldiezSwarmAfterWork."""
    callable_body = """
def custom_after_work(last_speaker, messages, groupchat):
    return "TERMINATE"
"""
    after_work = WaldiezSwarmAfterWork(
        recipient=callable_body, recipient_type="callable"
    )
    expected_recipient_string = (
        "def my_custom_after_work(\n"
        "    last_speaker: ConversableAgent,\n"
        "    messages: List[Dict[str, Any]],\n"
        "    groupchat: GroupChat,\n) -> "
        "Union[AfterWorkOption, ConversableAgent, str]:\n"
        '    return "TERMINATE"\n'
    )
    recipient = after_work.get_recipient({}, name_prefix="my")
    assert recipient[0] == "AfterWork(my_custom_after_work)"
    assert recipient[1] == expected_recipient_string
    assert after_work.recipient_type == "callable"


def test_waldiez_swarm_after_work_invalid_callable_body() -> None:
    """Test WaldiezSwarmAfterWork."""
    with pytest.raises(ValueError):
        WaldiezSwarmAfterWork(recipient="INVALID", recipient_type="callable")


def test_waldiez_swarm_after_work_invalid_callable_signature() -> None:
    """Test WaldiezSwarmAfterWork."""
    callable_body = """
    def custom_after_work():
        return "TERMINATE"
"""

    with pytest.raises(ValueError):
        WaldiezSwarmAfterWork(
            recipient=callable_body, recipient_type="callable"
        )


def test_waldiez_swarm_after_work_invalid_type() -> None:
    """Test WaldiezSwarmAfterWork."""
    with pytest.raises(ValueError):
        WaldiezSwarmAfterWork(
            recipient="INVALID",
            recipient_type="invalid",  # type: ignore
        )
