# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""RAG user agent.

It extends a user agent and has RAG related parameters (`retrieve_config`).
"""

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgent
from .rag_user_data import WaldiezRagUserData
from .retrieve_config import WaldiezRagUserRetrieveConfig


class WaldiezRagUser(WaldiezAgent):
    """RAG user agent.

    It extends a user agent and has RAG related parameters.

    Attributes
    ----------
    agent_type : Literal["rag_user"]
        The agent type: 'rag_user' for a RAG user agent.
    data : WaldiezRagUserData
        The RAG user agent's data.
        See `WaldiezRagUserData` for more info.
    retrieve_config : WaldiezRagUserRetrieveConfig
        The RAG user agent's retrieve config.
    """

    agent_type: Annotated[
        Literal["rag_user"],
        Field(
            "rag_user",
            title="Agent type",
            description="The agent type: 'rag_user' for a RAG user agent",
            alias="agentType",
        ),
    ]

    data: Annotated[
        WaldiezRagUserData,
        Field(
            title="Data",
            description="The RAG user agent's data",
            default_factory=WaldiezRagUserData,
        ),
    ]

    @property
    def retrieve_config(self) -> WaldiezRagUserRetrieveConfig:
        """Get the retrieve config.

        Returns
        -------
        WaldiezRagUserRetrieveConfig
            The RAG user agent's retrieve config.
        """
        return self.data.retrieve_config
