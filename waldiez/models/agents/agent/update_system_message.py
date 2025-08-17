# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Update the agent's system message before they reply."""

from typing import Optional

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ...common import WaldiezBase, check_function, generate_function

WaldiezAgentUpdateFunctionType = Literal["string", "callable"]
"""Possible types for the update function."""

CUSTOM_UPDATE_SYSTEM_MESSAGE = "custom_update_system_message"
CUSTOM_UPDATE_SYSTEM_MESSAGE_ARGS = ["agent", "messages"]
CUSTOM_UPDATE_SYSTEM_MESSAGE_TYPES = (
    ["ConversableAgent", "list[dict[str, Any]]"],
    "str",
)


class WaldiezAgentUpdateSystemMessage(WaldiezBase):
    """Update the agent's system message before they reply.

    Attributes
    ----------
    type : Literal["string", "callable"]
        The type of the update function. Can be either a string or a callable.
    content : str
        The string template or function definition to update
        the agent's system message. Can be a string or a Callable.
        If the `function_type` is 'string' it will be used as a
        template and substitute the context variables.
        If the `function_type` is 'callable', it should have the signature:
        ```
        def custom_update_system_message(
            agent: ConversableAgent,
            messages: list[dict[str, Any]]
        ) -> str:

        ```
    """

    type: Annotated[
        WaldiezAgentUpdateFunctionType,
        Field(
            "string",
            title="Function Type",
            description=(
                "The type of the update function. "
                "Can be either 'string' or 'callable'."
            ),
        ),
    ]

    content: Annotated[
        str,
        Field(
            ...,
            title="Function Content",
            description=(
                "The string template or function definition to update "
                "the agent's system message. Can be a string or a Callable.  "
                "If the `update_function_type` is 'string', "
                " it will be used as a template and substitute "
                "the context variables. If `update_function_type` "
                "is 'callable', it should have signature: "
                "def custom_update_system_message("
                "   agent: ConversableAgent, "
                "   messages: list[dict[str, Any]] "
                ") -> str"
            ),
        ),
    ]

    _content: str = ""

    def get_content(
        self,
        name_prefix: Optional[str] = None,
        name_suffix: Optional[str] = None,
    ) -> tuple[str, str]:
        """Get the update function content.

        Parameters
        ----------
        name_prefix : str, optional
            The prefix of the name, by default None
        name_suffix : str, optional
            The suffix of the name, by default None

        Returns
        -------
        tuple[str, str]
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
                function_body=self._content,
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
        self._content = self.content
        if self.type == "callable":
            valid, error_or_body = check_function(
                code_string=self._content,
                function_name=CUSTOM_UPDATE_SYSTEM_MESSAGE,
                function_args=CUSTOM_UPDATE_SYSTEM_MESSAGE_ARGS,
            )
            if not valid or not error_or_body:
                # pylint: disable=inconsistent-quotes
                raise ValueError(
                    f"Invalid custom method: {error_or_body or 'no content'}"
                )
            self._content = error_or_body
        return self
