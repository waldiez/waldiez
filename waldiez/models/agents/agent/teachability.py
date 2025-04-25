# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Agent Teachability."""

from pydantic import Field
from typing_extensions import Annotated, Literal

from ...common import WaldiezBase


class WaldiezAgentTeachability(WaldiezBase):
    """Waldiez Agent Teachability.

    Attributes
    ----------
    enabled : bool
        Whether the teachability is enabled.
    verbosity : Literal[0, 1, 2, 3]
        The verbosity level of the teachability. Default: 0
    reset_db : bool
        Whether to reset the database. Default: False
    recall_threshold : float
        The recall threshold. Default: 1.5
    max_num_retrievals : int
        The maximum number of retrievals. Default: 10
    """

    enabled: Annotated[
        bool,
        Field(
            False,
            title="Enabled",
            description="Whether the teachability is enabled.",
        ),
    ]
    verbosity: Annotated[
        Literal[0, 1, 2, 3],
        Field(
            0,
            title="Verbosity",
            description="The verbosity level of the teachability.",
        ),
    ]
    reset_db: Annotated[
        bool,
        Field(
            False,
            title="Reset DB",
            description="Whether to reset the database.",
            alias="resetDb",
        ),
    ]
    recall_threshold: Annotated[
        float,
        Field(
            1.5,
            title="Recall threshold",
            description="The recall threshold.",
            alias="recallThreshold",
        ),
    ]
    max_num_retrievals: Annotated[
        int,
        Field(
            10,
            title="Max num retrievals",
            description="The maximum number of retrievals.",
            alias="maxMumRetrievals",
        ),
    ]
