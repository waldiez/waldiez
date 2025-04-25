# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Swarm condition model for handoff."""

from typing import Optional, Tuple

from pydantic import Field
from typing_extensions import Annotated, Literal

from ...common import WaldiezBase
from .on_condition_available import WaldiezSwarmOnConditionAvailable
from .on_condition_target import WaldiezSwarmOnConditionTarget

WaldiezSwarmOnConditionTargetType = Literal["agent", "nested_chat"]
"""Possible types for the target of the OnCondition."""


class WaldiezSwarmOnCondition(WaldiezBase):
    """Swarm condition to handle handoff.

    Attributes
    ----------
    target : WaldiezSwarmOnConditionTarget
        The agent or nested chat configuration to hand off to.

    target_type: Literal["agent", "nested_chat"]
        The type of the target. Can be either 'agent' or 'nested_chat'.
        Default is 'agent'.

    condition : str
        The condition for transitioning to the target agent

    available: str, optional
        Optional condition to determine if this OnCondition is available.
        Can be a Callable or a string.  If a string, it will look up the
        value of the context variable with that name, which should be a bool.

    available_check_type : Literal["string", "callable", "none"]
        The type of the `available` property to check. Default is "none".
    """

    target: Annotated[
        WaldiezSwarmOnConditionTarget,
        Field(
            title="Target",
            description=(
                "The agent or nested chat configuration to hand off to."
            ),
        ),
    ]
    target_type: Annotated[
        WaldiezSwarmOnConditionTargetType,
        Field(
            "agent",
            alias="targetType",
            title="Target Type",
            description=(
                "The type of the target. "
                "Can be either 'agent' or 'nested_chat'.Default is 'agent'."
            ),
        ),
    ] = "agent"
    condition: Annotated[
        str,
        Field(
            ...,
            title="Condition",
            description="The condition for transitioning to the target agent",
        ),
    ]
    available: Annotated[
        WaldiezSwarmOnConditionAvailable,
        Field(
            default_factory=WaldiezSwarmOnConditionAvailable,
            title="Available",
            description=(
                "Optional condition to determine if this OnCondition "
                "is available."
            ),
        ),
    ]

    def get_available(
        self,
        name_prefix: Optional[str] = None,
        name_suffix: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Get the available string.

        Parameters
        ----------
        name_prefix : str, optional
            The prefix to add to the function name. Default is None.
        name_suffix : str, optional
            The suffix to add to the function name. Default is None.
        Returns
        -------
        Tuple[str, str]
            The available string or function name and code if available.
        """
        return self.available.get_available(
            name_prefix,
            name_suffix,
        )
