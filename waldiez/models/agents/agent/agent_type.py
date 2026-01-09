# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Waldiez Agent types."""

from typing_extensions import Literal

# pylint: disable=line-too-long
# fmt: off
WaldiezAgentType = Literal["user_proxy", "assistant", "group_manager", "manager", "rag_user", "swarm", "reasoning", "captain", "user", "rag_user_proxy", "doc_agent"]  # noqa: E501
"""Possible types of a Waldiez Agent:
    - user_proxy,
    - assistant,
    - group_manager,
    - rag_user_proxy (deprecated: use doc_agent),
    - reasoning,
    - captain,
    - doc_agent,
    - swarm (deprecated: do not use it),
    - user (deprecated: use user_proxy)
    - rag_user (deprecated: user rag_user_proxy)
    - manager (deprecated: use group_manager)
"""  # noqa: W291
# fmt: on
