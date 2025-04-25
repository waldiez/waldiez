# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Swarm after work model.

Handles the next step in the conversation when an
agent doesn't suggest a tool call or a handoff.

"""

# pylint: disable=line-too-long

from typing import Dict, Optional, Tuple

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ...common import WaldiezBase, check_function, generate_function

WaldiezSwarmAfterWorkRecipientType = Literal["agent", "option", "callable"]
"""The possible AfterWork recipient types."""
WaldiezSwarmAfterWorkOption = Literal[
    "TERMINATE", "REVERT_TO_USER", "STAY", "SWARM_MANAGER"
]
"""The possible AfterWork options."""


CUSTOM_AFTER_WORK = "custom_after_work"
CUSTOM_AFTER_WORK_ARGS = ["last_speaker", "messages", "groupchat"]
CUSTOM_AFTER_WORK_TYPES = (
    ["ConversableAgent", "List[Dict[str, Any]]", "GroupChat"],
    "Union[AfterWorkOption, ConversableAgent, str]",
)


class WaldiezSwarmAfterWork(WaldiezBase):
    """Swarm after work.


    Attributes
    ----------
    recipient : str
        The agent_id to hand off to, an AfterWork option,
        or the custom after work method.
        If it is an AfterWork option, it can be one of
        ('TERMINATE', 'REVERT_TO_USER', 'STAY', 'SWARM_MANAGER').

    recipient_type : WaldiezSwarmAfterWorkRecipientType
        The type of recipient.
        Can be 'agent', 'option', or 'callable'.
        If 'agent', the recipient is a Swarm Agent.
        If 'option', the recipient is an AfterWorkOption :
            ('TERMINATE', 'REVERT_TO_USER', 'STAY', 'SWARM_MANAGER').
        If 'callable', it should have the signature:
        def custom_after_work(
            last_speaker: ConversableAgent,
            messages: List[dict],
            groupchat: GroupChat,
        ) -> Union[AfterWorkOption, ConversableAgent, str]:

    """

    recipient: Annotated[
        str,
        Field(
            "TERMINATE",
            title="Recipient",
            description=(
                "The agent_id to hand off to, an AfterWork option, "
                "or the custom after work method. "
                "If it is an AfterWork option, it can be one of "
                "('TERMINATE', 'REVERT_TO_USER', 'STAY')"
            ),
        ),
    ]
    recipient_type: Annotated[
        WaldiezSwarmAfterWorkRecipientType,
        Field(
            "option",
            alias="recipientType",
            title="Recipient Type",
            description=(
                "The type of recipient. "
                "Can be 'agent', 'option', or 'callable'. "
                "If 'agent', the recipient is a Swarm Agent.  "
                "If 'option', the recipient is an AfterWorkOption :"
                "    ('TERMINATE', 'REVERT_TO_USER', 'STAY', 'SWARM_MANAGER'). "
                "If 'callable', it should have the signature: "
                "def custom_after_work("
                "    last_speaker: ConversableAgent,"
                "    messages: List[Dict[str, Any]],"
                "    groupchat: GroupChat,"
                ") -> Union[AfterWorkOption, ConversableAgent, str]:"
            ),
        ),
    ]

    _recipient_string: str = ""

    def get_recipient(
        self,
        agent_names: Dict[str, str],
        name_prefix: Optional[str] = None,
        name_suffix: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Get the recipient string.

        Parameters
        ----------
        agent_names : Dict[str, str]
            A mapping of agent id to agent name.
        name_prefix : Optional[str], optional
            The prefix for the function name, by default None.
        name_suffix : Optional[str], optional
            The suffix for the function name, by default None.

        Returns
        -------
        Tuple[str, str]
            The recipient string and the function content if applicable.
        """
        if self.recipient_type == "option":
            return f"AfterWork(AfterWorkOption.{self.recipient})", ""
        if self.recipient_type == "agent":
            # the the recipient is passed as the agent name
            # (and not its id), care should be taken to ensure
            # the all the agents in the flow have unique names
            agent_instance = agent_names.get(self.recipient, self.recipient)
            return f"AfterWork({agent_instance})", ""

        function_name = CUSTOM_AFTER_WORK
        if name_prefix:
            function_name = f"{name_prefix}_{function_name}"
        if name_suffix:
            function_name = f"{function_name}_{name_suffix}"
        return (
            f"AfterWork({function_name})",
            generate_function(
                function_name=function_name,
                function_args=CUSTOM_AFTER_WORK_ARGS,
                function_body=self._recipient_string,
                function_types=CUSTOM_AFTER_WORK_TYPES,
            ),
        )

    @model_validator(mode="after")
    def validate_recipient(self) -> Self:
        """Validate the recipient.

        Returns
        -------
        WaldiezSwarmAfterWork
            The validated after work model.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        self._recipient_string = self.recipient
        if self.recipient_type == "callable":
            is_valid, error_or_body = check_function(
                code_string=self.recipient,
                function_name=CUSTOM_AFTER_WORK,
                function_args=CUSTOM_AFTER_WORK_ARGS,
            )
            if not is_valid or not error_or_body:
                # pylint: disable=inconsistent-quotes
                raise ValueError(
                    f"Invalid custom method: {error_or_body or 'no content'}"
                )
            self._recipient_string = error_or_body
        elif self.recipient_type == "option":
            if self.recipient not in [
                "TERMINATE",
                "REVERT_TO_USER",
                "STAY",
                "SWARM_MANAGER",
            ]:
                raise ValueError("Invalid option.")
        return self
