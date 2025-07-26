# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""RAG user agent.

It extends a user agent and has RAG related parameters (`retrieve_config`).
"""

from pydantic import Field
from typing_extensions import Annotated, Literal

from ..agent import WaldiezAgent
from .rag_user_proxy_data import WaldiezRagUserProxyData
from .retrieve_config import WaldiezRagUserProxyRetrieveConfig


class WaldiezRagUserProxy(WaldiezAgent):
    """RAG user agent.

    It extends a user agent and has RAG related parameters.

    Attributes
    ----------
    agent_type : Literal["rag_user", "rag_user_proxy"]
        The agent type: 'rag_user' for a RAG user agent.
    data : WaldiezRagUserProxyData
        The RAG user agent's data.
        See `WaldiezRagUserProxyData` for more info.
    """

    agent_type: Annotated[  # pyright: ignore
        Literal["rag_user", "rag_user_proxy"],
        Field(
            "rag_user_proxy",
            title="Agent type",
            description=(
                "The agent type in a graph. "
                "`rag_user` is deprecated and will be removed in "
                "future versions. Use `rag_user_proxy` instead."
            ),
            alias="agentType",
        ),
    ] = "rag_user_proxy"

    data: Annotated[  # pyright: ignore
        WaldiezRagUserProxyData,
        Field(
            title="Data",
            description="The RAG user agent's data",
            default_factory=WaldiezRagUserProxyData,  # pyright: ignore
        ),
    ]

    @property
    def retrieve_config(self) -> WaldiezRagUserProxyRetrieveConfig:
        """Get the retrieve config.

        Returns
        -------
        WaldiezRagUserProxyRetrieveConfig
            The RAG user agent's retrieve config.
        """
        return self.data.retrieve_config
