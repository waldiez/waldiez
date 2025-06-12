# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.core.extras.chat_extras."""

from waldiez.exporting.core.extras.chat_extras import ChatExtras
from waldiez.exporting.core.result import ExportResult


def test_chat_extras_contribution() -> None:
    """Test the contribution of ChatExtras to ExportResult."""
    extras = ChatExtras(instance_id="test_instance")
    extras.set_chat_initiation("start_chat()")
    result = ExportResult()
    extras.contribute_to_export(result)
    assert any("chat()" in c.content for c in result.positioned_content)
