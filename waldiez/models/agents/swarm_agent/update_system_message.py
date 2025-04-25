# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Update the agent's system message before they reply."""

from typing import Optional, Tuple

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ...common import WaldiezBase, check_function, generate_function

WaldiezSwarmUpdateFunctionType = Literal["string", "callable"]
"""Possible types for the update function."""

CUSTOM_UPDATE_SYSTEM_MESSAGE = "custom_update_system_message"
CUSTOM_UPDATE_SYSTEM_MESSAGE_ARGS = ["agent", "messages"]
CUSTOM_UPDATE_SYSTEM_MESSAGE_TYPES = (
    ["ConversableAgent", "List[Dict[str, Any]]"],
    "str",
)


class WaldiezSwarmUpdateSystemMessage(WaldiezBase):
    """Update the agent's system message before they reply.

    Attributes
    ----------
    update_function_type : Literal["string", "callable"]
        The type of the update function. Can be either a string or a callable.
    update_function : str
        The string template or function definition to update
        the agent's system message. Can be a string or a Callable.
        If the `function_type` is 'string' it will be used as a
        template and substitute the context variables.
        If the `function_type` is 'callable', it should have the signature:
        ```
        def custom_update_system_message(
            agent: ConversableAgent,
            messages: List[Dict[str, Any]]
        ) -> str:

        ```
    """

    update_function_type: Annotated[
        WaldiezSwarmUpdateFunctionType,
        Field(
            "string",
            title="Function Type",
            alias="updateFunctionType",
            description=(
                "The type of the update function. "
                "Can be either 'string' or 'callable'."
            ),
        ),
    ]

    update_function: Annotated[
        str,
        Field(
            ...,
            title="Update Function",
            alias="updateFunction",
            description=(
                "The string template or function definition to update "
                "the agent's system message. Can be a string or a Callable.  "
                "If the `update_function_type` is 'string', "
                " it will be used as a template and substitute "
                "the context variables. If `update_function_type` "
                "is 'callable', it should have signature: "
                "def custom_update_system_message("
                "   agent: ConversableAgent, "
                "   messages: List[Dict[str, Any]] "
                ") -> str"
            ),
        ),
    ]

    _update_function: str = ""

    def get_update_function(
        self,
        name_prefix: Optional[str] = None,
        name_suffix: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Get the update function.

        Parameters
        ----------
        name_prefix : str, optional
            The prefix of the name, by default None
        name_suffix : str, optional
            The suffix of the name, by default None

        Returns
        -------
        Tuple[str, str]
            The update function and the function name.

        """
        function_name = CUSTOM_UPDATE_SYSTEM_MESSAGE
        if name_prefix:
            function_name = f"{name_prefix}_{function_name}"
        if name_suffix:
            function_name = f"{function_name}_{name_suffix}"
        return (
            generate_function(
                function_name=function_name,
                function_args=CUSTOM_UPDATE_SYSTEM_MESSAGE_ARGS,
                function_types=CUSTOM_UPDATE_SYSTEM_MESSAGE_TYPES,
                function_body=self._update_function,
            ),
            function_name,
        )

    @model_validator(mode="after")
    def validate_update_system_message(self) -> Self:
        """Validate the update system message function.

        Returns
        -------
        UpdateSystemMessage
            The validated update system message.

        Raises
        ------
        ValueError
            If the type is callable and the function is invalid.
            or if the function type is not 'string' or 'callable'.

        """
        self._update_function = self.update_function
        if self.update_function_type == "callable":
            valid, error_or_body = check_function(
                code_string=self.update_function,
                function_name=CUSTOM_UPDATE_SYSTEM_MESSAGE,
                function_args=CUSTOM_UPDATE_SYSTEM_MESSAGE_ARGS,
            )
            if not valid or not error_or_body:
                # pylint: disable=inconsistent-quotes
                raise ValueError(
                    f"Invalid custom method: {error_or_body or 'no content'}"
                )
            self._update_function = error_or_body
        return self
