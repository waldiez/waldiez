# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Reasoning agent's reason configuration model."""

from pydantic import Field
from typing_extensions import Annotated, Literal

from ...common import WaldiezBase

ReasonConfigMethod = Literal["beam_search", "mcts", "lats", "dfs"]
"""Possible reasoning methods."""


class WaldiezReasoningAgentReasonConfig(WaldiezBase):
    """Reasoning agent's reason configuration model.

    Configuration for the reasoning method.

    Attributes
    ----------
    method : Literal["beam_search", "mcts", "lats", "dfs"]
        The search strategy to use, default is "beam_search".
    max_depth : int
        Maximum depth of reasoning tree, default is 3.
    forest_size : int
        Number of independent trees to maintain, default is 1.
    rating_scale : int
        Scale for grading responses, e.g. 1-10, default is 10.
    beam_size : int
        Number of parallel paths to maintain, default is 3 (for beam_search).
    answer_approach : Literal["pool", "best"]
        How to select final answer, default is "pool" (only for beam_search).
    nsim : int
        Number of simulations to run, default is 3 (only for mcts and lats).
    exploration_constant : float
        UCT exploration parameter, default is 1.41 (only for mcts and lats).
    """

    method: Annotated[
        ReasonConfigMethod,
        Field(
            "beam_search",
            title="Method",
            description="The search strategy to use.",
        ),
    ]
    max_depth: Annotated[
        int,
        Field(
            3,
            title="Maximum depth",
            description="Maximum depth of reasoning tree.",
        ),
    ]
    forest_size: Annotated[
        int,
        Field(
            1,
            title="Forest size",
            description="Number of independent trees to maintain.",
        ),
    ]
    rating_scale: Annotated[
        int,
        Field(
            10,
            title="Rating scale",
            description="Scale for grading responses, e.g. 1-10.",
        ),
    ]
    beam_size: Annotated[
        int,
        Field(
            3,
            title="Beam size",
            description="Number of parallel paths to maintain.",
        ),
    ]
    answer_approach: Annotated[
        Literal["pool", "best"],
        Field(
            "pool",
            title="Answer approach",
            description="How to select final answer.",
        ),
    ]
    nsim: Annotated[
        int,
        Field(
            3,
            title="Number of simulations",
            description="Number of simulations to run.",
        ),
    ]
    exploration_constant: Annotated[
        float,
        Field(
            1.41,
            title="Exploration constant",
            description="UCT exploration parameter.",
        ),
    ]


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
