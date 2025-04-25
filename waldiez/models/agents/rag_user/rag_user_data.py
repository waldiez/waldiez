# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez RAG user agent data."""

from pydantic import Field
from typing_extensions import Annotated

from ..user_proxy import WaldiezUserProxyData
from .retrieve_config import WaldiezRagUserRetrieveConfig


class WaldiezRagUserData(WaldiezUserProxyData):
    """RAG user agent data.

    The data for a RAG user agent.

    Attributes
    ----------
    use_message_generator: bool
        Whether to use the message generator in user's chats. Defaults to False.
    retrieve_config : WaldiezRagUserRetrieveConfig
        The RAG user agent's retrieve config.

    """

    retrieve_config: Annotated[
        WaldiezRagUserRetrieveConfig,
        Field(
            title="Retrieve Config",
            description="The RAG user agent's retrieve config",
            default_factory=WaldiezRagUserRetrieveConfig,
            alias="retrieveConfig",
        ),
    ]
