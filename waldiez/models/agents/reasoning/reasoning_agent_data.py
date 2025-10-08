# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pyright: reportArgumentType=false
"""Reasoning agent data model."""

from typing import Any

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgentData
from .reasoning_agent_reason_config import WaldiezReasoningAgentReasonConfig


class WaldiezReasoningAgentData(WaldiezAgentData):
    """Reasoning agent data model."""

    human_input_mode: Annotated[
        Literal["ALWAYS", "NEVER", "TERMINATE"],
        Field(
            "NEVER",
            title="Human input mode",
            description="The human input mode, Defaults to `NEVER`",
            alias="humanInputMode",
        ),
    ]
    verbose: Annotated[
        bool,
        Field(
            True,
            title="Verbose",
            description="Whether to show intermediate steps",
        ),
    ]
    reason_config: Annotated[
        WaldiezReasoningAgentReasonConfig,
        Field(
            title="Reason config",
            description="The reasoning agent's reason configuration",
            default_factory=WaldiezReasoningAgentReasonConfig,
            alias="reasonConfig",
        ),
    ]

    @property
    def method(self) -> str:
        """Get the method of the reasoning agent.

        Returns
        -------
        str
            The method of the reasoning agent.

        """
        return self.reason_config.method

    @property
    def max_depth(self) -> int:
        """Get the maximum depth of the reasoning agent.

        Returns
        -------
        int
            The maximum depth of the reasoning agent.

        """
        return self.reason_config.max_depth

    @property
    def beam_size(self) -> int:
        """Get the beam size of the reasoning agent.

        Returns
        -------
        int
            The beam size of the reasoning agent.

        """
        return self.reason_config.beam_size

    @property
    def answer_approach(self) -> str:
        """Get the answer approach of the reasoning agent.

        Returns
        -------
        str
            The answer approach of the reasoning agent.

        """
        return self.reason_config.answer_approach

    @property
    def forest_size(self) -> int:
        """Get the forest size of the reasoning agent.

        Returns
        -------
        int
            The forest size of the reasoning agent.

        """
        return self.reason_config.forest_size

    @property
    def rating_scale(self) -> int:
        """Get the rating scale of the reasoning agent.

        Returns
        -------
        int
            The rating scale of the reasoning agent.

        """
        return self.reason_config.rating_scale

    @property
    def exploration_constant(self) -> float:
        """Get the exploration constant of the reasoning agent.

        Returns
        -------
        float
            The exploration constant of the reasoning agent.

        """
        return self.reason_config.exploration_constant

    @property
    def nsim(self) -> int:
        """Get the number of simulations of the reasoning agent.

        Returns
        -------
        int
            The number of simulations of the reasoning agent.

        """
        return self.reason_config.nsim

    def get_reasoning_config(self) -> dict[str, Any]:
        """Get the reasoning configuration based on the reason_config method.

        Returns
        -------
        dict[str, Any]
            The reasoning configuration.

        """
        reason_dict: dict[str, Any] = {
            "method": self.reason_config.method,
            "max_depth": self.reason_config.max_depth,
            "forest_size": self.reason_config.forest_size,
            "rating_scale": self.reason_config.rating_scale,
        }
        if self.reason_config.method == "beam_search":
            reason_dict["beam_size"] = self.reason_config.beam_size
            reason_dict["answer_approach"] = self.reason_config.answer_approach
        if self.reason_config.method in ("mcts", "lats"):
            reason_dict["nsim"] = self.reason_config.nsim
            reason_dict["exploration_constant"] = (
                self.reason_config.exploration_constant
            )
        return reason_dict
