# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Agent types."""

from typing_extensions import Literal

# pylint: disable=line-too-long
# fmt: off
WaldiezAgentType = Literal["user_proxy", "assistant", "manager", "rag_user", "swarm", "reasoning", "captain", "user", "rag_user_proxy"]  # noqa: E501
"""Possible types of a Waldiez Agent:
    - user_proxy,
    - assistant,
    - manager,
    - rag_user_proxy,
    - swarm,
    - reasoning,
    - captain,
    - user (deprecated: use user_proxy)
    - rag_user (deprecated: user rag_user_proxy)
"""  # noqa: W291
# fmt: on
