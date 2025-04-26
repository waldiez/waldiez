# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.chat.chat_summary.*."""

import pytest

from waldiez.models.chat.chat_summary import WaldiezChatSummary


def test_waldiez_chat_summary() -> None:
    """Test WaldiezChatSummary."""
    chat_summary = WaldiezChatSummary(
        prompt="prompt",
    )
    assert chat_summary.prompt == "prompt"
    assert not chat_summary.args

    chat_summary = WaldiezChatSummary(
        method="lastMsg",
        prompt="prompt",
        args={"key": "value"},
    )
    assert chat_summary.method == "last_msg"
    summary_dump = chat_summary.model_dump(by_alias=True)
    assert summary_dump["method"] == "lastMsg"
    assert summary_dump["prompt"] == "prompt"
    assert summary_dump["args"] == {"key": "value"}
    summary_dump = chat_summary.model_dump(by_alias=False)
    assert summary_dump["method"] == "last_msg"

    chat_summary = WaldiezChatSummary(
        method="reflectionWithLlm",
        prompt="prompt",
        args={"key": "value"},
    )
    assert chat_summary.method == "reflection_with_llm"
    summary_dump = chat_summary.model_dump(by_alias=True)
    assert summary_dump["method"] == "reflectionWithLlm"
    summary_dump = chat_summary.model_dump(by_alias=False)
    assert summary_dump["method"] == "reflection_with_llm"

    with pytest.raises(ValueError):
        chat_summary = WaldiezChatSummary(prompt=1)  # type: ignore

    chat_summary = WaldiezChatSummary(
        method=None,
        prompt="prompt",
        args={"key": "value"},
    )
    assert chat_summary.method is None
    summary_dump = chat_summary.model_dump(by_alias=True)
    assert summary_dump["method"] is None
