# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportArgumentType=false

"""Waldiez RAG user agent data."""

from pydantic import Field
from typing_extensions import Annotated

from ..user_proxy import WaldiezUserProxyData
from .retrieve_config import WaldiezRagUserProxyRetrieveConfig


class WaldiezRagUserProxyData(WaldiezUserProxyData):
    """RAG user agent data.

    The data for a RAG user agent.

    Attributes
    ----------
    retrieve_config : WaldiezRagUserProxyRetrieveConfig
        The RAG user agent's retrieve config.

    """

    # pylint: disable=line-too-long
    retrieve_config: Annotated[
        WaldiezRagUserProxyRetrieveConfig,
        Field(
            title="Retrieve Config",
            description="The RAG user agent's retrieve config",
            default_factory=WaldiezRagUserProxyRetrieveConfig,
            alias="retrieveConfig",
        ),
    ]
