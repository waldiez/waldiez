# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Reasoning agent's reason configuration model."""

from pydantic import Field
from typing_extensions import Annotated, Literal

from ...common import WaldiezBase

ReasoningConfigMethod = Literal["beam_search", "mcts", "lats", "dfs"]
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
        ReasoningConfigMethod,
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
