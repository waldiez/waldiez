# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=line-too-long
"""Test waldiez.models.agents.agent.termination_message.*."""

import pytest

from waldiez.models.agents.agent.termination_message import (
    WaldiezAgentTerminationMessage,
)


def test_waldiez_agent_termination_message_keyword() -> None:
    """Test WaldiezAgentTerminationMessage with keyword."""
    termination_message = WaldiezAgentTerminationMessage(
        type="keyword",
        keywords=["keyword-1", "keyword-2"],
        criterion="found",
        method_content=None,
    )
    assert termination_message.type == "keyword"
    assert termination_message.keywords == ["keyword-1", "keyword-2"]
    assert termination_message.criterion == "found"
    assert termination_message.method_content is None
    assert termination_message.string == (
        'lambda x: any(isinstance(x, dict) and x.get("content", "") and isinstance(x.get("content", ""), str) and keyword in x.get("content", "") for keyword in ["keyword-1", "keyword-2"])'
    )

    termination_message = WaldiezAgentTerminationMessage(
        type="keyword",
        keywords=["keyword-1", "keyword-2"],
        criterion="ending",
        method_content=None,
    )
    assert termination_message.string == (
        'lambda x: any(isinstance(x, dict) and x.get("content", "") and isinstance(x.get("content", ""), str) and x.get("content", "").endswith(keyword) for keyword in ["keyword-1", "keyword-2"])'
    )

    termination_message = WaldiezAgentTerminationMessage(
        type="keyword",
        keywords=["keyword-1", "keyword-2"],
        criterion="exact",
        method_content=None,
    )
    assert termination_message.string == (
        'lambda x: any(isinstance(x, dict) and x.get("content", "") and isinstance(x.get("content", ""), str) and x.get("content", "") == keyword for keyword in ["keyword-1", "keyword-2"])'
    )

    termination_message = WaldiezAgentTerminationMessage(
        type="keyword",
        keywords=["TERMINATE"],
        criterion="starting",
        method_content=None,
    )
    assert termination_message.string == (
        'lambda x: any(isinstance(x, dict) and x.get("content", "") and isinstance(x.get("content", ""), str) and x.get("content", "").startswith(keyword) for keyword in ["TERMINATE"])'
    )

    with pytest.raises(ValueError):
        WaldiezAgentTerminationMessage(
            type="keyword",
            keywords=["TERMINATE"],
            criterion=None,
            method_content=None,
        )

    with pytest.raises(ValueError):
        WaldiezAgentTerminationMessage(
            type="keyword",
            keywords=[],
            criterion="found",
            method_content=None,
        )


def test_waldiez_agent_termination_message_method() -> None:
    """Test WaldiezAgentTerminationMessage with method."""
    termination_message = WaldiezAgentTerminationMessage(
        type="method",
        keywords=[],
        criterion=None,
        method_content="def is_termination_message(message):\n    return False",
    )
    assert termination_message.type == "method"
    assert not termination_message.keywords
    assert termination_message.criterion is None
    assert (
        termination_message.method_content
        == "def is_termination_message(message):\n    return False"
    )
    assert termination_message.string == "    return False"

    with pytest.raises(ValueError):
        WaldiezAgentTerminationMessage(
            type="method",
            keywords=[],
            criterion=None,
            method_content=None,
        )

    with pytest.raises(ValueError):
        WaldiezAgentTerminationMessage(
            type="method",
            keywords=[],
            criterion=None,
            method_content="def is_termination_message():\n    return False",
        )


def test_waldiez_agent_get_termination_function() -> None:
    """Test WaldiezAgentTerminationMessage.get_termination_function."""
    termination_message = WaldiezAgentTerminationMessage(
        type="keyword",
        keywords=["keyword-1", "keyword-2"],
        criterion="found",
        method_content=None,
    )
    termination_function = termination_message.get_termination_function()
    assert termination_function[1] == "is_termination_message"
    termination_message = WaldiezAgentTerminationMessage(
        type="method",
        keywords=[],
        criterion=None,
        method_content="def is_termination_message(message):\n    return False",
    )
    termination_function_tuple = termination_message.get_termination_function(
        name_suffix="post", name_prefix="pre"
    )
    assert termination_function_tuple[1] == "pre_is_termination_message_post"
    assert termination_function_tuple[0] == (
        "def pre_is_termination_message_post(\n"
        "    message: dict[str, Any],\n"
        ") -> bool:\n"
        "    return False\n"
    )
