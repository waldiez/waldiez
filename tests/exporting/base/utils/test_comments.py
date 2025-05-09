# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.base.utils.comments.*."""

from waldiez.exporting.base.utils.comments import comment, get_comment


def test_comment() -> None:
    """Test comment."""
    assert comment(True, 2) == "# ## "
    assert comment(False) == "# "
    assert comment(True) == "# # "
    assert comment(False, 2) == "# "


def test_get_comment() -> None:
    """Test get_comment."""
    assert get_comment("agents", True) == "\n# ## Agents\n"
    assert get_comment("tools", False) == "\n# Tools\n"
    assert get_comment("models", True) == "\n# ## Models\n"
    assert get_comment("nested", False) == "\n# Nested Chats\n"
    assert get_comment("run", True) == "\n# ## Run the flow\n"
    assert get_comment("logging", False) == "\n# Start Logging\n"
    assert get_comment("invalid", False) == "# "  # type: ignore
