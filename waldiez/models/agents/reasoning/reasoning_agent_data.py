# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Reasoning agent data model."""

from typing import Any, Dict

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..assistant import WaldiezAssistantData
from .reasoning_agent_reason_config import WaldiezReasoningAgentReasonConfig


class WaldiezReasoningAgentData(WaldiezAssistantData):
    """Reasoning agent data model."""

    max_depth: Annotated[
        int,
        Field(
            4,
            title="Maximum depth",
            description="Maximum depth of the reasoning tree",
            alias="maxDepth",
            deprecated=True,
        ),
    ] = 4
    beam_size: Annotated[
        int,
        Field(
            3,
            title="Beam size",
            description="Number of parallel reasoning paths to maintain",
            alias="beamSize",
            deprecated=True,
        ),
    ] = 3
    answer_approach: Annotated[
        Literal["pool", "best"],
        Field(
            "pool",
            title="Answer approach",
            description="How to generate final answer",
            alias="answerApproach",
            deprecated=True,
        ),
    ] = "pool"
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

    def get_reasoning_config(self) -> Dict[str, Any]:
        """Get the reasoning configuration based on the reason_config method.

        Returns
        -------
        Dict[str, Any]
            The reasoning configuration.

        """
        reason_dict: Dict[str, Any] = {
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


# reason_config (dict): Configuration for the reasoning method.
# Supported parameters:
#     method (str): The search strategy to use. Options:
#         - "beam_search" (default): Uses beam search with parallel paths
#         - "mcts": Uses Monte Carlo Tree Search for exploration
#         - "lats": Uses Language Agent Tree Search with per-step rewards
#         - "dfs": Uses depth-first search
#                (equivalent to beam_search with beam_size=1)
#     Common parameters:
#         max_depth (int): Maximum depth of reasoning tree (default: 3)
#         forest_size (int):
#               Number of independent trees to maintain (default: 1)
#         rating_scale (int):
#               Scale for grading responses, e.g. 1-10 (default: 10)
#     Beam Search specific:
#         beam_size (int): Number of parallel paths to maintain (default: 3)
#         answer_approach (str):
#               How to select final answer, "pool" or "best" (default: "pool")
#     MCTS/LATS specific:
#         nsim (int): Number of simulations to run (default: 3)
#         exploration_constant (float):
#               UCT exploration parameter (default: 1.41)
#     Example configs:
#         `{"method": "beam_search", "beam_size": 5, "max_depth": 4}`
#         `{"method": "mcts", "nsim": 10, "exploration_constant": 2.0}`
#         `{"method": "lats", "nsim": 5, "forest_size": 3}`
