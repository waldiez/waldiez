# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Termination message configuration for Waldiez agents."""

import json

from waldiez.models import WaldiezAgent

from ..core import SystemMessageConfig


class SystemMessageProcessor:
    """Processor for system message configuration."""

    def __init__(
        self,
        agent: WaldiezAgent,
    ):
        self.agent = agent

    def process(self) -> SystemMessageConfig:
        """Process system message configuration.

        Returns
        -------
        SystemMessageConfig
            The processed system message configuration.
        """
        if not self.agent.data.system_message:
            return SystemMessageConfig()

        return SystemMessageConfig(
            before_agent_conent="",
            system_message_arg=json.dumps(self.agent.data.system_message),
        )
