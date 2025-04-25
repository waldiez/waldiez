# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Swarm agent."""

from typing import List, Union

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgent, WaldiezAgentNestedChat
from .after_work import WaldiezSwarmAfterWork
from .on_condition import WaldiezSwarmOnCondition
from .swarm_agent_data import WaldiezSwarmAgentData
from .update_system_message import WaldiezSwarmUpdateSystemMessage


class WaldiezSwarmAgent(WaldiezAgent):
    """Swarm agent.

    It extends a user agent and has swarm related parameters.

    Attributes
    ----------
    agent_type : Literal["swarm"]
        The agent type: 'swarm' for a swarm agent.
    data : WaldiezSwarmAgentData
        The swarm agent's data.
        See `WaldiezSwarmAgentData` for more info.
    """

    agent_type: Annotated[
        Literal["swarm"],
        Field(
            "swarm",
            title="Agent type",
            description="The agent type: 'swarm' for a swarm agent.",
            alias="agentType",
        ),
    ]

    data: Annotated[
        WaldiezSwarmAgentData,
        Field(
            title="Data",
            description="The swarm agent's data",
            default_factory=WaldiezSwarmAgentData,
        ),
    ]

    @property
    def functions(self) -> List[str]:
        """Get the functions that the agent can use.

        Returns
        -------
        List[str]
            The functions that the agent can use.
        """
        return self.data.functions

    @property
    def update_agent_state_before_reply(
        self,
    ) -> List[Union[str, WaldiezSwarmUpdateSystemMessage]]:
        """Get the functions that update the agent's state before it replies.

        Returns
        -------
        List[str]
            The functions that update the agent's state before it replies.
        """
        return self.data.update_agent_state_before_reply

    @property
    def handoffs(
        self,
    ) -> List[Union[WaldiezSwarmOnCondition, WaldiezSwarmAfterWork]]:
        """Get the hand offs to register.

        Returns
        -------
        List[str]
            The hand offs to register.
        """
        return self.data.handoffs

    @property
    def nested_chats(self) -> List[WaldiezAgentNestedChat]:
        """Get the nested chats.

        Returns
        -------
        List[WaldiezChat]
            The nested chats.
        """
        return self.data.nested_chats

    @property
    def is_initial(self) -> bool:
        """Check if the agent is the initial agent.

        Returns
        -------
        bool
            Whether the agent is the initial agent.
        """
        return self.data.is_initial
