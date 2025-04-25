# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Agent types."""

from typing_extensions import Literal

# pylint: disable=line-too-long
# fmt: off
WaldiezAgentType = Literal["user", "assistant", "manager", "rag_user", "swarm", "reasoning", "captain"]  # noqa: E501
"""Possible types of a Waldiez Agent: user, assistant, manager, rag_user, swarm, reasoning, captain."""  # noqa: E501
# fmt: on
