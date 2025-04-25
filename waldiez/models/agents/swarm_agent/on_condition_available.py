# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Swarm Agent ON_CONDITION Available Model."""

from typing import Optional, Tuple

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ...common import WaldiezBase, check_function, generate_function

WaldiezSwarmOnConditionAvailableCheckType = Literal[
    "string", "callable", "none"
]
"""Possible types for the `available` check."""

CUSTOM_ON_CONDITION_AVAILABLE = "custom_on_condition_available"
CUSTOM_ON_CONDITION_AVAILABLE_ARGS = ["agent", "message"]
CUSTOM_ON_CONDITION_AVAILABLE_TYPES = (
    ["ConversableAgent", "Dict[str, Any]"],
    "bool",
)

# In ag2 it is used as:
#
# if on_condition.available is not None:
#     if isinstance(on_condition.available, Callable):
#         is_available = on_condition.available(
#           agent, next(iter(agent.chat_messages.values()))
#         )
#     elif isinstance(on_condition.available, str):
#         is_available = agent.get_context(on_condition.available) or False


class WaldiezSwarmOnConditionAvailable(WaldiezBase):
    """Swarm condition availability check."""

    type: Annotated[
        WaldiezSwarmOnConditionAvailableCheckType,
        Field(
            "none",
            alias="availableCheckType",
            title="Available Check Type",
            description=("The type of the `available` property to check. "),
        ),
    ] = "none"
    value: Annotated[
        Optional[str],
        Field(
            None,
            title="Available",
            description=(
                "Optional condition to determine if this ON_CONDITION "
                "is available. Can be a Callable or a string.  If a string, "
                " it will look up the value of the context variable with that "
                "name, which should be a bool."
            ),
        ),
    ]

    _available_string: str = ""

    @property
    def available_string(self) -> str:
        """Get the available string.

        Returns
        -------
        str
            The available string.
        """
        return self._available_string

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
        if self.type == "none" or not self.value:
            return "", ""
        if self.type == "string":
            return self._available_string, ""
        function_name = CUSTOM_ON_CONDITION_AVAILABLE
        if name_prefix:
            function_name = f"{name_prefix}_{function_name}"
        if name_suffix:
            function_name = f"{function_name}_{name_suffix}"
        return function_name, generate_function(
            function_name=function_name,
            function_args=CUSTOM_ON_CONDITION_AVAILABLE_ARGS,
            function_types=CUSTOM_ON_CONDITION_AVAILABLE_TYPES,
            function_body=self._available_string,
        )

    @model_validator(mode="after")
    def validate_available(self) -> Self:
        """Validate the available check.

        Returns
        -------
        Self
            The swarm agent's on condition available model.

        Raises
        ------
        ValueError
            If the available check fails.
        """
        if self.type == "callable":
            if not self.value:
                raise ValueError(
                    "A callable is expected, but no value was provided."
                )
            is_valid, error_or_body = check_function(
                code_string=self.value,
                function_name=CUSTOM_ON_CONDITION_AVAILABLE,
                function_args=CUSTOM_ON_CONDITION_AVAILABLE_ARGS,
            )
            if not is_valid:
                raise ValueError(error_or_body)
            self._available_string = error_or_body
        if self.type == "string":
            if not self.value:
                raise ValueError(
                    "A string is expected, but no value was provided."
                )
            self._available_string = self.value
        return self
